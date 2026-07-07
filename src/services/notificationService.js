import {
  listNotifications as repoListNotifications,
  getNotification,
  createNotification,
  markAsRead as repoMarkAsRead,
  markAllAsRead as repoMarkAllAsRead,
  deleteNotification,
  getNotificationCount,
  getUnreadCount as repoGetUnreadCount,
  getDistinctTriggers,
  getDistinctTypes,
  getNotificationsByRecipient,
  getAllNotifications,
  getNotificationSummary,
} from './notificationRepository';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';
import { generateId } from '../utils/idGenerator';
import { ID_PREFIXES, NOTIFICATION_TRIGGERS } from '../constants/constants';

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
 * Maps a notification trigger to a notification type.
 * @param {string} trigger - The trigger event identifier.
 * @returns {string} The notification type.
 */
const triggerToType = (trigger) => {
  if (typeof trigger !== 'string') {
    return 'info';
  }

  const errorTriggers = [
    NOTIFICATION_TRIGGERS.STANDARD_EXPIRED,
    NOTIFICATION_TRIGGERS.WAIVER_EXPIRED,
    NOTIFICATION_TRIGGERS.APPROVAL_REJECTED,
    NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED,
    NOTIFICATION_TRIGGERS.GOVERNANCE_VIOLATION,
    NOTIFICATION_TRIGGERS.INTEGRATION_SYNC_FAILED,
  ];

  const warningTriggers = [
    NOTIFICATION_TRIGGERS.STANDARD_EXPIRING,
    NOTIFICATION_TRIGGERS.WAIVER_EXPIRING,
    NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED,
  ];

  const successTriggers = [
    NOTIFICATION_TRIGGERS.APPROVAL_GRANTED,
    NOTIFICATION_TRIGGERS.TECH_DEBT_RESOLVED,
    NOTIFICATION_TRIGGERS.QUALITY_GATE_PASSED,
    NOTIFICATION_TRIGGERS.AI_ANALYSIS_COMPLETE,
  ];

  const actionTriggers = [
    NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED,
  ];

  if (errorTriggers.includes(trigger)) {
    return 'error';
  }
  if (warningTriggers.includes(trigger)) {
    return 'warning';
  }
  if (successTriggers.includes(trigger)) {
    return 'success';
  }
  if (actionTriggers.includes(trigger)) {
    return 'action_required';
  }
  return 'info';
};

/**
 * Maps a notification trigger to a priority level.
 * @param {string} trigger - The trigger event identifier.
 * @returns {string} The priority level.
 */
const triggerToPriority = (trigger) => {
  if (typeof trigger !== 'string') {
    return 'low';
  }

  const criticalTriggers = [
    NOTIFICATION_TRIGGERS.GOVERNANCE_VIOLATION,
    NOTIFICATION_TRIGGERS.STANDARD_EXPIRED,
  ];

  const highTriggers = [
    NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED,
    NOTIFICATION_TRIGGERS.INTEGRATION_SYNC_FAILED,
    NOTIFICATION_TRIGGERS.WAIVER_EXPIRED,
    NOTIFICATION_TRIGGERS.APPROVAL_REJECTED,
  ];

  const mediumTriggers = [
    NOTIFICATION_TRIGGERS.STANDARD_EXPIRING,
    NOTIFICATION_TRIGGERS.WAIVER_EXPIRING,
    NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED,
    NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED,
  ];

  if (criticalTriggers.includes(trigger)) {
    return 'critical';
  }
  if (highTriggers.includes(trigger)) {
    return 'high';
  }
  if (mediumTriggers.includes(trigger)) {
    return 'medium';
  }
  return 'low';
};

/**
 * Builds a notification message from a trigger and context data.
 * @param {string} trigger - The trigger event identifier.
 * @param {Object} data - Context data for the notification.
 * @returns {string} The notification message.
 */
