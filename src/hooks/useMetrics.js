import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { computeMetrics, computeDashboardMetrics, computeTrends } from '../services/metricsEngine';

/**
 * @typedef {Object} UseMetricsOptions
 * @property {string} [portfolioId] - Optional portfolio ID to scope metrics.
 * @property {string} [applicationId] - Optional application ID to scope metrics.
 * @property {boolean} [autoLoad] - Whether to load metrics on mount (default: true).
 */

/**
 * @typedef {Object} UseMetricsReturn
 * @property {Object|null} metrics - The computed metrics object, or null if not yet loaded.
 * @property {boolean} loading - Whether metrics are currently being computed.
 * @property {string|null} error - Error message if the last computation failed.
 * @property {function(): void} refresh - Recomputes metrics with current parameters.
 */

/**
 * Custom hook that computes metrics from the metricsEngine.
 * Supports entity-level metrics, dashboard metrics, and trend metrics.
 * Recalculates when dependencies (metricType, scope) change.
 *
 * @param {string} metricType - The metric type to compute. Supported values:
 *   - Entity type keys (e.g., 'PORTFOLIO', 'APPLICATION', 'TECH_DEBT', 'QUALITY_GATE', etc.)
 *     for entity-level metrics via computeMetrics.
 *   - 'dashboard' for dashboard-level aggregated metrics via computeDashboardMetrics.
 *   - 'trend:compliance', 'trend:risk', 'trend:techDebt', 'trend:qualityGates',
 *     'trend:standardAdoption', 'trend:integrationHealth', 'trend:environmentHealth',
 *     'trend:techEntryCompliance' for trend data via computeTrends.
 * @param {UseMetricsOptions} [scope={}] - Optional scope filters and configuration.
 * @returns {UseMetricsReturn}
 *
 * @example
 * // Entity-level metrics
 * const { metrics, loading, error, refresh } = useMetrics('APPLICATION', { portfolioId: 'PF-001' });
 *
 * @example
 * // Dashboard metrics
 * const { metrics, loading, refresh } = useMetrics('dashboard');
 *
 * @example
 * // Trend metrics
 * const { metrics, loading, refresh } = useMetrics('trend:compliance');
 */
const useMetrics = (metricType, scope = {}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const loadCounterRef = useRef(0);

  const autoLoad = scope.autoLoad !== false;

  const scopeKey = useMemo(() => {
    const parts = [];
    if (scope.portfolioId) {
      parts.push(`portfolio:${scope.portfolioId}`);
    }
    if (scope.applicationId) {
      parts.push(`application:${scope.applicationId}`);
    }
    return parts.join('|');
  }, [scope.portfolioId, scope.applicationId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Computes metrics based on the metricType and scope.
   */
  const loadMetrics = useCallback(() => {
    if (typeof metricType !== 'string' || metricType.trim() === '') {
      setMetrics(null);
      setError('Metric type must be a non-empty string');
      return;
    }

    setLoading(true);
    setError(null);

    loadCounterRef.current += 1;
    const currentLoadId = loadCounterRef.current;

    try {
      const normalizedType = metricType.trim();

      // Dashboard metrics
      if (normalizedType.toLowerCase() === 'dashboard') {
        const result = computeDashboardMetrics(null);

        if (!mountedRef.current || currentLoadId !== loadCounterRef.current) {
          return;
        }

        if (result.success) {
          setMetrics(result.metrics);
          setError(null);
        } else {
          setMetrics(null);
          setError(result.error || 'Failed to compute dashboard metrics');
        }

        setLoading(false);
        return;
      }

      // Trend metrics (format: 'trend:<trendType>')
      if (normalizedType.toLowerCase().startsWith('trend:')) {
        const trendType = normalizedType.slice(6).trim();

        if (trendType === '') {
          if (mountedRef.current && currentLoadId === loadCounterRef.current) {
            setMetrics(null);
            setError('Trend type must be specified after "trend:" prefix');
            setLoading(false);
          }
          return;
        }

        const result = computeTrends(trendType);

        if (!mountedRef.current || currentLoadId !== loadCounterRef.current) {
          return;
        }

        if (result.success) {
          setMetrics({
            metricType: result.metricType,
            trendData: result.trendData,
          });
          setError(null);
        } else {
          setMetrics(null);
          setError(result.error || 'Failed to compute trend metrics');
        }

        setLoading(false);
        return;
      }

      // Entity-level metrics
      const scopeFilters = {};
      if (typeof scope.portfolioId === 'string' && scope.portfolioId.trim() !== '') {
        scopeFilters.portfolioId = scope.portfolioId.trim();
      }
      if (typeof scope.applicationId === 'string' && scope.applicationId.trim() !== '') {
        scopeFilters.applicationId = scope.applicationId.trim();
      }

      const result = computeMetrics(normalizedType, scopeFilters);

      if (!mountedRef.current || currentLoadId !== loadCounterRef.current) {
        return;
      }

      if (result.success) {
        setMetrics(result.metrics);
        setError(null);
      } else {
        setMetrics(null);
        setError(result.error || 'Failed to compute metrics');
      }

      setLoading(false);
    } catch (err) {
      if (mountedRef.current && currentLoadId === loadCounterRef.current) {
        setMetrics(null);
        setError(err && err.message ? err.message : 'Failed to compute metrics');
        setLoading(false);
      }
    }
  }, [metricType, scope.portfolioId, scope.applicationId]);

  // Auto-load metrics on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadMetrics();
    }
  }, [loadMetrics, autoLoad]);

  const refresh = useCallback(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh,
  };
};

export default useMetrics;