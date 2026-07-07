import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import {
  listAllIntegrations,
  testConnection,
  syncNow,
  getSummary,
  getAvailableTypes,
  getAvailableStatuses,
} from '../services/integrationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import StatusBadge from '../components/common/StatusBadge';
import ScoreCard from '../components/common/ScoreCard';
import { getScoreBand } from '../constants/constants';

/**
 * Maps integration status to StatusBadge variant.
 * @param {string} status - The integration status.
 * @returns {string}
 */
const statusToVariant = (status) => {
  if (typeof status !== 'string') {
    return 'neutral';
  }
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'neutral';
    case 'error':
      return 'danger';
    case 'configuring':
      return 'warning';
    case 'deprecated':
      return 'neutral';
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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '—';
  }
};

/**
 * Formats an integration type string for display.
 * @param {string} type - The integration type.
 * @returns {string}
 */
const formatType = (type) => {
  if (typeof type !== 'string') {
    return '';
  }
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Returns an icon SVG path for an integration type.
 * @param {string} type - The integration type.
 * @returns {string}
 */
const getTypeIconPath = (type) => {
  if (typeof type !== 'string') {
    return 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z';
  }
  const lower = type.toLowerCase();
  if (lower.includes('email') || lower.includes('slack') || lower.includes('teams')) {
    return 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z';
  }
  if (lower.includes('github') || lower.includes('gitlab') || lower.includes('azure_devops')) {
    return 'M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z';
  }
  if (lower.includes('jira') || lower.includes('servicenow') || lower.includes('confluence')) {
    return 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z';
  }
  if (lower.includes('sonarqube') || lower.includes('snyk')) {
    return 'M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z';
  }
  if (lower.includes('splunk') || lower.includes('datadog') || lower.includes('elastic')) {
    return 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z';
  }
  if (lower.includes('ldap') || lower.includes('saml') || lower.includes('oauth') || lower.includes('oidc')) {
    return 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z';
  }
  if (lower.includes('jenkins')) {
    return 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z';
  }
  return 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z';
};

/**
 * Simulated integrations management page.
 * Displays all integration types as cards with connection status, sync frequency,
 * last sync, error count. Provides 'Test Connection' and 'Sync Now' buttons
 * that simulate latency and update status. All actions are audit-logged and permission-gated.
 *
 * @returns {React.ReactElement}
 */
const IntegrationsPage = () => {
  const navigate = useNavigate();
  const { persona, canView, canEdit: personaCanEdit } = usePersona();

  const [integrations, setIntegrations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const hasViewPermission = useMemo(() => {
    return canView('INTEGRATION');
  }, [canView]);

  const hasEditPermission = useMemo(() => {
    return personaCanEdit('INTEGRATION');
  }, [personaCanEdit]);

  /**
   * Loads all integrations and summary data.
   */
  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const allIntegrations = listAllIntegrations();
      setIntegrations(allIntegrations);
      const summaryData = getSummary();
      setSummary(summaryData);
    } catch {
      setIntegrations([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasViewPermission) {
      loadData();
    }
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasViewPermission, loadData]);

  /**
   * Handles test connection action for an integration.
   * @param {string} integrationId - The integration ID.
   */
  const handleTestConnection = useCallback(
    async (integrationId) => {
      if (!integrationId || actionLoading[integrationId]) {
        return;
      }

      setActionLoading((prev) => ({ ...prev, [integrationId]: 'testing' }));

      try {
        const result = await testConnection(integrationId, 800);

        if (result.success && result.data) {
          setIntegrations((prev) =>
            prev.map((integration) => {
              if (integration.id === integrationId) {
                return {
                  ...integration,
                  status: result.data.status || integration.status,
                  healthScore: result.data.healthScore !== undefined ? result.data.healthScore : integration.healthScore,
                  errorMessage: result.data.errorMessage || null,
                };
              }
              return integration;
            })
          );
          // Refresh summary
          try {
            const summaryData = getSummary();
            setSummary(summaryData);
          } catch {
            // Ignore summary refresh errors
          }
        }
      } catch {
        // Error handled silently; integration state unchanged
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[integrationId];
          return next;
        });
      }
    },
    [actionLoading]
  );

  /**
   * Handles sync now action for an integration.
   * @param {string} integrationId - The integration ID.
   */
  const handleSyncNow = useCallback(
    async (integrationId) => {
      if (!integrationId || actionLoading[integrationId]) {
        return;
      }

      setActionLoading((prev) => ({ ...prev, [integrationId]: 'syncing' }));

      try {
        const result = await syncNow(integrationId, 1200);

        if (result.success && result.data) {
          setIntegrations((prev) =>
            prev.map((integration) => {
              if (integration.id === integrationId) {
                return {
                  ...integration,
                  status: result.data.status || integration.status,
                  healthScore: result.data.healthScore !== undefined ? result.data.healthScore : integration.healthScore,
                  lastSyncAt: result.data.lastSyncAt || result.data.syncedAt || integration.lastSyncAt,
                  errorMessage: result.data.errorMessage || null,
                };
              }
              return integration;
            })
          );
          // Refresh summary
          try {
            const summaryData = getSummary();
            setSummary(summaryData);
          } catch {
            // Ignore summary refresh errors
          }
        }
      } catch {
        // Error handled silently; integration state unchanged
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[integrationId];
          return next;
        });
      }
    },
    [actionLoading]
  );

  /**
   * Handles navigation to integration detail page.
   * @param {string} integrationId - The integration ID.
   */
  const handleViewDetail = useCallback(
    (integrationId) => {
      if (integrationId) {
        navigate(`/integrations/${integrationId}`);
      }
    },
    [navigate]
  );

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
   * Filters integrations based on current filter state.
   */
  const filteredIntegrations = useMemo(() => {
    let result = [...integrations];

    if (typeof filterType === 'string' && filterType.trim() !== '') {
      const typeLower = filterType.trim().toLowerCase();
      result = result.filter(
        (i) => i.type && i.type.toLowerCase() === typeLower
      );
    }

    if (typeof filterStatus === 'string' && filterStatus.trim() !== '') {
      const statusLower = filterStatus.trim().toLowerCase();
      result = result.filter(
        (i) => i.status && i.status.toLowerCase() === statusLower
      );
    }

    if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const searchLower = searchTerm.trim().toLowerCase();
      result = result.filter((i) => {
        const searchableFields = [i.name, i.description, i.type, i.status];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [integrations, filterType, filterStatus, searchTerm]);

  const availableTypes = useMemo(() => {
    try {
      return getAvailableTypes();
    } catch {
      return [];
    }
  }, [integrations]);

  const availableStatuses = useMemo(() => {
    try {
      return getAvailableStatuses();
    } catch {
      return [];
    }
  }, [integrations]);

  const hasActiveFilters = filterType !== '' || filterStatus !== '' || searchTerm !== '';

  const handleClearFilters = useCallback(() => {
    setFilterType('');
    setFilterStatus('');
    setSearchTerm('');
  }, []);

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

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title="Access Denied — Integrations"
        entityType="INTEGRATION"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading || loading;

  if (isLoading && integrations.length === 0) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading integrations"
      >
        <LoadingSpinner size="lg" label="Loading integrations..." />
      </div>
    );
  }

  if (!isLoading && integrations.length === 0) {
    return (
      <EmptyState
        title="No Integrations Found"
        message="No integration records are available. Please ensure the database has been seeded."
        actionLabel="Refresh"
        onAction={handleRefresh}
      />
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Integrations">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Integrations
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {integrations.length} integration{integrations.length !== 1 ? 's' : ''} configured
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs self-start sm:self-auto"
          aria-label="Refresh integrations"
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
        <section aria-label="Integration summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            label="Total Integrations"
            value={summary.total}
            description={`${summary.active} active`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            }
          />
          <ScoreCard
            label="Active"
            value={summary.active}
            trend={summary.active > summary.error ? 'up' : 'down'}
            description={`${summary.inactive} inactive`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="In Error"
            value={summary.error}
            trend={summary.error > 0 ? 'down' : 'stable'}
            description={`${summary.configuring} configuring`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Avg Health Score"
            value={summary.averageHealthScore}
            suffix="%"
            scoreBand={getScoreBand(summary.averageHealthScore)}
            description="Across all integrations"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            }
          />
        </section>
      )}

      {/* Filters */}
      <section aria-label="Integration filters" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <label htmlFor="integration-search" className="sr-only">
              Search integrations
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
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="integration-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search integrations..."
                className="input pl-9 text-sm"
                aria-label="Search integrations"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-2 text-sm max-w-[180px]"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {formatType(type)}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-2 text-sm max-w-[150px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {formatType(status)}
              </option>
            ))}
          </select>

          {/* Clear filters */}
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

        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {filteredIntegrations.length} of {integrations.length} shown
        </div>
      </section>

      {/* Integration Cards Grid */}
      {filteredIntegrations.length === 0 ? (
        <EmptyState
          title="No Matching Integrations"
          message="No integrations match your current filters. Try adjusting your search or filter criteria."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <section
          aria-label="Integration cards"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredIntegrations.map((integration) => {
            if (!integration || !integration.id) {
              return null;
            }

            const isActionLoading = !!actionLoading[integration.id];
            const currentAction = actionLoading[integration.id] || null;
            const healthBand = typeof integration.healthScore === 'number'
              ? getScoreBand(integration.healthScore)
              : null;

            return (
              <div
                key={integration.id}
                className="rounded-xl bg-white shadow-card transition-shadow duration-300 hover:shadow-soft dark:bg-neutral-800"
                role="article"
                aria-label={`Integration: ${integration.name || integration.id}`}
              >
                {/* Card Header */}
                <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
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
                            d={getTypeIconPath(integration.type)}
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {integration.name || integration.id}
                        </h3>
                        <p className="truncate text-2xs text-neutral-500 dark:text-neutral-400">
                          {formatType(integration.type)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={integration.status || 'unknown'}
                      variant={statusToVariant(integration.status)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="space-y-3 px-5 py-4">
                  {/* Health Score */}
                  {typeof integration.healthScore === 'number' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Health Score</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {Math.round(integration.healthScore)}
                        </span>
                        {healthBand && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: healthBand.color }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Direction */}
                  {integration.direction && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Direction</span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {formatType(integration.direction)}
                      </span>
                    </div>
                  )}

                  {/* Sync Frequency */}
                  {integration.syncFrequency && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Sync Frequency</span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {integration.syncFrequency}
                      </span>
                    </div>
                  )}

                  {/* Last Sync */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Last Sync</span>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {formatTimestamp(integration.lastSyncAt)}
                    </span>
                  </div>

                  {/* Auth Type */}
                  {integration.authType && integration.authType !== 'none' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Auth</span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {formatType(integration.authType)}
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {integration.errorMessage && (
                    <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                      <p className="text-2xs text-red-700 dark:text-red-300 line-clamp-2" title={integration.errorMessage}>
                        {integration.errorMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => handleViewDetail(integration.id)}
                    className="text-xs font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    aria-label={`View details for ${integration.name || integration.id}`}
                  >
                    View Details
                  </button>

                  {hasEditPermission && (
                    <div className="flex items-center gap-2">
                      {/* Test Connection Button */}
                      <button
                        type="button"
                        onClick={() => handleTestConnection(integration.id)}
                        disabled={isActionLoading}
                        className="btn-outline flex items-center gap-1 px-2.5 py-1.5 text-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Test connection for ${integration.name || integration.id}`}
                      >
                        {currentAction === 'testing' ? (
                          <div
                            className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                            aria-hidden="true"
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span>{currentAction === 'testing' ? 'Testing...' : 'Test'}</span>
                      </button>

                      {/* Sync Now Button */}
                      <button
                        type="button"
                        onClick={() => handleSyncNow(integration.id)}
                        disabled={isActionLoading}
                        className="btn-outline flex items-center gap-1 px-2.5 py-1.5 text-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Sync now for ${integration.name || integration.id}`}
                      >
                        {currentAction === 'syncing' ? (
                          <div
                            className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                            aria-hidden="true"
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
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
                        )}
                        <span>{currentAction === 'syncing' ? 'Syncing...' : 'Sync'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All integration connections are simulated. No real network calls are made.
          Test Connection and Sync Now actions simulate latency and update status deterministically.
        </p>
      </footer>
    </div>
  );
};

export default IntegrationsPage;