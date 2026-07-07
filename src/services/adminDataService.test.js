import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
} from './adminDataService';
import { STORAGE_KEYS, SCHEMA_VERSION, SEED_SIZES, ANCHOR_DATE } from '../constants/constants';
import { seedDatabase } from '../seed/seedEngine';

describe('adminDataService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set active persona to admin for permission checks
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

    // Seed users so persona manager can resolve
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      {
        id: 'persona-platform-administrator',
        username: 'admin',
        email: 'admin@kpetsip.example.com',
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Admin User',
        accessLevel: 'admin',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        version: 1,
      },
    ]));

    // Seed roles
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));

    // Initialize empty arrays for entity types
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('canPerformAdminActions', () => {
    it('returns true for admin persona', () => {
      expect(canPerformAdminActions()).toBe(true);
    });

    it('returns false for non-admin persona', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      expect(canPerformAdminActions()).toBe(false);
    });

    it('returns false for external persona', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-vendor-partner'));
      expect(canPerformAdminActions()).toBe(false);
    });

    it('returns false for contributor persona', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-quality-engineer'));
      expect(canPerformAdminActions()).toBe(false);
    });
  });

  describe('reseedData', () => {
    it('reseeds the database with standard size successfully', () => {
      const result = reseedData('standard', 'test-reseed-seed');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.counts).toBeDefined();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('reseeds the database with small size', () => {
      const result = reseedData('small', 'test-small-seed');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('reseeds the database with large size', () => {
      const result = reseedData('large', 'test-large-seed');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('populates localStorage with entity data after reseed', () => {
      reseedData('standard', 'test-populate-seed');
      const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(Array.isArray(portfolios)).toBe(true);
      expect(portfolios.length).toBeGreaterThan(0);

      const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
      expect(Array.isArray(applications)).toBe(true);
      expect(applications.length).toBeGreaterThan(0);
    });

    it('creates an audit log entry on successful reseed', () => {
      reseedData('standard', 'test-audit-seed');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const reseedLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'reseed'
      );
      expect(reseedLog).toBeDefined();
      expect(reseedLog.status).toBe('success');
      expect(reseedLog.entityType).toBe('PDE_CONFIG');
      expect(reseedLog.entityName).toBe('Reseed Database');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = reseedData('standard', 'test-denied-seed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      reseedData('standard', 'test-denied-audit-seed');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'reseed' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
      expect(deniedLog.details).toContain('Permission denied');
    });

    it('produces deterministic results for the same seed', () => {
      const result1 = reseedData('standard', 'deterministic-seed');
      const portfolios1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      localStorage.clear();
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

      const result2 = reseedData('standard', 'deterministic-seed');
      const portfolios2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      expect(result1.counts).toEqual(result2.counts);
      expect(portfolios1.length).toBe(portfolios2.length);
      portfolios1.forEach((p, i) => {
        expect(p.id).toBe(portfolios2[i].id);
        expect(p.name).toBe(portfolios2[i].name);
      });
    });

    it('uses default seed value when none provided', () => {
      const result = reseedData('standard');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('uses default seed size when none provided', () => {
      const result = reseedData();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('resetToDefaults', () => {
    it('resets the database to factory defaults', () => {
      // First seed with large
      reseedData('large', 'pre-reset-seed');
      const beforePortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(beforePortfolios.length).toBeGreaterThan(0);

      // Reset to defaults
      const result = resetToDefaults();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('resets to standard seed size', () => {
      reseedData('large', 'pre-reset-large');
      const result = resetToDefaults();
      expect(result.success).toBe(true);

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('standard');
    });

    it('creates an audit log entry on successful reset', () => {
      const result = resetToDefaults();
      expect(result.success).toBe(true);

      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const resetLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'reset'
      );
      expect(resetLog).toBeDefined();
      expect(resetLog.status).toBe('success');
      expect(resetLog.entityName).toBe('Reset to Defaults');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = resetToDefaults();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      resetToDefaults();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'reset' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
    });

    it('sets the schema version after reset', () => {
      resetToDefaults();
      const storedVersion = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION));
      expect(storedVersion).toBe(SCHEMA_VERSION);
    });

    it('produces deterministic results on repeated resets', () => {
      const result1 = resetToDefaults();
      const portfolios1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      localStorage.clear();
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

      const result2 = resetToDefaults();
      const portfolios2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      expect(result1.counts).toEqual(result2.counts);
      expect(portfolios1.length).toBe(portfolios2.length);
    });
  });

  describe('exportAllData', () => {
    it('exports all data as a JSON object', () => {
      seedDatabase('small', 'export-test-seed');
      const result = exportAllData();
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it('includes schema version in export', () => {
      seedDatabase('small', 'export-schema-seed');
      const result = exportAllData();
      expect(result.data[STORAGE_KEYS.SCHEMA_VERSION]).toBe(SCHEMA_VERSION);
    });

    it('includes metadata in export', () => {
      seedDatabase('small', 'export-meta-seed');
      const result = exportAllData();
      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.data.metadata.anchorDate).toBe(ANCHOR_DATE);
      expect(typeof result.data.metadata.exportedAt).toBe('string');
      expect(typeof result.data.metadata.exportedBy).toBe('string');
    });

    it('includes entity counts in metadata', () => {
      seedDatabase('small', 'export-counts-seed');
      const result = exportAllData();
      expect(result.data.metadata.entityCounts).toBeDefined();
      expect(typeof result.data.metadata.entityCounts).toBe('object');
    });

    it('includes entity data in export', () => {
      seedDatabase('small', 'export-entities-seed');
      const result = exportAllData();
      expect(result.data[STORAGE_KEYS.PORTFOLIOS]).toBeDefined();
      expect(Array.isArray(result.data[STORAGE_KEYS.PORTFOLIOS])).toBe(true);
      expect(result.data[STORAGE_KEYS.PORTFOLIOS].length).toBeGreaterThan(0);

      expect(result.data[STORAGE_KEYS.APPLICATIONS]).toBeDefined();
      expect(Array.isArray(result.data[STORAGE_KEYS.APPLICATIONS])).toBe(true);
      expect(result.data[STORAGE_KEYS.APPLICATIONS].length).toBeGreaterThan(0);
    });

    it('creates an audit log entry on successful export', () => {
      seedDatabase('small', 'export-audit-seed');
      exportAllData();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const exportLog = auditLogs.find(
        (log) => log.action === 'export' && log.entityId === 'export'
      );
      expect(exportLog).toBeDefined();
      expect(exportLog.status).toBe('success');
      expect(exportLog.entityName).toBe('Export All Data');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = exportAllData();
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied for export', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      exportAllData();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'export' && log.entityId === 'export' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
    });

    it('includes storage bytes used in metadata', () => {
      seedDatabase('small', 'export-storage-seed');
      const result = exportAllData();
      expect(typeof result.data.metadata.storageBytesUsed).toBe('number');
      expect(result.data.metadata.storageBytesUsed).toBeGreaterThan(0);
    });

    it('includes exportedAt timestamp', () => {
      seedDatabase('small', 'export-timestamp-seed');
      const result = exportAllData();
      expect(result.data.exportedAt).toBeDefined();
      const ts = new Date(result.data.exportedAt);
      expect(Number.isNaN(ts.getTime())).toBe(false);
    });

    it('includes exportedBy field', () => {
      seedDatabase('small', 'export-by-seed');
      const result = exportAllData();
      expect(typeof result.data.exportedBy).toBe('string');
      expect(result.data.exportedBy.length).toBeGreaterThan(0);
    });
  });

  describe('importAllData', () => {
    it('imports valid data successfully', () => {
      // First export data
      seedDatabase('small', 'import-test-seed');
      const exportResult = exportAllData();
      expect(exportResult.success).toBe(true);

      // Clear and reimport
      const importResult = importAllData(exportResult.data);
      expect(importResult.success).toBe(true);
      expect(importResult.importedCount).toBeGreaterThan(0);
      expect(importResult.error).toBeNull();
    });

    it('restores entity data after import', () => {
      seedDatabase('small', 'import-restore-seed');
      const exportResult = exportAllData();
      const originalPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      // Import the data
      importAllData(exportResult.data);

      const importedPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(importedPortfolios.length).toBe(originalPortfolios.length);
    });

    it('creates an audit log entry on successful import', () => {
      seedDatabase('small', 'import-audit-seed');
      const exportResult = exportAllData();

      // Clear audit logs before import
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

      importAllData(exportResult.data);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const importLog = auditLogs.find(
        (log) => log.action === 'import' && log.entityId === 'import'
      );
      expect(importLog).toBeDefined();
      expect(importLog.status).toBe('success');
      expect(importLog.entityName).toBe('Import Data');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = importAllData({ [STORAGE_KEYS.PORTFOLIOS]: [] });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied for import', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      importAllData({ [STORAGE_KEYS.PORTFOLIOS]: [] });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'import' && log.entityId === 'import' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
    });

    it('returns error for null data', () => {
      const result = importAllData(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-null object');
    });

    it('returns error for array data', () => {
      const result = importAllData([1, 2, 3]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-null object');
    });

    it('returns error for non-object data', () => {
      const result = importAllData('string');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-null object');
    });

    it('validates import data and rejects invalid records', () => {
      const invalidData = {
        [STORAGE_KEYS.PORTFOLIOS]: [
          { name: 'No ID Portfolio' }, // Missing id
        ],
      };
      const result = importAllData(invalidData);
      // Should fail validation because record is missing id
      expect(result.success).toBe(false);
    });

    it('validates import data and rejects duplicate IDs', () => {
      const duplicateData = {
        [STORAGE_KEYS.PORTFOLIOS]: [
          { id: 'PF-001', name: 'Portfolio A', owner: 'Owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
          { id: 'PF-001', name: 'Portfolio B', owner: 'Owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        ],
      };
      const result = importAllData(duplicateData);
      expect(result.success).toBe(false);
    });

    it('returns warnings array', () => {
      seedDatabase('small', 'import-warnings-seed');
      const exportResult = exportAllData();
      const result = importAllData(exportResult.data);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('updates seed size from metadata if present', () => {
      const importData = {
        [STORAGE_KEYS.PORTFOLIOS]: [
          { id: 'PF-001', name: 'Test Portfolio', owner: 'Owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        ],
        metadata: {
          seedSize: 'large',
        },
      };
      const result = importAllData(importData);
      expect(result.success).toBe(true);

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('large');
    });

    it('creates an audit log entry on validation failure', () => {
      const invalidData = {
        [STORAGE_KEYS.PORTFOLIOS]: [
          { name: 'Missing ID' },
        ],
      };
      importAllData(invalidData);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const failLog = auditLogs.find(
        (log) => log.action === 'import' && log.entityId === 'import' && log.status === 'failure'
      );
      expect(failLog).toBeDefined();
      expect(failLog.details).toContain('validation failed');
    });
  });

  describe('clearAllData', () => {
    it('clears all application data from localStorage', () => {
      seedDatabase('small', 'clear-test-seed');
      const beforePortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(beforePortfolios.length).toBeGreaterThan(0);

      const result = clearAllData();
      expect(result.success).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.error).toBeNull();

      const afterPortfolios = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
      expect(afterPortfolios).toBeNull();
    });

    it('creates an audit log entry on successful clear', () => {
      seedDatabase('small', 'clear-audit-seed');
      clearAllData();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const clearLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'clear'
      );
      expect(clearLog).toBeDefined();
      expect(clearLog.status).toBe('success');
      expect(clearLog.entityName).toBe('Clear All Data');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = clearAllData();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied for clear', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      clearAllData();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'clear' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
    });

    it('returns removedCount in the result', () => {
      seedDatabase('small', 'clear-count-seed');
      const result = clearAllData();
      expect(typeof result.removedCount).toBe('number');
      expect(result.removedCount).toBeGreaterThan(0);
    });

    it('includes previous storage usage in audit log', () => {
      seedDatabase('small', 'clear-usage-seed');
      clearAllData();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const clearLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'clear' && log.status === 'success'
      );
      expect(clearLog).toBeDefined();
      expect(clearLog.previousValues).toBeDefined();
      expect(typeof clearLog.previousValues.storageBytesUsed).toBe('number');
    });
  });

  describe('setSeedSize', () => {
    it('sets seed size to small', () => {
      const result = setSeedSize('small');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('small');
    });

    it('sets seed size to standard', () => {
      const result = setSeedSize('standard');
      expect(result.success).toBe(true);

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('standard');
    });

    it('sets seed size to large', () => {
      const result = setSeedSize('large');
      expect(result.success).toBe(true);

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('large');
    });

    it('creates an audit log entry on successful set', () => {
      setSeedSize('standard');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const sizeLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'seed_size'
      );
      expect(sizeLog).toBeDefined();
      expect(sizeLog.status).toBe('success');
      expect(sizeLog.entityName).toBe('Set Seed Size');
      expect(sizeLog.newValues.seedSize).toBe('standard');
    });

    it('records previous seed size in audit log', () => {
      setSeedSize('small');
      setSeedSize('large');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const lastLog = auditLogs.filter(
        (log) => log.action === 'configure' && log.entityId === 'seed_size'
      ).pop();
      expect(lastLog).toBeDefined();
      expect(lastLog.previousValues.seedSize).toBe('small');
      expect(lastLog.newValues.seedSize).toBe('large');
    });

    it('returns error when permission is denied', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      const result = setSeedSize('standard');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('creates an audit log entry on permission denied for setSeedSize', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));
      setSeedSize('standard');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deniedLog = auditLogs.find(
        (log) => log.action === 'configure' && log.entityId === 'seed_size' && log.status === 'failure'
      );
      expect(deniedLog).toBeDefined();
    });

    it('returns error for empty string', () => {
      const result = setSeedSize('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('returns error for invalid seed size', () => {
      const result = setSeedSize('extra_large');
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be one of');
    });

    it('normalizes seed size to lowercase', () => {
      const result = setSeedSize('STANDARD');
      expect(result.success).toBe(true);

      const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
      expect(storedSize).toBe('standard');
    });

    it('returns error for non-string input', () => {
      const result = setSeedSize(null);
      expect(result.success).toBe(false);
    });
  });

  describe('getSeedInfo', () => {
    it('returns seed info when database is seeded', () => {
      seedDatabase('standard', 'seed-info-test');
      const result = getSeedInfo();
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.isSeeded).toBe(true);
    });

    it('returns seed size in seed info', () => {
      seedDatabase('small', 'seed-info-size');
      const result = getSeedInfo();
      expect(result.data.seedSize).toBe('small');
    });

    it('returns anchor date in seed info', () => {
      seedDatabase('small', 'seed-info-anchor');
      const result = getSeedInfo();
      expect(result.data.anchorDate).toBe(ANCHOR_DATE);
    });

    it('returns schema version info', () => {
      seedDatabase('small', 'seed-info-schema');
      const result = getSeedInfo();
      expect(result.data.currentSchemaVersion).toBe(SCHEMA_VERSION);
      expect(result.data.schemaMatch).toBe(true);
    });

    it('returns storage usage info', () => {
      seedDatabase('small', 'seed-info-storage');
      const result = getSeedInfo();
      expect(result.data.storage).toBeDefined();
      expect(typeof result.data.storage.bytesUsed).toBe('number');
      expect(typeof result.data.storage.quota).toBe('number');
      expect(typeof result.data.storage.percentage).toBe('number');
      expect(result.data.storage.bytesUsed).toBeGreaterThan(0);
    });

    it('returns entity counts', () => {
      seedDatabase('small', 'seed-info-counts');
      const result = getSeedInfo();
      expect(result.data.entityCounts).toBeDefined();
      expect(typeof result.data.entityCounts).toBe('object');
      expect(result.data.entityCounts.PORTFOLIO).toBeGreaterThan(0);
      expect(result.data.entityCounts.APPLICATION).toBeGreaterThan(0);
    });

    it('returns total entities count', () => {
      seedDatabase('small', 'seed-info-total');
      const result = getSeedInfo();
      expect(typeof result.data.totalEntities).toBe('number');
      expect(result.data.totalEntities).toBeGreaterThan(0);
    });

    it('returns isSeeded false when database is not seeded', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
      const result = getSeedInfo();
      expect(result.success).toBe(true);
      expect(result.data.isSeeded).toBe(false);
    });

    it('returns null seedSize when not set', () => {
      localStorage.removeItem(STORAGE_KEYS.SEED_SIZE);
      const result = getSeedInfo();
      expect(result.success).toBe(true);
      expect(result.data.seedSize).toBeNull();
    });

    it('returns seedSizeConfig when seed size is set', () => {
      seedDatabase('small', 'seed-info-config');
      const result = getSeedInfo();
      expect(result.data.seedSizeConfig).not.toBeNull();
      expect(result.data.seedSizeConfig.key).toBe('small');
      expect(result.data.seedSizeConfig.label).toBe('Small');
      expect(typeof result.data.seedSizeConfig.records).toBe('number');
    });

    it('returns needsMigration flag', () => {
      seedDatabase('small', 'seed-info-migration');
      const result = getSeedInfo();
      expect(typeof result.data.needsMigration).toBe('boolean');
    });
  });

  describe('getAvailableSeedSizes', () => {
    it('returns an array of seed sizes', () => {
      const sizes = getAvailableSeedSizes();
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBe(3);
    });

    it('includes small, standard, and large sizes', () => {
      const sizes = getAvailableSeedSizes();
      const keys = sizes.map((s) => s.key);
      expect(keys).toContain('small');
      expect(keys).toContain('standard');
      expect(keys).toContain('large');
    });

    it('each size has key, label, and records properties', () => {
      const sizes = getAvailableSeedSizes();
      sizes.forEach((size) => {
        expect(typeof size.key).toBe('string');
        expect(typeof size.label).toBe('string');
        expect(typeof size.records).toBe('number');
        expect(size.records).toBeGreaterThan(0);
      });
    });

    it('small has fewer records than standard', () => {
      const sizes = getAvailableSeedSizes();
      const small = sizes.find((s) => s.key === 'small');
      const standard = sizes.find((s) => s.key === 'standard');
      expect(small.records).toBeLessThan(standard.records);
    });

    it('standard has fewer records than large', () => {
      const sizes = getAvailableSeedSizes();
      const standard = sizes.find((s) => s.key === 'standard');
      const large = sizes.find((s) => s.key === 'large');
      expect(standard.records).toBeLessThan(large.records);
    });
  });

  describe('getSchemaInfo', () => {
    it('returns current schema version', () => {
      const info = getSchemaInfo();
      expect(info.current).toBe(SCHEMA_VERSION);
    });

    it('returns null stored version when not set', () => {
      localStorage.removeItem(STORAGE_KEYS.SCHEMA_VERSION);
      const info = getSchemaInfo();
      expect(info.stored).toBeNull();
    });

    it('returns matching when stored version equals current', () => {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify(SCHEMA_VERSION));
      const info = getSchemaInfo();
      expect(info.match).toBe(true);
      expect(info.needsMigration).toBe(false);
    });

    it('returns needsMigration when stored version differs', () => {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify('0.9.0'));
      const info = getSchemaInfo();
      expect(info.match).toBe(false);
      expect(info.needsMigration).toBe(true);
    });
  });

  describe('getStorageInfo', () => {
    it('returns storage usage information', () => {
      seedDatabase('small', 'storage-info-seed');
      const info = getStorageInfo();
      expect(typeof info.bytesUsed).toBe('number');
      expect(typeof info.quota).toBe('number');
      expect(typeof info.percentage).toBe('number');
      expect(typeof info.keys).toBe('object');
    });

    it('returns non-zero bytes when data exists', () => {
      seedDatabase('small', 'storage-info-nonzero');
      const info = getStorageInfo();
      expect(info.bytesUsed).toBeGreaterThan(0);
    });

    it('returns zero bytes when no data exists', () => {
      localStorage.clear();
      const info = getStorageInfo();
      expect(info.bytesUsed).toBe(0);
    });

    it('returns a valid percentage', () => {
      seedDatabase('small', 'storage-info-pct');
      const info = getStorageInfo();
      expect(info.percentage).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeLessThanOrEqual(100);
    });

    it('returns keys breakdown', () => {
      seedDatabase('small', 'storage-info-keys');
      const info = getStorageInfo();
      expect(Object.keys(info.keys).length).toBeGreaterThan(0);
    });
  });

  describe('permission gating across all actions', () => {
    const nonAdminPersonas = [
      'persona-executive-leadership',
      'persona-quality-engineer',
      'persona-developer',
      'persona-read-only-user',
      'persona-vendor-partner',
    ];

    nonAdminPersonas.forEach((personaId) => {
      it(`reseedData is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = reseedData('standard');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });

      it(`resetToDefaults is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = resetToDefaults();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });

      it(`exportAllData is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = exportAllData();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });

      it(`importAllData is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = importAllData({ [STORAGE_KEYS.PORTFOLIOS]: [] });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });

      it(`clearAllData is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = clearAllData();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });

      it(`setSeedSize is denied for ${personaId}`, () => {
        localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
        const result = setSeedSize('standard');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });
    });
  });

  describe('audit logging consistency', () => {
    it('all successful admin actions create audit log entries', () => {
      // Reseed
      reseedData('small', 'audit-consistency-seed');
      let auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      expect(auditLogs.some((l) => l.entityId === 'reseed' && l.status === 'success')).toBe(true);

      // Set seed size
      setSeedSize('standard');
      auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      expect(auditLogs.some((l) => l.entityId === 'seed_size' && l.status === 'success')).toBe(true);

      // Export
      exportAllData();
      auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      expect(auditLogs.some((l) => l.entityId === 'export' && l.status === 'success')).toBe(true);

      // Clear
      clearAllData();
      auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      expect(auditLogs.some((l) => l.entityId === 'clear' && l.status === 'success')).toBe(true);
    });

    it('all denied admin actions create audit log entries with failure status', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-read-only-user'));

      reseedData('standard');
      resetToDefaults();
      exportAllData();
      importAllData({ [STORAGE_KEYS.PORTFOLIOS]: [] });
      clearAllData();
      setSeedSize('standard');

      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const failureLogs = auditLogs.filter((l) => l.status === 'failure');
      expect(failureLogs.length).toBeGreaterThanOrEqual(6);
    });

    it('audit log entries include userId and userName', () => {
      reseedData('small', 'audit-user-seed');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const reseedLog = auditLogs.find(
        (log) => log.entityId === 'reseed' && log.status === 'success'
      );
      expect(reseedLog).toBeDefined();
      expect(reseedLog.userId).toBeDefined();
      expect(typeof reseedLog.userId).toBe('string');
      expect(reseedLog.userId.length).toBeGreaterThan(0);
      expect(reseedLog.userName).toBeDefined();
      expect(typeof reseedLog.userName).toBe('string');
      expect(reseedLog.userName.length).toBeGreaterThan(0);
    });

    it('audit log entries include timestamp', () => {
      reseedData('small', 'audit-timestamp-seed');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const reseedLog = auditLogs.find(
        (log) => log.entityId === 'reseed' && log.status === 'success'
      );
      expect(reseedLog).toBeDefined();
      expect(reseedLog.timestamp).toBeDefined();
      const ts = new Date(reseedLog.timestamp);
      expect(Number.isNaN(ts.getTime())).toBe(false);
    });

    it('audit log entries include details string', () => {
      reseedData('small', 'audit-details-seed');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const reseedLog = auditLogs.find(
        (log) => log.entityId === 'reseed' && log.status === 'success'
      );
      expect(reseedLog).toBeDefined();
      expect(typeof reseedLog.details).toBe('string');
      expect(reseedLog.details.length).toBeGreaterThan(0);
    });
  });

  describe('end-to-end workflow', () => {
    it('seed -> export -> clear -> import restores data', () => {
      // Seed
      const seedResult = reseedData('small', 'e2e-seed');
      expect(seedResult.success).toBe(true);

      const originalPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      const originalApps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
      expect(originalPortfolios.length).toBeGreaterThan(0);
      expect(originalApps.length).toBeGreaterThan(0);

      // Export
      const exportResult = exportAllData();
      expect(exportResult.success).toBe(true);
      const exportedData = exportResult.data;

      // Clear
      const clearResult = clearAllData();
      expect(clearResult.success).toBe(true);

      // Verify cleared
      expect(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS)).toBeNull();

      // Import
      const importResult = importAllData(exportedData);
      expect(importResult.success).toBe(true);

      // Verify restored
      const restoredPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      const restoredApps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
      expect(restoredPortfolios.length).toBe(originalPortfolios.length);
      expect(restoredApps.length).toBe(originalApps.length);
    });

    it('reseed replaces existing data', () => {
      // First seed
      reseedData('small', 'first-seed');
      const firstPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(firstPortfolios.length).toBeGreaterThan(0);

      // Reseed with different seed
      reseedData('small', 'second-seed');
      const secondPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(secondPortfolios.length).toBeGreaterThan(0);

      // Data should be different (different seed values produce different PRNG-driven data)
      let hasDifference = false;
      for (let i = 0; i < Math.min(firstPortfolios.length, secondPortfolios.length); i++) {
        if (firstPortfolios[i].complianceScore !== secondPortfolios[i].complianceScore) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });

    it('getSeedInfo reflects current state after operations', () => {
      // Before seeding
      let info = getSeedInfo();
      expect(info.data.isSeeded).toBe(false);

      // After seeding
      reseedData('small', 'info-state-seed');
      info = getSeedInfo();
      expect(info.data.isSeeded).toBe(true);
      expect(info.data.seedSize).toBe('small');
      expect(info.data.totalEntities).toBeGreaterThan(0);

      // After clearing
      clearAllData();
      info = getSeedInfo();
      expect(info.data.isSeeded).toBe(false);
      expect(info.data.totalEntities).toBe(0);
    });

    it('setSeedSize does not affect existing data', () => {
      reseedData('small', 'size-no-affect-seed');
      const beforePortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      setSeedSize('large');

      const afterPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(afterPortfolios.length).toBe(beforePortfolios.length);
    });
  });

  describe('edge cases', () => {
    it('reseedData handles unknown seed size gracefully', () => {
      const result = reseedData('unknown_size', 'edge-seed');
      expect(result.success).toBe(true);
      // Should default to standard
    });

    it('getSeedInfo handles missing localStorage keys gracefully', () => {
      localStorage.clear();
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
      const result = getSeedInfo();
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.isSeeded).toBe(false);
    });

    it('exportAllData handles empty database', () => {
      const result = exportAllData();
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
    });

    it('clearAllData handles already empty database', () => {
      localStorage.clear();
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
      const result = clearAllData();
      expect(result.success).toBe(true);
    });

    it('importAllData with empty entity arrays succeeds', () => {
      const emptyData = {
        [STORAGE_KEYS.PORTFOLIOS]: [],
        [STORAGE_KEYS.APPLICATIONS]: [],
      };
      const result = importAllData(emptyData);
      expect(result.success).toBe(true);
    });

    it('multiple rapid reseeds do not corrupt data', () => {
      reseedData('small', 'rapid-1');
      reseedData('small', 'rapid-2');
      reseedData('small', 'rapid-3');

      const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(Array.isArray(portfolios)).toBe(true);
      expect(portfolios.length).toBeGreaterThan(0);

      // All IDs should be unique
      const ids = portfolios.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('reseedData includes counts for all entity types', () => {
      const result = reseedData('standard', 'counts-seed');
      expect(result.success).toBe(true);

      const expectedEntityTypes = [
        'PORTFOLIO', 'APPLICATION', 'RELATIONSHIP', 'TECH_CATEGORY',
        'TECH_STANDARD', 'TECH_ENTRY', 'DEFINITION', 'ENVIRONMENT',
        'TECH_DEBT', 'QUALITY_GATE', 'GOVERNANCE_RECORD', 'APPROVAL_REQUEST',
        'WAIVER', 'EVIDENCE', 'USER', 'ROLE', 'INTEGRATION', 'NOTIFICATION',
        'AI_ANALYSIS', 'USE_CASE', 'SCHEDULE', 'DEMO_SCENARIO', 'PDE_CONFIG',
        'AUDIT_LOG',
      ];

      expectedEntityTypes.forEach((entityType) => {
        expect(result.counts[entityType]).toBeDefined();
        expect(typeof result.counts[entityType]).toBe('number');
        expect(result.counts[entityType]).toBeGreaterThan(0);
      });
    });
  });
});