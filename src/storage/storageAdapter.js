import { STORAGE_KEYS, SCHEMA_VERSION } from '../constants/constants';

/**
 * Storage adapter abstracting localStorage access.
 * Single point of localStorage access for the entire app.
 * Handles JSON serialization/deserialization, error handling for quota exceeded,
 * and schema version checks.
 */

/**
 * Retrieves a value from localStorage by key, deserializing from JSON.
 * @param {string} key - The storage key to retrieve.
 * @returns {*} The deserialized value, or null if the key does not exist or an error occurs.
 */
export const getItem = (key) => {
  if (typeof key !== 'string' || key.trim() === '') {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Stores a value in localStorage by key, serializing to JSON.
 * @param {string} key - The storage key to set.
 * @param {*} value - The value to store. Must be JSON-serializable.
 * @returns {{ success: boolean, error: string|null }} Result of the operation.
 */
export const setItem = (key, value) => {
  if (typeof key !== 'string' || key.trim() === '') {
    return { success: false, error: 'Key must be a non-empty string' };
  }
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true, error: null };
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)) {
      return { success: false, error: 'Storage quota exceeded. Please clear some data and try again.' };
    }
    return { success: false, error: err && err.message ? err.message : 'Failed to write to localStorage' };
  }
};

/**
 * Removes a value from localStorage by key.
 * @param {string} key - The storage key to remove.
 * @returns {{ success: boolean, error: string|null }} Result of the operation.
 */
export const removeItem = (key) => {
  if (typeof key !== 'string' || key.trim() === '') {
    return { success: false, error: 'Key must be a non-empty string' };
  }
  try {
    localStorage.removeItem(key);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : 'Failed to remove item from localStorage' };
  }
};

/**
 * Clears all KP ETSIP keys from localStorage.
 * Only removes keys that are part of the application's STORAGE_KEYS namespace.
 * @returns {{ success: boolean, error: string|null, removedCount: number }} Result of the operation.
 */
export const clear = () => {
  let removedCount = 0;
  try {
    const appKeys = Object.values(STORAGE_KEYS);
    appKeys.forEach((appKey) => {
      try {
        localStorage.removeItem(appKey);
        removedCount += 1;
      } catch {
        // Continue removing other keys even if one fails
      }
    });

    // Also remove the ID counters key
    try {
      localStorage.removeItem('kp_etsip_id_counters');
      removedCount += 1;
    } catch {
      // Ignore
    }

    return { success: true, error: null, removedCount };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : 'Failed to clear localStorage', removedCount };
  }
};

/**
 * Returns all localStorage keys that belong to the KP ETSIP application.
 * @returns {string[]} Array of matching localStorage keys.
 */
export const getAllKeys = () => {
  try {
    const allKeys = [];
    const appKeyValues = new Set(Object.values(STORAGE_KEYS));

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (appKeyValues.has(key) || key.startsWith('kp_etsip_'))) {
        allKeys.push(key);
      }
    }

    return allKeys;
  } catch {
    return [];
  }
};

/**
 * Calculates the storage usage for KP ETSIP data in localStorage.
 * Returns bytes used by application keys and an estimated quota.
 * @returns {{ bytesUsed: number, quota: number, percentage: number, keys: Object<string, number> }}
 */
export const getStorageUsage = () => {
  const result = {
    bytesUsed: 0,
    quota: 5 * 1024 * 1024, // 5MB default estimate for localStorage
    percentage: 0,
    keys: {},
  };

  try {
    const appKeys = getAllKeys();

    appKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Each character in JS is 2 bytes (UTF-16), but localStorage typically uses UTF-8-like encoding
          // We approximate using the string length in bytes
          const keyBytes = key.length * 2;
          const valueBytes = value.length * 2;
          const totalBytes = keyBytes + valueBytes;
          result.keys[key] = totalBytes;
          result.bytesUsed += totalBytes;
        }
      } catch {
        // Skip keys that can't be read
      }
    });

    if (result.quota > 0) {
      result.percentage = Math.round((result.bytesUsed / result.quota) * 10000) / 100;
    }
  } catch {
    // Return default result on error
  }

  return result;
};

/**
 * Checks the stored schema version against the current application schema version.
 * @returns {{ current: string, stored: string|null, match: boolean, needsMigration: boolean }}
 */
export const checkSchemaVersion = () => {
  const stored = getItem(STORAGE_KEYS.SCHEMA_VERSION);
  const current = SCHEMA_VERSION;

  return {
    current,
    stored: stored || null,
    match: stored === current,
    needsMigration: stored !== null && stored !== current,
  };
};

/**
 * Sets the schema version in localStorage to the current application version.
 * @returns {{ success: boolean, error: string|null }}
 */
export const setSchemaVersion = () => {
  return setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION);
};

/**
 * Checks whether localStorage is available and writable.
 * @returns {boolean} True if localStorage is available and writable.
 */
export const isStorageAvailable = () => {
  const testKey = 'kp_etsip_storage_test';
  try {
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns all stored data for the application as a single object keyed by storage key.
 * Useful for export and backup operations.
 * @returns {Object<string, *>} All stored application data.
 */
export const getAllData = () => {
  const data = {};
  try {
    const appKeyValues = Object.values(STORAGE_KEYS);
    appKeyValues.forEach((key) => {
      const value = getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    });
  } catch {
    // Return whatever was collected
  }
  return data;
};

/**
 * Imports data into localStorage from a data object keyed by storage key.
 * Validates that keys are recognized application keys before writing.
 * @param {Object<string, *>} data - The data to import, keyed by storage key.
 * @param {Object} [options] - Import options.
 * @param {boolean} [options.overwrite=true] - Whether to overwrite existing data.
 * @param {boolean} [options.clearFirst=false] - Whether to clear existing data before importing.
 * @returns {{ success: boolean, error: string|null, importedCount: number, skippedCount: number, errors: string[] }}
 */
export const importData = (data, options = {}) => {
  const result = {
    success: true,
    error: null,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    result.success = false;
    result.error = 'Import data must be a non-null object';
    return result;
  }

  const { overwrite = true, clearFirst = false } = options;
  const validKeys = new Set(Object.values(STORAGE_KEYS));

  try {
    if (clearFirst) {
      clear();
    }

    Object.entries(data).forEach(([key, value]) => {
      if (!validKeys.has(key)) {
        result.skippedCount += 1;
        return;
      }

      if (!overwrite) {
        const existing = getItem(key);
        if (existing !== null) {
          result.skippedCount += 1;
          return;
        }
      }

      const writeResult = setItem(key, value);
      if (writeResult.success) {
        result.importedCount += 1;
      } else {
        result.errors.push(`Failed to import key '${key}': ${writeResult.error}`);
        result.success = false;
      }
    });

    // Update schema version after import
    setSchemaVersion();
  } catch (err) {
    result.success = false;
    result.error = err && err.message ? err.message : 'Failed to import data';
  }

  return result;
};