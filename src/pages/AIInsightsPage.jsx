import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import {
  getAIInsight,
  askKpetsip,
  listAllAIInsights,
  getAIInsightSummary,
  getAvailableFeatureTypes,
} from '../services/aiInsightService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import StatusBadge from '../components/common/StatusBadge';
import ScoreCard from '../components/common/ScoreCard';
import ChartWrapper from '../components/common/ChartWrapper';
import { getScoreBand } from '../constants/constants';

/**
 * Maps AI analysis status to StatusBadge variant.
 * @param {string} status - The analysis status.
 * @returns {string}
 */
const statusToVariant = (status) => {
  if (typeof status !== 'string') {
    return 'neutral';
  }
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'running':
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'neutral';
    default:
      return 'neutral';
  }
};

/**
 * Maps priority to StatusBadge variant.
 * @param {string} priority - The priority level.
 * @returns {string}
 */
const priorityToVariant = (priority) => {
  if (typeof priority !== 'string') {
    return 'neutral';
  }
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
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
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
};

/**
 * Formats a feature type string for display.
 * @param {string} featureType - The feature type identifier.
 * @returns {string}
 */
const formatFeatureType = (featureType) => {
  if (typeof featureType !== 'string' || featureType.trim() === '') {
    return '';
  }
  return featureType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats the access level for display.
 * @param {string} accessLevel - The raw access level string.
 * @returns {string}
 */
const formatAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') {
    return '';
  }
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Returns an icon SVG path for an AI feature type.
 * @param {string} featureType - The feature type.
 * @returns {string}
 */
const getFeatureIconPath = (featureType) => {
  if (typeof featureType !== 'string') {
    return 'M13 7H7v6h6V7z';
  }
  const lower = featureType.toLowerCase();
  if (lower.includes('risk')) {
    return 'M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z';
  }
  if (lower.includes('lifecycle') || lower.includes('prediction') || lower.includes('forecast')) {
    return 'M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z';
  }
  if (lower.includes('dependency') || lower.includes('impact')) {
    return 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z';
  }
  if (lower.includes('migration') || lower.includes('planning')) {
    return 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z';
  }
  if (lower.includes('cost') || lower.includes('optimization')) {
    return 'M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z';
  }
  if (lower.includes('compliance') || lower.includes('check')) {
    return 'M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z';
  }
  if (lower.includes('anomaly') || lower.includes('detection')) {
    return 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z';
  }
  if (lower.includes('portfolio')) {
    return 'M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z';
  }
  if (lower.includes('standard') || lower.includes('recommendation')) {
    return 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z';
  }
  if (lower.includes('debt') || lower.includes('prioritization')) {
    return 'M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z';
  }
  if (lower.includes('radar')) {
    return 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z';
  }
  return 'M13 7H7v6h6V7z M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z';
};

/**
 * AI Insights page displaying all 13 simulated AI features.
 * Includes 'Ask KP ETSIP' NL search input, predictive analytics cards,
 * generative recommendations, and data-driven insights.
 * All output labeled 'AI (simulated)'. Uses aiInsightService.
 * Feature-flag gated (aiPanels). Permission-gated. Accessible with ARIA landmarks.
 *
 * @returns {React.ReactElement}
 */