const buildMessage = (trigger, data) => {
  const entityName = (data && data.entityName) || 'an entity';
  const entityType = (data && data.entityType) || 'record';

  switch (trigger) {
    case NOTIFICATION_TRIGGERS.STANDARD_EXPIRING:
      return `Technology standard '${entityName}' is expiring soon. Please review and take action.`;
    case NOTIFICATION_TRIGGERS.STANDARD_EXPIRED:
      return `Technology standard '${entityName}' has expired. Immediate review required.`;
    case NOTIFICATION_TRIGGERS.WAIVER_EXPIRING:
      return `Waiver '${entityName}' is expiring soon. Please submit a renewal or remediation plan.`;
    case NOTIFICATION_TRIGGERS.WAIVER_EXPIRED:
      return `Waiver '${entityName}' has expired. Non-compliance status will be applied.`;
    case NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED:
      return `A new approval request '${entityName}' requires your review.`;
    case NOTIFICATION_TRIGGERS.APPROVAL_GRANTED:
      return `Approval request '${entityName}' has been approved.`;
    case NOTIFICATION_TRIGGERS.APPROVAL_REJECTED:
      return `Approval request '${entityName}' has been rejected. See comments for details.`;
    case NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED:
      return `New technical debt item '${entityName}' has been identified.`;
    case NOTIFICATION_TRIGGERS.TECH_DEBT_RESOLVED:
      return `Technical debt item '${entityName}' has been resolved and closed.`;
    case NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED:
      return `Quality gate '${entityName}' has failed. Deployment is blocked.`;
    case NOTIFICATION_TRIGGERS.QUALITY_GATE_PASSED:
      return `Quality gate '${entityName}' has passed. Deployment is cleared to proceed.`;
    case NOTIFICATION_TRIGGERS.GOVERNANCE_VIOLATION:
      return `A governance violation has been detected for '${entityName}'. Immediate action required.`;
    case NOTIFICATION_TRIGGERS.AI_ANALYSIS_COMPLETE:
      return `AI analysis '${entityName}' has completed. Review the recommendations.`;
    case NOTIFICATION_TRIGGERS.INTEGRATION_SYNC_FAILED:
      return `Integration sync for '${entityName}' has failed. Check connection settings.`;
    default:
      return `Notification for ${entityType} '${entityName}'.`;
  }
};

/**
 * Builds a notification title from a trigger.
 * @param {string} trigger - The trigger event identifier.
 * @returns {string} The notification title.
 */
const buildTitle = (trigger) => {
  switch (trigger) {
    case NOTIFICATION_TRIGGERS.STANDARD_EXPIRING:
      return 'Standard Expiring Soon';
    case NOTIFICATION_TRIGGERS.STANDARD_EXPIRED:
      return 'Standard Expired';
    case NOTIFICATION_TRIGGERS.WAIVER_EXPIRING:
      return 'Waiver Expiring Soon';
    case NOTIFICATION_TRIGGERS.WAIVER_EXPIRED:
      return 'Waiver Expired';
    case NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED:
      return 'Approval Request Pending';
    case NOTIFICATION_TRIGGERS.APPROVAL_GRANTED:
      return 'Approval Granted';
    case NOTIFICATION_TRIGGERS.APPROVAL_REJECTED:
      return 'Approval Rejected';
    case NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED:
      return 'New Technical Debt';
    case NOTIFICATION_TRIGGERS.TECH_DEBT_RESOLVED:
      return 'Technical Debt Resolved';
    case NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED:
      return 'Quality Gate Failed';
    case NOTIFICATION_TRIGGERS.QUALITY_GATE_PASSED:
      return 'Quality Gate Passed';
    case NOTIFICATION_TRIGGERS.GOVERNANCE_VIOLATION:
      return 'Governance Violation Detected';
    case NOTIFICATION_TRIGGERS.AI_ANALYSIS_COMPLETE:
      return 'AI Analysis Complete';
    case NOTIFICATION_TRIGGERS.INTEGRATION_SYNC_FAILED:
      return 'Integration Sync Failed';
    default:
      return 'System Notification';
  }
};

/**
 * Lists notifications for a given persona with optional filters.
 * Filters by the persona's ID as the recipientId, then applies additional filters.
 *
 * @param {string|Object} persona - Persona ID string or persona object with an id property.
 * @param {Object} [filters={}] - Optional filters for listing notifications.
 * @returns {{ data: Array<Object>, total: number, page: number, pageSize: number, totalPages: number }}
 */
export const listNotifications = (persona, filters = {}) => {
  let recipientId = null;

  if (typeof persona === 'string' && persona.trim() !== '') {
    recipientId = persona.trim();
  } else if (persona && typeof persona === 'object' && typeof persona.id === 'string') {
    recipientId = persona.id;
  }

  const mergedFilters = {
    ...filters,
  };

  if (recipientId) {
    mergedFilters.recipientId = recipientId;
  }

  return repoListNotifications(mergedFilters);
};

/**
 * Returns all notifications for a given persona without pagination.
 *
 * @param {string|Object} persona - Persona ID string or persona object with an id property.
 * @returns {Array<Object>}
 */
export const listAllNotifications = (persona) => {
  let recipientId = null;

  if (typeof persona === 'string' && persona.trim() !== '') {
    recipientId = persona.trim();
  } else if (persona && typeof persona === 'object' && typeof persona.id === 'string') {
    recipientId = persona.id;
  }

  if (!recipientId) {
    return getAllNotifications();
  }

  return getNotificationsByRecipient(recipientId);
};

