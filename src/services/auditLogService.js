import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Unique audit log entry ID (AUD- prefix).
 * @property {string} action - The action performed (e.g., 'create', 'update', 'delete', 'login', 'persona_switch').
 * @property {string} entityType - The type of entity affected.
 * @property {string} [entityId] - The ID of the entity affected.
 * @property {string} [entityName] - The name/title of the entity affected.
 * @property {string} userId - The ID of the user/persona who performed the action.
 * @property {string} userName - The display name of the user/persona at time of action.
 * @property {string} status - Result status: 'success', 'failure', or 'partial'.
 * @property {string} timestamp - ISO 8601 timestamp of when the action occurred.
 * @property {string} createdAt - ISO 8601 creation timestamp.
 * @property {string} updatedAt - ISO 8601 last update timestamp.
 * @property {Object} [previousValues] - Previous field values (for updates).
 * @property {Object} [newValues] - New field values (for creates/updates).
 * @property {string} [details] - Additional details about the action.
 * @property {string} [ipAddress] - IP address of the user.
 * @property {string} [userAgent] - User agent string.
 */

/**
 * @typedef {Object} AuditLogFilters
 * @property {string} [action] - Filter by action type.
 * @property {string} [entityType] - Filter by entity type.
 * @property {string} [entityId] - Filter by entity ID.
 * @property {string} [userId] - Filter by user/persona ID.
 * @property {string} [userName] - Filter by user name (partial match, case-insensitive).
 * @property {string} [status] - Filter by status.
 * @property {string} [startDate] - Filter entries on or after this ISO date string.
 * @property {string} [endDate] - Filter entries on or before this ISO date string.
 * @property {string} [search] - Free-text search across action, entityType, entityName, userName, details.
 * @property {string} [sortField] - Field to sort by (default: 'timestamp').
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc' (default: 'desc').
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of entries per page (default: 20).
 */

/**
 * @typedef {Object} PaginatedAuditLogResult
 * @property {AuditLogEntry[]} data - The audit log entries for the current page.
 * @property {number} total - Total number of matching entries.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of entries per page.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Retrieves all audit log entries from localStorage.
 * @returns {AuditLogEntry[]}
 */
const getAllEntries = () => {
  const entries = getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries;
};

/**
 * Persists the full audit log entries array to localStorage.
 * @param {AuditLogEntry[]} entries - The entries to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllEntries = (entries) => {
  return setItem(STORAGE_KEYS.AUDIT_LOGS, entries);
};

/**
 * Creates a structured audit log entry and persists it to localStorage.
 *
 * @param {Object} params - The audit log parameters.
 * @param {string} params.action - The action performed (e.g., 'create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export', 'import', 'execute', 'configure', 'persona_switch').
 * @param {string} params.userId - The ID of the actor (user or persona).
 * @param {string} params.userName - The display name of the actor.
 * @param {string} params.entityType - The type of entity affected.
 * @param {string} [params.entityId] - The ID of the entity affected.
 * @param {string} [params.entityName] - The name/title of the entity affected.
 * @param {string} [params.status='success'] - Result status: 'success', 'failure', or 'partial'.
 * @param {Object} [params.previousValues] - Previous field values (for updates).
 * @param {Object} [params.newValues] - New field values (for creates/updates).
 * @param {string} [params.details] - Additional details about the action.
 * @param {string} [params.ipAddress] - IP address of the user.
 * @param {string} [params.userAgent] - User agent string.
 * @returns {{ success: boolean, entry: AuditLogEntry|null, error: string|null }}
 */
