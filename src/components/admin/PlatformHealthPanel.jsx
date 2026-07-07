import { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getPlatformHealth, getHealthSummary } from '../../services/platformHealthService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import ScoreCard from '../common/ScoreCard';
import { getScoreBand } from '../../constants/constants';

/**
 * Maps overall platform status to StatusBadge variant.
 * @param {string} status - The overall status.
 * @returns {string}
 */
const overallStatusToVariant = (status) => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
};

/**
 * Formats bytes to a human-readable string.
 * @param {number} bytes - The byte count.
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Formats a timestamp for display.
 * @param {string} timestamp - ISO 8601 timestamp.
 * @returns {string}
 */
const formatTimestamp = (timestamp) => {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    return '—';
  }
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
};

/**
 * Returns the color class for a storage usage percentage.
 * @param {number} percentage - The usage percentage.
 * @returns {string}
 */
const getStorageBarColor = (percentage) => {
  if (typeof percentage !== 'number' || Number.isNaN(percentage)) {
    return 'bg-green-500 dark:bg-green-400';
  }
  if (percentage >= 90) {
    return 'bg-red-500 dark:bg-red-400';
  }
  if (percentage >= 80) {
    return 'bg-yellow-500 dark:bg-yellow-400';
  }
  return 'bg-green-500 dark:bg-green-400';
};

/**
 * Returns the text color class for a storage usage percentage.
 * @param {number} percentage - The usage percentage.
 * @returns {string}
 */
const getStorageTextColor = (percentage) => {
  if (typeof percentage !== 'number' || Number.isNaN(percentage)) {
    return 'text-green-600 dark:text-green-400';
  }
  if (percentage >= 90) {
    return 'text-red-600 dark:text-red-400';
  }
  if (percentage >= 80) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-green-600 dark:text-green-400';
};

/**
 * Platform Health panel component used within the AdministrationPage.
 * Displays localStorage usage bar (bytes/percentage with warning at 80%),
 * integration status summary, seed info (size, value, timestamp), error counts.
 * Uses platformHealthService. Shows warnings if approaching 4MB quota.
 * Accessible with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @param {function} [props.onRefresh] - Optional callback invoked when the refresh button is clicked.
 * @returns {React.ReactElement}
 */
