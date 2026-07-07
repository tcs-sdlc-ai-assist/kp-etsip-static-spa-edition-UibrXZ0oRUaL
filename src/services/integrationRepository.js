import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';

/**
 * @typedef {Object} Integration
 * @property {string} id - Unique integration ID (INT- prefix).
 * @property {string} name - Integration name.
 * @property {string} description - Integration description.
 * @property {string} type - Integration type (one of 22 types).
 * @property {string} status - Connection status: 'active', 'inactive', 'error', 'configuring', 'deprecated'.
 * @property {string} direction - Data flow direction: 'inbound', 'outbound', 'bidirectional'.
 * @property {string|null} endpoint - Integration endpoint URL.
 * @property {string} authType - Authentication type.
 * @property {string|null} lastSyncAt - Last synchronization timestamp (ISO 8601).
 * @property {string|null} syncFrequency - Sync frequency description.
 * @property {string|null} errorMessage - Last error message.
 * @property {Object} config - Integration configuration.
 * @property {number|null} healthScore - Integration health score (0-100).
 * @property {string} createdAt - ISO 8601 creation timestamp.
 * @property {string} updatedAt - ISO 8601 last update timestamp.
 * @property {string} createdBy - User who created the record.
 * @property {string} updatedBy - User who last updated the record.
 * @property {number} version - Record version for optimistic locking.
 */

/**
 * @typedef {Object} IntegrationFilters
 * @property {string} [type] - Filter by integration type.
 * @property {string} [status] - Filter by connection status.
 * @property {string} [direction] - Filter by data flow direction.
 * @property {string} [search] - Free-text search across name, description, type.
 * @property {string} [sortField] - Field to sort by (default: 'name').
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc' (default: 'asc').
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of entries per page (default: 20).
 */

/**
 * @typedef {Object} PaginatedIntegrationResult
 * @property {Integration[]} data - The integrations for the current page.
 * @property {number} total - Total number of matching integrations.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of entries per page.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Retrieves all integration records from localStorage.
 * @returns {Integration[]}
 */
