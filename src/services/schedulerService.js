import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';
import { simulateNotification } from './notificationService';
import { NOTIFICATION_TRIGGERS } from '../constants/constants';

/**
 * @typedef {Object} Schedule
 * @property {string} id - Unique schedule ID (SCH- prefix).
 * @property {string} name - Schedule name.
 * @property {string} description - Schedule description.
 * @property {string} type - Schedule type: 'review', 'assessment', 'sync', 'report', 'maintenance', 'audit'.
 * @property {string} frequency - Schedule frequency: 'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'.
 * @property {string} status - Schedule status: 'active', 'paused', 'completed', 'cancelled'.
 * @property {string} startDate - Schedule start date (YYYY-MM-DD).
 * @property {string|null} endDate - Schedule end date (YYYY-MM-DD).
 * @property {string|null} nextRunDate - Next scheduled run (ISO 8601).
 * @property {string|null} lastRunDate - Last run timestamp (ISO 8601).
 * @property {string|null} assigneeId - Assigned user ID.
 * @property {string|null} applicationId - Related application ID.
 * @property {Object} config - Schedule configuration.
 * @property {string} createdAt - ISO 8601 creation timestamp.
 * @property {string} updatedAt - ISO 8601 last update timestamp.
 * @property {string} createdBy - User who created the record.
 * @property {string} updatedBy - User who last updated the record.
 * @property {number} version - Record version for optimistic locking.
 */

/**
 * @typedef {Object} ScheduleFilters
 * @property {string} [type] - Filter by schedule type.
 * @property {string} [status] - Filter by schedule status.
 * @property {string} [frequency] - Filter by schedule frequency.
 * @property {string} [assigneeId] - Filter by assigned user ID.
 * @property {string} [applicationId] - Filter by related application ID.
 * @property {string} [search] - Free-text search across name, description, type.
 * @property {string} [sortField] - Field to sort by (default: 'nextRunDate').
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc' (default: 'asc').
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of entries per page (default: 20).
 */

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
 * Retrieves all schedule records from localStorage.
 * @returns {Schedule[]}
 */