/**
 * Retrieves a single notification by ID.
 *
 * @param {string} id - The notification ID.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const getNotificationById = (id) => {
  return getNotification(id);
};

/**
 * Marks a single notification as read by its ID.
 * Logs the action to the audit log.
 *
 * @param {string} id - The notification ID to mark as read.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const markAsRead = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  const result = repoMarkAsRead(id);

  if (result.success) {
    const actor = getAuditActor();
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: id,
        entityName: result.data ? result.data.title : id,
        status: 'success',
        newValues: { isRead: true },
        details: `Marked notification '${id}' as read`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
  }

  return result;
};

/**
 * Marks all notifications for a given persona as read.
 * Logs the action to the audit log.
 *
 * @param {string|Object} persona - Persona ID string or persona object with an id property.
 * @returns {{ success: boolean, updatedCount: number, error: string|null }}
 */
export const markAllAsRead = (persona) => {
  let recipientId = null;

  if (typeof persona === 'string' && persona.trim() !== '') {
    recipientId = persona.trim();
  } else if (persona && typeof persona === 'object' && typeof persona.id === 'string') {
    recipientId = persona.id;
  }

  if (!recipientId) {
    return { success: false, updatedCount: 0, error: 'Persona ID is required' };
  }

  const result = repoMarkAllAsRead(recipientId);

  if (result.success && result.updatedCount > 0) {
    const actor = getAuditActor();
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: recipientId,
        entityName: `All notifications for ${recipientId}`,
        status: 'success',
        newValues: { isRead: true, updatedCount: result.updatedCount },
        details: `Marked ${result.updatedCount} notification(s) as read for recipient '${recipientId}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
  }

  return result;
};

/**
 * Simulates creating a new notification for the appropriate persona(s).
 * Generates a notification based on the trigger and context data,
 * persists it, and logs the action to the audit log.
 *
 * @param {string} trigger - The notification trigger event identifier (one of NOTIFICATION_TRIGGERS values).
 * @param {Object} [data={}] - Context data for the notification.
 * @param {string} [data.recipientId] - The recipient persona/user ID. If not provided, uses the active persona.
 * @param {string} [data.entityName] - The name of the related entity.
 * @param {string} [data.entityType] - The type of the related entity.
 * @param {string} [data.entityId] - The ID of the related entity.
 * @param {string} [data.actionUrl] - URL for the notification action.
 * @returns {{ success: boolean, data: Object|null, error: string|null, simulated: boolean }}
 */
export const simulateNotification = (trigger, data = {}) => {
  if (typeof trigger !== 'string' || trigger.trim() === '') {
    return {
      success: false,
      data: null,
      error: 'Trigger must be a non-empty string',
      simulated: true,
    };
  }

  try {
    const actor = getAuditActor();
    const recipientId = data.recipientId || actor.id;
    const now = new Date().toISOString();

    const title = buildTitle(trigger);
    const message = buildMessage(trigger, data);
    const type = triggerToType(trigger);
    const priority = triggerToPriority(trigger);

    const notificationData = {
      title,
      message,
      type,
      trigger: trigger.trim(),
      recipientId,
      isRead: false,
      readAt: null,
      actionUrl: data.actionUrl || null,
      relatedEntityType: data.entityType || null,
      relatedEntityId: data.entityId || null,
      priority,
      expiresAt: null,
      createdBy: actor.id,
      updatedBy: actor.id,
    };

    const createResult = createNotification(notificationData);

    if (!createResult.success) {
      return {
        success: false,
        data: null,
        error: createResult.error,
        simulated: true,
      };
    }

    // Log audit action
    try {
      logAction({
        action: 'create',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: createResult.data ? createResult.data.id : null,
        entityName: title,
        status: 'success',
        newValues: {
          trigger,
          recipientId,
          type,
          priority,
          simulated: true,
        },
        details: `Simulated notification '${title}' for trigger '${trigger}' sent to '${recipientId}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return {
      success: true,
      data: createResult.data ? { ...createResult.data, simulated: true } : null,
      error: null,
      simulated: true,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to simulate notification',
      simulated: true,
    };
  }
};

/**
 * Simulates sending an email notification.
 * Generates preview data for the email and logs 'sent (simulated)' to the audit log.
 * No real email is sent.
 *
 * @param {Object|string} notification - The notification object or notification ID.
 * @returns {{ success: boolean, preview: Object|null, error: string|null, simulated: boolean }}
 */
