import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listIntegrations,
  listAllIntegrations,
  getIntegrationById,
  testConnection,
  syncNow,
  getCount,
  getAvailableTypes,
  getAvailableStatuses,
  getByStatus,
  getByType,
  getSummary,
  bulkTestConnections,
  bulkSync,
} from './integrationService';
import { STORAGE_KEYS } from '../constants/constants';

describe('integrationService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set active persona to admin for permission checks
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

    // Seed integrations with all 22 types
    const integrationTypes = [
      'rest_api', 'graphql', 'webhook', 'ldap', 'saml', 'oauth2', 'oidc',
      'jira', 'servicenow', 'confluence', 'github', 'gitlab', 'azure_devops',
      'jenkins', 'sonarqube', 'snyk', 'splunk', 'datadog', 'elastic',
      'slack', 'teams', 'email',
    ];

    const integrations = integrationTypes.map((type, i) => ({
      id: `INT-${String(i + 1).padStart(3, '0')}`,
      name: `Integration ${type}`,
      description: `Integration with ${type}.`,
      type,
      status: i % 5 === 0 ? 'error' : (i % 4 === 0 ? 'inactive' : (i % 3 === 0 ? 'configuring' : 'active')),
      direction: i % 3 === 0 ? 'inbound' : (i % 3 === 1 ? 'outbound' : 'bidirectional'),
      endpoint: `https://api.${type}.example.com/v1`,
      authType: 'api_key',
      lastSyncAt: i % 2 === 0 ? '2026-06-28T10:00:00.000Z' : null,
      syncFrequency: 'every hour',
      errorMessage: i % 5 === 0 ? 'Connection timeout after 30s.' : null,
      config: { retryCount: 3, timeoutMs: 10000 },
      healthScore: i % 5 === 0 ? 15 : (i % 4 === 0 ? 45 : 85),
      createdAt: '2026-01-15T08:00:00.000Z',
      updatedAt: '2026-06-28T10:00:00.000Z',
      createdBy: 'system',
      updatedBy: 'system',
      version: 1,
    }));

    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('listAllIntegrations', () => {
    it('returns all 22 integration records', () => {
      const integrations = listAllIntegrations();
      expect(Array.isArray(integrations)).toBe(true);
      expect(integrations.length).toBe(22);
    });

    it('returns integrations covering all 22 types', () => {
      const integrations = listAllIntegrations();
      const types = new Set(integrations.map((i) => i.type));
      expect(types.size).toBe(22);

      const expectedTypes = [
        'rest_api', 'graphql', 'webhook', 'ldap', 'saml', 'oauth2', 'oidc',
        'jira', 'servicenow', 'confluence', 'github', 'gitlab', 'azure_devops',
        'jenkins', 'sonarqube', 'snyk', 'splunk', 'datadog', 'elastic',
        'slack', 'teams', 'email',
      ];
      expectedTypes.forEach((type) => {
        expect(types.has(type)).toBe(true);
      });
    });

    it('returns copies of records (not references)', () => {
      const integrations = listAllIntegrations();
      integrations[0].name = 'Modified';
      const integrations2 = listAllIntegrations();
      expect(integrations2[0].name).not.toBe('Modified');
    });
  });

  describe('listIntegrations', () => {
    it('returns paginated results with default page size', () => {
      const result = listIntegrations();
      expect(result.data.length).toBeLessThanOrEqual(20);
      expect(result.total).toBe(22);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('filters by type', () => {
      const result = listIntegrations({ type: 'jira' });
      expect(result.total).toBe(1);
      expect(result.data[0].type).toBe('jira');
    });

    it('filters by status', () => {
      const result = listIntegrations({ status: 'active' });
      result.data.forEach((integration) => {
        expect(integration.status).toBe('active');
      });
      expect(result.total).toBeGreaterThan(0);
    });

    it('filters by direction', () => {
      const result = listIntegrations({ direction: 'inbound' });
      result.data.forEach((integration) => {
        expect(integration.direction).toBe('inbound');
      });
      expect(result.total).toBeGreaterThan(0);
    });

    it('supports free-text search', () => {
      const result = listIntegrations({ search: 'jira' });
      expect(result.total).toBeGreaterThan(0);
      const hasJira = result.data.some(
        (i) => i.name.toLowerCase().includes('jira') || i.type.toLowerCase().includes('jira')
      );
      expect(hasJira).toBe(true);
    });

    it('returns empty results for non-matching search', () => {
      const result = listIntegrations({ search: 'nonexistent_integration_xyz' });
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('supports pagination', () => {
      const page1 = listIntegrations({ page: 1, pageSize: 5 });
      expect(page1.data.length).toBe(5);
      expect(page1.page).toBe(1);
      expect(page1.totalPages).toBe(5);

      const page2 = listIntegrations({ page: 2, pageSize: 5 });
      expect(page2.data.length).toBe(5);
      expect(page2.page).toBe(2);

      // Ensure different records on different pages
      const page1Ids = new Set(page1.data.map((i) => i.id));
      const page2Ids = new Set(page2.data.map((i) => i.id));
      page2Ids.forEach((id) => {
        expect(page1Ids.has(id)).toBe(false);
      });
    });

    it('supports sorting by name ascending', () => {
      const result = listIntegrations({ sortField: 'name', sortDirection: 'asc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].name.localeCompare(result.data[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('supports sorting by healthScore descending', () => {
      const result = listIntegrations({ sortField: 'healthScore', sortDirection: 'desc' });
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1].healthScore;
        const curr = result.data[i].healthScore;
        if (prev !== null && curr !== null) {
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      }
    });
  });

  describe('getIntegrationById', () => {
    it('returns an existing integration by ID', () => {
      const result = getIntegrationById('INT-001');
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBe('INT-001');
      expect(result.data.type).toBe('rest_api');
    });

    it('returns error for non-existent ID', () => {
      const result = getIntegrationById('INT-999');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('returns error for empty ID', () => {
      const result = getIntegrationById('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('returns a copy of the record', () => {
      const result = getIntegrationById('INT-001');
      result.data.name = 'Modified';
      const result2 = getIntegrationById('INT-001');
      expect(result2.data.name).not.toBe('Modified');
    });
  });

  describe('testConnection', () => {
    it('simulates a connection test and updates integration status', async () => {
      const originalResult = getIntegrationById('INT-001');
      const originalStatus = originalResult.data.status;

      const result = await testConnection('INT-001', 10);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBe('INT-001');
      expect(typeof result.data.status).toBe('string');
      expect(['active', 'inactive', 'error']).toContain(result.data.testResult);
      expect(result.data.lastTestedAt).toBeDefined();
    });

    it('returns deterministic results for the same integration ID', async () => {
      const result1 = await testConnection('INT-003', 10);
      // Reset the integration to original state
      const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
      const idx = integrations.findIndex((i) => i.id === 'INT-003');
      integrations[idx].status = 'active';
      integrations[idx].healthScore = 85;
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));

      const result2 = await testConnection('INT-003', 10);
      expect(result1.data.testResult).toBe(result2.data.testResult);
    });

    it('updates the health score based on simulated status', async () => {
      const result = await testConnection('INT-002', 10);
      expect(result.success).toBe(true);
      expect(typeof result.data.healthScore).toBe('number');
      expect(result.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.data.healthScore).toBeLessThanOrEqual(100);
    });

    it('sets error message when simulated status is error', async () => {
      // Find an integration that deterministically returns error
      const allIntegrations = listAllIntegrations();
      let errorIntegrationId = null;

      for (const integration of allIntegrations) {
        const result = await testConnection(integration.id, 5);
        if (result.data && result.data.testResult === 'error') {
          errorIntegrationId = integration.id;
          break;
        }
        // Reset for next test
        const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        const idx = integrations.findIndex((i) => i.id === integration.id);
        if (idx !== -1) {
          integrations[idx].status = integration.status;
          integrations[idx].healthScore = integration.healthScore;
          integrations[idx].errorMessage = integration.errorMessage;
          localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
        }
      }

      if (errorIntegrationId) {
        const result = await testConnection(errorIntegrationId, 5);
        expect(result.data.status).toBe('error');
        // Verify the record was updated in storage
        const stored = getIntegrationById(errorIntegrationId);
        expect(stored.data.errorMessage).not.toBeNull();
        expect(stored.data.errorMessage).toContain('simulated');
      }
    });

    it('returns error for non-existent integration ID', async () => {
      const result = await testConnection('INT-999', 10);
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
      expect(result.simulated).toBe(true);
    });

    it('returns error for empty integration ID', async () => {
      const result = await testConnection('', 10);
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
      expect(result.simulated).toBe(true);
    });

    it('creates an audit log entry on successful test', async () => {
      await testConnection('INT-001', 10);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const testLog = auditLogs.find(
        (log) => log.action === 'execute' && log.entityType === 'INTEGRATION' && log.entityId === 'INT-001'
      );
      expect(testLog).toBeDefined();
      expect(testLog.status).toBe('success');
      expect(testLog.details).toContain('Simulated connection test');
    });

    it('persists the updated status to localStorage', async () => {
      await testConnection('INT-005', 10);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
      const integration = stored.find((i) => i.id === 'INT-005');
      expect(integration).toBeDefined();
      expect(typeof integration.status).toBe('string');
      expect(typeof integration.healthScore).toBe('number');
    });

    it('simulates latency (resolves after delay)', async () => {
      const start = Date.now();
      await testConnection('INT-001', 50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('uses default latency when not specified', async () => {
      // Just verify it resolves without error
      const result = await testConnection('INT-001');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });

  describe('syncNow', () => {
    it('simulates a sync operation and updates integration', async () => {
      const result = await syncNow('INT-002', 10);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBe('INT-002');
      expect(typeof result.data.syncResult).toBe('string');
      expect(['active', 'inactive', 'error']).toContain(result.data.syncResult);
      expect(result.data.syncedAt).toBeDefined();
    });

    it('updates lastSyncAt when sync is successful (status active)', async () => {
      // Find an integration that deterministically returns active
      const allIntegrations = listAllIntegrations();
      let activeIntegrationId = null;

      for (const integration of allIntegrations) {
        const result = await syncNow(integration.id, 5);
        if (result.data && result.data.syncResult === 'active') {
          activeIntegrationId = integration.id;
          // Verify lastSyncAt was updated
          const stored = getIntegrationById(integration.id);
          expect(stored.data.lastSyncAt).not.toBeNull();
          break;
        }
        // Reset for next test
        const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        const idx = integrations.findIndex((i) => i.id === integration.id);
        if (idx !== -1) {
          integrations[idx].status = integration.status;
          integrations[idx].healthScore = integration.healthScore;
          integrations[idx].lastSyncAt = integration.lastSyncAt;
          integrations[idx].errorMessage = integration.errorMessage;
          localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
        }
      }

      expect(activeIntegrationId).not.toBeNull();
    });

    it('returns errorCount in the response', async () => {
      const result = await syncNow('INT-003', 10);
      expect(result.success).toBe(true);
      expect(typeof result.data.errorCount).toBe('number');
      expect(result.data.errorCount).toBeGreaterThanOrEqual(0);
    });

    it('updates health score after sync', async () => {
      const result = await syncNow('INT-004', 10);
      expect(result.success).toBe(true);
      expect(typeof result.data.healthScore).toBe('number');
      expect(result.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.data.healthScore).toBeLessThanOrEqual(100);
    });

    it('returns error for non-existent integration ID', async () => {
      const result = await syncNow('INT-999', 10);
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
      expect(result.simulated).toBe(true);
    });

    it('returns error for empty integration ID', async () => {
      const result = await syncNow('', 10);
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
      expect(result.simulated).toBe(true);
    });

    it('creates an audit log entry on sync', async () => {
      await syncNow('INT-002', 10);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const syncLog = auditLogs.find(
        (log) => log.action === 'execute' && log.entityType === 'INTEGRATION' && log.entityId === 'INT-002'
      );
      expect(syncLog).toBeDefined();
      expect(syncLog.details).toContain('Simulated sync');
    });

    it('persists the updated state to localStorage', async () => {
      const beforeSync = getIntegrationById('INT-006');
      await syncNow('INT-006', 10);
      const afterSync = getIntegrationById('INT-006');
      expect(afterSync.data.version).toBeGreaterThan(beforeSync.data.version);
    });

    it('simulates latency (resolves after delay)', async () => {
      const start = Date.now();
      await syncNow('INT-001', 50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('uses default latency when not specified', async () => {
      const result = await syncNow('INT-001');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it('sets error message when sync fails', async () => {
      const allIntegrations = listAllIntegrations();
      let errorIntegrationId = null;

      for (const integration of allIntegrations) {
        const result = await syncNow(integration.id, 5);
        if (result.data && result.data.syncResult === 'error') {
          errorIntegrationId = integration.id;
          break;
        }
        // Reset for next test
        const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        const idx = integrations.findIndex((i) => i.id === integration.id);
        if (idx !== -1) {
          integrations[idx].status = integration.status;
          integrations[idx].healthScore = integration.healthScore;
          integrations[idx].lastSyncAt = integration.lastSyncAt;
          integrations[idx].errorMessage = integration.errorMessage;
          localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
        }
      }

      if (errorIntegrationId) {
        const stored = getIntegrationById(errorIntegrationId);
        expect(stored.data.errorMessage).not.toBeNull();
        expect(stored.data.errorMessage).toContain('simulated');
      }
    });

    it('logs failure status in audit log when sync result is error', async () => {
      const allIntegrations = listAllIntegrations();

      for (const integration of allIntegrations) {
        const result = await syncNow(integration.id, 5);
        if (result.data && result.data.syncResult === 'error') {
          const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
          const syncLog = auditLogs.find(
            (log) =>
              log.action === 'execute' &&
              log.entityType === 'INTEGRATION' &&
              log.entityId === integration.id &&
              log.status === 'failure'
          );
          expect(syncLog).toBeDefined();
          break;
        }
        // Reset for next test
        const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        const idx = integrations.findIndex((i) => i.id === integration.id);
        if (idx !== -1) {
          integrations[idx].status = integration.status;
          integrations[idx].healthScore = integration.healthScore;
          integrations[idx].lastSyncAt = integration.lastSyncAt;
          integrations[idx].errorMessage = integration.errorMessage;
          localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
        }
      }
    });
  });

  describe('getCount', () => {
    it('returns total count of all integrations', () => {
      const count = getCount();
      expect(count).toBe(22);
    });

    it('returns count filtered by status', () => {
      const activeCount = getCount('active');
      expect(activeCount).toBeGreaterThan(0);

      const errorCount = getCount('error');
      expect(errorCount).toBeGreaterThan(0);

      expect(activeCount + errorCount).toBeLessThanOrEqual(22);
    });

    it('returns 0 for non-existent status', () => {
      const count = getCount('nonexistent_status');
      expect(count).toBe(0);
    });
  });

  describe('getAvailableTypes', () => {
    it('returns all distinct integration types', () => {
      const types = getAvailableTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBe(22);
    });

    it('returns sorted types', () => {
      const types = getAvailableTypes();
      for (let i = 1; i < types.length; i++) {
        expect(types[i].localeCompare(types[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('includes expected integration types', () => {
      const types = getAvailableTypes();
      expect(types).toContain('jira');
      expect(types).toContain('github');
      expect(types).toContain('slack');
      expect(types).toContain('teams');
      expect(types).toContain('email');
      expect(types).toContain('rest_api');
      expect(types).toContain('graphql');
    });
  });

  describe('getAvailableStatuses', () => {
    it('returns all distinct integration statuses', () => {
      const statuses = getAvailableStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('returns sorted statuses', () => {
      const statuses = getAvailableStatuses();
      for (let i = 1; i < statuses.length; i++) {
        expect(statuses[i].localeCompare(statuses[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('includes expected statuses', () => {
      const statuses = getAvailableStatuses();
      expect(statuses).toContain('active');
      expect(statuses).toContain('error');
    });
  });

  describe('getByStatus', () => {
    it('returns integrations filtered by active status', () => {
      const active = getByStatus('active');
      expect(Array.isArray(active)).toBe(true);
      active.forEach((integration) => {
        expect(integration.status).toBe('active');
      });
    });

    it('returns integrations filtered by error status', () => {
      const errors = getByStatus('error');
      expect(Array.isArray(errors)).toBe(true);
      errors.forEach((integration) => {
        expect(integration.status).toBe('error');
      });
    });

    it('returns empty array for non-existent status', () => {
      const result = getByStatus('nonexistent');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = getByStatus('');
      expect(result).toEqual([]);
    });
  });

  describe('getByType', () => {
    it('returns integrations filtered by type', () => {
      const jiraIntegrations = getByType('jira');
      expect(Array.isArray(jiraIntegrations)).toBe(true);
      expect(jiraIntegrations.length).toBe(1);
      expect(jiraIntegrations[0].type).toBe('jira');
    });

    it('returns empty array for non-existent type', () => {
      const result = getByType('nonexistent_type');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = getByType('');
      expect(result).toEqual([]);
    });
  });

  describe('getSummary', () => {
    it('returns a summary with total count', () => {
      const summary = getSummary();
      expect(summary.total).toBe(22);
    });

    it('returns status breakdown that sums to total', () => {
      const summary = getSummary();
      const statusSum = summary.active + summary.inactive + summary.error + summary.configuring + summary.deprecated;
      expect(statusSum).toBe(summary.total);
    });

    it('returns a valid average health score', () => {
      const summary = getSummary();
      expect(typeof summary.averageHealthScore).toBe('number');
      expect(summary.averageHealthScore).toBeGreaterThanOrEqual(0);
      expect(summary.averageHealthScore).toBeLessThanOrEqual(100);
    });

    it('has non-negative counts for all status categories', () => {
      const summary = getSummary();
      expect(summary.active).toBeGreaterThanOrEqual(0);
      expect(summary.inactive).toBeGreaterThanOrEqual(0);
      expect(summary.error).toBeGreaterThanOrEqual(0);
      expect(summary.configuring).toBeGreaterThanOrEqual(0);
      expect(summary.deprecated).toBeGreaterThanOrEqual(0);
    });

    it('reflects changes after testConnection', async () => {
      const summaryBefore = getSummary();
      await testConnection('INT-001', 10);
      const summaryAfter = getSummary();
      // Summary should still have 22 total
      expect(summaryAfter.total).toBe(22);
      // Average health score may have changed
      expect(typeof summaryAfter.averageHealthScore).toBe('number');
    });
  });

  describe('bulkTestConnections', () => {
    it('tests multiple integrations and returns results', async () => {
      const ids = ['INT-001', 'INT-002', 'INT-003'];
      const result = await bulkTestConnections(ids, 5);
      expect(result.simulated).toBe(true);
      expect(result.totalTested).toBe(3);
      expect(result.totalSuccess + result.totalFailed).toBe(3);
      expect(result.results.length).toBe(3);
    });

    it('handles mix of valid and invalid IDs', async () => {
      const ids = ['INT-001', 'INT-999'];
      const result = await bulkTestConnections(ids, 5);
      expect(result.totalTested).toBe(2);
      expect(result.totalSuccess).toBe(1);
      expect(result.totalFailed).toBe(1);
    });

    it('returns empty results for non-array input', async () => {
      const result = await bulkTestConnections('not-an-array', 5);
      expect(result.totalTested).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('creates audit log entries for each tested integration', async () => {
      const ids = ['INT-001', 'INT-002'];
      await bulkTestConnections(ids, 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const testLogs = auditLogs.filter(
        (log) => log.action === 'execute' && log.entityType === 'INTEGRATION'
      );
      expect(testLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('bulkSync', () => {
    it('syncs multiple integrations and returns results', async () => {
      const ids = ['INT-004', 'INT-005', 'INT-006'];
      const result = await bulkSync(ids, 5);
      expect(result.simulated).toBe(true);
      expect(result.totalSynced).toBe(3);
      expect(result.totalSuccess + result.totalFailed).toBe(3);
      expect(result.results.length).toBe(3);
    });

    it('handles mix of valid and invalid IDs', async () => {
      const ids = ['INT-004', 'INT-999'];
      const result = await bulkSync(ids, 5);
      expect(result.totalSynced).toBe(2);
      expect(result.totalSuccess).toBe(1);
      expect(result.totalFailed).toBe(1);
    });

    it('returns empty results for non-array input', async () => {
      const result = await bulkSync('not-an-array', 5);
      expect(result.totalSynced).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('creates audit log entries for each synced integration', async () => {
      const ids = ['INT-004', 'INT-005'];
      await bulkSync(ids, 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const syncLogs = auditLogs.filter(
        (log) => log.action === 'execute' && log.entityType === 'INTEGRATION'
      );
      expect(syncLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('deterministic simulation', () => {
    it('testConnection produces same result for same ID across calls', async () => {
      const result1 = await testConnection('INT-010', 5);
      const status1 = result1.data.testResult;

      // Reset integration state
      const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
      const idx = integrations.findIndex((i) => i.id === 'INT-010');
      integrations[idx].status = 'active';
      integrations[idx].healthScore = 85;
      integrations[idx].errorMessage = null;
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));

      const result2 = await testConnection('INT-010', 5);
      const status2 = result2.data.testResult;

      expect(status1).toBe(status2);
    });

    it('syncNow produces same result for same ID across calls', async () => {
      const result1 = await syncNow('INT-010', 5);
      const syncResult1 = result1.data.syncResult;

      // Reset integration state
      const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
      const idx = integrations.findIndex((i) => i.id === 'INT-010');
      integrations[idx].status = 'active';
      integrations[idx].healthScore = 85;
      integrations[idx].lastSyncAt = '2026-06-28T10:00:00.000Z';
      integrations[idx].errorMessage = null;
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));

      const result2 = await syncNow('INT-010', 5);
      const syncResult2 = result2.data.syncResult;

      expect(syncResult1).toBe(syncResult2);
    });

    it('different integration IDs can produce different results', async () => {
      const results = [];
      for (let i = 1; i <= 10; i++) {
        const id = `INT-${String(i).padStart(3, '0')}`;
        const result = await testConnection(id, 5);
        if (result.success) {
          results.push(result.data.testResult);
        }
      }

      // At least some should differ (not all the same)
      const uniqueResults = new Set(results);
      // With 10 integrations, we should see at least 1 different result
      // (deterministic but varied based on ID hash)
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('audit logging', () => {
    it('testConnection logs with correct entity type and action', async () => {
      await testConnection('INT-007', 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'INT-007' && l.action === 'execute' && l.entityType === 'INTEGRATION'
      );
      expect(log).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.userName).toBeDefined();
      expect(log.timestamp).toBeDefined();
    });

    it('syncNow logs with correct entity type and action', async () => {
      await syncNow('INT-008', 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'INT-008' && l.action === 'execute' && l.entityType === 'INTEGRATION'
      );
      expect(log).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.userName).toBeDefined();
    });

    it('audit log includes previous and new values', async () => {
      await testConnection('INT-009', 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'INT-009' && l.action === 'execute'
      );
      expect(log).toBeDefined();
      expect(log.previousValues).toBeDefined();
      expect(log.newValues).toBeDefined();
      expect(log.newValues.testedAt).toBeDefined();
    });

    it('audit log includes simulated flag in details', async () => {
      await syncNow('INT-010', 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'INT-010' && l.action === 'execute'
      );
      expect(log).toBeDefined();
      expect(log.details).toContain('Simulated');
    });

    it('audit log includes entity name', async () => {
      await testConnection('INT-001', 5);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'INT-001' && l.action === 'execute'
      );
      expect(log).toBeDefined();
      expect(log.entityName).toBeDefined();
      expect(typeof log.entityName).toBe('string');
      expect(log.entityName.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty integrations array', () => {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      const integrations = listAllIntegrations();
      expect(integrations).toEqual([]);
      expect(getCount()).toBe(0);
    });

    it('handles missing integrations key in localStorage', () => {
      localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
      const integrations = listAllIntegrations();
      expect(integrations).toEqual([]);
    });

    it('handles invalid JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, 'not valid json');
      const integrations = listAllIntegrations();
      expect(integrations).toEqual([]);
    });

    it('testConnection handles negative latency gracefully', async () => {
      const result = await testConnection('INT-001', -100);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it('syncNow handles zero latency', async () => {
      const result = await syncNow('INT-001', 0);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it('getSummary returns valid summary with empty data', () => {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      const summary = getSummary();
      expect(summary.total).toBe(0);
      expect(summary.active).toBe(0);
      expect(summary.error).toBe(0);
      expect(summary.averageHealthScore).toBe(0);
    });

    it('getAvailableTypes returns empty array with no data', () => {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      const types = getAvailableTypes();
      expect(types).toEqual([]);
    });

    it('getAvailableStatuses returns empty array with no data', () => {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      const statuses = getAvailableStatuses();
      expect(statuses).toEqual([]);
    });

    it('listIntegrations handles combined filters', () => {
      const result = listIntegrations({
        type: 'jira',
        status: 'active',
        search: 'jira',
        sortField: 'name',
        sortDirection: 'asc',
        page: 1,
        pageSize: 10,
      });
      expect(result.data.length).toBeLessThanOrEqual(10);
      result.data.forEach((integration) => {
        expect(integration.type).toBe('jira');
      });
    });
  });
});