const getAllRecords = () => {
  const data = getItem(STORAGE_KEYS.SCHEDULES);
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

/**
 * Persists the full schedules array to localStorage.
 * @param {Schedule[]} records - The records to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllRecords = (records) => {
  return setItem(STORAGE_KEYS.SCHEDULES, records);
};

/**
 * Computes the next run date from a given last run date (or start date) and frequency.
 * Returns an ISO 8601 datetime string.
 *
 * @param {string} fromDate - The reference date (ISO 8601 or YYYY-MM-DD).
 * @param {string} frequency - The schedule frequency.
 * @returns {string|null} The computed next run date as ISO 8601 string, or null if invalid.
 */
const computeNextRun = (fromDate, frequency) => {
  if (typeof fromDate !== 'string' || fromDate.trim() === '') {
    return null;
  }

  if (typeof frequency !== 'string' || frequency.trim() === '') {
    return null;
  }

  try {
    const d = new Date(fromDate);
    if (Number.isNaN(d.getTime())) {
      return null;
    }

    switch (frequency.toLowerCase()) {
      case 'once':
        return null;
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'biweekly':
        d.setDate(d.getDate() + 14);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'quarterly':
        d.setMonth(d.getMonth() + 3);
        break;
      case 'annually':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        return null;
    }

    return d.toISOString();
  } catch {
    return null;
  }
};

/**
 * Lists schedule records with support for filtering, sorting, and pagination.
 *
 * @param {ScheduleFilters} [filters={}] - Optional filters, sorting, and pagination options.
 * @returns {{ data: Schedule[], total: number, page: number, pageSize: number, totalPages: number }}
 */
export const listSchedules = (filters = {}) => {
  try {
    let records = getAllRecords();

    const {
      type,
      status,
      frequency,
      assigneeId,
      applicationId,
      search,
      sortField = 'nextRunDate',
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

    // Apply frequency filter
    if (typeof frequency === 'string' && frequency.trim() !== '') {
      const frequencyLower = frequency.trim().toLowerCase();
      records = records.filter(
        (r) => r.frequency && r.frequency.toLowerCase() === frequencyLower
      );
    }

    // Apply assigneeId filter
    if (typeof assigneeId === 'string' && assigneeId.trim() !== '') {
      const assigneeIdTrimmed = assigneeId.trim();
      records = records.filter(
        (r) => r.assigneeId === assigneeIdTrimmed
      );
    }

    // Apply applicationId filter
    if (typeof applicationId === 'string' && applicationId.trim() !== '') {
      const applicationIdTrimmed = applicationId.trim();
      records = records.filter(
        (r) => r.applicationId === applicationIdTrimmed
      );
    }

    // Apply free-text search
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      records = records.filter((r) => {
        const searchableFields = [r.name, r.description, r.type, r.frequency, r.status];
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
      'frequency',
      'status',
      'startDate',
      'endDate',
      'nextRunDate',
      'lastRunDate',
      'createdAt',
      'updatedAt',
    ];
    const effectiveSortField = validSortFields.includes(sortField)
      ? sortField
      : 'nextRunDate';
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
 * Retrieves a single schedule record by its ID.
 *
 * @param {string} id - The schedule ID.
 * @returns {{ success: boolean, data: Schedule|null, error: string|null }}
 */
export const getSchedule = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const record = records.find((r) => r && r.id === id);

    if (!record) {
      return { success: false, data: null, error: `Schedule with ID '${id}' not found` };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to retrieve schedule',
    };
  }
};

/**
 * Creates a new schedule record.
 * Generates an ID, sets timestamps, computes nextRunDate, persists the record,
 * and logs the action to the audit log.
 *
 * @param {Object} data - The schedule data (without id, createdAt, updatedAt).
 * @param {string} data.name - Schedule name (required).
 * @param {string} data.type - Schedule type (required).
 * @param {string} data.frequency - Schedule frequency (required).
 * @param {string} data.startDate - Schedule start date (required, YYYY-MM-DD).
 * @param {string} [data.description] - Schedule description.
 * @param {string} [data.status] - Schedule status (default: 'active').
 * @param {string} [data.endDate] - Schedule end date (YYYY-MM-DD).
 * @param {string} [data.assigneeId] - Assigned user ID.
 * @param {string} [data.applicationId] - Related application ID.
 * @param {Object} [data.config] - Schedule configuration.
 * @returns {{ success: boolean, data: Schedule|null, error: string|null }}
 */
export const createSchedule = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  if (typeof data.name !== 'string' || data.name.trim() === '') {
    return { success: false, data: null, error: 'Schedule name is required' };
  }

  if (typeof data.type !== 'string' || data.type.trim() === '') {
    return { success: false, data: null, error: 'Schedule type is required' };
  }

  const validTypes = ['review', 'assessment', 'sync', 'report', 'maintenance', 'audit'];
  if (!validTypes.includes(data.type.trim().toLowerCase())) {
    return { success: false, data: null, error: `Schedule type must be one of: ${validTypes.join(', ')}` };
  }

  if (typeof data.frequency !== 'string' || data.frequency.trim() === '') {
    return { success: false, data: null, error: 'Schedule frequency is required' };
  }

  const validFrequencies = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
  if (!validFrequencies.includes(data.frequency.trim().toLowerCase())) {
    return { success: false, data: null, error: `Schedule frequency must be one of: ${validFrequencies.join(', ')}` };
  }

  if (typeof data.startDate !== 'string' || data.startDate.trim() === '') {
    return { success: false, data: null, error: 'Schedule start date is required' };
  }

  try {
    const records = getAllRecords();
    const now = new Date().toISOString();
    const actor = getAuditActor();

    const nextRunDate = computeNextRun(data.startDate, data.frequency);

    const record = {
      id: data.id || generateId(ID_PREFIXES.SCHEDULE),
      name: data.name.trim(),
      description: data.description || '',
      type: data.type.trim().toLowerCase(),
      frequency: data.frequency.trim().toLowerCase(),
      status: data.status || 'active',
      startDate: data.startDate.trim(),
      endDate: data.endDate || null,
      nextRunDate: nextRunDate || data.nextRunDate || null,
      lastRunDate: data.lastRunDate || null,
      assigneeId: data.assigneeId || null,
      applicationId: data.applicationId || null,
      config: data.config || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      createdBy: data.createdBy || actor.id,
      updatedBy: data.updatedBy || actor.id,
      version: data.version || 1,
    };

    records.push(record);

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    try {
      logAction({
        action: 'create',
        userId: actor.id,
        userName: actor.name,
        entityType: 'SCHEDULE',
        entityId: record.id,
        entityName: record.name,
        status: 'success',
        newValues: record,
        details: `Created schedule '${record.name}' (${record.type}, ${record.frequency})`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to create schedule',
    };
  }
};

/**
 * Updates an existing schedule record by ID.
 * Merges the provided data with the existing record, recomputes nextRunDate if
 * frequency or lastRunDate changed, persists the changes, and logs the action.
 *
 * @param {string} id - The schedule ID to update.
 * @param {Object} data - The fields to update.
 * @returns {{ success: boolean, data: Schedule|null, error: string|null }}
 */
export const editSchedule = (id, data) => {
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
      return { success: false, data: null, error: `Schedule with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];
    const now = new Date().toISOString();
    const actor = getAuditActor();

    // Validate type if provided
    if (data.type !== undefined) {
      const validTypes = ['review', 'assessment', 'sync', 'report', 'maintenance', 'audit'];
      if (typeof data.type !== 'string' || !validTypes.includes(data.type.trim().toLowerCase())) {
        return { success: false, data: null, error: `Schedule type must be one of: ${validTypes.join(', ')}` };
      }
    }

    // Validate frequency if provided
    if (data.frequency !== undefined) {
      const validFrequencies = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
      if (typeof data.frequency !== 'string' || !validFrequencies.includes(data.frequency.trim().toLowerCase())) {
        return { success: false, data: null, error: `Schedule frequency must be one of: ${validFrequencies.join(', ')}` };
      }
    }

    // Validate status if provided
    if (data.status !== undefined) {
      const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
      if (typeof data.status !== 'string' || !validStatuses.includes(data.status.trim().toLowerCase())) {
        return { success: false, data: null, error: `Schedule status must be one of: ${validStatuses.join(', ')}` };
      }
    }

    const updatedRecord = {
      ...existingRecord,
      ...data,
      id: existingRecord.id,
      createdAt: existingRecord.createdAt,
      createdBy: existingRecord.createdBy,
      updatedAt: now,
      updatedBy: actor.id,
      version: (existingRecord.version || 0) + 1,
    };

    // Recompute nextRunDate if frequency or lastRunDate changed
    const frequencyChanged = data.frequency !== undefined && data.frequency !== existingRecord.frequency;
    const lastRunChanged = data.lastRunDate !== undefined && data.lastRunDate !== existingRecord.lastRunDate;
    const startDateChanged = data.startDate !== undefined && data.startDate !== existingRecord.startDate;

    if (frequencyChanged || lastRunChanged || startDateChanged) {
      const referenceDate = updatedRecord.lastRunDate || updatedRecord.startDate;
      const newNextRun = computeNextRun(referenceDate, updatedRecord.frequency);
      updatedRecord.nextRunDate = newNextRun;
    }

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType: 'SCHEDULE',
        entityId: id,
        entityName: updatedRecord.name,
        status: 'success',
        previousValues: existingRecord,
        newValues: data,
        details: `Updated schedule '${updatedRecord.name}' (${updatedRecord.id})`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...updatedRecord }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to update schedule',
    };
  }
};

/**
 * Pauses an active schedule by setting its status to 'paused'.
 * Logs the action to the audit log.
 *
 * @param {string} id - The schedule ID to pause.
 * @returns {{ success: boolean, data: Schedule|null, error: string|null }}
 */
export const pauseSchedule = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `Schedule with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];

    if (existingRecord.status === 'paused') {
      return { success: true, data: { ...existingRecord }, error: null };
    }

    if (existingRecord.status === 'completed' || existingRecord.status === 'cancelled') {
      return {
        success: false,
        data: null,
        error: `Cannot pause a schedule with status '${existingRecord.status}'`,
      };
    }

    const now = new Date().toISOString();
    const actor = getAuditActor();

    const updatedRecord = {
      ...existingRecord,
      status: 'paused',
      updatedAt: now,
      updatedBy: actor.id,
      version: (existingRecord.version || 0) + 1,
    };

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType: 'SCHEDULE',
        entityId: id,
        entityName: updatedRecord.name,
        status: 'success',
        previousValues: { status: existingRecord.status },
        newValues: { status: 'paused' },
        details: `Paused schedule '${updatedRecord.name}' (${updatedRecord.id})`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...updatedRecord }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to pause schedule',
    };
  }
};

/**
 * Resumes a paused schedule by setting its status to 'active' and recomputing nextRunDate.
 * Logs the action to the audit log.
 *
 * @param {string} id - The schedule ID to resume.
 * @returns {{ success: boolean, data: Schedule|null, error: string|null }}
 */
export const resumeSchedule = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `Schedule with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];

    if (existingRecord.status === 'active') {
      return { success: true, data: { ...existingRecord }, error: null };
    }

    if (existingRecord.status !== 'paused') {
      return {
        success: false,
        data: null,
        error: `Cannot resume a schedule with status '${existingRecord.status}'. Only paused schedules can be resumed.`,
      };
    }

    const now = new Date().toISOString();
    const actor = getAuditActor();

    // Recompute nextRunDate from now
    const nextRunDate = computeNextRun(now, existingRecord.frequency);

    const updatedRecord = {
      ...existingRecord,
      status: 'active',
      nextRunDate: nextRunDate || existingRecord.nextRunDate,
      updatedAt: now,
      updatedBy: actor.id,
      version: (existingRecord.version || 0) + 1,
    };

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType: 'SCHEDULE',
        entityId: id,
        entityName: updatedRecord.name,
        status: 'success',
        previousValues: { status: existingRecord.status, nextRunDate: existingRecord.nextRunDate },
        newValues: { status: 'active', nextRunDate: updatedRecord.nextRunDate },
        details: `Resumed schedule '${updatedRecord.name}' (${updatedRecord.id})`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...updatedRecord }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to resume schedule',
    };
  }
};

/**
 * Deletes a schedule record by ID.
 * Logs the action to the audit log.
 *
 * @param {string} id - The schedule ID to delete.
 * @returns {{ success: boolean, error: string|null }}
 */
export const deleteSchedule = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, error: `Schedule with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];
    const updatedRecords = records.filter((r) => r && r.id !== id);

    const writeResult = saveAllRecords(updatedRecords);
    if (!writeResult.success) {
      return { success: false, error: writeResult.error };
    }

    // Audit log
    const actor = getAuditActor();
    try {
      logAction({
        action: 'delete',
        userId: actor.id,
        userName: actor.name,
        entityType: 'SCHEDULE',
        entityId: id,
        entityName: existingRecord.name,
        status: 'success',
        previousValues: existingRecord,
        details: `Deleted schedule '${existingRecord.name}' (${id})`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : 'Failed to delete schedule',
    };
  }
};