export const sendSimulatedEmail = (notification) => {
  try {
    let notificationData = null;

    if (typeof notification === 'string') {
      const result = getNotification(notification);
      if (!result.success || !result.data) {
        return {
          success: false,
          preview: null,
          error: result.error || `Notification with ID '${notification}' not found`,
          simulated: true,
        };
      }
      notificationData = result.data;
    } else if (notification && typeof notification === 'object' && notification.id) {
      notificationData = notification;
    } else {
      return {
        success: false,
        preview: null,
        error: 'Notification must be a valid notification object or notification ID string',
        simulated: true,
      };
    }

    const now = new Date().toISOString();
    const actor = getAuditActor();

    const emailPreview = {
      to: `${notificationData.recipientId}@kpetsip.example.com`,
      from: 'notifications@kpetsip.example.com',
      subject: `[KP ETSIP] ${notificationData.title || 'Notification'}`,
      body: notificationData.message || '',
      htmlBody: `<div style="font-family: Arial, sans-serif; padding: 20px;">
<h2 style="color: #1a56db;">${notificationData.title || 'Notification'}</h2>
<p>${notificationData.message || ''}</p>
<hr style="border: 1px solid #e5e7eb;" />
<p style="color: #6b7280; font-size: 12px;">
This is a simulated email from KP ETSIP Platform. No real email was sent.
</p>
<p style="color: #6b7280; font-size: 12px;">
Priority: ${notificationData.priority || 'low'} | Type: ${notificationData.type || 'info'}
</p>
</div>`,
      sentAt: now,
      channel: 'email',
      simulated: true,
      notificationId: notificationData.id,
    };

    // Log audit action
    try {
      logAction({
        action: 'execute',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: notificationData.id,
        entityName: notificationData.title || notificationData.id,
        status: 'success',
        newValues: {
          channel: 'email',
          to: emailPreview.to,
          subject: emailPreview.subject,
          sentAt: now,
          simulated: true,
        },
        details: `Email notification sent (simulated) for '${notificationData.id}' to '${emailPreview.to}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return {
      success: true,
      preview: emailPreview,
      error: null,
      simulated: true,
    };
  } catch (err) {
    return {
      success: false,
      preview: null,
      error: err && err.message ? err.message : 'Failed to simulate email notification',
      simulated: true,
    };
  }
};

/**
 * Simulates sending a Microsoft Teams notification.
 * Generates preview data for the Teams message and logs 'sent (simulated)' to the audit log.
 * No real Teams message is sent.
 *
 * @param {Object|string} notification - The notification object or notification ID.
 * @returns {{ success: boolean, preview: Object|null, error: string|null, simulated: boolean }}
 */
export const sendSimulatedTeams = (notification) => {
  try {
    let notificationData = null;

    if (typeof notification === 'string') {
      const result = getNotification(notification);
      if (!result.success || !result.data) {
        return {
          success: false,
          preview: null,
          error: result.error || `Notification with ID '${notification}' not found`,
          simulated: true,
        };
      }
      notificationData = result.data;
    } else if (notification && typeof notification === 'object' && notification.id) {
      notificationData = notification;
    } else {
      return {
        success: false,
        preview: null,
        error: 'Notification must be a valid notification object or notification ID string',
        simulated: true,
      };
    }

    const now = new Date().toISOString();
    const actor = getAuditActor();

    const priorityColor = (() => {
      switch (notificationData.priority) {
        case 'critical':
          return '#ef4444';
        case 'high':
          return '#f97316';
        case 'medium':
          return '#f59e0b';
        default:
          return '#3b82f6';
      }
    })();

    const teamsPreview = {
      webhookUrl: 'https://teams.kpetsip.example.com/webhook/simulated',
      channel: '#kp-etsip-notifications',
      card: {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: priorityColor,
        summary: notificationData.title || 'KP ETSIP Notification',
        sections: [
          {
            activityTitle: notificationData.title || 'Notification',
            activitySubtitle: `Priority: ${notificationData.priority || 'low'} | Type: ${notificationData.type || 'info'}`,
            activityImage: 'https://kpetsip.example.com/logo.png',
            text: notificationData.message || '',
            facts: [
              { name: 'Trigger', value: notificationData.trigger || 'N/A' },
              { name: 'Recipient', value: notificationData.recipientId || 'N/A' },
              { name: 'Sent At', value: now },
              { name: 'Simulated', value: 'Yes' },
            ],
          },
        ],
        potentialAction: notificationData.actionUrl
          ? [
              {
                '@type': 'OpenUri',
                name: 'View in KP ETSIP',
                targets: [
                  { os: 'default', uri: notificationData.actionUrl },
                ],
              },
            ]
          : [],
      },
      sentAt: now,
      channelType: 'teams',
      simulated: true,
      notificationId: notificationData.id,
    };

    // Log audit action
    try {
      logAction({
        action: 'execute',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: notificationData.id,
        entityName: notificationData.title || notificationData.id,
        status: 'success',
        newValues: {
          channel: 'teams',
          teamsChannel: teamsPreview.channel,
          sentAt: now,
          simulated: true,
        },
        details: `Teams notification sent (simulated) for '${notificationData.id}' to channel '${teamsPreview.channel}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return {
      success: true,
      preview: teamsPreview,
      error: null,
      simulated: true,
    };
  } catch (err) {
    return {
      success: false,
      preview: null,
      error: err && err.message ? err.message : 'Failed to simulate Teams notification',
      simulated: true,
    };
  }
};

/**
 * Deletes a notification by ID.
 * Logs the action to the audit log.
 *
 * @param {string} id - The notification ID to delete.
 * @returns {{ success: boolean, error: string|null }}
 */
export const removeNotification = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'ID must be a non-empty string' };
  }

  const existing = getNotification(id);
  const result = deleteNotification(id);

  if (result.success) {
    const actor = getAuditActor();
    try {
      logAction({
        action: 'delete',
        userId: actor.id,
        userName: actor.name,
        entityType: 'NOTIFICATION',
        entityId: id,
        entityName: existing.data ? existing.data.title : id,
        status: 'success',
        previousValues: existing.data || null,
        details: `Deleted notification '${id}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }
  }

  return result;
};

/**
 * Returns the total count of notifications, optionally filtered by recipientId.
 *
 * @param {string} [recipientId] - Optional recipient ID to filter by.
 * @returns {number}
 */
export const getCount = (recipientId) => {
  return getNotificationCount(recipientId);
};

/**
 * Returns the count of unread notifications for a given persona.
 *
 * @param {string|Object} persona - Persona ID string or persona object with an id property.
 * @returns {number}
 */
export const getUnreadCount = (persona) => {
  let recipientId = null;

  if (typeof persona === 'string' && persona.trim() !== '') {
    recipientId = persona.trim();
  } else if (persona && typeof persona === 'object' && typeof persona.id === 'string') {
    recipientId = persona.id;
  }

  if (!recipientId) {
    return 0;
  }

  return repoGetUnreadCount(recipientId);
};

/**
 * Returns all distinct trigger types present in the notification data.
 *
 * @returns {string[]}
 */
export const getAvailableTriggers = () => {
  return getDistinctTriggers();
};

/**
 * Returns all distinct notification types present in the data.
 *
 * @returns {string[]}
 */
export const getAvailableTypes = () => {
  return getDistinctTypes();
};

/**
 * Returns a summary of notification statistics for a given persona.
 *
 * @param {string|Object} persona - Persona ID string or persona object with an id property.
 * @returns {{ total: number, unread: number, read: number, byType: Object<string, number>, byPriority: Object<string, number> }}
 */
export const getSummary = (persona) => {
  let recipientId = null;

  if (typeof persona === 'string' && persona.trim() !== '') {
    recipientId = persona.trim();
  } else if (persona && typeof persona === 'object' && typeof persona.id === 'string') {
    recipientId = persona.id;
  }

  if (!recipientId) {
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: {},
      byPriority: {},
    };
  }

  return getNotificationSummary(recipientId);
};

/**
 * Simulates sending a notification via all available channels (InApp, Email, Teams).
 * Creates the notification and generates preview data for Email and Teams.
 *
 * @param {string} trigger - The notification trigger event identifier.
 * @param {Object} [data={}] - Context data for the notification.
 * @returns {{ success: boolean, notification: Object|null, emailPreview: Object|null, teamsPreview: Object|null, error: string|null, simulated: boolean }}
 */
export const simulateMultiChannelNotification = (trigger, data = {}) => {
  const result = {
    success: false,
    notification: null,
    emailPreview: null,
    teamsPreview: null,
    error: null,
    simulated: true,
  };

  // Create the in-app notification
  const notifResult = simulateNotification(trigger, data);
  if (!notifResult.success || !notifResult.data) {
    result.error = notifResult.error || 'Failed to create notification';
    return result;
  }

  result.notification = notifResult.data;

  // Simulate email delivery
  const emailResult = sendSimulatedEmail(notifResult.data);
  if (emailResult.success) {
    result.emailPreview = emailResult.preview;
  }

  // Simulate Teams delivery
  const teamsResult = sendSimulatedTeams(notifResult.data);
  if (teamsResult.success) {
    result.teamsPreview = teamsResult.preview;
  }

  result.success = true;
  return result;
};