import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID (NOT- prefix).
 * @property {string} title - Notification title.
 * @property {string} message - Notification message.
 * @property {string} type - Notification type: 'info', 'warning', 'error', 'success', 'action_required'.
 * @property {string|null} trigger - Trigger event identifier.
 * @property {string} recipientId - Recipient user/persona ID.
 * @property {boolean} isRead - Whether the notification has been read.
 * @property {string|null} readAt - When the notification was read (ISO 8601).
 * @property {string|null} actionUrl - URL for the notification action.
 * @property {string|null} relatedEntityType - Related entity type.
 * @property {string|null} relatedEntityId - Related entity ID.
 * @property {string} priority - Notification priority: 'critical', 'high', 'medium', 'low'.
 * @property {string|null} expiresAt - Notification expiration timestamp (ISO 8601).
 * @property {string} createdAt - ISO 8601 creation timestamp.
 * @property {string} updatedAt - ISO 8601 last update timestamp.
 * @property {string} createdBy - User who created the record.
 * @property {string} updatedBy - User who last updated the record.
 * @property {number} version - Record version for optimistic locking.
 */

/**
 * @typedef {Object} NotificationFilters
 * @property {string} [recipientId] - Filter by recipient user/persona ID.
 * @property {string} [type] - Filter by notification type.
 * @property {string} [trigger] - Filter by trigger event identifier.
 * @property {string} [priority] - Filter by priority level.
 * @property {boolean} [unreadOnly] - If true, only return unread notifications.
 * @property {string} [relatedEntityType] - Filter by related entity type.
 * @property {string} [relatedEntityId] - Filter by related entity ID.
 * @property {string} [search] - Free-text search across title, message, trigger.
 * @property {string} [sortField] - Field to sort by (default: 'createdAt').
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc' (default: 'desc').
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of entries per page (default: 20).
 */

/**
 * @typedef {Object} PaginatedNotificationResult
 * @property {Notification[]} data - The notifications for the current page.
 * @property {number} total - Total number of matching notifications.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of entries per page.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Retrieves all notification records from localStorage.
 * @returns {Notification[]}
 */
