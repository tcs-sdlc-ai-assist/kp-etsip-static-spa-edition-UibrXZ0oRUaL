import { SCHEMA_VERSION, STORAGE_KEYS } from '../constants/constants';
import {
  getItem,
  setItem,
  checkSchemaVersion,
  setSchemaVersion,
  getAllKeys,
} from './storageAdapter';

/**
 * Registry of migration functions keyed by target version.
 * Each migration transforms data from the previous version to the target version.
 * Migrations are applied in order of their version keys.
 *
 * @type {Array<{ version: string, migrate: () => { success: boolean, error: string|null } }>}
 */
const MIGRATIONS = [
  // Example migration entry for future use:
  // {
  //   version: '1.1.0',
  //   migrate: () => {
  //     // Transform data from 1.0.0 to 1.1.0
  //     return { success: true, error: null };
  //   },
  // },
];

/**
 * Compares two semver version strings.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 *
 * @param {string} a - First version string (e.g., '1.0.0').
 * @param {string} b - Second version string (e.g., '1.1.0').
 * @returns {number} -1, 0, or 1.
 */
const compareSemver = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return 0;
  }

  const partsA = a.split('.').map((p) => {
    const num = parseInt(p, 10);
    return Number.isNaN(num) ? 0 : num;
  });
  const partsB = b.split('.').map((p) => {
    const num = parseInt(p, 10);
    return Number.isNaN(num) ? 0 : num;
  });

  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    if (valA < valB) {
      return -1;
    }
    if (valA > valB) {
      return 1;
    }
  }

  return 0;
};

/**
 * Returns the list of migrations that need to be applied to go from
 * the stored version to the current version, sorted in ascending order.
 *
 * @param {string|null} storedVersion - The version currently stored in localStorage.
 * @returns {Array<{ version: string, migrate: () => { success: boolean, error: string|null } }>}
 */
const getPendingMigrations = (storedVersion) => {
  if (!storedVersion) {
    return [];
  }

  return MIGRATIONS
    .filter((m) => compareSemver(m.version, storedVersion) > 0 && compareSemver(m.version, SCHEMA_VERSION) <= 0)
    .sort((a, b) => compareSemver(a.version, b.version));
};

/**
 * Ensures all entity arrays stored in localStorage are valid arrays.
 * If a storage key contains non-array data, it is reset to an empty array.
 * This provides a safety net for corrupted data.
 *
 * @returns {{ fixed: number, errors: string[] }}
 */
const sanitizeStoredData = () => {
  const result = { fixed: 0, errors: [] };

  const arrayKeys = [
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
    STORAGE_KEYS.TEST_DATA,
  ];

  arrayKeys.forEach((key) => {
    try {
      const data = getItem(key);
      if (data !== null && !Array.isArray(data)) {
        const writeResult = setItem(key, []);
        if (writeResult.success) {
          result.fixed += 1;
        } else {
          result.errors.push(`Failed to fix corrupted data for key '${key}': ${writeResult.error}`);
        }
      }
    } catch {
      result.errors.push(`Error checking key '${key}'`);
    }
  });

  return result;
};

/**
 * Creates a backup of all current application data in localStorage
 * before applying migrations. The backup is stored under a timestamped key.
 *
 * @returns {{ success: boolean, backupKey: string|null, error: string|null }}
 */
const createBackup = () => {
  try {
    const backupKey = `kp_etsip_backup_${Date.now()}`;
    const allKeys = getAllKeys();
    const backup = {};

    allKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          backup[key] = raw;
        }
      } catch {
        // Skip keys that cannot be read
      }
    });

    const serialized = JSON.stringify(backup);
    try {
      localStorage.setItem(backupKey, serialized);
      return { success: true, backupKey, error: null };
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)) {
        return { success: false, backupKey: null, error: 'Storage quota exceeded during backup' };
      }
      return { success: false, backupKey: null, error: err && err.message ? err.message : 'Failed to create backup' };
    }
  } catch (err) {
    return { success: false, backupKey: null, error: err && err.message ? err.message : 'Failed to create backup' };
  }
};