export const logAction = (params) => {
  try {
    if (!params || typeof params !== 'object') {
      return { success: false, entry: null, error: 'Params must be a non-null object' };
    }

    const {
      action,
      userId,
      userName,
      entityType,
      entityId = null,
      entityName = null,
      status = 'success',
      previousValues = null,
      newValues = null,
      details = null,
      ipAddress = null,
      userAgent = null,
    } = params;

    if (typeof action !== 'string' || action.trim() === '') {
      return { success: false, entry: null, error: 'Action must be a non-empty string' };
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      return { success: false, entry: null, error: 'userId must be a non-empty string' };
    }

    if (typeof userName !== 'string' || userName.trim() === '') {
      return { success: false, entry: null, error: 'userName must be a non-empty string' };
    }

    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, entry: null, error: 'entityType must be a non-empty string' };
    }

    const now = new Date().toISOString();
    const id = generateId(ID_PREFIXES.AUDIT_LOG);

    /** @type {AuditLogEntry} */
    const entry = {
      id,
      action: action.trim(),
      entityType: entityType.trim(),
      entityId: entityId || null,
      entityName: entityName || null,
      userId: userId.trim(),
      userName: userName.trim(),
      status: status || 'success',
      timestamp: now,
      createdAt: now,
      updatedAt: now,
      previousValues: previousValues || null,
      newValues: newValues || null,
      details: details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      version: 1,
      createdBy: userId.trim(),
      updatedBy: userId.trim(),
    };

    const entries = getAllEntries();
    entries.push(entry);

    const writeResult = saveAllEntries(entries);
    if (!writeResult.success) {
      return { success: false, entry: null, error: writeResult.error };
    }

    return { success: true, entry, error: null };
  } catch (err) {
    return {
      success: false,
      entry: null,
      error: err && err.message ? err.message : 'Failed to log audit action',
    };
  }
};

/**
 * Retrieves and filters audit log entries with support for pagination and sorting.
 *
 * @param {AuditLogFilters} [filters={}] - Optional filters, sorting, and pagination options.
 * @returns {PaginatedAuditLogResult}
 */