/**
 * Simulates an immediate execution of a schedule.
 * Updates lastRunDate to now, recomputes nextRunDate, marks the schedule as 'completed'
 * if frequency is 'once', triggers a simulated notification, and logs the action.
 * No real timers or background processes are used.
 *
 * @param {string} id - The schedule ID to run immediately.
 * @param {number} [latencyMs=600] - Simulated latency in milliseconds.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null, simulated: boolean }>}
 */
export const runNow = (id, latencyMs = 600) => {
  return new Promise((resolve) => {
    if (typeof id !== 'string' || id.trim() === '') {
      resolve({
        success: false,
        data: null,
        error: 'ID must be a non-empty string',
        simulated: true,
      });
      return;
    }

    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      resolve({
        success: false,
        data: null,
        error: `Schedule with ID '${id}' not found`,
        simulated: true,
      });
      return;
    }

    const existingRecord = records[existingIndex];

    if (existingRecord.status === 'cancelled') {
      resolve({
        success: false,
        data: null,
        error: `Cannot run a cancelled schedule`,
        simulated: true,
      });
      return;
    }

    const effectiveLatency = typeof latencyMs === 'number' && latencyMs >= 0 ? latencyMs : 600;

    setTimeout(() => {
      try {
        const now = new Date().toISOString();
        const actor = getAuditActor();

        // Determine if schedule should be marked as completed
        const isOneTime = existingRecord.frequency === 'once';
        const newStatus = isOneTime ? 'completed' : existingRecord.status;

        // Compute next run date
        const nextRunDate = isOneTime ? null : computeNextRun(now, existingRecord.frequency);

        // Deterministic simulated execution result
        const hashVal = id.length * 7 + id.charCodeAt(0);
        const executionDurationMs = (hashVal % 5000) + 1000;
        const testsPassed = (hashVal % 20) + 5;
        const testsFailed = hashVal % 3;
        const testsTotal = testsPassed + testsFailed;
        const executionSuccess = testsFailed === 0;

        const executionResult = {
          scheduleId: id,
          scheduleName: existingRecord.name,
          executedAt: now,
          executedBy: actor.name,
          duration: `${executionDurationMs}ms`,
          result: executionSuccess ? 'passed' : 'failed',
          summary: {
            total: testsTotal,
            passed: testsPassed,
            failed: testsFailed,
            skipped: 0,
          },
          simulated: true,
        };

        // Update the schedule record
        const updatedRecord = {
          ...existingRecord,
          lastRunDate: now,
          nextRunDate: nextRunDate,
          status: newStatus,
          updatedAt: now,
          updatedBy: actor.id,
          version: (existingRecord.version || 0) + 1,
        };

        // Re-read records to avoid stale data
        const currentRecords = getAllRecords();
        const currentIndex = currentRecords.findIndex((r) => r && r.id === id);
        if (currentIndex === -1) {
          resolve({
            success: false,
            data: null,
            error: `Schedule with ID '${id}' not found during execution`,
            simulated: true,
          });
          return;
        }

        currentRecords[currentIndex] = updatedRecord;

        const writeResult = saveAllRecords(currentRecords);
        if (!writeResult.success) {
          resolve({
            success: false,
            data: null,
            error: writeResult.error || 'Failed to update schedule after execution',
            simulated: true,
          });
          return;
        }

        // Audit log
        try {
          logAction({
            action: 'execute',
            userId: actor.id,
            userName: actor.name,
            entityType: 'SCHEDULE',
            entityId: id,
            entityName: existingRecord.name,
            status: executionSuccess ? 'success' : 'partial',
            previousValues: {
              lastRunDate: existingRecord.lastRunDate,
              nextRunDate: existingRecord.nextRunDate,
              status: existingRecord.status,
            },
            newValues: {
              lastRunDate: now,
              nextRunDate: nextRunDate,
              status: newStatus,
              executionResult: executionResult.result,
              testsPassed,
              testsFailed,
              testsTotal,
              simulated: true,
            },
            details: `Executed schedule '${existingRecord.name}' (simulated). Result: ${executionResult.result}. Tests: ${testsPassed}/${testsTotal} passed. Duration: ${executionDurationMs}ms.`,
          });
        } catch {
          // Audit log failure should not block the operation
        }

        // Trigger a simulated notification
        try {
          const notifTrigger = executionSuccess
            ? NOTIFICATION_TRIGGERS.QUALITY_GATE_PASSED
            : NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED;

          simulateNotification(notifTrigger, {
            recipientId: existingRecord.assigneeId || actor.id,
            entityName: existingRecord.name,
            entityType: 'SCHEDULE',
            entityId: id,
            actionUrl: `/schedules/${id}`,
          });
        } catch {
          // Notification failure should not block the operation
        }

        resolve({
          success: true,
          data: {
            schedule: { ...updatedRecord },
            execution: executionResult,
          },
          error: null,
          simulated: true,
        });
      } catch (err) {
        resolve({
          success: false,
          data: null,
          error: err && err.message ? err.message : 'Failed to execute schedule',
          simulated: true,
        });
      }
    }, effectiveLatency);
  });
};