const getAllRecords = () => {
  const data = getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

/**
 * Persists the full notifications array to localStorage.
 * @param {Notification[]} records - The records to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllRecords = (records) => {
  return setItem(STORAGE_KEYS.NOTIFICATIONS, records);
};

/**
 * Lists notification records with support for filtering, sorting, and pagination.
 *
 * @param {NotificationFilters} [filters={}] - Optional filters, sorting, and pagination options.
 * @returns {PaginatedNotificationResult}
 */
export const listNotifications = (filters = {}) => {
  try {
    let records = getAllRecords();

    const {
      recipientId,
      type,
      trigger,
      priority,
      unreadOnly,
      relatedEntityType,
      relatedEntityId,
      search,
      sortField = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    // Apply recipientId filter
    if (typeof recipientId === 'string' && recipientId.trim() !== '') {
      const recipientIdTrimmed = recipientId.trim();
      records = records.filter(
        (r) => r.recipientId === recipientIdTrimmed
      );
    }

    // Apply type filter
    if (typeof type === 'string' && type.trim() !== '') {
      const typeLower = type.trim().toLowerCase();
      records = records.filter(
        (r) => r.type && r.type.toLowerCase() === typeLower
      );
    }

    // Apply trigger filter
    if (typeof trigger === 'string' && trigger.trim() !== '') {
      const triggerLower = trigger.trim().toLowerCase();
      records = records.filter(
        (r) => r.trigger && r.trigger.toLowerCase() === triggerLower
      );
    }

    // Apply priority filter
    if (typeof priority === 'string' && priority.trim() !== '') {
      const priorityLower = priority.trim().toLowerCase();
      records = records.filter(
        (r) => r.priority && r.priority.toLowerCase() === priorityLower
      );
    }

    // Apply unreadOnly filter
    if (unreadOnly === true) {
      records = records.filter((r) => r.isRead === false);
    }

    // Apply relatedEntityType filter
    if (typeof relatedEntityType === 'string' && relatedEntityType.trim() !== '') {
      const relatedTypeTrimmed = relatedEntityType.trim();
      records = records.filter(
        (r) => r.relatedEntityType === relatedTypeTrimmed
      );
    }

    // Apply relatedEntityId filter
    if (typeof relatedEntityId === 'string' && relatedEntityId.trim() !== '') {
      const relatedIdTrimmed = relatedEntityId.trim();
      records = records.filter(
        (r) => r.relatedEntityId === relatedIdTrimmed
      );
    }

    // Apply free-text search
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      records = records.filter((r) => {
        const searchableFields = [r.title, r.message, r.trigger, r.type];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    const validSortFields = [
      'title',
      'type',
      'trigger',
      'priority',
      'isRead',
      'createdAt',
      'updatedAt',
      'readAt',
      'expiresAt',
    ];
    const effectiveSortField = validSortFields.includes(sortField)
      ? sortField
      : 'createdAt';
    const effectiveSortDirection =
      sortDirection === 'asc' ? 'asc' : 'desc';

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

      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : (valA ? 1 : -1);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
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
 * Retrieves a single notification record by its ID.
 *
 * @param {string} id - The notification ID.
 * @returns {{ success: boolean, data: Notification|null, error: string|null }}
 */
export const getNotification = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const record = records.find((r) => r && r.id === id);

    if (!record) {
      return { success: false, data: null, error: `Notification with ID '${id}' not found` };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to retrieve notification',
    };
  }
};

/**
 * Creates a new notification record.
 * Generates an ID, sets timestamps, and persists the record.
 *
 * @param {Object} data - The notification data (without id, createdAt, updatedAt).
 * @returns {{ success: boolean, data: Notification|null, error: string|null }}
 */
export const createNotification = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return { success: false, data: null, error: 'Notification title is required' };
  }

  if (typeof data.message !== 'string' || data.message.trim() === '') {
    return { success: false, data: null, error: 'Notification message is required' };
  }

  if (typeof data.recipientId !== 'string' || data.recipientId.trim() === '') {
    return { success: false, data: null, error: 'Recipient ID is required' };
  }

  try {
    const records = getAllRecords();
    const now = new Date().toISOString();

    const record = {
      id: data.id || generateId(ID_PREFIXES.NOTIFICATION),
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type || 'info',
      trigger: data.trigger || null,
      recipientId: data.recipientId.trim(),
      isRead: typeof data.isRead === 'boolean' ? data.isRead : false,
      readAt: data.readAt || null,
      actionUrl: data.actionUrl || null,
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      priority: data.priority || 'low',
      expiresAt: data.expiresAt || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      createdBy: data.createdBy || 'system',
      updatedBy: data.updatedBy || 'system',
      version: data.version || 1,
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
      error: err && err.message ? err.message : 'Failed to create notification',
    };
  }
};

/**
 * Marks a single notification as read by its ID.
 * Sets isRead to true and readAt to the current timestamp.
 *
 * @param {string} id - The notification ID to mark as read.
 * @returns {{ success: boolean, data: Notification|null, error: string|null }}
 */
export const markAsRead = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `Notification with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];

    if (existingRecord.isRead === true) {
      return { success: true, data: { ...existingRecord }, error: null };
    }

    const now = new Date().toISOString();

    const updatedRecord = {
      ...existingRecord,
      isRead: true,
      readAt: now,
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
      error: err && err.message ? err.message : 'Failed to mark notification as read',
    };
  }
};

/**
 * Marks all notifications for a given recipient as read.
 * Sets isRead to true and readAt to the current timestamp for all matching unread notifications.
 *
 * @param {string} recipientId - The recipient user/persona ID.
 * @returns {{ success: boolean, updatedCount: number, error: string|null }}
 */
export const markAllAsRead = (recipientId) => {
  if (typeof recipientId !== 'string' || recipientId.trim() === '') {
    return { success: false, updatedCount: 0, error: 'Recipient ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const now = new Date().toISOString();
    const recipientIdTrimmed = recipientId.trim();
    let updatedCount = 0;

    const updatedRecords = records.map((record) => {
      if (
        record &&
        record.recipientId === recipientIdTrimmed &&
        record.isRead === false
      ) {
        updatedCount += 1;
        return {
          ...record,
          isRead: true,
          readAt: now,
          updatedAt: now,
          version: (record.version || 0) + 1,
        };
      }
      return record;
    });

    if (updatedCount === 0) {
      return { success: true, updatedCount: 0, error: null };
    }

    const writeResult = saveAllRecords(updatedRecords);
    if (!writeResult.success) {
      return { success: false, updatedCount: 0, error: writeResult.error };
    }

    return { success: true, updatedCount, error: null };
  } catch (err) {
    return {
      success: false,
      updatedCount: 0,
      error: err && err.message ? err.message : 'Failed to mark all notifications as read',
    };
  }
};

/**
 * Deletes a notification record by ID.
 *
 * @param {string} id - The notification ID to delete.
 * @returns {{ success: boolean, error: string|null }}
 */
export const deleteNotification = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, error: `Notification with ID '${id}' not found` };
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
      error: err && err.message ? err.message : 'Failed to delete notification',
    };
  }
};

/**
 * Returns the total count of notification records, optionally filtered by recipientId.
 *
 * @param {string} [recipientId] - Optional recipient ID to filter by.
 * @returns {number}
 */
export const getNotificationCount = (recipientId) => {
  const records = getAllRecords();
  if (typeof recipientId === 'string' && recipientId.trim() !== '') {
    const recipientIdTrimmed = recipientId.trim();
    return records.filter(
      (r) => r.recipientId === recipientIdTrimmed
    ).length;
  }
  return records.length;
};

/**
 * Returns the count of unread notifications for a given recipient.
 *
 * @param {string} recipientId - The recipient user/persona ID.
 * @returns {number}
 */
export const getUnreadCount = (recipientId) => {
  if (typeof recipientId !== 'string' || recipientId.trim() === '') {
    return 0;
  }

  const records = getAllRecords();
  const recipientIdTrimmed = recipientId.trim();
  return records.filter(
    (r) =>
      r.recipientId === recipientIdTrimmed &&
      r.isRead === false
  ).length;
};

/**
 * Returns all distinct trigger types present in the notification data.
 *
 * @returns {string[]}
 */
export const getDistinctTriggers = () => {
  const records = getAllRecords();
  const triggers = new Set();
  records.forEach((r) => {
    if (r.trigger) {
      triggers.add(r.trigger);
    }
  });
  return Array.from(triggers).sort();
};

/**
 * Returns all distinct notification types present in the data.
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
 * Returns notifications filtered by recipient ID without pagination.
 *
 * @param {string} recipientId - The recipient user/persona ID.
 * @returns {Notification[]}
 */
export const getNotificationsByRecipient = (recipientId) => {
  if (typeof recipientId !== 'string' || recipientId.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const recipientIdTrimmed = recipientId.trim();
  return records
    .filter((r) => r.recipientId === recipientIdTrimmed)
    .sort((a, b) => {
      const tsA = a.createdAt || '';
      const tsB = b.createdAt || '';
      return tsB.localeCompare(tsA);
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns all notification records without pagination.
 *
 * @returns {Notification[]}
 */
export const getAllNotifications = () => {
  return getAllRecords().map((r) => ({ ...r }));
};

/**
 * Returns a summary of notification statistics for a given recipient.
 *
 * @param {string} recipientId - The recipient user/persona ID.
 * @returns {{ total: number, unread: number, read: number, byType: Object<string, number>, byPriority: Object<string, number> }}
 */
export const getNotificationSummary = (recipientId) => {
  const summary = {
    total: 0,
    unread: 0,
    read: 0,
    byType: {},
    byPriority: {},
  };

  if (typeof recipientId !== 'string' || recipientId.trim() === '') {
    return summary;
  }

  const records = getAllRecords();
  const recipientIdTrimmed = recipientId.trim();

  records.forEach((r) => {
    if (!r || r.recipientId !== recipientIdTrimmed) {
      return;
    }

    summary.total += 1;

    if (r.isRead === true) {
      summary.read += 1;
    } else {
      summary.unread += 1;
    }

    if (r.type) {
      summary.byType[r.type] = (summary.byType[r.type] || 0) + 1;
    }

    if (r.priority) {
      summary.byPriority[r.priority] = (summary.byPriority[r.priority] || 0) + 1;
    }
  });

  return summary;
};