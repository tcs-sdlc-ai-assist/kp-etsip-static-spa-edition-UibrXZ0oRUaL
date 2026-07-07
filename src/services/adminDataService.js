import { seedDatabase, reseedDatabase, isDatabaseSeeded, getCurrentSeedSize } from '../seed/seedEngine';
import { clear, getAllData, importData as storageImportData, getStorageUsage, checkSchemaVersion, setItem, getItem } from '../storage/storageAdapter';
import { migrateIfNeeded } from '../storage/schemaMigration';
import { STORAGE_KEYS, SCHEMA_VERSION, SEED_SIZES, ANCHOR_DATE } from '../constants/constants';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';
import { checkPermission, ACTIONS } from '../constants/permissionMatrix';
import { validateImportData } from '../utils/validators';
import { resetAllCounters } from '../utils/idGenerator';
import { refreshHealth } from './platformHealthService';

/**
 * Returns the current active persona info for audit logging and permission checks.
 * @returns {{ id: string, name: string, accessLevel: string }}
 */
const getAuditActor = () => {
  try {
    const persona = getActivePersona();
    return { id: persona.id, name: persona.name, accessLevel: persona.accessLevel };
  } catch {
    return { id: 'system', name: 'System', accessLevel: 'admin' };
  }
};

/**
 * Checks whether the current persona has admin-level configure permission.
 * @returns {boolean}
 */
const hasAdminPermission = () => {
  const actor = getAuditActor();
  return checkPermission(actor.accessLevel, 'PDE_CONFIG', ACTIONS.CONFIGURE);
};

/**
 * Re-seeds the localStorage database with deterministic data.
 * Clears existing data and generates fresh seed data using the specified seed size and seed value.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @param {string} [seedSize='standard'] - One of 'small', 'standard', 'large'.
 * @param {string|number} [seedValue='kp-etsip-default-seed'] - Seed value for deterministic PRNG.
 * @returns {{ success: boolean, counts: Object<string, number>, error: string|null }}
 */
export const reseedData = (seedSize = 'standard', seedValue = 'kp-etsip-default-seed') => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'reseed',
        entityName: 'Reseed Database',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to reseed database`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, counts: {}, error: 'Permission denied: insufficient access level to reseed data' };
  }

  try {
    const result = reseedDatabase(seedSize, seedValue);

    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'reseed',
        entityName: 'Reseed Database',
        status: result.success ? 'success' : 'failure',
        newValues: {
          seedSize,
          seedValue: String(seedValue),
          counts: result.counts,
        },
        details: result.success
          ? `Database reseeded with size '${seedSize}'. Total entities: ${Object.values(result.counts).reduce((s, c) => s + c, 0)}`
          : `Reseed failed: ${result.error}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    // Refresh platform health after reseed
    try {
      refreshHealth();
    } catch {
      // Health refresh failure should not block the operation
    }

    return result;
  } catch (err) {
    return {
      success: false,
      counts: {},
      error: err && err.message ? err.message : 'Failed to reseed database',
    };
  }
};

/**
 * Resets all data to factory defaults by clearing localStorage and reseeding with standard size.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @returns {{ success: boolean, counts: Object<string, number>, error: string|null }}
 */
export const resetToDefaults = () => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'reset',
        entityName: 'Reset to Defaults',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to reset to defaults`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, counts: {}, error: 'Permission denied: insufficient access level to reset data' };
  }

  try {
    // Clear all existing data
    const clearResult = clear();
    if (!clearResult.success) {
      return { success: false, counts: {}, error: clearResult.error || 'Failed to clear data before reset' };
    }

    // Reset ID counters
    resetAllCounters();

    // Reseed with standard defaults
    const seedResult = seedDatabase('standard', 'kp-etsip-default-seed');

    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'reset',
        entityName: 'Reset to Defaults',
        status: seedResult.success ? 'success' : 'failure',
        newValues: {
          seedSize: 'standard',
          seedValue: 'kp-etsip-default-seed',
          counts: seedResult.counts,
        },
        details: seedResult.success
          ? `Database reset to factory defaults. Total entities: ${Object.values(seedResult.counts).reduce((s, c) => s + c, 0)}`
          : `Reset failed: ${seedResult.error}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    // Run schema migration check
    try {
      migrateIfNeeded();
    } catch {
      // Migration failure should not block the operation
    }

    // Refresh platform health after reset
    try {
      refreshHealth();
    } catch {
      // Health refresh failure should not block the operation
    }

    return seedResult;
  } catch (err) {
    return {
      success: false,
      counts: {},
      error: err && err.message ? err.message : 'Failed to reset to defaults',
    };
  }
};

