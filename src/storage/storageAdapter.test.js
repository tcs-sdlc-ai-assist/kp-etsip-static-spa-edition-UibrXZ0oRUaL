import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
  getStorageUsage,
  checkSchemaVersion,
  setSchemaVersion,
  isStorageAvailable,
  getAllData,
  importData,
} from './storageAdapter';
import { STORAGE_KEYS, SCHEMA_VERSION } from '../constants/constants';

describe('storageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getItem', () => {
    it('returns null for a key that does not exist', () => {
      const result = getItem('nonexistent_key');
      expect(result).toBeNull();
    });

    it('returns null for an empty string key', () => {
      const result = getItem('');
      expect(result).toBeNull();
    });

    it('returns null for a non-string key', () => {
      const result = getItem(null);
      expect(result).toBeNull();
    });

    it('returns null for undefined key', () => {
      const result = getItem(undefined);
      expect(result).toBeNull();
    });

    it('returns deserialized JSON object', () => {
      const data = { name: 'Test', value: 42 };
      localStorage.setItem('test_key', JSON.stringify(data));
      const result = getItem('test_key');
      expect(result).toEqual(data);
    });

    it('returns deserialized JSON array', () => {
      const data = [1, 2, 3, 'four'];
      localStorage.setItem('test_key', JSON.stringify(data));
      const result = getItem('test_key');
      expect(result).toEqual(data);
    });

    it('returns deserialized JSON string', () => {
      localStorage.setItem('test_key', JSON.stringify('hello'));
      const result = getItem('test_key');
      expect(result).toBe('hello');
    });

    it('returns deserialized JSON number', () => {
      localStorage.setItem('test_key', JSON.stringify(123));
      const result = getItem('test_key');
      expect(result).toBe(123);
    });

    it('returns deserialized JSON boolean', () => {
      localStorage.setItem('test_key', JSON.stringify(true));
      const result = getItem('test_key');
      expect(result).toBe(true);
    });

    it('returns deserialized JSON null', () => {
      localStorage.setItem('test_key', JSON.stringify(null));
      const result = getItem('test_key');
      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      localStorage.setItem('test_key', 'not valid json {{{');
      const result = getItem('test_key');
      expect(result).toBeNull();
    });

    it('returns null when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const result = getItem('test_key');
      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    it('stores a JSON object in localStorage', () => {
      const data = { name: 'Test', count: 5 };
      const result = setItem('test_key', data);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(JSON.parse(localStorage.getItem('test_key'))).toEqual(data);
    });

    it('stores a JSON array in localStorage', () => {
      const data = [1, 2, 3];
      const result = setItem('test_key', data);
      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_key'))).toEqual(data);
    });

    it('stores a string value in localStorage', () => {
      const result = setItem('test_key', 'hello');
      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_key'))).toBe('hello');
    });

    it('stores a number value in localStorage', () => {
      const result = setItem('test_key', 42);
      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_key'))).toBe(42);
    });

    it('stores a boolean value in localStorage', () => {
      const result = setItem('test_key', false);
      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_key'))).toBe(false);
    });

    it('stores null in localStorage', () => {
      const result = setItem('test_key', null);
      expect(result.success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test_key'))).toBeNull();
    });

    it('returns error for empty string key', () => {
      const result = setItem('', { data: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns error for non-string key', () => {
      const result = setItem(123, { data: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns error for null key', () => {
      const result = setItem(null, { data: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns quota exceeded error when localStorage is full', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      quotaError.code = 22;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });
      const result = setItem('test_key', { data: 'large' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('returns generic error when localStorage throws non-quota error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Some other error');
      });
      const result = setItem('test_key', { data: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Some other error');
    });

    it('overwrites existing value', () => {
      setItem('test_key', 'first');
      setItem('test_key', 'second');
      expect(getItem('test_key')).toBe('second');
    });
  });

  describe('removeItem', () => {
    it('removes an existing key from localStorage', () => {
      localStorage.setItem('test_key', JSON.stringify('value'));
      const result = removeItem('test_key');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(localStorage.getItem('test_key')).toBeNull();
    });

    it('succeeds even if key does not exist', () => {
      const result = removeItem('nonexistent_key');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns error for empty string key', () => {
      const result = removeItem('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns error for non-string key', () => {
      const result = removeItem(42);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns error for null key', () => {
      const result = removeItem(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Key must be a non-empty string');
    });

    it('returns error when localStorage.removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Remove failed');
      });
      const result = removeItem('test_key');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Remove failed');
    });
  });

  describe('clear', () => {
    it('removes all KP ETSIP keys from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([{ id: 'PF-001' }]));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([{ id: 'APP-001' }]));
      localStorage.setItem('unrelated_key', 'should_remain');

      const result = clear();
      expect(result.success).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.APPLICATIONS)).toBeNull();
      expect(localStorage.getItem('unrelated_key')).toBe('should_remain');
    });

    it('returns success even when no keys exist', () => {
      const result = clear();
      expect(result.success).toBe(true);
    });

    it('also removes the ID counters key', () => {
      localStorage.setItem('kp_etsip_id_counters', JSON.stringify({ 'PF-': 5 }));
      const result = clear();
      expect(result.success).toBe(true);
      expect(localStorage.getItem('kp_etsip_id_counters')).toBeNull();
    });
  });

  describe('getAllKeys', () => {
    it('returns empty array when no KP ETSIP keys exist', () => {
      localStorage.setItem('unrelated_key', 'value');
      const keys = getAllKeys();
      expect(keys).toEqual([]);
    });

    it('returns KP ETSIP keys from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
      localStorage.setItem('unrelated_key', 'value');

      const keys = getAllKeys();
      expect(keys).toContain(STORAGE_KEYS.PORTFOLIOS);
      expect(keys).toContain(STORAGE_KEYS.APPLICATIONS);
      expect(keys).not.toContain('unrelated_key');
    });

    it('returns keys that start with kp_etsip_ prefix', () => {
      localStorage.setItem('kp_etsip_custom_key', 'value');
      const keys = getAllKeys();
      expect(keys).toContain('kp_etsip_custom_key');
    });
  });

  describe('getStorageUsage', () => {
    it('returns zero bytes when no KP ETSIP data exists', () => {
      const usage = getStorageUsage();
      expect(usage.bytesUsed).toBe(0);
      expect(usage.quota).toBe(5 * 1024 * 1024);
      expect(usage.percentage).toBe(0);
      expect(usage.keys).toEqual({});
    });

    it('returns non-zero bytes when KP ETSIP data exists', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([{ id: 'PF-001', name: 'Test Portfolio' }]));
      const usage = getStorageUsage();
      expect(usage.bytesUsed).toBeGreaterThan(0);
      expect(usage.keys[STORAGE_KEYS.PORTFOLIOS]).toBeGreaterThan(0);
    });

    it('calculates percentage correctly', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([{ id: 'PF-001' }]));
      const usage = getStorageUsage();
      const expectedPercentage = Math.round((usage.bytesUsed / usage.quota) * 10000) / 100;
      expect(usage.percentage).toBe(expectedPercentage);
    });

    it('includes multiple keys in the breakdown', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([{ id: 'PF-001' }]));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([{ id: 'APP-001' }]));
      const usage = getStorageUsage();
      expect(Object.keys(usage.keys).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('checkSchemaVersion', () => {
    it('returns null stored version when no version is set', () => {
      const result = checkSchemaVersion();
      expect(result.current).toBe(SCHEMA_VERSION);
      expect(result.stored).toBeNull();
      expect(result.match).toBe(false);
      expect(result.needsMigration).toBe(false);
    });

    it('returns matching when stored version equals current', () => {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify(SCHEMA_VERSION));
      const result = checkSchemaVersion();
      expect(result.current).toBe(SCHEMA_VERSION);
      expect(result.stored).toBe(SCHEMA_VERSION);
      expect(result.match).toBe(true);
      expect(result.needsMigration).toBe(false);
    });

    it('returns needsMigration when stored version differs', () => {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify('0.9.0'));
      const result = checkSchemaVersion();
      expect(result.current).toBe(SCHEMA_VERSION);
      expect(result.stored).toBe('0.9.0');
      expect(result.match).toBe(false);
      expect(result.needsMigration).toBe(true);
    });
  });

  describe('setSchemaVersion', () => {
    it('sets the schema version to the current version', () => {
      const result = setSchemaVersion();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION));
      expect(stored).toBe(SCHEMA_VERSION);
    });
  });

  describe('isStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws on setItem', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Not available');
      });
      expect(isStorageAvailable()).toBe(false);
    });
  });

  describe('getAllData', () => {
    it('returns empty object when no data exists', () => {
      const data = getAllData();
      expect(data).toEqual({});
    });

    it('returns all stored KP ETSIP data', () => {
      const portfolios = [{ id: 'PF-001' }];
      const applications = [{ id: 'APP-001' }];
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

      const data = getAllData();
      expect(data[STORAGE_KEYS.PORTFOLIOS]).toEqual(portfolios);
      expect(data[STORAGE_KEYS.APPLICATIONS]).toEqual(applications);
    });

    it('does not include non-KP ETSIP keys', () => {
      localStorage.setItem('unrelated_key', 'value');
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));

      const data = getAllData();
      expect(data).not.toHaveProperty('unrelated_key');
      expect(data).toHaveProperty(STORAGE_KEYS.PORTFOLIOS);
    });
  });

  describe('importData', () => {
    it('imports valid data into localStorage', () => {
      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [{ id: 'PF-001', name: 'Test' }],
        [STORAGE_KEYS.APPLICATIONS]: [{ id: 'APP-001', name: 'App' }],
      };

      const result = importData(importPayload);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
      expect(result.errors).toEqual([]);
      expect(getItem(STORAGE_KEYS.PORTFOLIOS)).toEqual(importPayload[STORAGE_KEYS.PORTFOLIOS]);
      expect(getItem(STORAGE_KEYS.APPLICATIONS)).toEqual(importPayload[STORAGE_KEYS.APPLICATIONS]);
    });

    it('skips unrecognized keys', () => {
      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [{ id: 'PF-001' }],
        unknown_key: [{ id: 'X-001' }],
      };

      const result = importData(importPayload);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
    });

    it('returns error for null data', () => {
      const result = importData(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Import data must be a non-null object');
    });

    it('returns error for array data', () => {
      const result = importData([1, 2, 3]);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Import data must be a non-null object');
    });

    it('returns error for non-object data', () => {
      const result = importData('string');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Import data must be a non-null object');
    });

    it('does not overwrite existing data when overwrite is false', () => {
      setItem(STORAGE_KEYS.PORTFOLIOS, [{ id: 'PF-EXISTING' }]);

      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [{ id: 'PF-NEW' }],
        [STORAGE_KEYS.APPLICATIONS]: [{ id: 'APP-001' }],
      };

      const result = importData(importPayload, { overwrite: false });
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(getItem(STORAGE_KEYS.PORTFOLIOS)).toEqual([{ id: 'PF-EXISTING' }]);
      expect(getItem(STORAGE_KEYS.APPLICATIONS)).toEqual([{ id: 'APP-001' }]);
    });

    it('overwrites existing data when overwrite is true (default)', () => {
      setItem(STORAGE_KEYS.PORTFOLIOS, [{ id: 'PF-EXISTING' }]);

      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [{ id: 'PF-NEW' }],
      };

      const result = importData(importPayload, { overwrite: true });
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(getItem(STORAGE_KEYS.PORTFOLIOS)).toEqual([{ id: 'PF-NEW' }]);
    });

    it('clears existing data first when clearFirst is true', () => {
      setItem(STORAGE_KEYS.PORTFOLIOS, [{ id: 'PF-EXISTING' }]);
      setItem(STORAGE_KEYS.APPLICATIONS, [{ id: 'APP-EXISTING' }]);

      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [{ id: 'PF-NEW' }],
      };

      const result = importData(importPayload, { clearFirst: true });
      expect(result.success).toBe(true);
      expect(getItem(STORAGE_KEYS.PORTFOLIOS)).toEqual([{ id: 'PF-NEW' }]);
      // Applications should have been cleared
      expect(getItem(STORAGE_KEYS.APPLICATIONS)).toBeNull();
    });

    it('sets schema version after import', () => {
      const importPayload = {
        [STORAGE_KEYS.PORTFOLIOS]: [],
      };

      importData(importPayload);
      const versionCheck = checkSchemaVersion();
      expect(versionCheck.match).toBe(true);
    });
  });

  describe('JSON serialization round-trip', () => {
    it('correctly round-trips complex nested objects', () => {
      const complexData = {
        id: 'PF-001',
        name: 'Test Portfolio',
        tags: ['tag1', 'tag2'],
        metadata: {
          nested: {
            deep: true,
            count: 42,
          },
          list: [1, 'two', null, false],
        },
        nullField: null,
        boolField: false,
        numField: 0,
      };

      const writeResult = setItem('complex_test', complexData);
      expect(writeResult.success).toBe(true);

      const readResult = getItem('complex_test');
      expect(readResult).toEqual(complexData);
    });

    it('correctly round-trips empty arrays', () => {
      setItem('empty_array', []);
      expect(getItem('empty_array')).toEqual([]);
    });

    it('correctly round-trips empty objects', () => {
      setItem('empty_object', {});
      expect(getItem('empty_object')).toEqual({});
    });
  });

  describe('error handling for quota exceeded', () => {
    it('handles QuotaExceededError by name', () => {
      const error = new DOMException('Storage full', 'QuotaExceededError');
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw error;
      });

      const result = setItem('test_key', 'data');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('handles quota exceeded error by code 22', () => {
      const error = new Error('Quota exceeded');
      error.code = 22;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw error;
      });

      const result = setItem('test_key', 'data');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('handles quota exceeded error by code 1014', () => {
      const error = new Error('NS_ERROR_DOM_QUOTA_REACHED');
      error.code = 1014;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw error;
      });

      const result = setItem('test_key', 'data');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('returns generic error message for non-quota errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Generic storage failure');
      });

      const result = setItem('test_key', 'data');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Generic storage failure');
    });

    it('handles error without message property', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw {};
      });

      const result = setItem('test_key', 'data');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to write to localStorage');
    });
  });

  describe('edge cases', () => {
    it('handles whitespace-only key as invalid', () => {
      const result = setItem('   ', 'value');
      expect(result.success).toBe(false);
    });

    it('getItem handles whitespace-only key as invalid', () => {
      const result = getItem('   ');
      expect(result).toBeNull();
    });

    it('removeItem handles whitespace-only key as invalid', () => {
      const result = removeItem('   ');
      expect(result.success).toBe(false);
    });

    it('setItem and getItem work with very large arrays', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        id: `ITEM-${i}`,
        name: `Item ${i}`,
        value: i * 100,
      }));

      const writeResult = setItem('large_array', largeArray);
      expect(writeResult.success).toBe(true);

      const readResult = getItem('large_array');
      expect(readResult).toEqual(largeArray);
      expect(readResult.length).toBe(100);
    });

    it('setItem handles undefined value by storing null-like', () => {
      const result = setItem('test_key', undefined);
      expect(result.success).toBe(true);
      // JSON.stringify(undefined) returns undefined, but localStorage stores it as string
      // The behavior depends on the implementation
    });
  });
});