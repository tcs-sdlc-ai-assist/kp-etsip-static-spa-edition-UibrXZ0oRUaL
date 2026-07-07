import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  reseedData,
  resetToDefaults,
  exportAllData,
  importAllData,
  clearAllData,
  setSeedSize,
  getSeedInfo,
  getAvailableSeedSizes,
  canPerformAdminActions,
  getSchemaInfo,
  getStorageInfo,
} from '../services/adminDataService';
import { getPlatformHealth, getHealthSummary } from '../services/platformHealthService';
import { listEntries, getDistinctActions, getDistinctEntityTypes } from '../services/auditLogService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import StatusBadge from '../components/common/StatusBadge';
import ScoreCard from '../components/common/ScoreCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import { getScoreBand } from '../constants/constants';
import { exportToJSON } from '../utils/exportUtils';

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
 * Maps audit log status to StatusBadge variant.
 * @param {string} status - The audit log status.
 * @returns {string}
 */
const auditStatusToVariant = (status) => {
  if (typeof status !== 'string') return 'neutral';
  switch (status.toLowerCase()) {
    case 'success':
      return 'success';
    case 'failure':
      return 'danger';
    case 'partial':
      return 'warning';
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
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
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
 * Formats the access level for display.
 * @param {string} accessLevel - The raw access level string.
 * @returns {string}
 */
const formatAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') return '';
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Tab keys for the administration page.
 * @type {string[]}
 */
const TABS = [
  { key: 'data', label: 'Data Controls' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'health', label: 'Platform Health' },
];

const AUDIT_PAGE_SIZE = 20;

/**
 * Administration page with tabs/sections for Data Controls, Feature Flags,
 * Audit Log viewer, and Platform Health. All controls permission-gated.
 * Data controls trigger adminDataService methods. Audit log displays structured
 * entries with search/filter. All actions audit-logged.
 *
 * @returns {React.ReactElement}
 */
const AdministrationPage = () => {
  const navigate = useNavigate();
  const { persona, canView } = usePersona();
  const { flags, toggleFlag, resetFlags, isEnabled } = useFeatureFlags();
  const { theme, toggleTheme, isDark, darkModeEnabled } = useTheme();

  const [activeTab, setActiveTab] = useState('data');
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Data Controls state
  const [seedInfo, setSeedInfo] = useState(null);
  const [seedInfoLoading, setSeedInfoLoading] = useState(false);
  const [selectedSeedSize, setSelectedSeedSize] = useState('standard');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, title: '', message: '' });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileContent, setImportFileContent] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Audit Log state
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditFilterEntityType, setAuditFilterEntityType] = useState('');
  const [auditFilterStatus, setAuditFilterStatus] = useState('');
  const [auditActions, setAuditActions] = useState([]);
  const [auditEntityTypes, setAuditEntityTypes] = useState([]);

  // Platform Health state
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const hasAdminPermission = useMemo(() => {
    return canPerformAdminActions();
  }, [persona]);

  const hasViewPermission = useMemo(() => {
    return canView('PDE_CONFIG');
  }, [canView]);

  const availableSeedSizes = useMemo(() => {
    return getAvailableSeedSizes();
  }, []);

  /**
   * Loads seed info from the admin data service.
   */
  const loadSeedInfo = useCallback(() => {
    setSeedInfoLoading(true);
    try {
      const result = getSeedInfo();
      if (result.success && result.data) {
        setSeedInfo(result.data);
        if (result.data.seedSize) {
          setSelectedSeedSize(result.data.seedSize);
        }
      }
    } catch {
      setSeedInfo(null);
    } finally {
      setSeedInfoLoading(false);
    }
  }, []);

  /**
   * Loads audit log entries.
   */
  const loadAuditEntries = useCallback(() => {
    setAuditLoading(true);
    try {
      const filters = {
        page: auditPage,
        pageSize: AUDIT_PAGE_SIZE,
        sortField: 'timestamp',
        sortDirection: 'desc',
      };
      if (auditSearch.trim() !== '') {
        filters.search = auditSearch.trim();
      }
      if (auditFilterAction.trim() !== '') {
        filters.action = auditFilterAction.trim();
      }
      if (auditFilterEntityType.trim() !== '') {
        filters.entityType = auditFilterEntityType.trim();
      }
      if (auditFilterStatus.trim() !== '') {
        filters.status = auditFilterStatus.trim();
      }

      const result = listEntries(filters);
      setAuditEntries(Array.isArray(result.data) ? result.data : []);
      setAuditTotal(result.total || 0);
      setAuditTotalPages(result.totalPages || 1);
    } catch {
      setAuditEntries([]);
      setAuditTotal(0);
      setAuditTotalPages(1);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditSearch, auditFilterAction, auditFilterEntityType, auditFilterStatus]);

  /**
   * Loads audit filter options.
   */
  const loadAuditFilterOptions = useCallback(() => {
    try {
      setAuditActions(getDistinctActions());
      setAuditEntityTypes(getDistinctEntityTypes());
    } catch {
      setAuditActions([]);
      setAuditEntityTypes([]);
    }
  }, []);

  /**
   * Loads platform health status.
   */
  const loadHealthStatus = useCallback(() => {
    setHealthLoading(true);
    try {
      const status = getPlatformHealth();
      setHealthStatus(status);
    } catch {
      setHealthStatus(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (hasViewPermission) {
      loadSeedInfo();
      loadAuditFilterOptions();
    }
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasViewPermission, loadSeedInfo, loadAuditFilterOptions]);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!hasViewPermission) return;
    if (activeTab === 'audit') {
      loadAuditEntries();
      loadAuditFilterOptions();
    } else if (activeTab === 'health') {
      loadHealthStatus();
    } else if (activeTab === 'data') {
      loadSeedInfo();
    }
  }, [activeTab, hasViewPermission, loadAuditEntries, loadAuditFilterOptions, loadHealthStatus, loadSeedInfo]);

  // Reload audit entries when filters change
  useEffect(() => {
    if (activeTab === 'audit' && hasViewPermission) {
      loadAuditEntries();
    }
  }, [auditPage, auditSearch, auditFilterAction, auditFilterEntityType, auditFilterStatus]);

  // Reset audit page when filters change
  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditFilterAction, auditFilterEntityType, auditFilterStatus]);

  /**
   * Handles reseed action.
   */
  const handleReseed = useCallback(() => {
    setConfirmDialog({
      open: true,
      action: 'reseed',
      title: 'Reseed Database',
      message: `This will clear all existing data and generate fresh seed data with size "${selectedSeedSize}". This action cannot be undone. Continue?`,
    });
  }, [selectedSeedSize]);

  /**
   * Handles reset to defaults action.
   */
  const handleResetToDefaults = useCallback(() => {
    setConfirmDialog({
      open: true,
      action: 'reset',
      title: 'Reset to Defaults',
      message: 'This will clear all data and reseed with standard defaults. All customizations will be lost. This action cannot be undone. Continue?',
    });
  }, []);

  /**
   * Handles clear all data action.
   */
  const handleClearAll = useCallback(() => {
    setConfirmDialog({
      open: true,
      action: 'clear',
      title: 'Clear All Data',
      message: 'This will permanently remove all application data from localStorage. The application will be empty until reseeded. This action cannot be undone. Continue?',
    });
  }, []);

  /**
   * Handles export all data action.
   */
  const handleExportAll = useCallback(() => {
    setActionLoading('export');
    setActionResult(null);
    try {
      const result = exportAllData();
      if (result.success && result.data) {
        const exported = exportToJSON(result.data, 'kp-etsip-export.json');
        if (exported) {
          setActionResult({ type: 'success', message: 'Data exported successfully.' });
        } else {
          setActionResult({ type: 'error', message: 'Failed to download export file.' });
        }
      } else {
        setActionResult({ type: 'error', message: result.error || 'Failed to export data.' });
      }
    } catch (err) {
      setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to export data.' });
    } finally {
      setActionLoading(null);
    }
  }, []);

  /**
   * Handles set seed size action.
   */
  const handleSetSeedSize = useCallback(() => {
    setActionLoading('seedSize');
    setActionResult(null);
    try {
      const result = setSeedSize(selectedSeedSize);
      if (result.success) {
        setActionResult({ type: 'success', message: `Seed size set to "${selectedSeedSize}".` });
        loadSeedInfo();
      } else {
        setActionResult({ type: 'error', message: result.error || 'Failed to set seed size.' });
      }
    } catch (err) {
      setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to set seed size.' });
    } finally {
      setActionLoading(null);
    }
  }, [selectedSeedSize, loadSeedInfo]);

  /**
   * Handles confirm dialog confirmation.
   */
  const handleConfirmAction = useCallback(() => {
    const action = confirmDialog.action;
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
    setActionResult(null);

    if (action === 'reseed') {
      setActionLoading('reseed');
      try {
        const result = reseedData(selectedSeedSize);
        if (result.success) {
          const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
          setActionResult({ type: 'success', message: `Database reseeded with "${selectedSeedSize}" size. ${totalEntities} entities created.` });
          loadSeedInfo();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to reseed database.' });
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to reseed database.' });
      } finally {
        setActionLoading(null);
      }
    } else if (action === 'reset') {
      setActionLoading('reset');
      try {
        const result = resetToDefaults();
        if (result.success) {
          const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
          setActionResult({ type: 'success', message: `Database reset to defaults. ${totalEntities} entities created.` });
          loadSeedInfo();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to reset to defaults.' });
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to reset to defaults.' });
      } finally {
        setActionLoading(null);
      }
    } else if (action === 'clear') {
      setActionLoading('clear');
      try {
        const result = clearAllData();
        if (result.success) {
          setActionResult({ type: 'success', message: `All data cleared. ${result.removedCount} key(s) removed.` });
          loadSeedInfo();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to clear data.' });
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to clear data.' });
      } finally {
        setActionLoading(null);
      }
    } else if (action === 'resetFlags') {
      setActionLoading('resetFlags');
      try {
        const result = resetFlags();
        if (result.success) {
          setActionResult({ type: 'success', message: 'Feature flags reset to defaults.' });
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to reset feature flags.' });
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to reset feature flags.' });
      } finally {
        setActionLoading(null);
      }
    }
  }, [confirmDialog.action, selectedSeedSize, loadSeedInfo, resetFlags]);

  /**
   * Handles cancel confirm dialog.
   */
  const handleCancelConfirm = useCallback(() => {
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
  }, []);

  /**
   * Handles opening the import modal.
   */
  const handleOpenImport = useCallback(() => {
    setImportModalOpen(true);
    setImportFileContent(null);
    setImportFileName('');
    setImportError(null);
  }, []);

  /**
   * Handles closing the import modal.
   */
  const handleCloseImport = useCallback(() => {
    setImportModalOpen(false);
    setImportFileContent(null);
    setImportFileName('');
    setImportError(null);
  }, []);

  /**
   * Handles file selection for import.
   */
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setImportError('Only JSON files are supported for import.');
      setImportFileContent(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setImportFileContent(parsed);
        setImportError(null);
      } catch {
        setImportError('Invalid JSON file. Please select a valid KP ETSIP export file.');
        setImportFileContent(null);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
      setImportFileContent(null);
    };
    reader.readAsText(file);
  }, []);

  /**
   * Handles import submission.
   */
  const handleImportSubmit = useCallback(() => {
    if (!importFileContent) {
      setImportError('No valid file selected.');
      return;
    }

    setActionLoading('import');
    setImportError(null);

    try {
      const result = importAllData(importFileContent);
      if (result.success) {
        setActionResult({
          type: 'success',
          message: `Data imported successfully. ${result.importedCount} key(s) imported.${result.warnings.length > 0 ? ` Warnings: ${result.warnings.length}` : ''}`,
        });
        setImportModalOpen(false);
        setImportFileContent(null);
        setImportFileName('');
        loadSeedInfo();
      } else {
        setImportError(result.error || 'Failed to import data.');
        if (result.warnings && result.warnings.length > 0) {
          setImportError((prev) => `${prev || ''} Warnings: ${result.warnings.join('; ')}`);
        }
      }
    } catch (err) {
      setImportError(err && err.message ? err.message : 'Failed to import data.');
    } finally {
      setActionLoading(null);
    }
  }, [importFileContent, loadSeedInfo]);

  /**
   * Handles toggling a feature flag.
   */
  const handleToggleFlag = useCallback(
    (flagKey) => {
      if (!flagKey) return;
      setActionResult(null);
      const result = toggleFlag(flagKey);
      if (result.success) {
        setActionResult({ type: 'success', message: `Feature flag "${flagKey}" toggled.` });
      } else {
        setActionResult({ type: 'error', message: result.error || `Failed to toggle flag "${flagKey}".` });
      }
    },
    [toggleFlag]
  );

  /**
   * Handles resetting feature flags.
   */
  const handleResetFlags = useCallback(() => {
    setConfirmDialog({
      open: true,
      action: 'resetFlags',
      title: 'Reset Feature Flags',
      message: 'This will reset all feature flags to their default values. Continue?',
    });
  }, []);

  /**
   * Handles refresh for the current tab.
   */
  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    setActionResult(null);
    if (activeTab === 'data') {
      loadSeedInfo();
    } else if (activeTab === 'audit') {
      loadAuditEntries();
      loadAuditFilterOptions();
    } else if (activeTab === 'health') {
      loadHealthStatus();
    }
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
  }, [activeTab, loadSeedInfo, loadAuditEntries, loadAuditFilterOptions, loadHealthStatus]);

  /**
   * Handles audit log page change.
   */
  const handleAuditPageChange = useCallback((newPage) => {
    if (typeof newPage === 'number' && newPage >= 1) {
      setAuditPage(newPage);
    }
  }, []);

  /**
   * Clears audit filters.
   */
  const handleClearAuditFilters = useCallback(() => {
    setAuditSearch('');
    setAuditFilterAction('');
    setAuditFilterEntityType('');
    setAuditFilterStatus('');
  }, []);

  const hasActiveAuditFilters = auditSearch !== '' || auditFilterAction !== '' || auditFilterEntityType !== '' || auditFilterStatus !== '';

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title="Access Denied — Administration"
        entityType="PDE_CONFIG"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading;

  if (isLoading && !seedInfo && !healthStatus) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading administration"
      >
        <LoadingSpinner size="lg" label="Loading administration..." />
      </div>
    );
  }

  /**
   * Renders the Data Controls tab content.
   */
  const renderDataControls = () => (
    <div className="space-y-6">
      {/* Action result banner */}
      {actionResult && (
        <div
          className={`rounded-lg p-3 text-sm ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
          role="alert"
        >
          {actionResult.message}
        </div>
      )}

      {/* Seed Info */}
      {seedInfo && (
        <section aria-label="Seed information" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Seed Information
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreCard
                label="Seeded"
                value={seedInfo.isSeeded ? 'Yes' : 'No'}
                description={seedInfo.seedSize ? `Size: ${seedInfo.seedSize}` : 'Not seeded'}
              />
              <ScoreCard
                label="Total Entities"
                value={seedInfo.totalEntities}
                description={`${Object.keys(seedInfo.entityCounts || {}).length} entity types`}
              />
              <ScoreCard
                label="Storage Used"
                value={formatBytes(seedInfo.storage ? seedInfo.storage.bytesUsed : 0)}
                description={seedInfo.storage ? `${seedInfo.storage.percentage.toFixed(1)}% of quota` : ''}
              />
              <ScoreCard
                label="Schema Version"
                value={seedInfo.currentSchemaVersion || '—'}
                description={seedInfo.schemaMatch ? 'Up to date' : 'Needs migration'}
              />
            </div>

            {/* Entity counts */}
            {seedInfo.entityCounts && Object.keys(seedInfo.entityCounts).length > 0 && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  Entity Counts
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(seedInfo.entityCounts)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([entityType, count]) => (
                      <div
                        key={entityType}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900/50"
                      >
                        <span className="truncate text-2xs text-neutral-500 dark:text-neutral-400">
                          {entityType.replace(/_/g, ' ')}
                        </span>
                        <span className="ml-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Seed Size Selector */}
      <section aria-label="Seed size configuration" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Seed Size Configuration
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Select the seed size for data generation. This affects the number of records created during seeding.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 max-w-xs">
              <label htmlFor="seed-size-select" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Seed Size
              </label>
              <select
                id="seed-size-select"
                value={selectedSeedSize}
                onChange={(e) => setSelectedSeedSize(e.target.value)}
                className="input text-sm"
                aria-label="Select seed size"
                disabled={!hasAdminPermission}
              >
                {availableSeedSizes.map((size) => (
                  <option key={size.key} value={size.key}>
                    {size.label} (~{size.records} records)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSetSeedSize}
              disabled={!hasAdminPermission || actionLoading === 'seedSize'}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save seed size"
            >
              {actionLoading === 'seedSize' && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              )}
              <span>Save Seed Size</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Actions */}
      <section aria-label="Data actions" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Data Actions
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Reseed */}
            <button
              type="button"
              onClick={handleReseed}
              disabled={!hasAdminPermission || !!actionLoading}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
              aria-label="Reseed database"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" aria-hidden="true">
                {actionLoading === 'reseed' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Reseed Database</p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Clear and regenerate all data with the selected seed size.
                </p>
              </div>
            </button>

            {/* Reset to Defaults */}
            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={!hasAdminPermission || !!actionLoading}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
              aria-label="Reset to defaults"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" aria-hidden="true">
                {actionLoading === 'reset' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Reset to Defaults</p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Clear all data and reseed with standard defaults.
                </p>
              </div>
            </button>

            {/* Export All */}
            <button
              type="button"
              onClick={handleExportAll}
              disabled={!hasAdminPermission || !!actionLoading}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
              aria-label="Export all data"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" aria-hidden="true">
                {actionLoading === 'export' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Export All Data</p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Download all data as a JSON file.
                </p>
              </div>
            </button>

            {/* Import */}
            <button
              type="button"
              onClick={handleOpenImport}
              disabled={!hasAdminPermission || !!actionLoading}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
              aria-label="Import data"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" aria-hidden="true">
                {actionLoading === 'import' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Import Data</p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Import data from a JSON export file.
                </p>
              </div>
            </button>

            {/* Clear All */}
            <button
              type="button"
              onClick={handleClearAll}
              disabled={!hasAdminPermission || !!actionLoading}
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:bg-neutral-800 dark:hover:bg-red-900/20"
              aria-label="Clear all data"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" aria-hidden="true">
                {actionLoading === 'clear' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Clear All Data</p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Permanently remove all data from localStorage.
                </p>
              </div>
            </button>
          </div>

          {!hasAdminPermission && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" role="alert">
              You do not have permission to perform data administration actions. Switch to the Platform Administrator persona.
            </div>
          )}
        </div>
      </section>
    </div>
  );

  /**
   * Renders the Feature Flags tab content.
   */
  const renderFeatureFlags = () => (
    <div className="space-y-6">
      {/* Action result banner */}
      {actionResult && (
        <div
          className={`rounded-lg p-3 text-sm ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
          role="alert"
        >
          {actionResult.message}
        </div>
      )}

      <section aria-label="Feature flags" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Feature Flags
          </h3>
          <button
            type="button"
            onClick={handleResetFlags}
            disabled={!hasAdminPermission || !!actionLoading}
            className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset feature flags to defaults"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Reset to Defaults</span>
          </button>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {Array.isArray(flags) && flags.length > 0 ? (
            flags.map((flag) => {
              if (!flag || !flag.key) return null;
              return (
                <div
                  key={flag.key}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {flag.label || flag.key}
                      </p>
                      {flag.category && (
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-2xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                          {flag.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {flag.description || ''}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flag.enabled}
                      aria-label={`Toggle ${flag.label || flag.key}`}
                      onClick={() => handleToggleFlag(flag.key)}
                      disabled={!hasAdminPermission || !!actionLoading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        flag.enabled
                          ? 'bg-primary-500'
                          : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No feature flags available.
            </div>
          )}
        </div>
      </section>

      {/* Theme section */}
      <section aria-label="Theme settings" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Theme Settings
          </h3>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Current Theme
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {darkModeEnabled
                ? `Dark mode is enabled. Current theme: ${isDark ? 'Dark' : 'Light'}.`
                : 'Dark mode is disabled via feature flag. Enable the "Dark Mode" feature flag to use dark theme.'}
            </p>
          </div>
          {darkModeEnabled && (
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );

  /**
   * Renders the Audit Log tab content.
   */
  const renderAuditLog = () => {
    const startRecord = auditTotal > 0 ? (auditPage - 1) * AUDIT_PAGE_SIZE + 1 : 0;
    const endRecord = Math.min(auditPage * AUDIT_PAGE_SIZE, auditTotal);

    return (
      <div className="space-y-4">
        {/* Filters */}
        <section aria-label="Audit log filters" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <label htmlFor="audit-search" className="sr-only">Search audit log</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="audit-search"
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit log..."
                className="input pl-9 text-sm"
                aria-label="Search audit log"
              />
            </div>
          </div>

          {/* Action filter */}
          <select
            value={auditFilterAction}
            onChange={(e) => setAuditFilterAction(e.target.value)}
            className="input py-2 text-xs max-w-[140px]"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Entity type filter */}
          <select
            value={auditFilterEntityType}
            onChange={(e) => setAuditFilterEntityType(e.target.value)}
            className="input py-2 text-xs max-w-[160px]"
            aria-label="Filter by entity type"
          >
            <option value="">All Entity Types</option>
            {auditEntityTypes.map((et) => (
              <option key={et} value={et}>
                {et.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={auditFilterStatus}
            onChange={(e) => setAuditFilterStatus(e.target.value)}
            className="input py-2 text-xs max-w-[120px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="partial">Partial</option>
          </select>

          {hasActiveAuditFilters && (
            <button
              type="button"
              onClick={handleClearAuditFilters}
              className="text-xs text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          )}
        </section>

        {/* Audit entries table */}
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Audit Log Entries
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {auditTotal} total
            </span>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" label="Loading audit log..." />
            </div>
          ) : auditEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-300 dark:text-neutral-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {hasActiveAuditFilters ? 'No audit entries match your filters.' : 'No audit log entries yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700" role="table" aria-label="Audit log entries">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr role="row">
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Timestamp</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Action</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Entity Type</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Entity</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">User</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                    {auditEntries.map((entry) => {
                      if (!entry || !entry.id) return null;
                      return (
                        <tr key={entry.id} role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                          <td role="cell" className="whitespace-nowrap px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {formatTimestamp(entry.timestamp)}
                          </td>
                          <td role="cell" className="whitespace-nowrap px-4 py-2 text-xs">
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-2xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                              {entry.action ? entry.action.replace(/_/g, ' ') : '—'}
                            </span>
                          </td>
                          <td role="cell" className="whitespace-nowrap px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300">
                            {entry.entityType ? entry.entityType.replace(/_/g, ' ') : '—'}
                          </td>
                          <td role="cell" className="max-w-[150px] truncate px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300" title={entry.entityName || entry.entityId || ''}>
                            {entry.entityName || entry.entityId || '—'}
                          </td>
                          <td role="cell" className="whitespace-nowrap px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300">
                            {entry.userName || '—'}
                          </td>
                          <td role="cell" className="whitespace-nowrap px-4 py-2">
                            <StatusBadge
                              status={entry.status || 'unknown'}
                              variant={auditStatusToVariant(entry.status)}
                              size="sm"
                            />
                          </td>
                          <td role="cell" className="max-w-[200px] truncate px-4 py-2 text-2xs text-neutral-500 dark:text-neutral-400" title={entry.details || ''}>
                            {entry.details || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3 dark:border-neutral-700 sm:flex-row">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {auditTotal > 0 ? (
                    <span>
                      Showing <span className="font-medium text-neutral-700 dark:text-neutral-200">{startRecord}</span> to{' '}
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">{endRecord}</span> of{' '}
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">{auditTotal}</span> entries
                    </span>
                  ) : (
                    <span>No entries</span>
                  )}
                </div>
                <nav aria-label="Audit log pagination" className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAuditPageChange(1)}
                    disabled={auditPage <= 1}
                    className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Go to first page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditPageChange(auditPage - 1)}
                    disabled={auditPage <= 1}
                    className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Go to previous page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="flex items-center px-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{auditPage}</span>
                    <span className="mx-1">/</span>
                    <span>{auditTotalPages}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAuditPageChange(auditPage + 1)}
                    disabled={auditPage >= auditTotalPages}
                    className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Go to next page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditPageChange(auditTotalPages)}
                    disabled={auditPage >= auditTotalPages}
                    className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Go to last page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders the Platform Health tab content.
   */
  const renderPlatformHealth = () => {
    if (healthLoading && !healthStatus) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" label="Loading platform health..." />
        </div>
      );
    }

    if (!healthStatus) {
      return (
        <EmptyState
          title="Health Data Unavailable"
          message="Platform health data could not be loaded."
          actionLabel="Retry"
          onAction={loadHealthStatus}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Status */}
        <section aria-label="Overall platform status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            label="Overall Status"
            value={healthStatus.overallStatus ? healthStatus.overallStatus.charAt(0).toUpperCase() + healthStatus.overallStatus.slice(1) : '—'}
            description={`Computed at ${formatTimestamp(healthStatus.computedAt)}`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Storage Used"
            value={formatBytes(healthStatus.storage ? healthStatus.storage.bytesUsed : 0)}
            description={healthStatus.storage ? `${healthStatus.storage.percentage.toFixed(1)}% of ${formatBytes(healthStatus.storage.quota)}` : ''}
            scoreBand={healthStatus.storage && healthStatus.storage.percentage > 80 ? getScoreBand(20) : getScoreBand(80)}
          />
          <ScoreCard
            label="Total Errors"
            value={healthStatus.errorCounts ? healthStatus.errorCounts.total : 0}
            description="Across all entity types"
            trend={healthStatus.errorCounts && healthStatus.errorCounts.total > 10 ? 'down' : 'stable'}
          />
          <ScoreCard
            label="Integrations"
            value={`${healthStatus.integrations ? healthStatus.integrations.active : 0}/${healthStatus.integrations ? healthStatus.integrations.total : 0}`}
            description={`${healthStatus.integrations ? healthStatus.integrations.error : 0} in error`}
            scoreBand={getScoreBand(healthStatus.integrations ? healthStatus.integrations.averageHealthScore : 0)}
          />
        </section>

        {/* Warnings */}
        {healthStatus.warnings && Object.values(healthStatus.warnings).some((v) => v === true) && (
          <section aria-label="Platform warnings" className="rounded-xl bg-yellow-50 shadow-card dark:bg-yellow-900/20">
            <div className="border-b border-yellow-200 px-5 py-3 dark:border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Active Warnings
              </h3>
            </div>
            <div className="p-5 space-y-2">
              {healthStatus.warnings.storageCritical && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                  <span>Storage usage is critical (&gt;90% of quota). Clear data or reduce seed size.</span>
                </div>
              )}
              {healthStatus.warnings.storageApproachingLimit && !healthStatus.warnings.storageCritical && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                  <span>Storage usage is approaching the limit (&gt;80% of quota).</span>
                </div>
              )}
              {healthStatus.warnings.highErrorCount && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                  <span>High error count detected ({healthStatus.errorCounts ? healthStatus.errorCounts.total : 0} errors).</span>
                </div>
              )}
              {healthStatus.warnings.schemaVersionMismatch && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                  <span>Schema version mismatch. Data may need migration.</span>
                </div>
              )}
              {healthStatus.warnings.notSeeded && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                  <span>Database has not been seeded. Go to Data Controls to seed the database.</span>
                </div>
              )}
              {healthStatus.warnings.integrationsUnhealthy && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                  <span>More than 30% of integrations are in error state.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Error Counts Breakdown */}
        {healthStatus.errorCounts && (
          <section aria-label="Error counts breakdown" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Error Counts by Category
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Integrations', value: healthStatus.errorCounts.integrationsInError, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Quality Gates', value: healthStatus.errorCounts.failedQualityGates, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Critical Debt', value: healthStatus.errorCounts.criticalTechDebt, color: 'text-orange-600 dark:text-orange-400' },
                  { label: 'Expired Waivers', value: healthStatus.errorCounts.expiredWaivers, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Failed AI', value: healthStatus.errorCounts.failedAIAnalyses, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Degraded Envs', value: healthStatus.errorCounts.degradedEnvironments, color: 'text-orange-600 dark:text-orange-400' },
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

        {/* Integration Health */}
        {healthStatus.integrations && (
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
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.integrations.total}</td>
                    </tr>
                    <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Active</td>
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">{healthStatus.integrations.active}</td>
                    </tr>
                    <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">In Error</td>
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">{healthStatus.integrations.error}</td>
                    </tr>
                    <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Inactive</td>
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">{healthStatus.integrations.inactive}</td>
                    </tr>
                    <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Configuring</td>
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-yellow-600 dark:text-yellow-400">{healthStatus.integrations.configuring}</td>
                    </tr>
                    <tr role="row" className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">Avg Health Score</td>
                      <td role="cell" className="px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.integrations.averageHealthScore}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Seed Info */}
        {healthStatus.seedInfo && (
          <section aria-label="Seed information" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Seed & Schema Information
              </h3>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Database Seeded</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.seedInfo.isSeeded ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Seed Size</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.seedInfo.seedSize || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Anchor Date</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.seedInfo.anchorDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Schema Version</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{healthStatus.seedInfo.schemaVersion || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Schema Match</span>
                <StatusBadge
                  status={healthStatus.seedInfo.schemaMatch ? 'Up to date' : 'Mismatch'}
                  variant={healthStatus.seedInfo.schemaMatch ? 'success' : 'danger'}
                  size="sm"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" role="region" aria-label="Administration">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Administration
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Platform administration and data controls
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs self-start sm:self-auto"
          aria-label="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>Refresh</span>
        </button>
      </header>

      {/* Tab Navigation */}
      <nav aria-label="Administration tabs" className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex space-x-0 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => {
                setActiveTab(tab.key);
                setActionResult(null);
              }}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
      >
        {activeTab === 'data' && renderDataControls()}
        {activeTab === 'flags' && renderFeatureFlags()}
        {activeTab === 'audit' && renderAuditLog()}
        {activeTab === 'health' && renderPlatformHealth()}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={confirmDialog.action === 'clear' ? 'danger' : 'warning'}
        loading={!!actionLoading}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={handleCloseImport}
        title="Import Data"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Select a JSON file exported from KP ETSIP to import. This will replace all existing data.
          </p>

          {importError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {importError}
            </div>
          )}

          <div>
            <label htmlFor="import-file-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Select File
            </label>
            <input
              ref={fileInputRef}
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-neutral-400 dark:file:bg-primary-900/30 dark:file:text-primary-300"
              aria-label="Select JSON file to import"
            />
            {importFileName && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Selected: {importFileName}
              </p>
            )}
          </div>

          {importFileContent && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
              File parsed successfully. Ready to import.
              {importFileContent.metadata && importFileContent.metadata.seedSize && (
                <span> Seed size: {importFileContent.metadata.seedSize}.</span>
              )}
              {importFileContent.metadata && typeof importFileContent.metadata.totalEntities === 'number' && (
                <span> Total entities: {importFileContent.metadata.totalEntities}.</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button
              type="button"
              onClick={handleCloseImport}
              disabled={actionLoading === 'import'}
              className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel import"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={!importFileContent || actionLoading === 'import'}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Import data"
            >
              {actionLoading === 'import' && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              )}
              <span>{actionLoading === 'import' ? 'Importing...' : 'Import'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All administration actions are audit-logged. Data is stored in localStorage.
          Persona: {persona.name}.
        </p>
      </footer>
    </div>
  );
};

export default AdministrationPage;