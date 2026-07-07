import { getStorageUsage, getAllKeys } from '../storage/storageAdapter';
import { getIntegrationSummary } from './integrationRepository';
import { getCurrentSeedSize, isDatabaseSeeded } from '../seed/seedEngine';
import { checkSchemaVersion } from '../storage/storageAdapter';
import { STORAGE_KEYS, ANCHOR_DATE, SEED_SIZES } from '../constants/constants';
import { getItem } from '../storage/storageAdapter';

/**
 * @typedef {Object} StorageInfo
 * @property {number} bytesUsed - Total bytes used by application data.
 * @property {number} quota - Estimated localStorage quota in bytes.
 * @property {number} percentage - Percentage of quota used.
 * @property {Object<string, number>} keys - Bytes used per storage key.
 */

/**
 * @typedef {Object} IntegrationHealthSummary
 * @property {number} total - Total number of integrations.
 * @property {number} active - Number of active integrations.
 * @property {number} inactive - Number of inactive integrations.
 * @property {number} error - Number of integrations in error state.
 * @property {number} configuring - Number of integrations being configured.
 * @property {number} deprecated - Number of deprecated integrations.
 * @property {number} averageHealthScore - Average health score across all integrations.
 */

/**
 * @typedef {Object} SeedInfo
 * @property {boolean} isSeeded - Whether the database has been seeded.
 * @property {string|null} seedSize - The current seed size key ('small', 'standard', 'large'), or null if not set.
 * @property {string} anchorDate - The anchor date used for seed data generation.
 * @property {string|null} schemaVersion - The stored schema version, or null if not set.
 * @property {boolean} schemaMatch - Whether the stored schema version matches the current version.
 */

/**
 * @typedef {Object} ErrorCounts
 * @property {number} integrationsInError - Number of integrations in error state.
 * @property {number} failedQualityGates - Number of failed quality gates.
 * @property {number} criticalTechDebt - Number of critical priority open tech debt items.
 * @property {number} expiredWaivers - Number of expired waivers.
 * @property {number} failedAIAnalyses - Number of failed AI analyses.
 * @property {number} degradedEnvironments - Number of degraded or down environments.
 * @property {number} total - Total error count across all categories.
 */

/**
 * @typedef {Object} WarningFlags
 * @property {boolean} storageApproachingLimit - True if localStorage usage exceeds 80% of estimated quota.
 * @property {boolean} storageCritical - True if localStorage usage exceeds 90% of estimated quota.
 * @property {boolean} highErrorCount - True if total error count exceeds 10.
 * @property {boolean} schemaVersionMismatch - True if stored schema version does not match current version.
 * @property {boolean} notSeeded - True if the database has not been seeded.
 * @property {boolean} integrationsUnhealthy - True if more than 30% of integrations are in error state.
 */

/**
 * @typedef {Object} PlatformHealthStatus
 * @property {StorageInfo} storage - localStorage usage information.
 * @property {IntegrationHealthSummary} integrations - Integration health summary.
 * @property {SeedInfo} seedInfo - Seed data information.
 * @property {ErrorCounts} errorCounts - Error counts across entity types.
 * @property {WarningFlags} warnings - Warning flags for platform health issues.
 * @property {string} computedAt - ISO 8601 timestamp of when the health status was computed.
 * @property {string} overallStatus - Overall platform status: 'healthy', 'warning', or 'critical'.
 */

/**
 * Storage threshold constants.
 * @type {number}
 */
const STORAGE_WARNING_THRESHOLD = 0.80;
const STORAGE_CRITICAL_THRESHOLD = 0.90;
const HIGH_ERROR_COUNT_THRESHOLD = 10;
const INTEGRATION_UNHEALTHY_RATIO = 0.30;

/**
 * Registered health change listeners.
 * @type {Array<function(PlatformHealthStatus): void>}
 */
const listeners = [];

/**
 * Cached last health status for comparison.
 * @type {PlatformHealthStatus|null}
 */
let lastHealthStatus = null;

/**
 * Computes the current localStorage usage information.
 * @returns {StorageInfo}
 */
const computeStorageInfo = () => {
  try {
    return getStorageUsage();
  } catch {
    return {
      bytesUsed: 0,
      quota: 5 * 1024 * 1024,
      percentage: 0,
      keys: {},
    };
  }
};

/**
 * Computes the integration health summary.
 * @returns {IntegrationHealthSummary}
 */
const computeIntegrationHealth = () => {
  try {
    return getIntegrationSummary();
  } catch {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      error: 0,
      configuring: 0,
      deprecated: 0,
      averageHealthScore: 0,
    };
  }
};

/**
 * Computes the current seed information.
 * @returns {SeedInfo}
 */
const computeSeedInfo = () => {
  try {
    const isSeeded = isDatabaseSeeded();
    const seedSize = getCurrentSeedSize();
    const versionCheck = checkSchemaVersion();

    return {
      isSeeded,
      seedSize: seedSize || null,
      anchorDate: ANCHOR_DATE,
      schemaVersion: versionCheck.stored || null,
      schemaMatch: versionCheck.match,
    };
  } catch {
    return {
      isSeeded: false,
      seedSize: null,
      anchorDate: ANCHOR_DATE,
      schemaVersion: null,
      schemaMatch: false,
    };
  }
};