/**
 * Checks the current schema version and applies any pending migrations.
 * Called during application boot to ensure data compatibility.
 *
 * Behavior:
 * - If no stored version exists (fresh install), sets the current version and returns.
 * - If stored version matches current version, no action is taken.
 * - If stored version is older, applies pending migrations in order.
 * - If stored version is newer (downgrade), resets data and sets current version.
 *
 * @returns {{ success: boolean, migrated: boolean, fromVersion: string|null, toVersion: string, migrationsApplied: number, errors: string[], warnings: string[] }}
 */
export const migrateIfNeeded = () => {
  const result = {
    success: true,
    migrated: false,
    fromVersion: null,
    toVersion: SCHEMA_VERSION,
    migrationsApplied: 0,
    errors: [],
    warnings: [],
  };

  try {
    const versionCheck = checkSchemaVersion();
    result.fromVersion = versionCheck.stored;

    // Fresh install — no stored version
    if (versionCheck.stored === null) {
      const sanitizeResult = sanitizeStoredData();
      if (sanitizeResult.fixed > 0) {
        result.warnings.push(`Sanitized ${sanitizeResult.fixed} corrupted storage entries`);
      }
      if (sanitizeResult.errors.length > 0) {
        result.warnings.push(...sanitizeResult.errors);
      }

      setSchemaVersion();
      return result;
    }

    // Versions match — no migration needed
    if (versionCheck.match) {
      return result;
    }

    // Downgrade scenario — stored version is newer than current
    if (compareSemver(versionCheck.stored, SCHEMA_VERSION) > 0) {
      result.warnings.push(
        `Stored schema version '${versionCheck.stored}' is newer than current version '${SCHEMA_VERSION}'. ` +
        'Data may have been created by a newer version of the application. Setting version to current.'
      );
      setSchemaVersion();
      result.migrated = true;
      return result;
    }

    // Upgrade scenario — apply pending migrations
    const pendingMigrations = getPendingMigrations(versionCheck.stored);

    if (pendingMigrations.length > 0) {
      // Create backup before migrating
      const backupResult = createBackup();
      if (!backupResult.success) {
        result.warnings.push(
          `Could not create backup before migration: ${backupResult.error}. Proceeding anyway.`
        );
      }

      // Apply each migration in order
      for (const migration of pendingMigrations) {
        try {
          const migrationResult = migration.migrate();
          if (migrationResult.success) {
            result.migrationsApplied += 1;
          } else {
            result.errors.push(
              `Migration to version '${migration.version}' failed: ${migrationResult.error}`
            );
            result.success = false;
            break;
          }
        } catch (err) {
          result.errors.push(
            `Migration to version '${migration.version}' threw an error: ${err && err.message ? err.message : 'Unknown error'}`
          );
          result.success = false;
          break;
        }
      }
    }

    // Sanitize data after migrations
    const sanitizeResult = sanitizeStoredData();
    if (sanitizeResult.fixed > 0) {
      result.warnings.push(`Sanitized ${sanitizeResult.fixed} corrupted storage entries after migration`);
    }
    if (sanitizeResult.errors.length > 0) {
      result.warnings.push(...sanitizeResult.errors);
    }

    // Update schema version if all migrations succeeded
    if (result.success) {
      setSchemaVersion();
      result.migrated = true;
    }

    return result;
  } catch (err) {
    result.success = false;
    result.errors.push(
      err && err.message ? err.message : 'Unexpected error during schema migration'
    );
    return result;
  }
};

/**
 * Returns the current migration status without applying any changes.
 * Useful for displaying migration information in the UI.
 *
 * @returns {{ storedVersion: string|null, currentVersion: string, needsMigration: boolean, pendingMigrationCount: number }}
 */
export const getMigrationStatus = () => {
  const versionCheck = checkSchemaVersion();
  const pendingMigrations = versionCheck.stored
    ? getPendingMigrations(versionCheck.stored)
    : [];

  return {
    storedVersion: versionCheck.stored,
    currentVersion: SCHEMA_VERSION,
    needsMigration: versionCheck.needsMigration,
    pendingMigrationCount: pendingMigrations.length,
  };
};

/**
 * Forces a schema version reset to the current version without applying migrations.
 * Use with caution — this skips all migration logic.
 *
 * @returns {{ success: boolean, error: string|null }}
 */
export const forceSchemaVersion = () => {
  return setSchemaVersion();
};