/**
 * Exports the full dataset from localStorage as a JSON object.
 * Includes schema version, seed info, anchor date, and all entity data.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const exportAllData = () => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'export',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'export',
        entityName: 'Export All Data',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to export all data`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, data: null, error: 'Permission denied: insufficient access level to export data' };
  }

  try {
    const allData = getAllData();
    const seedSize = getCurrentSeedSize();
    const versionCheck = checkSchemaVersion();
    const storageUsage = getStorageUsage();
    const now = new Date().toISOString();

    const exportPayload = {
      ...allData,
      [STORAGE_KEYS.SCHEMA_VERSION]: SCHEMA_VERSION,
      exportedAt: now,
      exportedBy: actor.name,
      metadata: {
        schemaVersion: SCHEMA_VERSION,
        seedSize: seedSize || 'standard',
        anchorDate: ANCHOR_DATE,
        exportedAt: now,
        exportedBy: actor.name,
        storageBytesUsed: storageUsage.bytesUsed,
        entityCounts: {},
      },
    };

    // Compute entity counts for metadata
    const entityStorageKeys = [
      STORAGE_KEYS.PORTFOLIOS,
      STORAGE_KEYS.APPLICATIONS,
      STORAGE_KEYS.RELATIONSHIPS,
      STORAGE_KEYS.TECH_CATEGORIES,
      STORAGE_KEYS.TECH_STANDARDS,
      STORAGE_KEYS.TECH_ENTRIES,
      STORAGE_KEYS.DEFINITIONS,
      STORAGE_KEYS.ENVIRONMENTS,
      STORAGE_KEYS.TECH_DEBT,
      STORAGE_KEYS.QUALITY_GATES,
      STORAGE_KEYS.GOVERNANCE_RECORDS,
      STORAGE_KEYS.APPROVAL_REQUESTS,
      STORAGE_KEYS.WAIVERS,
      STORAGE_KEYS.EVIDENCE,
      STORAGE_KEYS.USERS,
      STORAGE_KEYS.ROLES,
      STORAGE_KEYS.INTEGRATIONS,
      STORAGE_KEYS.NOTIFICATIONS,
      STORAGE_KEYS.AI_ANALYSES,
      STORAGE_KEYS.PDE_CONFIGS,
      STORAGE_KEYS.DEMO_SCENARIOS,
      STORAGE_KEYS.SCHEDULES,
      STORAGE_KEYS.AUDIT_LOGS,
      STORAGE_KEYS.USE_CASES,
    ];

    let totalEntities = 0;
    entityStorageKeys.forEach((key) => {
      const data = allData[key];
      const count = Array.isArray(data) ? data.length : 0;
      exportPayload.metadata.entityCounts[key] = count;
      totalEntities += count;
    });

    try {
      logAction({
        action: 'export',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'export',
        entityName: 'Export All Data',
        status: 'success',
        newValues: {
          schemaVersion: SCHEMA_VERSION,
          seedSize: seedSize || 'standard',
          totalEntities,
          storageBytesUsed: storageUsage.bytesUsed,
        },
        details: `Exported all data. Schema version: ${SCHEMA_VERSION}. Total entities: ${totalEntities}. Storage: ${storageUsage.bytesUsed} bytes.`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: exportPayload, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to export data',
    };
  }
};

/**
 * Imports data from a JSON object into localStorage.
 * Validates schema version and data structure before importing.
 * Clears existing data before importing to ensure a clean state.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @param {Object} jsonData - The JSON data to import. Must include entity arrays keyed by storage keys.
 * @returns {{ success: boolean, importedCount: number, error: string|null, warnings: string[] }}
 */
export const importAllData = (jsonData) => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'import',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'import',
        entityName: 'Import Data',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to import data`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, importedCount: 0, error: 'Permission denied: insufficient access level to import data', warnings: [] };
  }

  if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
    return { success: false, importedCount: 0, error: 'Import data must be a non-null object', warnings: [] };
  }

  try {
    // Validate the import data structure
    const validation = validateImportData(jsonData);

    if (!validation.valid) {
      try {
        logAction({
          action: 'import',
          userId: actor.id,
          userName: actor.name,
          entityType: 'PDE_CONFIG',
          entityId: 'import',
          entityName: 'Import Data',
          status: 'failure',
          details: `Import validation failed: ${validation.errors.join('; ')}`,
        });
      } catch {
        // Audit log failure should not block the operation
      }
      return {
        success: false,
        importedCount: 0,
        error: `Import validation failed: ${validation.errors.join('; ')}`,
        warnings: validation.warnings,
      };
    }

    // Clear existing data before import
    const clearResult = clear();
    if (!clearResult.success) {
      return {
        success: false,
        importedCount: 0,
        error: clearResult.error || 'Failed to clear existing data before import',
        warnings: validation.warnings,
      };
    }

    // Reset ID counters
    resetAllCounters();

    // Import the data
    const importResult = storageImportData(jsonData, { overwrite: true, clearFirst: false });

    if (!importResult.success) {
      return {
        success: false,
        importedCount: importResult.importedCount,
        error: importResult.error || 'Failed to import data',
        warnings: [...validation.warnings, ...importResult.errors],
      };
    }

    // Update seed size if present in metadata
    if (jsonData.metadata && jsonData.metadata.seedSize) {
      setItem(STORAGE_KEYS.SEED_SIZE, jsonData.metadata.seedSize);
    }

    // Run schema migration check
    try {
      migrateIfNeeded();
    } catch {
      // Migration failure should not block the operation
    }

    try {
      logAction({
        action: 'import',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'import',
        entityName: 'Import Data',
        status: 'success',
        newValues: {
          importedCount: importResult.importedCount,
          skippedCount: importResult.skippedCount,
          entityCounts: validation.entityCounts,
        },
        details: `Data imported successfully. ${importResult.importedCount} key(s) imported, ${importResult.skippedCount} skipped. Warnings: ${validation.warnings.length}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    // Refresh platform health after import
    try {
      refreshHealth();
    } catch {
      // Health refresh failure should not block the operation
    }

    return {
      success: true,
      importedCount: importResult.importedCount,
      error: null,
      warnings: validation.warnings,
    };
  } catch (err) {
    return {
      success: false,
      importedCount: 0,
      error: err && err.message ? err.message : 'Failed to import data',
      warnings: [],
    };
  }
};

