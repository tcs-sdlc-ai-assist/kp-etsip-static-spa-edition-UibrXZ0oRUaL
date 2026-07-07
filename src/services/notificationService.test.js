import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listNotifications,
  listAllNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  simulateNotification,
  sendSimulatedEmail,
  sendSimulatedTeams,
  removeNotification,
  getCount,
  getUnreadCount,
  getAvailableTriggers,
  getAvailableTypes,
  getSummary,
  simulateMultiChannelNotification,
} from './notificationService';
import { STORAGE_KEYS, NOTIFICATION_TRIGGERS } from '../constants/constants';

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set active persona to admin for permission checks
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

    // Seed users for recipient references
    const users = [
      {
        id: 'persona-platform-administrator',
        username: 'admin',
        email: 'admin@kpetsip.example.com',
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Admin User',
        accessLevel: 'admin',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        version: 1,
      },
      {
        id: 'persona-quality-engineer',
        username: 'qe',
        email: 'qe@kpetsip.example.com',
        firstName: 'Quality',
        lastName: 'Engineer',
        displayName: 'Quality Engineer',
        accessLevel: 'contributor',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Seed notifications
    const notifications = [
      {
        id: 'NOT-001',
        title: 'Standard Expiring',
        message: 'Technology standard React 18.x is expiring in 30 days.',
        type: 'warning',
        trigger: 'standard_expiring',
        recipientId: 'persona-platform-administrator',
        isRead: false,
        readAt: null,
        actionUrl: '/technology-standards/TS-001',
        relatedEntityType: 'TECH_STANDARD',
        relatedEntityId: 'TS-001',
        priority: 'medium',
        expiresAt: null,
        createdAt: '2026-06-28T10:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      },
      {
        id: 'NOT-002',
        title: 'Quality Gate Failed',
        message: 'Quality gate Code Coverage has failed for Application APP-001.',
        type: 'error',
        trigger: 'quality_gate_failed',
        recipientId: 'persona-platform-administrator',
        isRead: false,
        readAt: null,
        actionUrl: '/quality-gates/QG-001',
        relatedEntityType: 'QUALITY_GATE',
        relatedEntityId: 'QG-001',
        priority: 'high',
        expiresAt: null,
        createdAt: '2026-06-29T08:00:00.000Z',
        updatedAt: '2026-06-29T08:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      },
      {
        id: 'NOT-003',
        title: 'Approval Granted',
        message: 'Your approval request has been approved.',
        type: 'success',
        trigger: 'approval_granted',
        recipientId: 'persona-platform-administrator',
        isRead: true,
        readAt: '2026-06-29T09:00:00.000Z',
        actionUrl: '/approvals/APR-001',
        relatedEntityType: 'APPROVAL_REQUEST',
        relatedEntityId: 'APR-001',
        priority: 'low',
        expiresAt: null,
        createdAt: '2026-06-27T14:00:00.000Z',
        updatedAt: '2026-06-29T09:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 2,
      },
      {
        id: 'NOT-004',
        title: 'Tech Debt Created',
        message: 'New technical debt item identified.',
        type: 'warning',
        trigger: 'tech_debt_created',
        recipientId: 'persona-quality-engineer',
        isRead: false,
        readAt: null,
        actionUrl: '/tech-debt/TD-001',
        relatedEntityType: 'TECH_DEBT',
        relatedEntityId: 'TD-001',
        priority: 'medium',
        expiresAt: null,
        createdAt: '2026-06-30T11:00:00.000Z',
        updatedAt: '2026-06-30T11:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      },
      {
        id: 'NOT-005',
        title: 'Integration Sync Failed',
        message: 'Integration sync for Jira has failed.',
        type: 'error',
        trigger: 'integration_sync_failed',
        recipientId: 'persona-quality-engineer',
        isRead: false,
        readAt: null,
        actionUrl: '/integrations/INT-001',
        relatedEntityType: 'INTEGRATION',
        relatedEntityId: 'INT-001',
        priority: 'high',
        expiresAt: null,
        createdAt: '2026-06-30T12:00:00.000Z',
        updatedAt: '2026-06-30T12:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      },
      {
        id: 'NOT-006',
        title: 'AI Analysis Complete',
        message: 'AI analysis has completed. Review the recommendations.',
        type: 'success',
        trigger: 'ai_analysis_complete',
        recipientId: 'persona-platform-administrator',
        isRead: false,
        readAt: null,
        actionUrl: '/ai-insights/AI-001',
        relatedEntityType: 'AI_ANALYSIS',
        relatedEntityId: 'AI-001',
        priority: 'low',
        expiresAt: null,
        createdAt: '2026-06-30T13:00:00.000Z',
        updatedAt: '2026-06-30T13:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('listNotifications', () => {
    it('returns notifications filtered by persona object', () => {
      const persona = { id: 'persona-platform-administrator' };
      const result = listNotifications(persona);
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((n) => {
        expect(n.recipientId).toBe('persona-platform-administrator');
      });
    });

    it('returns notifications filtered by persona ID string', () => {
      const result = listNotifications('persona-quality-engineer');
      expect(result.data.length).toBe(2);
      result.data.forEach((n) => {
        expect(n.recipientId).toBe('persona-quality-engineer');
      });
    });

    it('returns all admin notifications with correct total', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' });
      expect(result.total).toBe(4);
    });

    it('returns paginated results', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { page: 1, pageSize: 2 });
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(4);
      expect(result.totalPages).toBe(2);
    });

    it('filters by trigger type', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { trigger: 'quality_gate_failed' });
      expect(result.total).toBe(1);
      expect(result.data[0].trigger).toBe('quality_gate_failed');
    });

    it('filters by notification type', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { type: 'warning' });
      expect(result.total).toBe(1);
      result.data.forEach((n) => {
        expect(n.type).toBe('warning');
      });
    });

    it('filters by unread only', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { unreadOnly: true });
      result.data.forEach((n) => {
        expect(n.isRead).toBe(false);
      });
      expect(result.total).toBe(3);
    });

    it('supports free-text search', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { search: 'quality gate' });
      expect(result.total).toBeGreaterThan(0);
      const hasMatch = result.data.some(
        (n) =>
          n.title.toLowerCase().includes('quality gate') ||
          n.message.toLowerCase().includes('quality gate')
      );
      expect(hasMatch).toBe(true);
    });

    it('returns empty results for non-matching search', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { search: 'nonexistent_xyz_abc' });
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('returns empty results for persona with no notifications', () => {
      const result = listNotifications({ id: 'persona-vendor-partner' });
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('returns copies of records (not references)', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' });
      result.data[0].title = 'Modified';
      const result2 = listNotifications({ id: 'persona-platform-administrator' });
      expect(result2.data[0].title).not.toBe('Modified');
    });

    it('filters by priority', () => {
      const result = listNotifications({ id: 'persona-platform-administrator' }, { priority: 'high' });
      expect(result.total).toBe(1);
      expect(result.data[0].priority).toBe('high');
    });

    it('handles null persona gracefully', () => {
      const result = listNotifications(null);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('listAllNotifications', () => {
    it('returns all notifications for a persona without pagination', () => {
      const result = listAllNotifications({ id: 'persona-platform-administrator' });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      result.forEach((n) => {
        expect(n.recipientId).toBe('persona-platform-administrator');
      });
    });

    it('returns all notifications for a persona ID string', () => {
      const result = listAllNotifications('persona-quality-engineer');
      expect(result.length).toBe(2);
    });

    it('returns all notifications when no persona provided', () => {
      const result = listAllNotifications(null);
      expect(result.length).toBe(6);
    });

    it('returns sorted by createdAt descending', () => {
      const result = listAllNotifications('persona-platform-administrator');
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].createdAt >= result[i].createdAt).toBe(true);
      }
    });
  });

  describe('getNotificationById', () => {
    it('returns an existing notification by ID', () => {
      const result = getNotificationById('NOT-001');
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBe('NOT-001');
      expect(result.data.title).toBe('Standard Expiring');
    });

    it('returns error for non-existent ID', () => {
      const result = getNotificationById('NOT-999');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('returns error for empty ID', () => {
      const result = getNotificationById('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('returns a copy of the record', () => {
      const result = getNotificationById('NOT-001');
      result.data.title = 'Modified';
      const result2 = getNotificationById('NOT-001');
      expect(result2.data.title).toBe('Standard Expiring');
    });
  });

  describe('markAsRead', () => {
    it('marks an unread notification as read', () => {
      const result = markAsRead('NOT-001');
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.isRead).toBe(true);
      expect(result.data.readAt).toBeDefined();
      expect(result.data.readAt).not.toBeNull();
    });

    it('persists the read state to localStorage', () => {
      markAsRead('NOT-001');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
      const notification = stored.find((n) => n.id === 'NOT-001');
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).not.toBeNull();
    });

    it('returns success for already-read notification', () => {
      const result = markAsRead('NOT-003');
      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
    });

    it('returns error for non-existent notification', () => {
      const result = markAsRead('NOT-999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for empty ID', () => {
      const result = markAsRead('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('creates an audit log entry on successful mark as read', () => {
      markAsRead('NOT-001');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const readLog = auditLogs.find(
        (log) => log.action === 'update' && log.entityType === 'NOTIFICATION' && log.entityId === 'NOT-001'
      );
      expect(readLog).toBeDefined();
      expect(readLog.status).toBe('success');
      expect(readLog.details).toContain('Marked notification');
    });

    it('increments the version number', () => {
      const before = getNotificationById('NOT-001');
      expect(before.data.version).toBe(1);
      markAsRead('NOT-001');
      const after = getNotificationById('NOT-001');
      expect(after.data.version).toBe(2);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications for a persona as read', () => {
      const result = markAllAsRead({ id: 'persona-platform-administrator' });
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);

      const allNotifs = listAllNotifications('persona-platform-administrator');
      allNotifs.forEach((n) => {
        expect(n.isRead).toBe(true);
      });
    });

    it('marks all unread notifications for a persona ID string', () => {
      const result = markAllAsRead('persona-quality-engineer');
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });

    it('returns 0 updated count when all are already read', () => {
      markAllAsRead('persona-platform-administrator');
      const result = markAllAsRead('persona-platform-administrator');
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
    });

    it('does not affect notifications for other personas', () => {
      markAllAsRead('persona-platform-administrator');
      const qeNotifs = listAllNotifications('persona-quality-engineer');
      const unreadQe = qeNotifs.filter((n) => n.isRead === false);
      expect(unreadQe.length).toBe(2);
    });

    it('returns error when no persona ID provided', () => {
      const result = markAllAsRead(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Persona ID is required');
    });

    it('creates an audit log entry on successful mark all as read', () => {
      markAllAsRead('persona-platform-administrator');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const markAllLog = auditLogs.find(
        (log) =>
          log.action === 'update' &&
          log.entityType === 'NOTIFICATION' &&
          log.entityId === 'persona-platform-administrator'
      );
      expect(markAllLog).toBeDefined();
      expect(markAllLog.status).toBe('success');
      expect(markAllLog.details).toContain('notification(s) as read');
    });
  });

  describe('simulateNotification', () => {
    it('creates a notification with the correct trigger', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.STANDARD_EXPIRING, {
        recipientId: 'persona-platform-administrator',
        entityName: 'React 18.x',
        entityType: 'TECH_STANDARD',
        entityId: 'TS-001',
      });
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.trigger).toBe('standard_expiring');
      expect(result.data.simulated).toBe(true);
    });

    it('creates a notification with correct type based on trigger', () => {
      const errorResult = simulateNotification(NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Code Coverage',
      });
      expect(errorResult.data.type).toBe('error');

      const warningResult = simulateNotification(NOTIFICATION_TRIGGERS.STANDARD_EXPIRING, {
        recipientId: 'persona-platform-administrator',
        entityName: 'React 18.x',
      });
      expect(warningResult.data.type).toBe('warning');

      const successResult = simulateNotification(NOTIFICATION_TRIGGERS.APPROVAL_GRANTED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Request A',
      });
      expect(successResult.data.type).toBe('success');

      const actionResult = simulateNotification(NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Request B',
      });
      expect(actionResult.data.type).toBe('action_required');
    });

    it('creates a notification with correct priority based on trigger', () => {
      const criticalResult = simulateNotification(NOTIFICATION_TRIGGERS.GOVERNANCE_VIOLATION, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Violation A',
      });
      expect(criticalResult.data.priority).toBe('critical');

      const highResult = simulateNotification(NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Gate A',
      });
      expect(highResult.data.priority).toBe('high');

      const mediumResult = simulateNotification(NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Debt A',
      });
      expect(mediumResult.data.priority).toBe('medium');

      const lowResult = simulateNotification(NOTIFICATION_TRIGGERS.AI_ANALYSIS_COMPLETE, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Analysis A',
      });
      expect(lowResult.data.priority).toBe('low');
    });

    it('creates a notification with a generated ID', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.TECH_DEBT_RESOLVED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Debt Item',
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.id.startsWith('NOT-')).toBe(true);
    });

    it('creates a notification with isRead set to false', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.STANDARD_EXPIRED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Old Standard',
      });
      expect(result.data.isRead).toBe(false);
      expect(result.data.readAt).toBeNull();
    });

    it('persists the notification to localStorage', () => {
      const beforeCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)).length;
      simulateNotification(NOTIFICATION_TRIGGERS.WAIVER_EXPIRING, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Waiver A',
      });
      const afterCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)).length;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('uses active persona as recipient when no recipientId provided', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED, {
        entityName: 'Debt Item',
      });
      expect(result.success).toBe(true);
      expect(result.data.recipientId).toBeDefined();
      expect(typeof result.data.recipientId).toBe('string');
      expect(result.data.recipientId.length).toBeGreaterThan(0);
    });

    it('builds a message containing the entity name', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.STANDARD_EXPIRING, {
        recipientId: 'persona-platform-administrator',
        entityName: 'React 18.x Framework',
      });
      expect(result.data.message).toContain('React 18.x Framework');
    });

    it('builds a title based on the trigger', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.QUALITY_GATE_PASSED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Code Coverage',
      });
      expect(result.data.title).toBe('Quality Gate Passed');
    });

    it('sets relatedEntityType and relatedEntityId from context', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.INTEGRATION_SYNC_FAILED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Jira Integration',
        entityType: 'INTEGRATION',
        entityId: 'INT-001',
      });
      expect(result.data.relatedEntityType).toBe('INTEGRATION');
      expect(result.data.relatedEntityId).toBe('INT-001');
    });

    it('sets actionUrl from context', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.APPROVAL_REQUESTED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Request A',
        actionUrl: '/approvals/APR-002',
      });
      expect(result.data.actionUrl).toBe('/approvals/APR-002');
    });

    it('creates an audit log entry', () => {
      simulateNotification(NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Debt Item',
      });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const createLog = auditLogs.find(
        (log) => log.action === 'create' && log.entityType === 'NOTIFICATION'
      );
      expect(createLog).toBeDefined();
      expect(createLog.status).toBe('success');
      expect(createLog.details).toContain('Simulated notification');
      expect(createLog.details).toContain('tech_debt_created');
    });

    it('returns error for empty trigger', () => {
      const result = simulateNotification('', {
        recipientId: 'persona-platform-administrator',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
      expect(result.simulated).toBe(true);
    });

    it('returns error for null trigger', () => {
      const result = simulateNotification(null, {});
      expect(result.success).toBe(false);
      expect(result.simulated).toBe(true);
    });

    it('handles all 14 notification triggers', () => {
      const allTriggers = Object.values(NOTIFICATION_TRIGGERS);
      allTriggers.forEach((trigger) => {
        const result = simulateNotification(trigger, {
          recipientId: 'persona-platform-administrator',
          entityName: `Entity for ${trigger}`,
        });
        expect(result.success).toBe(true);
        expect(result.data.trigger).toBe(trigger);
        expect(result.data.simulated).toBe(true);
        expect(typeof result.data.title).toBe('string');
        expect(result.data.title.length).toBeGreaterThan(0);
        expect(typeof result.data.message).toBe('string');
        expect(result.data.message.length).toBeGreaterThan(0);
      });
    });

    it('handles unknown trigger gracefully', () => {
      const result = simulateNotification('unknown_trigger_xyz', {
        recipientId: 'persona-platform-administrator',
        entityName: 'Unknown Entity',
      });
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('info');
      expect(result.data.priority).toBe('low');
      expect(result.data.simulated).toBe(true);
    });
  });

  describe('sendSimulatedEmail', () => {
    it('generates an email preview for a notification object', () => {
      const notification = {
        id: 'NOT-001',
        title: 'Standard Expiring',
        message: 'Technology standard React 18.x is expiring in 30 days.',
        type: 'warning',
        trigger: 'standard_expiring',
        recipientId: 'persona-platform-administrator',
        priority: 'medium',
      };
      const result = sendSimulatedEmail(notification);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.preview).not.toBeNull();
      expect(result.preview.to).toContain('@kpetsip.example.com');
      expect(result.preview.from).toContain('notifications@kpetsip.example.com');
      expect(result.preview.subject).toContain('Standard Expiring');
      expect(result.preview.body).toContain('Technology standard React 18.x');
      expect(result.preview.sentAt).toBeDefined();
      expect(result.preview.channel).toBe('email');
      expect(result.preview.simulated).toBe(true);
      expect(result.preview.notificationId).toBe('NOT-001');
    });

    it('generates an email preview for a notification ID string', () => {
      const result = sendSimulatedEmail('NOT-002');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.preview).not.toBeNull();
      expect(result.preview.subject).toContain('Quality Gate Failed');
      expect(result.preview.notificationId).toBe('NOT-002');
    });

    it('returns error for non-existent notification ID', () => {
      const result = sendSimulatedEmail('NOT-999');
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.error).toContain('not found');
      expect(result.simulated).toBe(true);
    });

    it('returns error for invalid input', () => {
      const result = sendSimulatedEmail(null);
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.simulated).toBe(true);
    });

    it('returns error for object without id', () => {
      const result = sendSimulatedEmail({ title: 'No ID' });
      expect(result.success).toBe(false);
      expect(result.simulated).toBe(true);
    });

    it('creates an audit log entry for simulated email', () => {
      sendSimulatedEmail('NOT-001');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const emailLog = auditLogs.find(
        (log) =>
          log.action === 'execute' &&
          log.entityType === 'NOTIFICATION' &&
          log.entityId === 'NOT-001'
      );
      expect(emailLog).toBeDefined();
      expect(emailLog.status).toBe('success');
      expect(emailLog.details).toContain('Email notification sent (simulated)');
      expect(emailLog.newValues.channel).toBe('email');
      expect(emailLog.newValues.simulated).toBe(true);
    });

    it('includes HTML body in the preview', () => {
      const result = sendSimulatedEmail('NOT-001');
      expect(result.preview.htmlBody).toBeDefined();
      expect(result.preview.htmlBody).toContain('Standard Expiring');
      expect(result.preview.htmlBody).toContain('simulated');
    });

    it('includes recipient email address derived from recipientId', () => {
      const result = sendSimulatedEmail('NOT-001');
      expect(result.preview.to).toContain('persona-platform-administrator');
    });
  });

  describe('sendSimulatedTeams', () => {
    it('generates a Teams preview for a notification object', () => {
      const notification = {
        id: 'NOT-002',
        title: 'Quality Gate Failed',
        message: 'Quality gate Code Coverage has failed.',
        type: 'error',
        trigger: 'quality_gate_failed',
        recipientId: 'persona-platform-administrator',
        priority: 'high',
        actionUrl: '/quality-gates/QG-001',
      };
      const result = sendSimulatedTeams(notification);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.preview).not.toBeNull();
      expect(result.preview.channel).toContain('#kp-etsip-notifications');
      expect(result.preview.channelType).toBe('teams');
      expect(result.preview.sentAt).toBeDefined();
      expect(result.preview.simulated).toBe(true);
      expect(result.preview.notificationId).toBe('NOT-002');
    });

    it('generates a Teams preview for a notification ID string', () => {
      const result = sendSimulatedTeams('NOT-001');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.preview).not.toBeNull();
      expect(result.preview.notificationId).toBe('NOT-001');
    });

    it('includes a MessageCard with sections', () => {
      const result = sendSimulatedTeams('NOT-002');
      expect(result.preview.card).toBeDefined();
      expect(result.preview.card['@type']).toBe('MessageCard');
      expect(result.preview.card.sections).toBeDefined();
      expect(Array.isArray(result.preview.card.sections)).toBe(true);
      expect(result.preview.card.sections.length).toBeGreaterThan(0);
    });

    it('includes facts in the card section', () => {
      const result = sendSimulatedTeams('NOT-002');
      const section = result.preview.card.sections[0];
      expect(section.facts).toBeDefined();
      expect(Array.isArray(section.facts)).toBe(true);
      const triggerFact = section.facts.find((f) => f.name === 'Trigger');
      expect(triggerFact).toBeDefined();
      expect(triggerFact.value).toBe('quality_gate_failed');
      const simulatedFact = section.facts.find((f) => f.name === 'Simulated');
      expect(simulatedFact).toBeDefined();
      expect(simulatedFact.value).toBe('Yes');
    });

    it('includes potentialAction with actionUrl when present', () => {
      const notification = {
        id: 'NOT-002',
        title: 'Quality Gate Failed',
        message: 'Quality gate failed.',
        type: 'error',
        trigger: 'quality_gate_failed',
        recipientId: 'persona-platform-administrator',
        priority: 'high',
        actionUrl: '/quality-gates/QG-001',
      };
      const result = sendSimulatedTeams(notification);
      expect(result.preview.card.potentialAction).toBeDefined();
      expect(result.preview.card.potentialAction.length).toBeGreaterThan(0);
    });

    it('has empty potentialAction when no actionUrl', () => {
      const notification = {
        id: 'NOT-003',
        title: 'Test',
        message: 'Test message.',
        type: 'info',
        trigger: 'standard_expiring',
        recipientId: 'persona-platform-administrator',
        priority: 'low',
      };
      const result = sendSimulatedTeams(notification);
      expect(result.preview.card.potentialAction).toEqual([]);
    });

    it('sets theme color based on priority', () => {
      const highPriority = {
        id: 'NOT-002',
        title: 'High Priority',
        message: 'High priority notification.',
        type: 'error',
        trigger: 'quality_gate_failed',
        recipientId: 'persona-platform-administrator',
        priority: 'high',
      };
      const result = sendSimulatedTeams(highPriority);
      expect(result.preview.card.themeColor).toBe('#f97316');

      const criticalPriority = {
        id: 'NOT-010',
        title: 'Critical Priority',
        message: 'Critical priority notification.',
        type: 'error',
        trigger: 'governance_violation',
        recipientId: 'persona-platform-administrator',
        priority: 'critical',
      };
      const criticalResult = sendSimulatedTeams(criticalPriority);
      expect(criticalResult.preview.card.themeColor).toBe('#ef4444');
    });

    it('returns error for non-existent notification ID', () => {
      const result = sendSimulatedTeams('NOT-999');
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.error).toContain('not found');
      expect(result.simulated).toBe(true);
    });

    it('returns error for invalid input', () => {
      const result = sendSimulatedTeams(null);
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.simulated).toBe(true);
    });

    it('creates an audit log entry for simulated Teams message', () => {
      sendSimulatedTeams('NOT-001');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const teamsLog = auditLogs.find(
        (log) =>
          log.action === 'execute' &&
          log.entityType === 'NOTIFICATION' &&
          log.entityId === 'NOT-001' &&
          log.newValues &&
          log.newValues.channel === 'teams'
      );
      expect(teamsLog).toBeDefined();
      expect(teamsLog.status).toBe('success');
      expect(teamsLog.details).toContain('Teams notification sent (simulated)');
      expect(teamsLog.newValues.simulated).toBe(true);
    });
  });

  describe('removeNotification', () => {
    it('removes an existing notification', () => {
      const result = removeNotification('NOT-001');
      expect(result.success).toBe(true);

      const readResult = getNotificationById('NOT-001');
      expect(readResult.success).toBe(false);
    });

    it('returns error for non-existent notification', () => {
      const result = removeNotification('NOT-999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for empty ID', () => {
      const result = removeNotification('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('creates an audit log entry on successful delete', () => {
      removeNotification('NOT-001');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deleteLog = auditLogs.find(
        (log) => log.action === 'delete' && log.entityType === 'NOTIFICATION' && log.entityId === 'NOT-001'
      );
      expect(deleteLog).toBeDefined();
      expect(deleteLog.status).toBe('success');
    });

    it('reduces the total notification count', () => {
      const beforeCount = getCount();
      removeNotification('NOT-001');
      const afterCount = getCount();
      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('getCount', () => {
    it('returns total count of all notifications', () => {
      const count = getCount();
      expect(count).toBe(6);
    });

    it('returns count filtered by recipientId', () => {
      const count = getCount('persona-platform-administrator');
      expect(count).toBe(4);
    });

    it('returns 0 for non-existent recipientId', () => {
      const count = getCount('persona-nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count for a persona object', () => {
      const count = getUnreadCount({ id: 'persona-platform-administrator' });
      expect(count).toBe(3);
    });

    it('returns unread count for a persona ID string', () => {
      const count = getUnreadCount('persona-quality-engineer');
      expect(count).toBe(2);
    });

    it('returns 0 for persona with no unread notifications', () => {
      markAllAsRead('persona-platform-administrator');
      const count = getUnreadCount('persona-platform-administrator');
      expect(count).toBe(0);
    });

    it('returns 0 for null persona', () => {
      const count = getUnreadCount(null);
      expect(count).toBe(0);
    });

    it('returns 0 for empty string persona', () => {
      const count = getUnreadCount('');
      expect(count).toBe(0);
    });

    it('decreases after marking a notification as read', () => {
      const before = getUnreadCount('persona-platform-administrator');
      markAsRead('NOT-001');
      const after = getUnreadCount('persona-platform-administrator');
      expect(after).toBe(before - 1);
    });
  });

  describe('getAvailableTriggers', () => {
    it('returns all distinct trigger types', () => {
      const triggers = getAvailableTriggers();
      expect(Array.isArray(triggers)).toBe(true);
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('returns sorted triggers', () => {
      const triggers = getAvailableTriggers();
      for (let i = 1; i < triggers.length; i++) {
        expect(triggers[i].localeCompare(triggers[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('includes expected trigger types from seeded data', () => {
      const triggers = getAvailableTriggers();
      expect(triggers).toContain('standard_expiring');
      expect(triggers).toContain('quality_gate_failed');
      expect(triggers).toContain('approval_granted');
      expect(triggers).toContain('tech_debt_created');
      expect(triggers).toContain('integration_sync_failed');
      expect(triggers).toContain('ai_analysis_complete');
    });
  });

  describe('getAvailableTypes', () => {
    it('returns all distinct notification types', () => {
      const types = getAvailableTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('returns sorted types', () => {
      const types = getAvailableTypes();
      for (let i = 1; i < types.length; i++) {
        expect(types[i].localeCompare(types[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('includes expected notification types from seeded data', () => {
      const types = getAvailableTypes();
      expect(types).toContain('warning');
      expect(types).toContain('error');
      expect(types).toContain('success');
    });
  });

  describe('getSummary', () => {
    it('returns a summary for a persona object', () => {
      const summary = getSummary({ id: 'persona-platform-administrator' });
      expect(summary.total).toBe(4);
      expect(summary.unread).toBe(3);
      expect(summary.read).toBe(1);
      expect(typeof summary.byType).toBe('object');
      expect(typeof summary.byPriority).toBe('object');
    });

    it('returns a summary for a persona ID string', () => {
      const summary = getSummary('persona-quality-engineer');
      expect(summary.total).toBe(2);
      expect(summary.unread).toBe(2);
      expect(summary.read).toBe(0);
    });

    it('returns type breakdown', () => {
      const summary = getSummary('persona-platform-administrator');
      expect(summary.byType.warning).toBe(1);
      expect(summary.byType.error).toBe(1);
      expect(summary.byType.success).toBe(2);
    });

    it('returns priority breakdown', () => {
      const summary = getSummary('persona-platform-administrator');
      expect(summary.byPriority.medium).toBe(1);
      expect(summary.byPriority.high).toBe(1);
      expect(summary.byPriority.low).toBe(2);
    });

    it('returns empty summary for null persona', () => {
      const summary = getSummary(null);
      expect(summary.total).toBe(0);
      expect(summary.unread).toBe(0);
      expect(summary.read).toBe(0);
    });

    it('returns empty summary for non-existent persona', () => {
      const summary = getSummary('persona-nonexistent');
      expect(summary.total).toBe(0);
    });

    it('updates after marking notifications as read', () => {
      const before = getSummary('persona-platform-administrator');
      expect(before.unread).toBe(3);
      markAllAsRead('persona-platform-administrator');
      const after = getSummary('persona-platform-administrator');
      expect(after.unread).toBe(0);
      expect(after.read).toBe(4);
    });
  });

  describe('simulateMultiChannelNotification', () => {
    it('creates notification and generates email and teams previews', () => {
      const result = simulateMultiChannelNotification(NOTIFICATION_TRIGGERS.QUALITY_GATE_FAILED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Code Coverage Gate',
        entityType: 'QUALITY_GATE',
        entityId: 'QG-002',
      });
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.notification).not.toBeNull();
      expect(result.notification.trigger).toBe('quality_gate_failed');
      expect(result.notification.simulated).toBe(true);
      expect(result.emailPreview).not.toBeNull();
      expect(result.emailPreview.channel).toBe('email');
      expect(result.emailPreview.simulated).toBe(true);
      expect(result.teamsPreview).not.toBeNull();
      expect(result.teamsPreview.channelType).toBe('teams');
      expect(result.teamsPreview.simulated).toBe(true);
    });

    it('returns error for empty trigger', () => {
      const result = simulateMultiChannelNotification('', {
        recipientId: 'persona-platform-administrator',
      });
      expect(result.success).toBe(false);
      expect(result.notification).toBeNull();
      expect(result.simulated).toBe(true);
    });

    it('creates audit log entries for all channels', () => {
      simulateMultiChannelNotification(NOTIFICATION_TRIGGERS.STANDARD_EXPIRING, {
        recipientId: 'persona-platform-administrator',
        entityName: 'React 18.x',
      });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));

      const createLog = auditLogs.find(
        (log) => log.action === 'create' && log.entityType === 'NOTIFICATION'
      );
      expect(createLog).toBeDefined();

      const emailLog = auditLogs.find(
        (log) =>
          log.action === 'execute' &&
          log.entityType === 'NOTIFICATION' &&
          log.newValues &&
          log.newValues.channel === 'email'
      );
      expect(emailLog).toBeDefined();

      const teamsLog = auditLogs.find(
        (log) =>
          log.action === 'execute' &&
          log.entityType === 'NOTIFICATION' &&
          log.newValues &&
          log.newValues.channel === 'teams'
      );
      expect(teamsLog).toBeDefined();
    });
  });

  describe('persona-based notification routing', () => {
    it('notifications are only visible to the correct persona', () => {
      const adminNotifs = listAllNotifications('persona-platform-administrator');
      const qeNotifs = listAllNotifications('persona-quality-engineer');

      adminNotifs.forEach((n) => {
        expect(n.recipientId).toBe('persona-platform-administrator');
      });
      qeNotifs.forEach((n) => {
        expect(n.recipientId).toBe('persona-quality-engineer');
      });

      const adminIds = new Set(adminNotifs.map((n) => n.id));
      const qeIds = new Set(qeNotifs.map((n) => n.id));
      qeIds.forEach((id) => {
        expect(adminIds.has(id)).toBe(false);
      });
    });

    it('marking as read for one persona does not affect another', () => {
      markAsRead('NOT-001');
      const qeNotifs = listAllNotifications('persona-quality-engineer');
      const unreadQe = qeNotifs.filter((n) => n.isRead === false);
      expect(unreadQe.length).toBe(2);
    });

    it('simulated notification is routed to the specified recipient', () => {
      const result = simulateNotification(NOTIFICATION_TRIGGERS.TECH_DEBT_CREATED, {
        recipientId: 'persona-quality-engineer',
        entityName: 'New Debt',
      });
      expect(result.data.recipientId).toBe('persona-quality-engineer');

      const qeNotifs = listAllNotifications('persona-quality-engineer');
      const found = qeNotifs.find((n) => n.id === result.data.id);
      expect(found).toBeDefined();

      const adminNotifs = listAllNotifications('persona-platform-administrator');
      const notFound = adminNotifs.find((n) => n.id === result.data.id);
      expect(notFound).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty notifications array', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      const result = listNotifications({ id: 'persona-platform-administrator' });
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('handles missing notifications key in localStorage', () => {
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      const result = listNotifications({ id: 'persona-platform-administrator' });
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('handles invalid JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, 'not valid json');
      const result = listNotifications({ id: 'persona-platform-administrator' });
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('getAvailableTriggers returns empty array with no data', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      const triggers = getAvailableTriggers();
      expect(triggers).toEqual([]);
    });

    it('getAvailableTypes returns empty array with no data', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      const types = getAvailableTypes();
      expect(types).toEqual([]);
    });

    it('getSummary returns valid summary with empty data', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      const summary = getSummary('persona-platform-administrator');
      expect(summary.total).toBe(0);
      expect(summary.unread).toBe(0);
      expect(summary.read).toBe(0);
    });

    it('getUnreadCount returns 0 with empty data', () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      const count = getUnreadCount('persona-platform-administrator');
      expect(count).toBe(0);
    });

    it('simulateNotification with all triggers creates unique IDs', () => {
      const ids = new Set();
      const allTriggers = Object.values(NOTIFICATION_TRIGGERS);
      allTriggers.forEach((trigger) => {
        const result = simulateNotification(trigger, {
          recipientId: 'persona-platform-administrator',
          entityName: `Entity ${trigger}`,
        });
        expect(ids.has(result.data.id)).toBe(false);
        ids.add(result.data.id);
      });
      expect(ids.size).toBe(allTriggers.length);
    });

    it('sendSimulatedEmail and sendSimulatedTeams work on same notification', () => {
      const emailResult = sendSimulatedEmail('NOT-001');
      const teamsResult = sendSimulatedTeams('NOT-001');
      expect(emailResult.success).toBe(true);
      expect(teamsResult.success).toBe(true);
      expect(emailResult.preview.notificationId).toBe('NOT-001');
      expect(teamsResult.preview.notificationId).toBe('NOT-001');
    });

    it('listNotifications with combined filters', () => {
      const result = listNotifications(
        { id: 'persona-platform-administrator' },
        {
          type: 'warning',
          trigger: 'standard_expiring',
          unreadOnly: true,
          search: 'expiring',
          page: 1,
          pageSize: 10,
        }
      );
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('NOT-001');
    });
  });

  describe('audit logging', () => {
    it('markAsRead logs with correct entity type and action', () => {
      markAsRead('NOT-002');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'NOT-002' && l.action === 'update' && l.entityType === 'NOTIFICATION'
      );
      expect(log).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.userName).toBeDefined();
      expect(log.timestamp).toBeDefined();
    });

    it('simulateNotification logs with simulated flag in details', () => {
      simulateNotification(NOTIFICATION_TRIGGERS.WAIVER_EXPIRED, {
        recipientId: 'persona-platform-administrator',
        entityName: 'Expired Waiver',
      });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.action === 'create' && l.entityType === 'NOTIFICATION' && l.details.includes('Simulated')
      );
      expect(log).toBeDefined();
      expect(log.newValues.simulated).toBe(true);
    });

    it('removeNotification logs with previous values', () => {
      removeNotification('NOT-003');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) => l.entityId === 'NOT-003' && l.action === 'delete' && l.entityType === 'NOTIFICATION'
      );
      expect(log).toBeDefined();
      expect(log.previousValues).toBeDefined();
      expect(log.previousValues.id).toBe('NOT-003');
    });

    it('sendSimulatedEmail logs entity name', () => {
      sendSimulatedEmail('NOT-001');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) =>
          l.entityId === 'NOT-001' &&
          l.action === 'execute' &&
          l.newValues &&
          l.newValues.channel === 'email'
      );
      expect(log).toBeDefined();
      expect(log.entityName).toBeDefined();
      expect(typeof log.entityName).toBe('string');
      expect(log.entityName.length).toBeGreaterThan(0);
    });

    it('sendSimulatedTeams logs entity name', () => {
      sendSimulatedTeams('NOT-002');
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find(
        (l) =>
          l.entityId === 'NOT-002' &&
          l.action === 'execute' &&
          l.newValues &&
          l.newValues.channel === 'teams'
      );
      expect(log).toBeDefined();
      expect(log.entityName).toBeDefined();
      expect(typeof log.entityName).toBe('string');
      expect(log.entityName.length).toBeGreaterThan(0);
    });
  });
});