const getAllRecords = () => {
  const data = getItem(STORAGE_KEYS.INTEGRATIONS);
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

/**
 * Persists the full integrations array to localStorage.
 * @param {Integration[]} records - The records to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllRecords = (records) => {
  return setItem(STORAGE_KEYS.INTEGRATIONS, records);
};

/**
 * Lists integration records with support for filtering, sorting, and pagination.
 *
 * @param {IntegrationFilters} [filters={}] - Optional filters, sorting, and pagination options.
 * @returns {PaginatedIntegrationResult}
 */
export const listIntegrations = (filters = {}) => {
  try {
    let records = getAllRecords();

    const {
      type,
      status,
      direction,
      search,
      sortField = 'name',
      sortDirection = 'asc',
      page = 1,
      pageSize = 20,
    } = filters;

    // Apply type filter
    if (typeof type === 'string' && type.trim() !== '') {
      const typeLower = type.trim().toLowerCase();
      records = records.filter(
        (r) => r.type && r.type.toLowerCase() === typeLower
      );
    }

    // Apply status filter
    if (typeof status === 'string' && status.trim() !== '') {
      const statusLower = status.trim().toLowerCase();
      records = records.filter(
        (r) => r.status && r.status.toLowerCase() === statusLower
      );
    }

    // Apply direction filter
    if (typeof direction === 'string' && direction.trim() !== '') {
      const directionLower = direction.trim().toLowerCase();
      records = records.filter(
        (r) => r.direction && r.direction.toLowerCase() === directionLower
      );
    }

    // Apply free-text search
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      records = records.filter((r) => {
        const searchableFields = [r.name, r.description, r.type, r.status];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    const validSortFields = [
      'name',
      'type',
      'status',
      'direction',
      'lastSyncAt',
      'healthScore',
      'createdAt',
      'updatedAt',
    ];
    const effectiveSortField = validSortFields.includes(sortField)
      ? sortField
      : 'name';
    const effectiveSortDirection =
      sortDirection === 'desc' ? 'desc' : 'asc';

    records.sort((a, b) => {
      if (!a || !b) {
        return 0;
      }

      const valA = a[effectiveSortField];
      const valB = b[effectiveSortField];

      if (valA === null || valA === undefined) {
        return effectiveSortDirection === 'asc' ? 1 : -1;
      }
      if (valB === null || valB === undefined) {
        return effectiveSortDirection === 'asc' ? -1 : 1;
      }

      let comparison = 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
      } else {
        const strA = String(valA);
        const strB = String(valB);
        comparison = strA.localeCompare(strB);
      }

      return effectiveSortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = records.length;
    const effectivePage = Math.max(1, Math.floor(page) || 1);
    const effectivePageSize = Math.max(1, Math.floor(pageSize) || 20);
    const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
    const startIndex = (effectivePage - 1) * effectivePageSize;
    const paginatedData = records.slice(
      startIndex,
      startIndex + effectivePageSize
    );

    return {
      data: paginatedData.map((r) => ({ ...r })),
      total,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages,
    };
  } catch {
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
};

/**
 * Retrieves a single integration record by its ID.
 *
 * @param {string} id - The integration ID.
 * @returns {{ success: boolean, data: Integration|null, error: string|null }}
 */
export const getIntegration = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const record = records.find((r) => r && r.id === id);

    if (!record) {
      return { success: false, data: null, error: `Integration with ID '${id}' not found` };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to retrieve integration',
    };
  }
};

/**
 * Updates an existing integration record by ID.
 * Merges the provided data with the existing record and persists the changes.
 *
 * @param {string} id - The integration ID to update.
 * @param {Object} data - The fields to update.
 * @returns {{ success: boolean, data: Integration|null, error: string|null }}
 */
export const updateIntegration = (id, data) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `Integration with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];
    const now = new Date().toISOString();

    const updatedRecord = {
      ...existingRecord,
      ...data,
      id: existingRecord.id,
      createdAt: existingRecord.createdAt,
      createdBy: existingRecord.createdBy,
      updatedAt: now,
      version: (existingRecord.version || 0) + 1,
    };

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    return { success: true, data: { ...updatedRecord }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to update integration',
    };
  }
};

/**
 * Creates a new integration record.
 * Generates an ID, sets timestamps, and persists the record.
 *
 * @param {Object} data - The integration data (without id, createdAt, updatedAt).
 * @returns {{ success: boolean, data: Integration|null, error: string|null }}
 */
export const createIntegration = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  if (typeof data.name !== 'string' || data.name.trim() === '') {
    return { success: false, data: null, error: 'Integration name is required' };
  }

  if (typeof data.type !== 'string' || data.type.trim() === '') {
    return { success: false, data: null, error: 'Integration type is required' };
  }

  try {
    const records = getAllRecords();
    const now = new Date().toISOString();

    // Check for duplicate name
    const duplicateName = records.find(
      (r) =>
        r &&
        r.name &&
        r.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    if (duplicateName) {
      return {
        success: false,
        data: null,
        error: `Integration with name '${data.name}' already exists`,
      };
    }

    const record = {
      id: generateId(ID_PREFIXES.INTEGRATION),
      name: data.name.trim(),
      description: data.description || '',
      type: data.type.trim(),
      status: data.status || 'configuring',
      direction: data.direction || 'bidirectional',
      endpoint: data.endpoint || null,
      authType: data.authType || 'none',
      lastSyncAt: data.lastSyncAt || null,
      syncFrequency: data.syncFrequency || null,
      errorMessage: data.errorMessage || null,
      config: data.config || {},
      healthScore: typeof data.healthScore === 'number' ? data.healthScore : null,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || 'system',
      updatedBy: data.updatedBy || 'system',
      version: 1,
    };

    records.push(record);

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to create integration',
    };
  }
};

/**
 * Deletes an integration record by ID.
 *
 * @param {string} id - The integration ID to delete.
 * @returns {{ success: boolean, error: string|null }}
 */
export const deleteIntegration = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, error: `Integration with ID '${id}' not found` };
    }

    const updatedRecords = records.filter((r) => r && r.id !== id);

    const writeResult = saveAllRecords(updatedRecords);
    if (!writeResult.success) {
      return { success: false, error: writeResult.error };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : 'Failed to delete integration',
    };
  }
};

/**
 * Returns the total count of integration records, optionally filtered by status.
 *
 * @param {string} [status] - Optional status to filter by.
 * @returns {number}
 */
export const getIntegrationCount = (status) => {
  const records = getAllRecords();
  if (typeof status === 'string' && status.trim() !== '') {
    const statusLower = status.trim().toLowerCase();
    return records.filter(
      (r) => r.status && r.status.toLowerCase() === statusLower
    ).length;
  }
  return records.length;
};

/**
 * Returns all distinct integration types present in the data.
 *
 * @returns {string[]}
 */
export const getDistinctTypes = () => {
  const records = getAllRecords();
  const types = new Set();
  records.forEach((r) => {
    if (r.type) {
      types.add(r.type);
    }
  });
  return Array.from(types).sort();
};

/**
 * Returns all distinct integration statuses present in the data.
 *
 * @returns {string[]}
 */
export const getDistinctStatuses = () => {
  const records = getAllRecords();
  const statuses = new Set();
  records.forEach((r) => {
    if (r.status) {
      statuses.add(r.status);
    }
  });
  return Array.from(statuses).sort();
};

/**
 * Returns integrations filtered by status.
 *
 * @param {string} status - The status to filter by.
 * @returns {Integration[]}
 */
export const getIntegrationsByStatus = (status) => {
  if (typeof status !== 'string' || status.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const statusLower = status.trim().toLowerCase();
  return records
    .filter((r) => r.status && r.status.toLowerCase() === statusLower)
    .map((r) => ({ ...r }));
};

/**
 * Returns integrations filtered by type.
 *
 * @param {string} type - The integration type to filter by.
 * @returns {Integration[]}
 */
export const getIntegrationsByType = (type) => {
  if (typeof type !== 'string' || type.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const typeLower = type.trim().toLowerCase();
  return records
    .filter((r) => r.type && r.type.toLowerCase() === typeLower)
    .map((r) => ({ ...r }));
};

/**
 * Returns all integration records without pagination.
 *
 * @returns {Integration[]}
 */
export const getAllIntegrations = () => {
  return getAllRecords().map((r) => ({ ...r }));
};

/**
 * Returns a summary of integration health across all integrations.
 *
 * @returns {{ total: number, active: number, inactive: number, error: number, configuring: number, deprecated: number, averageHealthScore: number }}
 */
export const getIntegrationSummary = () => {
  const records = getAllRecords();
  const summary = {
    total: records.length,
    active: 0,
    inactive: 0,
    error: 0,
    configuring: 0,
    deprecated: 0,
    averageHealthScore: 0,
  };

  let healthScoreSum = 0;
  let healthScoreCount = 0;

  records.forEach((r) => {
    if (!r) {
      return;
    }

    switch (r.status) {
      case 'active':
        summary.active += 1;
        break;
      case 'inactive':
        summary.inactive += 1;
        break;
      case 'error':
        summary.error += 1;
        break;
      case 'configuring':
        summary.configuring += 1;
        break;
      case 'deprecated':
        summary.deprecated += 1;
        break;
      default:
        break;
    }

    if (typeof r.healthScore === 'number' && !Number.isNaN(r.healthScore)) {
      healthScoreSum += r.healthScore;
      healthScoreCount += 1;
    }
  });

  if (healthScoreCount > 0) {
    summary.averageHealthScore = Math.round((healthScoreSum / healthScoreCount) * 100) / 100;
  }

  return summary;
};