/**
 * Clears all application data from localStorage.
 * Removes all KP ETSIP keys and resets ID counters.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @returns {{ success: boolean, removedCount: number, error: string|null }}
 */
export const clearAllData = () => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'clear',
        entityName: 'Clear All Data',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to clear all data`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, removedCount: 0, error: 'Permission denied: insufficient access level to clear data' };
  }

  try {
    // Get storage usage before clearing for audit log
    const usageBefore = getStorageUsage();

    const clearResult = clear();

    // Reset ID counters
    resetAllCounters();

    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'clear',
        entityName: 'Clear All Data',
        status: clearResult.success ? 'success' : 'failure',
        previousValues: {
          storageBytesUsed: usageBefore.bytesUsed,
        },
        newValues: {
          removedCount: clearResult.removedCount,
        },
        details: clearResult.success
          ? `All data cleared. ${clearResult.removedCount} key(s) removed. Freed ${usageBefore.bytesUsed} bytes.`
          : `Clear failed: ${clearResult.error}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    // Refresh platform health after clear
    try {
      refreshHealth();
    } catch {
      // Health refresh failure should not block the operation
    }

    return {
      success: clearResult.success,
      removedCount: clearResult.removedCount,
      error: clearResult.error || null,
    };
  } catch (err) {
    return {
      success: false,
      removedCount: 0,
      error: err && err.message ? err.message : 'Failed to clear all data',
    };
  }
};

/**
 * Configures the seed size for future seeding operations.
 * Persists the seed size to localStorage.
 * Permission-gated to admin users. Logs the action to the audit log.
 *
 * @param {string} size - One of 'small', 'standard', 'large'.
 * @returns {{ success: boolean, error: string|null }}
 */