/**
 * Counts records matching a field value from a localStorage array.
 * @param {string} storageKey - The STORAGE_KEYS value.
 * @param {string} field - The field name to check.
 * @param {*} value - The value to match.
 * @returns {number}
 */
const countByFieldFromStorage = (storageKey, field, value) => {
  try {
    const data = getItem(storageKey);
    if (!Array.isArray(data)) {
      return 0;
    }
    return data.filter((r) => r && r[field] === value).length;
  } catch {
    return 0;
  }
};

/**
 * Counts records matching a field with one of multiple values from a localStorage array.
 * @param {string} storageKey - The STORAGE_KEYS value.
 * @param {string} field - The field name to check.
 * @param {Array<*>} values - The values to match.
 * @returns {number}
 */
const countByFieldMultipleFromStorage = (storageKey, field, values) => {
  try {
    const data = getItem(storageKey);
    if (!Array.isArray(data)) {
      return 0;
    }
    return data.filter((r) => r && values.includes(r[field])).length;
  } catch {
    return 0;
  }
};

/**
 * Counts open critical tech debt items.
 * @returns {number}
 */
const countCriticalTechDebt = () => {
  try {
    const data = getItem(STORAGE_KEYS.TECH_DEBT);
    if (!Array.isArray(data)) {
      return 0;
    }
    return data.filter(
      (d) => d && d.priority === 'critical' && d.status !== 'resolved'
    ).length;
  } catch {
    return 0;
  }
};

/**
 * Computes error counts across all relevant entity types.
 * @param {IntegrationHealthSummary} integrationSummary - The integration health summary.
 * @returns {ErrorCounts}
 */
const computeErrorCounts = (integrationSummary) => {
  const integrationsInError = integrationSummary.error || 0;
  const failedQualityGates = countByFieldFromStorage(STORAGE_KEYS.QUALITY_GATES, 'status', 'failed');
  const criticalTechDebt = countCriticalTechDebt();
  const expiredWaivers = countByFieldFromStorage(STORAGE_KEYS.WAIVERS, 'status', 'expired');
  const failedAIAnalyses = countByFieldFromStorage(STORAGE_KEYS.AI_ANALYSES, 'status', 'failed');
  const degradedEnvironments = countByFieldMultipleFromStorage(
    STORAGE_KEYS.ENVIRONMENTS,
    'healthStatus',
    ['degraded', 'down']
  );

  const total =
    integrationsInError +
    failedQualityGates +
    criticalTechDebt +
    expiredWaivers +
    failedAIAnalyses +
    degradedEnvironments;

  return {
    integrationsInError,
    failedQualityGates,
    criticalTechDebt,
    expiredWaivers,
    failedAIAnalyses,
    degradedEnvironments,
    total,
  };
};

/**
 * Computes warning flags based on current platform health data.
 * @param {StorageInfo} storage - Storage usage information.
 * @param {IntegrationHealthSummary} integrations - Integration health summary.
 * @param {SeedInfo} seedInfo - Seed information.
 * @param {ErrorCounts} errorCounts - Error counts.
 * @returns {WarningFlags}
 */
const computeWarnings = (storage, integrations, seedInfo, errorCounts) => {
  const storageRatio = storage.quota > 0 ? storage.bytesUsed / storage.quota : 0;

  const integrationsUnhealthy =
    integrations.total > 0 &&
    integrations.error / integrations.total > INTEGRATION_UNHEALTHY_RATIO;

  return {
    storageApproachingLimit: storageRatio >= STORAGE_WARNING_THRESHOLD,
    storageCritical: storageRatio >= STORAGE_CRITICAL_THRESHOLD,
    highErrorCount: errorCounts.total > HIGH_ERROR_COUNT_THRESHOLD,
    schemaVersionMismatch: !seedInfo.schemaMatch && seedInfo.schemaVersion !== null,
    notSeeded: !seedInfo.isSeeded,
    integrationsUnhealthy,
  };
};

/**
 * Determines the overall platform status based on warning flags.
 * @param {WarningFlags} warnings - The warning flags.
 * @returns {string} 'healthy', 'warning', or 'critical'.
 */
const determineOverallStatus = (warnings) => {
  if (warnings.storageCritical || warnings.schemaVersionMismatch) {
    return 'critical';
  }

  if (
    warnings.storageApproachingLimit ||
    warnings.highErrorCount ||
    warnings.notSeeded ||
    warnings.integrationsUnhealthy
  ) {
    return 'warning';
  }

  return 'healthy';
};

/**
 * Notifies all registered listeners with the latest health status.
 * @param {PlatformHealthStatus} status - The current platform health status.
 */
const notifyListeners = (status) => {
  listeners.forEach((callback) => {
    try {
      callback(status);
    } catch {
      // Listener errors should not break the notification chain
    }
  });
};