/**
 * Returns the total count of schedule records, optionally filtered by status.
 *
 * @param {string} [status] - Optional status to filter by.
 * @returns {number}
 */
export const getScheduleCount = (status) => {
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
 * Returns all schedule records without pagination.
 *
 * @returns {Schedule[]}
 */
export const getAllSchedules = () => {
  return getAllRecords().map((r) => ({ ...r }));
};

/**
 * Returns all distinct schedule types present in the data.
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
 * Returns all distinct schedule statuses present in the data.
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
 * Returns all distinct schedule frequencies present in the data.
 *
 * @returns {string[]}
 */
export const getDistinctFrequencies = () => {
  const records = getAllRecords();
  const frequencies = new Set();
  records.forEach((r) => {
    if (r.frequency) {
      frequencies.add(r.frequency);
    }
  });
  return Array.from(frequencies).sort();
};

/**
 * Returns schedules filtered by status.
 *
 * @param {string} status - The status to filter by.
 * @returns {Schedule[]}
 */
export const getSchedulesByStatus = (status) => {
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
 * Returns schedules filtered by assignee ID.
 *
 * @param {string} assigneeId - The assignee user ID to filter by.
 * @returns {Schedule[]}
 */
export const getSchedulesByAssignee = (assigneeId) => {
  if (typeof assigneeId !== 'string' || assigneeId.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const assigneeIdTrimmed = assigneeId.trim();
  return records
    .filter((r) => r.assigneeId === assigneeIdTrimmed)
    .sort((a, b) => {
      const tsA = a.nextRunDate || '';
      const tsB = b.nextRunDate || '';
      return tsA.localeCompare(tsB);
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns schedules filtered by application ID.
 *
 * @param {string} applicationId - The application ID to filter by.
 * @returns {Schedule[]}
 */
export const getSchedulesByApplication = (applicationId) => {
  if (typeof applicationId !== 'string' || applicationId.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const applicationIdTrimmed = applicationId.trim();
  return records
    .filter((r) => r.applicationId === applicationIdTrimmed)
    .sort((a, b) => {
      const tsA = a.nextRunDate || '';
      const tsB = b.nextRunDate || '';
      return tsA.localeCompare(tsB);
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns a summary of schedule statistics.
 *
 * @returns {{ total: number, active: number, paused: number, completed: number, cancelled: number, byType: Object<string, number>, byFrequency: Object<string, number>, upcomingCount: number }}
 */
export const getScheduleSummary = () => {
  const records = getAllRecords();
  const now = new Date().toISOString();

  const summary = {
    total: records.length,
    active: 0,
    paused: 0,
    completed: 0,
    cancelled: 0,
    byType: {},
    byFrequency: {},
    upcomingCount: 0,
  };

  records.forEach((r) => {
    if (!r) {
      return;
    }

    switch (r.status) {
      case 'active':
        summary.active += 1;
        break;
      case 'paused':
        summary.paused += 1;
        break;
      case 'completed':
        summary.completed += 1;
        break;
      case 'cancelled':
        summary.cancelled += 1;
        break;
      default:
        break;
    }

    if (r.type) {
      summary.byType[r.type] = (summary.byType[r.type] || 0) + 1;
    }

    if (r.frequency) {
      summary.byFrequency[r.frequency] = (summary.byFrequency[r.frequency] || 0) + 1;
    }

    // Count schedules with upcoming runs (nextRunDate in the future or within 7 days)
    if (r.nextRunDate && r.status === 'active') {
      try {
        const nextRun = new Date(r.nextRunDate);
        const nowDate = new Date(now);
        const diffMs = nextRun.getTime() - nowDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) {
          summary.upcomingCount += 1;
        }
      } catch {
        // Skip invalid dates
      }
    }
  });

  return summary;
};