export const setSeedSize = (size) => {
  const actor = getAuditActor();

  if (!hasAdminPermission()) {
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'seed_size',
        entityName: 'Set Seed Size',
        status: 'failure',
        details: `Permission denied: '${actor.name}' attempted to set seed size`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
    return { success: false, error: 'Permission denied: insufficient access level to set seed size' };
  }

  if (typeof size !== 'string' || size.trim() === '') {
    return { success: false, error: 'Seed size must be a non-empty string' };
  }

  const normalizedSize = size.toLowerCase().trim();
  const validSizes = ['small', 'standard', 'large'];

  if (!validSizes.includes(normalizedSize)) {
    return { success: false, error: `Seed size must be one of: ${validSizes.join(', ')}` };
  }

  try {
    const previousSize = getCurrentSeedSize();
    const writeResult = setItem(STORAGE_KEYS.SEED_SIZE, normalizedSize);

    if (!writeResult.success) {
      return { success: false, error: writeResult.error || 'Failed to persist seed size' };
    }

    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'PDE_CONFIG',
        entityId: 'seed_size',
        entityName: 'Set Seed Size',
        status: 'success',
        previousValues: { seedSize: previousSize },
        newValues: { seedSize: normalizedSize },
        details: `Seed size changed from '${previousSize || 'not set'}' to '${normalizedSize}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : 'Failed to set seed size',
    };
  }
};

/**
 * Returns current seed metadata including seed size, anchor date, schema version,
 * seeded status, and storage usage.
 *
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const getSeedInfo = () => {
  try {
    const isSeeded = isDatabaseSeeded();
    const seedSize = getCurrentSeedSize();
    const versionCheck = checkSchemaVersion();
    const storageUsage = getStorageUsage();

    // Compute entity counts
    const entityCounts = {};
    const entityStorageKeys = [
      { key: STORAGE_KEYS.PORTFOLIOS, label: 'PORTFOLIO' },
      { key: STORAGE_KEYS.APPLICATIONS, label: 'APPLICATION' },
      { key: STORAGE_KEYS.RELATIONSHIPS, label: 'RELATIONSHIP' },
      { key: STORAGE_KEYS.TECH_CATEGORIES, label: 'TECH_CATEGORY' },
      { key: STORAGE_KEYS.TECH_STANDARDS, label: 'TECH_STANDARD' },
      { key: STORAGE_KEYS.TECH_ENTRIES, label: 'TECH_ENTRY' },
      { key: STORAGE_KEYS.DEFINITIONS, label: 'DEFINITION' },
      { key: STORAGE_KEYS.ENVIRONMENTS, label: 'ENVIRONMENT' },
      { key: STORAGE_KEYS.TECH_DEBT, label: 'TECH_DEBT' },
      { key: STORAGE_KEYS.QUALITY_GATES, label: 'QUALITY_GATE' },
      { key: STORAGE_KEYS.GOVERNANCE_RECORDS, label: 'GOVERNANCE_RECORD' },
      { key: STORAGE_KEYS.APPROVAL_REQUESTS, label: 'APPROVAL_REQUEST' },
      { key: STORAGE_KEYS.WAIVERS, label: 'WAIVER' },
      { key: STORAGE_KEYS.EVIDENCE, label: 'EVIDENCE' },
      { key: STORAGE_KEYS.USERS, label: 'USER' },
      { key: STORAGE_KEYS.ROLES, label: 'ROLE' },
      { key: STORAGE_KEYS.INTEGRATIONS, label: 'INTEGRATION' },
      { key: STORAGE_KEYS.NOTIFICATIONS, label: 'NOTIFICATION' },
      { key: STORAGE_KEYS.AI_ANALYSES, label: 'AI_ANALYSIS' },
      { key: STORAGE_KEYS.PDE_CONFIGS, label: 'PDE_CONFIG' },
      { key: STORAGE_KEYS.DEMO_SCENARIOS, label: 'DEMO_SCENARIO' },
      { key: STORAGE_KEYS.SCHEDULES, label: 'SCHEDULE' },
      { key: STORAGE_KEYS.AUDIT_LOGS, label: 'AUDIT_LOG' },
      { key: STORAGE_KEYS.USE_CASES, label: 'USE_CASE' },
    ];

    let totalEntities = 0;
    entityStorageKeys.forEach(({ key, label }) => {
      const data = getItem(key);
      const count = Array.isArray(data) ? data.length : 0;
      entityCounts[label] = count;
      totalEntities += count;
    });

    // Resolve seed size config
    let seedSizeConfig = null;
    if (seedSize) {
      const normalizedSize = seedSize.toLowerCase();
      if (normalizedSize === 'small') {
        seedSizeConfig = SEED_SIZES.SMALL;
      } else if (normalizedSize === 'large') {
        seedSizeConfig = SEED_SIZES.LARGE;
      } else {
        seedSizeConfig = SEED_SIZES.STANDARD;
      }
    }

    const seedInfo = {
      isSeeded,
      seedSize: seedSize || null,
      seedSizeConfig: seedSizeConfig || null,
      anchorDate: ANCHOR_DATE,
      schemaVersion: versionCheck.stored || null,
      currentSchemaVersion: SCHEMA_VERSION,
      schemaMatch: versionCheck.match,
      needsMigration: versionCheck.needsMigration,
      storage: {
        bytesUsed: storageUsage.bytesUsed,
        quota: storageUsage.quota,
        percentage: storageUsage.percentage,
      },
      entityCounts,
      totalEntities,
    };

    return { success: true, data: seedInfo, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to get seed info',
    };
  }
};

/**
 * Returns a summary of available seed sizes with their configurations.
 *
 * @returns {Array<{ key: string, label: string, records: number }>}
 */
export const getAvailableSeedSizes = () => {
  return Object.values(SEED_SIZES).map((size) => ({
    key: size.key,
    label: size.label,
    records: size.records,
  }));
};

/**
 * Checks whether the current persona has permission to perform admin data operations.
 *
 * @returns {boolean}
 */
export const canPerformAdminActions = () => {
  return hasAdminPermission();
};

/**
 * Returns the current schema version information.
 *
 * @returns {{ current: string, stored: string|null, match: boolean, needsMigration: boolean }}
 */
export const getSchemaInfo = () => {
  return checkSchemaVersion();
};

/**
 * Returns the current storage usage information.
 *
 * @returns {{ bytesUsed: number, quota: number, percentage: number, keys: Object<string, number> }}
 */
export const getStorageInfo = () => {
  return getStorageUsage();
};