/**
 * Computes and returns the current platform health status.
 * Aggregates localStorage usage, integration statuses, seed info, error counts,
 * and warning flags into a single health status object.
 *
 * @returns {PlatformHealthStatus}
 */
export const getPlatformHealth = () => {
  try {
    const storage = computeStorageInfo();
    const integrations = computeIntegrationHealth();
    const seedInfo = computeSeedInfo();
    const errorCounts = computeErrorCounts(integrations);
    const warnings = computeWarnings(storage, integrations, seedInfo, errorCounts);
    const overallStatus = determineOverallStatus(warnings);
    const computedAt = new Date().toISOString();

    const status = {
      storage,
      integrations,
      seedInfo,
      errorCounts,
      warnings,
      computedAt,
      overallStatus,
    };

    lastHealthStatus = status;

    return status;
  } catch {
    const fallbackStatus = {
      storage: {
        bytesUsed: 0,
        quota: 5 * 1024 * 1024,
        percentage: 0,
        keys: {},
      },
      integrations: {
        total: 0,
        active: 0,
        inactive: 0,
        error: 0,
        configuring: 0,
        deprecated: 0,
        averageHealthScore: 0,
      },
      seedInfo: {
        isSeeded: false,
        seedSize: null,
        anchorDate: ANCHOR_DATE,
        schemaVersion: null,
        schemaMatch: false,
      },
      errorCounts: {
        integrationsInError: 0,
        failedQualityGates: 0,
        criticalTechDebt: 0,
        expiredWaivers: 0,
        failedAIAnalyses: 0,
        degradedEnvironments: 0,
        total: 0,
      },
      warnings: {
        storageApproachingLimit: false,
        storageCritical: false,
        highErrorCount: false,
        schemaVersionMismatch: false,
        notSeeded: true,
        integrationsUnhealthy: false,
      },
      computedAt: new Date().toISOString(),
      overallStatus: 'warning',
    };

    lastHealthStatus = fallbackStatus;

    return fallbackStatus;
  }
};

/**
 * Registers a callback function that will be invoked whenever the platform health
 * status changes. Returns an unsubscribe function to remove the listener.
 *
 * @param {function(PlatformHealthStatus): void} callback - The callback to invoke on health changes.
 * @returns {function(): void} An unsubscribe function that removes the listener.
 */
export const onHealthChange = (callback) => {
  if (typeof callback !== 'function') {
    return () => {};
  }

  listeners.push(callback);

  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * Triggers a health check and notifies all registered listeners if the status has changed.
 * Can be called after admin actions (reseed, import, clear) to update listeners.
 *
 * @returns {PlatformHealthStatus}
 */
export const refreshHealth = () => {
  const currentStatus = getPlatformHealth();

  if (listeners.length > 0) {
    const hasChanged =
      !lastHealthStatus ||
      lastHealthStatus.overallStatus !== currentStatus.overallStatus ||
      lastHealthStatus.storage.bytesUsed !== currentStatus.storage.bytesUsed ||
      lastHealthStatus.errorCounts.total !== currentStatus.errorCounts.total ||
      lastHealthStatus.seedInfo.isSeeded !== currentStatus.seedInfo.isSeeded ||
      lastHealthStatus.seedInfo.seedSize !== currentStatus.seedInfo.seedSize ||
      lastHealthStatus.integrations.error !== currentStatus.integrations.error;

    if (hasChanged) {
      notifyListeners(currentStatus);
    }
  }

  lastHealthStatus = currentStatus;

  return currentStatus;
};

/**
 * Returns the last computed health status without recomputing.
 * Returns null if no health check has been performed yet.
 *
 * @returns {PlatformHealthStatus|null}
 */
export const getLastHealthStatus = () => {
  return lastHealthStatus ? { ...lastHealthStatus } : null;
};

/**
 * Returns the number of currently registered health change listeners.
 *
 * @returns {number}
 */
export const getListenerCount = () => {
  return listeners.length;
};

/**
 * Removes all registered health change listeners.
 * Useful for cleanup during testing or application teardown.
 */
export const removeAllListeners = () => {
  listeners.length = 0;
};

/**
 * Returns a human-readable summary string of the current platform health.
 *
 * @returns {string}
 */
export const getHealthSummary = () => {
  const status = getPlatformHealth();

  const storageMB = (status.storage.bytesUsed / (1024 * 1024)).toFixed(2);
  const storagePercent = status.storage.percentage.toFixed(1);

  const parts = [
    `Status: ${status.overallStatus.toUpperCase()}`,
    `Storage: ${storageMB}MB (${storagePercent}%)`,
    `Integrations: ${status.integrations.active}/${status.integrations.total} active`,
    `Errors: ${status.errorCounts.total}`,
    `Seeded: ${status.seedInfo.isSeeded ? 'Yes' : 'No'}`,
  ];

  if (status.seedInfo.seedSize) {
    parts.push(`Seed Size: ${status.seedInfo.seedSize}`);
  }

  const activeWarnings = Object.entries(status.warnings)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (activeWarnings.length > 0) {
    parts.push(`Warnings: ${activeWarnings.join(', ')}`);
  }

  return parts.join(' | ');
};