const PlatformHealthPanel = ({ className, onRefresh }) => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Loads platform health status.
   */
  const loadHealthStatus = useCallback(() => {
    setLoading(true);
    try {
      const status = getPlatformHealth();
      setHealthStatus(status);
    } catch {
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealthStatus();
  }, [loadHealthStatus]);

  /**
   * Handles refresh action.
   */
  const handleRefresh = useCallback(() => {
    loadHealthStatus();
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  }, [loadHealthStatus, onRefresh]);

  /**
   * Computes the storage usage bar width as a clamped percentage.
   */
  const storageBarWidth = useMemo(() => {
    if (!healthStatus || !healthStatus.storage) {
      return 0;
    }
    const pct = healthStatus.storage.percentage;
    if (typeof pct !== 'number' || Number.isNaN(pct)) {
      return 0;
    }
    return Math.min(100, Math.max(0, pct));
  }, [healthStatus]);

  /**
   * Determines if storage is approaching the warning threshold.
   */
  const storageWarning = useMemo(() => {
    if (!healthStatus || !healthStatus.warnings) {
      return null;
    }
    if (healthStatus.warnings.storageCritical) {
      return 'critical';
    }
    if (healthStatus.warnings.storageApproachingLimit) {
      return 'warning';
    }
    return null;
  }, [healthStatus]);

  if (loading && !healthStatus) {
    return (
      <div
        className={`flex items-center justify-center py-8 ${className || ''}`}
        role="status"
        aria-label="Loading platform health"
      >
        <LoadingSpinner size="sm" label="Loading platform health..." />
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <div
        className={`rounded-xl bg-white shadow-card dark:bg-neutral-800 ${className || ''}`}
        role="region"
        aria-label="Platform health"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Platform health data could not be loaded.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-outline mt-3 px-3 py-1.5 text-xs"
            aria-label="Retry loading platform health"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { storage, integrations, seedInfo, errorCounts, warnings, overallStatus, computedAt } = healthStatus;

  return (
    <div
      className={`space-y-6 ${className || ''}`}
      role="region"
      aria-label="Platform health monitoring"
    >
      {/* Overall Status KPIs */}
      <section aria-label="Overall platform status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="Overall Status"
          value={overallStatus ? overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1) : '—'}
          description={`Computed at ${formatTimestamp(computedAt)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Storage Used"
          value={formatBytes(storage ? storage.bytesUsed : 0)}
          description={storage ? `${storage.percentage.toFixed(1)}% of ${formatBytes(storage.quota)}` : ''}
          scoreBand={storage && storage.percentage > 80 ? getScoreBand(20) : getScoreBand(80)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Total Errors"
          value={errorCounts ? errorCounts.total : 0}
          description="Across all entity types"
          trend={errorCounts && errorCounts.total > 10 ? 'down' : 'stable'}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Integrations"
          value={`${integrations ? integrations.active : 0}/${integrations ? integrations.total : 0}`}
          description={`${integrations ? integrations.error : 0} in error`}
          scoreBand={getScoreBand(integrations ? integrations.averageHealthScore : 0)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          }
        />
      </section>

      {/* Storage Usage Bar */}
      <section aria-label="Storage usage" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            localStorage Usage
          </h3>
          <div className="flex items-center gap-2">
            {storageWarning && (
              <StatusBadge
                status={storageWarning === 'critical' ? 'Critical' : 'Warning'}
                variant={storageWarning === 'critical' ? 'danger' : 'warning'}
                size="sm"
              />
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
              aria-label="Refresh platform health"
              title="Refresh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {formatBytes(storage ? storage.bytesUsed : 0)} used
              </span>
              <span className={`text-sm font-medium ${getStorageTextColor(storage ? storage.percentage : 0)}`}>
                {storage ? storage.percentage.toFixed(1) : '0.0'}%
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
              role="progressbar"
              aria-valuenow={storageBarWidth}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Storage usage: ${storage ? storage.percentage.toFixed(1) : '0'}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${getStorageBarColor(storage ? storage.percentage : 0)}`}
                style={{ width: `${storageBarWidth}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-2xs text-neutral-400 dark:text-neutral-500">0 B</span>
              <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                {formatBytes(storage ? storage.quota : 5 * 1024 * 1024)}
              </span>
            </div>
          </div>

          {/* Storage warning messages */}
          {storageWarning === 'critical' && (
            <div
              className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Storage usage is critical (&gt;90% of quota). Clear data or reduce seed size to avoid data loss.
              </span>
            </div>
          )}
          {storageWarning === 'warning' && (
            <div
              className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Storage usage is approaching the limit (&gt;80% of quota). Consider clearing unused data.
              </span>
            </div>
          )}

          {/* Storage breakdown by key */}
          {storage && storage.keys && Object.keys(storage.keys).length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                Storage Breakdown
              </p>
              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {Object.entries(storage.keys)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15)
                    .map(([key, bytes]) => {
                      const keyPct = storage.bytesUsed > 0
                        ? Math.round((bytes / storage.bytesUsed) * 100)
                        : 0;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 dark:bg-neutral-900/50"
                        >
                          <span className="truncate text-2xs text-neutral-500 dark:text-neutral-400 max-w-[60%]" title={key}>
                            {key.replace('kp_etsip_', '')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xs font-medium text-neutral-700 dark:text-neutral-300">
                              {formatBytes(bytes)}
                            </span>
                            <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                              ({keyPct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Warnings Section */}
      {warnings && Object.values(warnings).some((v) => v === true) && (
        <section aria-label="Platform warnings" className="rounded-xl bg-yellow-50 shadow-card dark:bg-yellow-900/20">
          <div className="border-b border-yellow-200 px-5 py-3 dark:border-yellow-800">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Active Warnings
            </h3>
          </div>
          <div className="p-5 space-y-2">
            {warnings.storageCritical && (
              <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                <span>Storage usage is critical (&gt;90% of quota). Clear data or reduce seed size.</span>
              </div>
            )}
            {warnings.storageApproachingLimit && !warnings.storageCritical && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                <span>Storage usage is approaching the limit (&gt;80% of quota).</span>
              </div>
            )}
            {warnings.highErrorCount && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                <span>High error count detected ({errorCounts ? errorCounts.total : 0} errors).</span>
              </div>
            )}
            {warnings.schemaVersionMismatch && (
              <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                <span>Schema version mismatch. Data may need migration.</span>
              </div>
            )}
            {warnings.notSeeded && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                <span>Database has not been seeded. Go to Data Controls to seed the database.</span>
              </div>
            )}
            {warnings.integrationsUnhealthy && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                <span>More than 30% of integrations are in error state.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Error Counts Breakdown */}
      {errorCounts && (
        <section aria-label="Error counts breakdown" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Error Counts by Category
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Integrations', value: errorCounts.integrationsInError, color: 'text-red-600 dark:text-red-400' },
                { label: 'Quality Gates', value: errorCounts.failedQualityGates, color: 'text-red-600 dark:text-red-400' },
                { label: 'Critical Debt', value: errorCounts.criticalTechDebt, color: 'text-orange-600 dark:text-orange-400' },
                { label: 'Expired Waivers', value: errorCounts.expiredWaivers, color: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Failed AI', value: errorCounts.failedAIAnalyses, color: 'text-red-600 dark:text-red-400' },
                { label: 'Degraded Envs', value: errorCounts.degradedEnvironments, color: 'text-orange-600 dark:text-orange-400' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                  <p className="text-2xs text-neutral-500 dark:text-neutral-400">{item.label}</p>
                  <p className={`mt-1 text-lg font-bold ${item.value > 0 ? item.color : 'text-neutral-900 dark:text-neutral-100'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Integration Health Summary */}
      {integrations && (
        <section aria-label="Integration health" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Integration Health Summary
            </h3>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700" role="table" aria-label="Integration health summary">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr role="row">
                    <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Metric</th>
                    <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Total</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">{integrations.total}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Active</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">{integrations.active}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">In Error</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">{integrations.error}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Inactive</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">{integrations.inactive}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Configuring</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-yellow-600 dark:text-yellow-400">{integrations.configuring}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Deprecated</td>
                    <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">{integrations.deprecated}</td>
                  </tr>
                  <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Avg Health Score</td>
                    <td role="cell" className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {integrations.averageHealthScore}%
                        </span>
                        {getScoreBand(integrations.averageHealthScore) && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getScoreBand(integrations.averageHealthScore).color }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Seed & Schema Information */}
      {seedInfo && (
        <section aria-label="Seed information" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Seed & Schema Information
            </h3>
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Database Seeded</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {seedInfo.isSeeded ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Seed Size</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {seedInfo.seedSize || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Anchor Date</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {seedInfo.anchorDate || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Schema Version</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {seedInfo.schemaVersion || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Schema Match</span>
              <StatusBadge
                status={seedInfo.schemaMatch ? 'Up to date' : 'Mismatch'}
                variant={seedInfo.schemaMatch ? 'success' : 'danger'}
                size="sm"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          Platform health is computed on demand from localStorage data.
          Last computed: {formatTimestamp(computedAt)}.
        </p>
      </footer>
    </div>
  );
};

PlatformHealthPanel.propTypes = {
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
  /** Optional callback invoked when the refresh button is clicked. */
  onRefresh: PropTypes.func,
};

PlatformHealthPanel.defaultProps = {
  className: '',
  onRefresh: null,
};

export default PlatformHealthPanel;