const AIInsightsPage = () => {
  const navigate = useNavigate();
  const { persona, canView } = usePersona();
  const { isEnabled } = useFeatureFlags();

  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [existingInsights, setExistingInsights] = useState([]);
  const [summary, setSummary] = useState(null);

  // Ask KP ETSIP state
  const [askQuery, setAskQuery] = useState('');
  const [askResult, setAskResult] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);

  // Run analysis state
  const [runningFeature, setRunningFeature] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Filter state
  const [filterFeatureType, setFilterFeatureType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const aiPanelsEnabled = useMemo(() => {
    return isEnabled('aiPanels');
  }, [isEnabled]);

  const hasViewPermission = useMemo(() => {
    return canView('AI_ANALYSIS');
  }, [canView]);

  const availableFeatureTypes = useMemo(() => {
    try {
      return getAvailableFeatureTypes();
    } catch {
      return [];
    }
  }, []);

  /**
   * Loads existing AI insights and summary data.
   */
  const loadData = useCallback(() => {
    try {
      const insights = listAllAIInsights();
      setExistingInsights(Array.isArray(insights) ? insights : []);
      const summaryData = getAIInsightSummary();
      setSummary(summaryData);
    } catch {
      setExistingInsights([]);
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    if (hasViewPermission && aiPanelsEnabled) {
      loadData();
    }
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasViewPermission, aiPanelsEnabled, loadData]);

  /**
   * Handles the Ask KP ETSIP query submission.
   */
  const handleAskSubmit = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
      }
      if (typeof askQuery !== 'string' || askQuery.trim() === '') {
        return;
      }

      setAskLoading(true);
      setAskError(null);
      setAskResult(null);

      try {
        const result = askKpetsip(askQuery.trim());
        if (result.success && result.data) {
          setAskResult(result.data);
        } else {
          setAskError(result.error || 'Failed to process query');
        }
      } catch (err) {
        setAskError(err && err.message ? err.message : 'Failed to process query');
      } finally {
        setAskLoading(false);
      }
    },
    [askQuery]
  );

  /**
   * Handles running a specific AI feature analysis.
   * @param {string} featureKey - The feature type key.
   */
  const handleRunAnalysis = useCallback(
    (featureKey) => {
      if (!featureKey || analysisLoading) {
        return;
      }

      setRunningFeature(featureKey);
      setAnalysisLoading(true);
      setAnalysisError(null);
      setAnalysisResult(null);

      // Simulate a brief delay for UX
      setTimeout(() => {
        try {
          const result = getAIInsight(featureKey, {});
          if (result.success && result.data) {
            setAnalysisResult(result.data);
            // Refresh the insights list
            loadData();
          } else {
            setAnalysisError(result.error || 'Failed to generate AI insight');
          }
        } catch (err) {
          setAnalysisError(err && err.message ? err.message : 'Failed to generate AI insight');
        } finally {
          setAnalysisLoading(false);
        }
      }, 600);
    },
    [analysisLoading, loadData]
  );

  /**
   * Handles clearing the analysis result.
   */
  const handleClearAnalysisResult = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setRunningFeature(null);
  }, []);

  /**
   * Handles clearing the ask result.
   */
  const handleClearAskResult = useCallback(() => {
    setAskResult(null);
    setAskError(null);
    setAskQuery('');
  }, []);

  /**
   * Handles refresh action.
   */
  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    loadData();
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
  }, [loadData]);

  /**
   * Filters existing insights based on current filter state.
   */
  const filteredInsights = useMemo(() => {
    let result = [...existingInsights];

    if (typeof filterFeatureType === 'string' && filterFeatureType.trim() !== '') {
      const ftLower = filterFeatureType.trim().toLowerCase();
      result = result.filter(
        (i) => i && i.featureType && i.featureType.toLowerCase() === ftLower
      );
    }

    if (typeof filterStatus === 'string' && filterStatus.trim() !== '') {
      const statusLower = filterStatus.trim().toLowerCase();
      result = result.filter(
        (i) => i && i.status && i.status.toLowerCase() === statusLower
      );
    }

    // Sort by createdAt descending
    result.sort((a, b) => {
      const tsA = a && a.createdAt ? a.createdAt : '';
      const tsB = b && b.createdAt ? b.createdAt : '';
      return tsB.localeCompare(tsA);
    });

    return result;
  }, [existingInsights, filterFeatureType, filterStatus]);

  /**
   * Builds feature type distribution chart data from summary.
   */
  const featureTypeChartData = useMemo(() => {
    if (!summary || !summary.byFeatureType) {
      return [];
    }
    return Object.entries(summary.byFeatureType).map(([key, value]) => ({
      name: formatFeatureType(key),
      value: typeof value === 'number' ? value : 0,
    }));
  }, [summary]);

  const hasActiveFilters = filterFeatureType !== '' || filterStatus !== '';

  const handleClearFilters = useCallback(() => {
    setFilterFeatureType('');
    setFilterStatus('');
  }, []);

  // Handle feature flag disabled
  if (!aiPanelsEnabled) {
    return (
      <EmptyState
        title="AI Insights Disabled"
        message="The AI Panels feature is currently disabled. Enable it from the feature flags settings to access AI-powered insights."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13 7H7v6h6V7z" />
            <path
              fillRule="evenodd"
              d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
              clipRule="evenodd"
            />
          </svg>
        }
      />
    );
  }

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title="Access Denied — AI Insights"
        entityType="AI_ANALYSIS"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading;

  if (isLoading && existingInsights.length === 0) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading AI insights"
      >
        <LoadingSpinner size="lg" label="Loading AI insights..." />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="AI Insights">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            AI Insights
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {existingInsights.length} analysis record{existingInsights.length !== 1 ? 's' : ''}
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
            <span className="mx-1.5">·</span>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              All AI output is simulated
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs self-start sm:self-auto"
          aria-label="Refresh AI insights"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          <span>Refresh</span>
        </button>
      </header>

      {/* Summary KPIs */}
      {summary && (
        <section aria-label="AI insights summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            label="Total Analyses"
            value={summary.total}
            description={`${summary.completed} completed`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Avg Confidence"
            value={summary.averageConfidenceScore}
            suffix="%"
            scoreBand={getScoreBand(summary.averageConfidenceScore)}
            description="Across completed analyses"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Completed"
            value={summary.completed}
            trend={summary.completed > summary.failed ? 'up' : 'stable'}
            description={`${summary.failed} failed · ${summary.pending} pending`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Feature Types"
            value={Object.keys(summary.byFeatureType || {}).length}
            description={`${summary.totalRecommendations || 0} recommendations generated`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
        </section>
      )}

      {/* Ask KP ETSIP Section */}
      <section aria-label="Ask KP ETSIP" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Ask KP ETSIP
            </h2>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              AI (simulated)
            </span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Ask questions about your technology portfolio, compliance, tech debt, quality gates, and more.
            All responses are generated locally from seeded data.
          </p>
          <form onSubmit={handleAskSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="ask-kpetsip-input" className="sr-only">
                Ask KP ETSIP a question
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-neutral-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13 7H7v6h6V7z" />
                    <path
                      fillRule="evenodd"
                      d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="ask-kpetsip-input"
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="e.g., How many applications are there? What is the compliance score?"
                  className="input pl-9 text-sm"
                  aria-label="Ask KP ETSIP a question"
                  disabled={askLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={askLoading || askQuery.trim() === ''}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Submit question"
              >
                {askLoading ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{askLoading ? 'Thinking...' : 'Ask'}</span>
              </button>
              {(askResult || askError) && (
                <button
                  type="button"
                  onClick={handleClearAskResult}
                  className="btn-outline px-3 py-2 text-xs"
                  aria-label="Clear result"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Ask result */}
          {askError && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {askError}
            </div>
          )}

          {askResult && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50" role="region" aria-label="AI response">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13 7H7v6h6V7z" />
                  <path
                    fillRule="evenodd"
                    d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  KP ETSIP AI
                </span>
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  simulated
                </span>
                {askResult.category && (
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-1.5 py-0.5 text-2xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {askResult.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {askResult.answer || ''}
              </p>
              {askResult.data && Object.keys(askResult.data).length > 0 && (
                <div className="mt-3 rounded-lg bg-white p-3 dark:bg-neutral-800">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                    Data
                  </p>
                  <div className="space-y-1">
                    {Object.entries(askResult.data).map(([key, value]) => {
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-neutral-500 dark:text-neutral-400 min-w-[100px]">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {value.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-2xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                                >
                                  {String(item)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-neutral-500 dark:text-neutral-400 min-w-[100px]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}:
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="mt-2 text-2xs text-neutral-400 dark:text-neutral-500">
                {askResult.timestamp ? formatTimestamp(askResult.timestamp) : ''}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Run Analysis Section */}
      <section aria-label="Run AI analysis">
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                AI Feature Analyses
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {availableFeatureTypes.length} features available
              </span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Select an AI feature to run a simulated analysis. Results are generated deterministically from your seeded data.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableFeatureTypes.map((feature) => {
                const isRunning = analysisLoading && runningFeature === feature.key;
                return (
                  <button
                    key={feature.key}
                    type="button"
                    onClick={() => handleRunAnalysis(feature.key)}
                    disabled={analysisLoading}
                    className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-left transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
                    aria-label={`Run ${feature.label} analysis`}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      aria-hidden="true"
                    >
                      {isRunning ? (
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                          aria-hidden="true"
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d={getFeatureIconPath(feature.key)}
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {feature.label}
                      </p>
                      <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                        {isRunning ? 'Running analysis...' : 'Click to run'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Result */}
      {(analysisResult || analysisError) && (
        <section aria-label="Analysis result" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Analysis Result
              </h2>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                AI (simulated)
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAnalysisResult}
              className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
              aria-label="Close analysis result"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            {analysisError && (
              <div
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
                role="alert"
              >
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <>
                {/* Title and metadata */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusBadge
                      status={analysisResult.status || 'completed'}
                      variant={statusToVariant(analysisResult.status)}
                      size="sm"
                    />
                    <StatusBadge
                      status={analysisResult.featureType || 'unknown'}
                      variant="info"
                      size="sm"
                    />
                    {typeof analysisResult.confidenceScore === 'number' && (
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Confidence: {Math.round(analysisResult.confidenceScore)}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {analysisResult.title || 'Analysis Result'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {analysisResult.description || ''}
                  </p>
                </div>

                {/* Summary */}
                {analysisResult.results && analysisResult.results.summary && (
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/50">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      Summary
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {analysisResult.results.summary}
                    </p>
                  </div>
                )}

                {/* Metrics */}
                {analysisResult.results && analysisResult.results.metrics && Object.keys(analysisResult.results.metrics).length > 0 && (
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                      Key Metrics
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {Object.entries(analysisResult.results.metrics).map(([key, value]) => {
                        // Skip complex objects and arrays
                        if (typeof value === 'object' && value !== null) {
                          return null;
                        }
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-800"
                          >
                            <p className="text-2xs text-neutral-500 dark:text-neutral-400 truncate">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {Array.isArray(analysisResult.recommendations) && analysisResult.recommendations.length > 0 && (
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                      Recommendations
                    </p>
                    <div className="space-y-2">
                      {analysisResult.recommendations.map((rec, idx) => (
                        <div
                          key={rec.id || idx}
                          className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge
                              status={rec.priority || 'medium'}
                              variant={priorityToVariant(rec.priority)}
                              size="sm"
                            />
                            {rec.effort && (
                              <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                                Effort: {rec.effort}
                              </span>
                            )}
                            {rec.impact && (
                              <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                                Impact: {rec.impact}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {rec.title || `Recommendation ${idx + 1}`}
                          </h4>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {rec.description || ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-2xs text-neutral-400 dark:text-neutral-500">
                  Generated at: {formatTimestamp(analysisResult.completedAt || analysisResult.createdAt)}
                  {' · '}ID: {analysisResult.id}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* Feature Type Distribution Chart */}
      {featureTypeChartData.length > 0 && (
        <section aria-label="Feature type distribution">
          <ChartWrapper
            type="pie"
            data={featureTypeChartData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              height: 300,
              showLegend: true,
              showTooltip: true,
            }}
            title="Analysis Distribution by Feature Type"
          />
        </section>
      )}

      {/* Existing Insights List */}
      <section aria-label="Existing AI analyses">
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Analysis History
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {filteredInsights.length} of {existingInsights.length} shown
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-5 py-2 dark:border-neutral-700">
            <select
              value={filterFeatureType}
              onChange={(e) => setFilterFeatureType(e.target.value)}
              className="input py-1.5 text-xs max-w-[180px]"
              aria-label="Filter by feature type"
            >
              <option value="">All Feature Types</option>
              {availableFeatureTypes.map((ft) => (
                <option key={ft.key} value={ft.key}>
                  {ft.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input py-1.5 text-xs max-w-[130px]"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Insights list */}
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {hasActiveFilters
                  ? 'No analyses match your filters.'
                  : 'No AI analyses yet. Run a feature analysis above to get started.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {filteredInsights.slice(0, 20).map((insight) => {
                if (!insight || !insight.id) {
                  return null;
                }

                const confidenceBand = typeof insight.confidenceScore === 'number'
                  ? getScoreBand(insight.confidenceScore)
                  : null;

                return (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 px-5 py-3 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer"
                    role="article"
                    aria-label={`AI analysis: ${insight.title || insight.id}`}
                    tabIndex={0}
                    onClick={() => navigate(`/ai-insights/${insight.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/ai-insights/${insight.id}`);
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d={getFeatureIconPath(insight.featureType)}
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {insight.title || 'AI Analysis'}
                        </p>
                        <span className="flex-shrink-0 text-2xs text-neutral-400 dark:text-neutral-500">
                          {formatTimestamp(insight.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusBadge
                          status={insight.status || 'pending'}
                          variant={statusToVariant(insight.status)}
                          size="sm"
                        />
                        <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                          {formatFeatureType(insight.featureType)}
                        </span>
                        {typeof insight.confidenceScore === 'number' && (
                          <div className="flex items-center gap-1">
                            <span className="text-2xs font-medium text-neutral-600 dark:text-neutral-400">
                              {Math.round(insight.confidenceScore)}%
                            </span>
                            {confidenceBand && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: confidenceBand.color }}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        )}
                        {Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
                          <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                            {insight.recommendations.length} rec{insight.recommendations.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 flex-shrink-0 text-neutral-400 self-center"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                );
              })}
              {filteredInsights.length > 20 && (
                <div className="px-5 py-2 text-center">
                  <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                    Showing 20 of {filteredInsights.length} analyses
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All AI insights are simulated. No real AI/ML models are used. Results are generated deterministically
          from seeded data stored in localStorage. All outputs are labeled as simulated.
          Persona: {persona.name}.
        </p>
      </footer>
    </div>
  );
};

export default AIInsightsPage;