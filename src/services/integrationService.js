import {
  listIntegrations as repoListIntegrations,
  getIntegration,
  updateIntegration,
  getAllIntegrations,
  getIntegrationCount,
  getDistinctTypes,
  getDistinctStatuses,
  getIntegrationsByStatus,
  getIntegrationsByType,
  getIntegrationSummary,
} from './integrationRepository';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';

/**
 * Returns the current active persona info for audit logging.
 * @returns {{ id: string, name: string }}
 */
const getAuditActor = () => {
  try {
    const persona = getActivePersona();
    return { id: persona.id, name: persona.name };
  } catch {
    return { id: 'system', name: 'System' };
  }
};

/**
 * Deterministically generates a simulated connection status based on integration ID.
 * Uses a simple hash of the ID to produce a repeatable result.
 * @param {string} integrationId - The integration ID.
 * @returns {string} Simulated status: 'active', 'error', or 'inactive'.
 */
const deterministicConnectionStatus = (integrationId) => {
  if (typeof integrationId !== 'string' || integrationId.trim() === '') {
    return 'error';
  }

  let hash = 0;
  for (let i = 0; i < integrationId.length; i++) {
    const char = integrationId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  hash = Math.abs(hash);

  const mod = hash % 10;
  if (mod < 7) {
    return 'active';
  }
  if (mod < 9) {
    return 'inactive';
  }
  return 'error';
};

/**
 * Deterministically generates a simulated health score based on integration ID and status.
 * @param {string} integrationId - The integration ID.
 * @param {string} status - The current status.
 * @returns {number} Simulated health score (0-100).
 */
const deterministicHealthScore = (integrationId, status) => {
  if (status === 'error') {
    return Math.max(0, Math.min(30, (integrationId.length * 7) % 31));
  }
  if (status === 'inactive') {
    return Math.max(30, Math.min(60, (integrationId.length * 13) % 31 + 30));
  }
  return Math.max(70, Math.min(100, (integrationId.length * 11) % 31 + 70));
};

/**
 * Deterministically generates a simulated error count based on integration ID.
 * @param {string} integrationId - The integration ID.
 * @param {string} status - The current status.
 * @returns {number} Simulated error count.
 */
const deterministicErrorCount = (integrationId, status) => {
  if (status === 'active') {
    return 0;
  }
  if (status === 'error') {
    let hash = 0;
    for (let i = 0; i < integrationId.length; i++) {
      hash = ((hash << 5) - hash + integrationId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 10 + 1;
  }
  return 0;
};

/**
 * Lists all integrations with their current status.
 * Delegates to the integration repository.
 *
 * @param {Object} [filters={}] - Optional filters for listing integrations.
 * @returns {{ data: Array<Object>, total: number, page: number, pageSize: number, totalPages: number }}
 */
export const listIntegrations = (filters = {}) => {
  return repoListIntegrations(filters);
};

/**
 * Returns all integrations without pagination.
 *
 * @returns {Array<Object>}
 */
export const listAllIntegrations = () => {
  return getAllIntegrations();
};

/**
 * Retrieves a single integration by ID.
 *
 * @param {string} id - The integration ID.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const getIntegrationById = (id) => {
  return getIntegration(id);
};

/**
 * Simulates testing a connection for an integration.
 * Uses setTimeout to simulate network latency, then deterministically updates
 * the integration status, health score, and logs the action to the audit log.
 * No real network calls are made.
 *
 * @param {string} integrationId - The integration ID to test.
 * @param {number} [latencyMs=800] - Simulated latency in milliseconds.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null, simulated: boolean }>}
 */
export const testConnection = (integrationId, latencyMs = 800) => {
  return new Promise((resolve) => {
    if (typeof integrationId !== 'string' || integrationId.trim() === '') {
      resolve({
        success: false,
        data: null,
        error: 'Integration ID must be a non-empty string',
        simulated: true,
      });
      return;
    }

    const existing = getIntegration(integrationId);
    if (!existing.success || !existing.data) {
      resolve({
        success: false,
        data: null,
        error: existing.error || `Integration with ID '${integrationId}' not found`,
        simulated: true,
      });
      return;
    }

    const effectiveLatency = typeof latencyMs === 'number' && latencyMs >= 0 ? latencyMs : 800;

    setTimeout(() => {
      try {
        const simulatedStatus = deterministicConnectionStatus(integrationId);
        const simulatedHealthScore = deterministicHealthScore(integrationId, simulatedStatus);
        const now = new Date().toISOString();

        const updateData = {
          status: simulatedStatus,
          healthScore: simulatedHealthScore,
          errorMessage: simulatedStatus === 'error'
            ? 'Simulated connection test failed: endpoint unreachable. This is a simulated error.'
            : null,
        };

        const updateResult = updateIntegration(integrationId, updateData);

        if (!updateResult.success) {
          resolve({
            success: false,
            data: null,
            error: updateResult.error || 'Failed to update integration after test',
            simulated: true,
          });
          return;
        }

        // Log audit action
        const actor = getAuditActor();
        try {
          logAction({
            action: 'execute',
            userId: actor.id,
            userName: actor.name,
            entityType: 'INTEGRATION',
            entityId: integrationId,
            entityName: updateResult.data ? updateResult.data.name : integrationId,
            status: 'success',
            previousValues: {
              status: existing.data.status,
              healthScore: existing.data.healthScore,
            },
            newValues: {
              status: simulatedStatus,
              healthScore: simulatedHealthScore,
              testedAt: now,
            },
            details: `Simulated connection test for integration '${integrationId}'. Result: ${simulatedStatus}. Health score: ${simulatedHealthScore}.`,
          });
        } catch {
          // Audit log failure should not block the operation
        }

        resolve({
          success: true,
          data: {
            ...updateResult.data,
            lastTestedAt: now,
            testResult: simulatedStatus,
            simulated: true,
          },
          error: null,
          simulated: true,
        });
      } catch (err) {
        resolve({
          success: false,
          data: null,
          error: err && err.message ? err.message : 'Failed to simulate connection test',
          simulated: true,
        });
      }
    }, effectiveLatency);
  });
};

/**
 * Simulates a sync operation for an integration.
 * Uses setTimeout to simulate network latency, then deterministically updates
 * the integration's lastSyncAt, errorCount, status, and health score.
 * Logs the action to the audit log. No real network calls are made.
 *
 * @param {string} integrationId - The integration ID to sync.
 * @param {number} [latencyMs=1200] - Simulated latency in milliseconds.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null, simulated: boolean }>}
 */
export const syncNow = (integrationId, latencyMs = 1200) => {
  return new Promise((resolve) => {
    if (typeof integrationId !== 'string' || integrationId.trim() === '') {
      resolve({
        success: false,
        data: null,
        error: 'Integration ID must be a non-empty string',
        simulated: true,
      });
      return;
    }

    const existing = getIntegration(integrationId);
    if (!existing.success || !existing.data) {
      resolve({
        success: false,
        data: null,
        error: existing.error || `Integration with ID '${integrationId}' not found`,
        simulated: true,
      });
      return;
    }

    const effectiveLatency = typeof latencyMs === 'number' && latencyMs >= 0 ? latencyMs : 1200;

    setTimeout(() => {
      try {
        const simulatedStatus = deterministicConnectionStatus(integrationId);
        const simulatedHealthScore = deterministicHealthScore(integrationId, simulatedStatus);
        const simulatedErrorCount = deterministicErrorCount(integrationId, simulatedStatus);
        const now = new Date().toISOString();

        const updateData = {
          status: simulatedStatus,
          healthScore: simulatedHealthScore,
          lastSyncAt: simulatedStatus === 'active' ? now : existing.data.lastSyncAt,
          errorMessage: simulatedStatus === 'error'
            ? 'Simulated sync failed: data source returned timeout. This is a simulated error.'
            : null,
        };

        const updateResult = updateIntegration(integrationId, updateData);

        if (!updateResult.success) {
          resolve({
            success: false,
            data: null,
            error: updateResult.error || 'Failed to update integration after sync',
            simulated: true,
          });
          return;
        }

        // Log audit action
        const actor = getAuditActor();
        try {
          logAction({
            action: 'execute',
            userId: actor.id,
            userName: actor.name,
            entityType: 'INTEGRATION',
            entityId: integrationId,
            entityName: updateResult.data ? updateResult.data.name : integrationId,
            status: simulatedStatus === 'error' ? 'failure' : 'success',
            previousValues: {
              status: existing.data.status,
              healthScore: existing.data.healthScore,
              lastSyncAt: existing.data.lastSyncAt,
            },
            newValues: {
              status: simulatedStatus,
              healthScore: simulatedHealthScore,
              lastSyncAt: updateData.lastSyncAt,
              errorCount: simulatedErrorCount,
              syncedAt: now,
            },
            details: `Simulated sync for integration '${integrationId}'. Result: ${simulatedStatus}. Error count: ${simulatedErrorCount}. Health score: ${simulatedHealthScore}.`,
          });
        } catch {
          // Audit log failure should not block the operation
        }

        resolve({
          success: true,
          data: {
            ...updateResult.data,
            syncResult: simulatedStatus,
            errorCount: simulatedErrorCount,
            syncedAt: now,
            simulated: true,
          },
          error: null,
          simulated: true,
        });
      } catch (err) {
        resolve({
          success: false,
          data: null,
          error: err && err.message ? err.message : 'Failed to simulate sync',
          simulated: true,
        });
      }
    }, effectiveLatency);
  });
};

/**
 * Returns the total count of integrations, optionally filtered by status.
 *
 * @param {string} [status] - Optional status to filter by.
 * @returns {number}
 */
export const getCount = (status) => {
  return getIntegrationCount(status);
};

/**
 * Returns all distinct integration types present in the data.
 *
 * @returns {string[]}
 */
export const getAvailableTypes = () => {
  return getDistinctTypes();
};

/**
 * Returns all distinct integration statuses present in the data.
 *
 * @returns {string[]}
 */
export const getAvailableStatuses = () => {
  return getDistinctStatuses();
};

/**
 * Returns integrations filtered by status.
 *
 * @param {string} status - The status to filter by.
 * @returns {Array<Object>}
 */
export const getByStatus = (status) => {
  return getIntegrationsByStatus(status);
};

/**
 * Returns integrations filtered by type.
 *
 * @param {string} type - The integration type to filter by.
 * @returns {Array<Object>}
 */
export const getByType = (type) => {
  return getIntegrationsByType(type);
};

/**
 * Returns a summary of integration health across all integrations.
 *
 * @returns {{ total: number, active: number, inactive: number, error: number, configuring: number, deprecated: number, averageHealthScore: number }}
 */
export const getSummary = () => {
  return getIntegrationSummary();
};

/**
 * Simulates testing connections for multiple integrations.
 * Tests each integration sequentially with simulated latency.
 *
 * @param {string[]} integrationIds - Array of integration IDs to test.
 * @param {number} [latencyMs=500] - Simulated latency per integration in milliseconds.
 * @returns {Promise<{ results: Array<{ integrationId: string, success: boolean, status: string|null, error: string|null }>, totalTested: number, totalSuccess: number, totalFailed: number, simulated: boolean }>}
 */
export const bulkTestConnections = async (integrationIds, latencyMs = 500) => {
  const result = {
    results: [],
    totalTested: 0,
    totalSuccess: 0,
    totalFailed: 0,
    simulated: true,
  };

  if (!Array.isArray(integrationIds)) {
    return result;
  }

  for (const id of integrationIds) {
    const testResult = await testConnection(id, latencyMs);
    result.totalTested += 1;

    if (testResult.success) {
      result.totalSuccess += 1;
      result.results.push({
        integrationId: id,
        success: true,
        status: testResult.data ? testResult.data.testResult : null,
        error: null,
      });
    } else {
      result.totalFailed += 1;
      result.results.push({
        integrationId: id,
        success: false,
        status: null,
        error: testResult.error,
      });
    }
  }

  return result;
};

/**
 * Simulates syncing multiple integrations.
 * Syncs each integration sequentially with simulated latency.
 *
 * @param {string[]} integrationIds - Array of integration IDs to sync.
 * @param {number} [latencyMs=800] - Simulated latency per integration in milliseconds.
 * @returns {Promise<{ results: Array<{ integrationId: string, success: boolean, status: string|null, error: string|null }>, totalSynced: number, totalSuccess: number, totalFailed: number, simulated: boolean }>}
 */
export const bulkSync = async (integrationIds, latencyMs = 800) => {
  const result = {
    results: [],
    totalSynced: 0,
    totalSuccess: 0,
    totalFailed: 0,
    simulated: true,
  };

  if (!Array.isArray(integrationIds)) {
    return result;
  }

  for (const id of integrationIds) {
    const syncResult = await syncNow(id, latencyMs);
    result.totalSynced += 1;

    if (syncResult.success) {
      result.totalSuccess += 1;
      result.results.push({
        integrationId: id,
        success: true,
        status: syncResult.data ? syncResult.data.syncResult : null,
        error: null,
      });
    } else {
      result.totalFailed += 1;
      result.results.push({
        integrationId: id,
        success: false,
        status: null,
        error: syncResult.error,
      });
    }
  }

  return result;
};