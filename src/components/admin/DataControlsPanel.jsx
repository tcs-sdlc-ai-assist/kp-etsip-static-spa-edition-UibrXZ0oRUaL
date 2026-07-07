import { useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
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
} from '../../services/adminDataService';
import LoadingSpinner from '../common/LoadingSpinner';
import ScoreCard from '../common/ScoreCard';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import { exportToJSON } from '../../utils/exportUtils';

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
 * Data controls panel component used within the AdministrationPage.
 * Provides buttons for Reseed, Reset to Defaults, Export All Data (JSON),
 * Import Data (JSON file upload), Clear All Data, and Seed Size selector.
 * All actions show confirmation dialogs, are permission-gated, and audit-logged.
 * Accessible with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @param {boolean} [props.disabled] - Whether all controls should be disabled (e.g., no admin permission).
 * @param {function} [props.onAction] - Optional callback invoked after any action completes.
 * @returns {React.ReactElement}
 */
const DataControlsPanel = ({ className, disabled, onAction }) => {
  const [seedInfo, setSeedInfoState] = useState(null);
  const [seedInfoLoading, setSeedInfoLoading] = useState(false);
  const [selectedSeedSize, setSelectedSeedSize] = useState('standard');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    title: '',
    message: '',
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileContent, setImportFileContent] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const hasAdminPermission = useMemo(() => {
    if (disabled) {
      return false;
    }
    return canPerformAdminActions();
  }, [disabled]);

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
        setSeedInfoState(result.data);
        if (result.data.seedSize) {
          setSelectedSeedSize(result.data.seedSize);
        }
      }
    } catch {
      setSeedInfoState(null);
    } finally {
      setSeedInfoLoading(false);
    }
  }, []);

  // Load seed info on mount
  useState(() => {
    loadSeedInfo();
  });

  /**
   * Clears the action result after a delay.
   */
  const clearActionResult = useCallback(() => {
    setTimeout(() => {
      setActionResult(null);
    }, 5000);
  }, []);

  /**
   * Notifies the parent component of a completed action.
   * @param {string} actionName - The name of the action.
   * @param {Object} result - The action result.
   */
  const notifyAction = useCallback(
    (actionName, result) => {
      if (typeof onAction === 'function') {
        onAction(actionName, result);
      }
    },
    [onAction]
  );

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
      message:
        'This will clear all data and reseed with standard defaults. All customizations will be lost. This action cannot be undone. Continue?',
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
      message:
        'This will permanently remove all application data from localStorage. The application will be empty until reseeded. This action cannot be undone. Continue?',
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
          setActionResult({
            type: 'success',
            message: 'Data exported successfully.',
          });
        } else {
          setActionResult({
            type: 'error',
            message: 'Failed to download export file.',
          });
        }
      } else {
        setActionResult({
          type: 'error',
          message: result.error || 'Failed to export data.',
        });
      }
    } catch (err) {
      setActionResult({
        type: 'error',
        message:
          err && err.message ? err.message : 'Failed to export data.',
      });
    } finally {
      setActionLoading(null);
      clearActionResult();
      notifyAction('export', null);
    }
  }, [clearActionResult, notifyAction]);

  /**
   * Handles set seed size action.
   */
  const handleSetSeedSize = useCallback(() => {
    setActionLoading('seedSize');
    setActionResult(null);
    try {
      const result = setSeedSize(selectedSeedSize);
      if (result.success) {
        setActionResult({
          type: 'success',
          message: `Seed size set to "${selectedSeedSize}".`,
        });
        loadSeedInfo();
        notifyAction('setSeedSize', { seedSize: selectedSeedSize });
      } else {
        setActionResult({
          type: 'error',
          message: result.error || 'Failed to set seed size.',
        });
      }
    } catch (err) {
      setActionResult({
        type: 'error',
        message:
          err && err.message ? err.message : 'Failed to set seed size.',
      });
    } finally {
      setActionLoading(null);
      clearActionResult();
    }
  }, [selectedSeedSize, loadSeedInfo, clearActionResult, notifyAction]);

  /**
   * Handles confirm dialog confirmation.
   */
  const handleConfirmAction = useCallback(() => {
    const action = confirmDialog.action;
    setConfirmDialog({
      open: false,
      action: null,
      title: '',
      message: '',
    });
    setActionResult(null);

    if (action === 'reseed') {
      setActionLoading('reseed');
      try {
        const result = reseedData(selectedSeedSize);
        if (result.success) {
          const totalEntities = Object.values(result.counts).reduce(
            (s, c) => s + c,
            0
          );
          setActionResult({
            type: 'success',
            message: `Database reseeded with "${selectedSeedSize}" size. ${totalEntities} entities created.`,
          });
          loadSeedInfo();
          notifyAction('reseed', result);
        } else {
          setActionResult({
            type: 'error',
            message: result.error || 'Failed to reseed database.',
          });
        }
      } catch (err) {
        setActionResult({
          type: 'error',
          message:
            err && err.message
              ? err.message
              : 'Failed to reseed database.',
        });
      } finally {
        setActionLoading(null);
        clearActionResult();
      }
    } else if (action === 'reset') {
      setActionLoading('reset');
      try {
        const result = resetToDefaults();
        if (result.success) {
          const totalEntities = Object.values(result.counts).reduce(
            (s, c) => s + c,
            0
          );
          setActionResult({
            type: 'success',
            message: `Database reset to defaults. ${totalEntities} entities created.`,
          });
          loadSeedInfo();
          notifyAction('reset', result);
        } else {
          setActionResult({
            type: 'error',
            message: result.error || 'Failed to reset to defaults.',
          });
        }
      } catch (err) {
        setActionResult({
          type: 'error',
          message:
            err && err.message
              ? err.message
              : 'Failed to reset to defaults.',
        });
      } finally {
        setActionLoading(null);
        clearActionResult();
      }
    } else if (action === 'clear') {
      setActionLoading('clear');
      try {
        const result = clearAllData();
        if (result.success) {
          setActionResult({
            type: 'success',
            message: `All data cleared. ${result.removedCount} key(s) removed.`,
          });
          loadSeedInfo();
          notifyAction('clear', result);
        } else {
          setActionResult({
            type: 'error',
            message: result.error || 'Failed to clear data.',
          });
        }
      } catch (err) {
        setActionResult({
          type: 'error',
          message:
            err && err.message ? err.message : 'Failed to clear data.',
        });
      } finally {
        setActionLoading(null);
        clearActionResult();
      }
    }
  }, [
    confirmDialog.action,
    selectedSeedSize,
    loadSeedInfo,
    clearActionResult,
    notifyAction,
  ]);

  /**
   * Handles cancel confirm dialog.
   */
  const handleCancelConfirm = useCallback(() => {
    setConfirmDialog({
      open: false,
      action: null,
      title: '',
      message: '',
    });
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
        setImportError(
          'Invalid JSON file. Please select a valid KP ETSIP export file.'
        );
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
          message: `Data imported successfully. ${result.importedCount} key(s) imported.${
            result.warnings.length > 0
              ? ` Warnings: ${result.warnings.length}`
              : ''
          }`,
        });
        setImportModalOpen(false);
        setImportFileContent(null);
        setImportFileName('');
        loadSeedInfo();
        notifyAction('import', result);
        clearActionResult();
      } else {
        setImportError(result.error || 'Failed to import data.');
        if (result.warnings && result.warnings.length > 0) {
          setImportError(
            (prev) =>
              `${prev || ''} Warnings: ${result.warnings.join('; ')}`
          );
        }
      }
    } catch (err) {
      setImportError(
        err && err.message ? err.message : 'Failed to import data.'
      );
    } finally {
      setActionLoading(null);
    }
  }, [importFileContent, loadSeedInfo, clearActionResult, notifyAction]);

  /**
   * Handles refresh action.
   */
  const handleRefresh = useCallback(() => {
    loadSeedInfo();
  }, [loadSeedInfo]);

  if (seedInfoLoading && !seedInfo) {
    return (
      <div
        className={`flex items-center justify-center py-8 ${className || ''}`}
        role="status"
        aria-label="Loading data controls"
      >
        <LoadingSpinner size="sm" label="Loading data controls..." />
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className || ''}`}
      role="region"
      aria-label="Data controls"
    >
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
        <section
          aria-label="Seed information"
          className="rounded-xl bg-white shadow-card dark:bg-neutral-800"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Seed Information
            </h3>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
              aria-label="Refresh seed information"
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
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreCard
                label="Seeded"
                value={seedInfo.isSeeded ? 'Yes' : 'No'}
                description={
                  seedInfo.seedSize
                    ? `Size: ${seedInfo.seedSize}`
                    : 'Not seeded'
                }
              />
              <ScoreCard
                label="Total Entities"
                value={seedInfo.totalEntities}
                description={`${
                  Object.keys(seedInfo.entityCounts || {}).length
                } entity types`}
              />
              <ScoreCard
                label="Storage Used"
                value={formatBytes(
                  seedInfo.storage ? seedInfo.storage.bytesUsed : 0
                )}
                description={
                  seedInfo.storage
                    ? `${seedInfo.storage.percentage.toFixed(1)}% of quota`
                    : ''
                }
              />
              <ScoreCard
                label="Schema Version"
                value={seedInfo.currentSchemaVersion || '—'}
                description={
                  seedInfo.schemaMatch ? 'Up to date' : 'Needs migration'
                }
              />
            </div>

            {/* Entity counts */}
            {seedInfo.entityCounts &&
              Object.keys(seedInfo.entityCounts).length > 0 && (
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
      <section
        aria-label="Seed size configuration"
        className="rounded-xl bg-white shadow-card dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Seed Size Configuration
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Select the seed size for data generation. This affects the number of
            records created during seeding.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 max-w-xs">
              <label
                htmlFor="seed-size-select"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Seed Size
              </label>
              <select
                id="seed-size-select"
                value={selectedSeedSize}
                onChange={(e) => setSelectedSeedSize(e.target.value)}
                className="input text-sm"
                aria-label="Select seed size"
                disabled={!hasAdminPermission || !!actionLoading}
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
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              )}
              <span>Save Seed Size</span>
            </button>
          </div>
        </div>
      </section>

      {/* Data Actions */}
      <section
        aria-label="Data actions"
        className="rounded-xl bg-white shadow-card dark:bg-neutral-800"
      >
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
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                aria-hidden="true"
              >
                {actionLoading === 'reseed' ? (
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
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Reseed Database
                </p>
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
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                aria-hidden="true"
              >
                {actionLoading === 'reset' ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"
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
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Reset to Defaults
                </p>
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
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                aria-hidden="true"
              >
                {actionLoading === 'export' ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent"
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
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Export All Data
                </p>
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
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                aria-hidden="true"
              >
                {actionLoading === 'import' ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
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
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Import Data
                </p>
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
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                aria-hidden="true"
              >
                {actionLoading === 'clear' ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"
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
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Clear All Data
                </p>
                <p className="mt-0.5 text-2xs text-neutral-500 dark:text-neutral-400">
                  Permanently remove all data from localStorage.
                </p>
              </div>
            </button>
          </div>

          {!hasAdminPermission && (
            <div
              className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              role="alert"
            >
              You do not have permission to perform data administration actions.
              Switch to the Platform Administrator persona.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All data control actions are audit-logged. Data is stored in
          localStorage. Changes take effect immediately.
        </p>
      </footer>

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
            Select a JSON file exported from KP ETSIP to import. This will
            replace all existing data.
          </p>

          {importError && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {importError}
            </div>
          )}

          <div>
            <label
              htmlFor="import-file-input"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
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
              {importFileContent.metadata &&
                importFileContent.metadata.seedSize && (
                  <span>
                    {' '}
                    Seed size: {importFileContent.metadata.seedSize}.
                  </span>
                )}
              {importFileContent.metadata &&
                typeof importFileContent.metadata.totalEntities ===
                  'number' && (
                  <span>
                    {' '}
                    Total entities:{' '}
                    {importFileContent.metadata.totalEntities}.
                  </span>
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
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              )}
              <span>
                {actionLoading === 'import' ? 'Importing...' : 'Import'}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

DataControlsPanel.propTypes = {
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
  /** Whether all controls should be disabled (e.g., no admin permission). */
  disabled: PropTypes.bool,
  /** Optional callback invoked after any action completes. */
  onAction: PropTypes.func,
};

DataControlsPanel.defaultProps = {
  className: '',
  disabled: false,
  onAction: null,
};

export default DataControlsPanel;