export const listEntries = (filters = {}) => {
  try {
    let entries = getAllEntries();

    const {
      action,
      entityType,
      entityId,
      userId,
      userName,
      status,
      startDate,
      endDate,
      search,
      sortField = 'timestamp',
      sortDirection = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    // Apply filters
    if (typeof action === 'string' && action.trim() !== '') {
      const actionLower = action.trim().toLowerCase();
      entries = entries.filter(
        (e) => e.action && e.action.toLowerCase() === actionLower
      );
    }

    if (typeof entityType === 'string' && entityType.trim() !== '') {
      const entityTypeLower = entityType.trim().toLowerCase();
      entries = entries.filter(
        (e) => e.entityType && e.entityType.toLowerCase() === entityTypeLower
      );
    }

    if (typeof entityId === 'string' && entityId.trim() !== '') {
      entries = entries.filter((e) => e.entityId === entityId.trim());
    }

    if (typeof userId === 'string' && userId.trim() !== '') {
      entries = entries.filter((e) => e.userId === userId.trim());
    }

    if (typeof userName === 'string' && userName.trim() !== '') {
      const userNameLower = userName.trim().toLowerCase();
      entries = entries.filter(
        (e) =>
          e.userName &&
          e.userName.toLowerCase().includes(userNameLower)
      );
    }

    if (typeof status === 'string' && status.trim() !== '') {
      const statusLower = status.trim().toLowerCase();
      entries = entries.filter(
        (e) => e.status && e.status.toLowerCase() === statusLower
      );
    }

    if (typeof startDate === 'string' && startDate.trim() !== '') {
      const startMs = Date.parse(startDate);
      if (!Number.isNaN(startMs)) {
        entries = entries.filter((e) => {
          const entryMs = Date.parse(e.timestamp);
          return !Number.isNaN(entryMs) && entryMs >= startMs;
        });
      }
    }

    if (typeof endDate === 'string' && endDate.trim() !== '') {
      const endMs = Date.parse(endDate);
      if (!Number.isNaN(endMs)) {
        entries = entries.filter((e) => {
          const entryMs = Date.parse(e.timestamp);
          return !Number.isNaN(entryMs) && entryMs <= endMs;
        });
      }
    }

    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      entries = entries.filter((e) => {
        const searchableFields = [
          e.action,
          e.entityType,
          e.entityId,
          e.entityName,
          e.userName,
          e.details,
        ];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    const validSortFields = [
      'timestamp',
      'action',
      'entityType',
      'entityId',
      'entityName',
      'userName',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const effectiveSortField = validSortFields.includes(sortField)
      ? sortField
      : 'timestamp';
    const effectiveSortDirection =
      sortDirection === 'asc' ? 'asc' : 'desc';

    entries.sort((a, b) => {
      const valA = a[effectiveSortField] || '';
      const valB = b[effectiveSortField] || '';

      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (valA < valB) {
        comparison = -1;
      } else if (valA > valB) {
        comparison = 1;
      }

      return effectiveSortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = entries.length;
    const effectivePage = Math.max(1, Math.floor(page) || 1);
    const effectivePageSize = Math.max(1, Math.floor(pageSize) || 20);
    const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
    const startIndex = (effectivePage - 1) * effectivePageSize;
    const paginatedData = entries.slice(
      startIndex,
      startIndex + effectivePageSize
    );

    return {
      data: paginatedData,
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
 * Retrieves a single audit log entry by its ID.
 *
 * @param {string} id - The audit log entry ID.
 * @returns {AuditLogEntry|null} The entry if found, or null.
 */
export const getEntryById = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return null;
  }
  const entries = getAllEntries();
  return entries.find((e) => e.id === id) || null;
};

/**
 * Returns the total count of audit log entries, optionally filtered by action.
 *
 * @param {string} [action] - Optional action to filter by.
 * @returns {number}
 */
export const getEntryCount = (action) => {
  const entries = getAllEntries();
  if (typeof action === 'string' && action.trim() !== '') {
    const actionLower = action.trim().toLowerCase();
    return entries.filter(
      (e) => e.action && e.action.toLowerCase() === actionLower
    ).length;
  }
  return entries.length;
};

/**
 * Returns all distinct action types present in the audit log.
 *
 * @returns {string[]}
 */
export const getDistinctActions = () => {
  const entries = getAllEntries();
  const actions = new Set();
  entries.forEach((e) => {
    if (e.action) {
      actions.add(e.action);
    }
  });
  return Array.from(actions).sort();
};

/**
 * Returns all distinct entity types present in the audit log.
 *
 * @returns {string[]}
 */
export const getDistinctEntityTypes = () => {
  const entries = getAllEntries();
  const types = new Set();
  entries.forEach((e) => {
    if (e.entityType) {
      types.add(e.entityType);
    }
  });
  return Array.from(types).sort();
};

/**
 * Returns all audit log entries for a specific entity.
 *
 * @param {string} entityType - The entity type.
 * @param {string} entityId - The entity ID.
 * @returns {AuditLogEntry[]}
 */
export const getEntriesForEntity = (entityType, entityId) => {
  if (
    typeof entityType !== 'string' ||
    entityType.trim() === '' ||
    typeof entityId !== 'string' ||
    entityId.trim() === ''
  ) {
    return [];
  }

  const entries = getAllEntries();
  return entries
    .filter(
      (e) =>
        e.entityType === entityType.trim() &&
        e.entityId === entityId.trim()
    )
    .sort((a, b) => {
      const tsA = a.timestamp || '';
      const tsB = b.timestamp || '';
      return tsB.localeCompare(tsA);
    });
};

/**
 * Returns all audit log entries for a specific user/persona.
 *
 * @param {string} userId - The user/persona ID.
 * @returns {AuditLogEntry[]}
 */
export const getEntriesForUser = (userId) => {
  if (typeof userId !== 'string' || userId.trim() === '') {
    return [];
  }

  const entries = getAllEntries();
  return entries
    .filter((e) => e.userId === userId.trim())
    .sort((a, b) => {
      const tsA = a.timestamp || '';
      const tsB = b.timestamp || '';
      return tsB.localeCompare(tsA);
    });
};

/**
 * Clears all audit log entries from localStorage.
 * Use with caution — typically only for admin reset or testing.
 *
 * @returns {{ success: boolean, error: string|null }}
 */
export const clearAuditLog = () => {
  return saveAllEntries([]);
};