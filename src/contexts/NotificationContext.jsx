import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  listNotifications,
  markAsRead as serviceMarkAsRead,
  markAllAsRead as serviceMarkAllAsRead,
  simulateNotification,
  getUnreadCount,
  getSummary,
  getNotificationById,
  removeNotification,
} from '../services/notificationService';
import { getActivePersona } from '../services/personaManager';

/**
 * @typedef {Object} NotificationContextValue
 * @property {Array<Object>} notifications - The current list of notifications for the active persona.
 * @property {number} unreadCount - Count of unread notifications for the active persona.
 * @property {number} total - Total number of notifications for the active persona.
 * @property {number} totalPages - Total number of pages available.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of notifications per page.
 * @property {boolean} loading - Whether notifications are currently being loaded.
 * @property {string|null} error - Error message if the last operation failed.
 * @property {{ total: number, unread: number, read: number, byType: Object<string, number>, byPriority: Object<string, number> }} summary - Notification summary statistics.
 * @property {function(string): { success: boolean, data: Object|null, error: string|null }} markAsRead - Marks a single notification as read by ID.
 * @property {function(): { success: boolean, updatedCount: number, error: string|null }} markAllAsRead - Marks all notifications as read for the active persona.
 * @property {function(string, Object=): { success: boolean, data: Object|null, error: string|null, simulated: boolean }} addNotification - Simulates creating a new notification with the given trigger and context.
 * @property {function(string): { success: boolean, error: string|null }} removeNotification - Removes a notification by ID.
 * @property {function(Object=): void} refreshNotifications - Refreshes the notification list with optional filters.
 * @property {function(Object): void} setFilters - Updates the current filters and refreshes.
 * @property {Object} filters - The current active filters.
 */

const NotificationContext = createContext(null);

/**
 * Resolves the current persona for notification operations.
 * @returns {{ id: string, name: string, accessLevel: string } | null}
 */
const resolvePersona = () => {
  try {
    const persona = getActivePersona();
    if (persona && typeof persona.id === 'string' && persona.id.trim() !== '') {
      return persona;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * NotificationProvider wraps the application and provides notification state,
 * actions, and summary data to all child components.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement}
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byType: {},
    byPriority: {},
  });
  const [filters, setFiltersState] = useState({});

  /**
   * Loads notifications for the active persona with the given filters.
   * @param {Object} [activeFilters={}] - Optional filters to apply.
   */
  const loadNotifications = useCallback((activeFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const persona = resolvePersona();
      if (!persona) {
        setNotifications([]);
        setUnreadCount(0);
        setTotal(0);
        setTotalPages(0);
        setSummary({ total: 0, unread: 0, read: 0, byType: {}, byPriority: {} });
        setLoading(false);
        return;
      }

      const mergedFilters = {
        ...activeFilters,
        page: activeFilters.page || page,
        pageSize: activeFilters.pageSize || pageSize,
      };

      const result = listNotifications(persona, mergedFilters);

      setNotifications(Array.isArray(result.data) ? result.data : []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
      setPage(result.page || 1);

      // Update unread count
      try {
        const count = getUnreadCount(persona);
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }

      // Update summary
      try {
        const summaryData = getSummary(persona);
        setSummary(summaryData);
      } catch {
        setSummary({ total: 0, unread: 0, read: 0, byType: {}, byPriority: {} });
      }
    } catch (err) {
      setError(err && err.message ? err.message : 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up periodic refresh for unread count and notifications
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const persona = resolvePersona();
        if (persona) {
          const count = getUnreadCount(persona);
          setUnreadCount(count);

          const summaryData = getSummary(persona);
          setSummary(summaryData);
        }
      } catch {
        // Silently ignore errors during periodic refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshNotifications = useCallback((newFilters) => {
    const activeFilters = newFilters || filters;
    loadNotifications(activeFilters);
  }, [filters, loadNotifications]);

  const setFilters = useCallback((newFilters) => {
    if (!newFilters || typeof newFilters !== 'object' || Array.isArray(newFilters)) {
      return;
    }
    setFiltersState(newFilters);
    loadNotifications(newFilters);
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback((notificationId) => {
    if (typeof notificationId !== 'string' || notificationId.trim() === '') {
      return { success: false, data: null, error: 'Notification ID must be a non-empty string' };
    }

    try {
      const result = serviceMarkAsRead(notificationId);

      if (result.success) {
        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((n) => {
            if (n && n.id === notificationId) {
              return { ...n, isRead: true, readAt: new Date().toISOString() };
            }
            return n;
          })
        );

        // Update unread count
        try {
          const persona = resolvePersona();
          if (persona) {
            const count = getUnreadCount(persona);
            setUnreadCount(count);

            const summaryData = getSummary(persona);
            setSummary(summaryData);
          }
        } catch {
          // Silently ignore count refresh errors
        }
      }

      return result;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err && err.message ? err.message : 'Failed to mark notification as read',
      };
    }
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    try {
      const persona = resolvePersona();
      if (!persona) {
        return { success: false, updatedCount: 0, error: 'No active persona' };
      }

      const result = serviceMarkAllAsRead(persona);

      if (result.success) {
        // Update local state optimistically
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) => {
            if (n && n.isRead === false) {
              return { ...n, isRead: true, readAt: now };
            }
            return n;
          })
        );

        setUnreadCount(0);

        // Update summary
        try {
          const summaryData = getSummary(persona);
          setSummary(summaryData);
        } catch {
          // Silently ignore summary refresh errors
        }
      }

      return result;
    } catch (err) {
      return {
        success: false,
        updatedCount: 0,
        error: err && err.message ? err.message : 'Failed to mark all notifications as read',
      };
    }
  }, []);

  const handleAddNotification = useCallback((trigger, data = {}) => {
    if (typeof trigger !== 'string' || trigger.trim() === '') {
      return {
        success: false,
        data: null,
        error: 'Trigger must be a non-empty string',
        simulated: true,
      };
    }

    try {
      const persona = resolvePersona();
      const contextData = {
        ...data,
      };

      // If no recipientId provided, use the active persona
      if (!contextData.recipientId && persona) {
        contextData.recipientId = persona.id;
      }

      const result = simulateNotification(trigger, contextData);

      if (result.success && result.data) {
        // Refresh notifications to include the new one
        loadNotifications(filters);
      }

      return result;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err && err.message ? err.message : 'Failed to add notification',
        simulated: true,
      };
    }
  }, [filters, loadNotifications]);

  const handleRemoveNotification = useCallback((notificationId) => {
    if (typeof notificationId !== 'string' || notificationId.trim() === '') {
      return { success: false, error: 'Notification ID must be a non-empty string' };
    }

    try {
      const result = removeNotification(notificationId);

      if (result.success) {
        // Update local state optimistically
        setNotifications((prev) => prev.filter((n) => n && n.id !== notificationId));
        setTotal((prev) => Math.max(0, prev - 1));

        // Update unread count and summary
        try {
          const persona = resolvePersona();
          if (persona) {
            const count = getUnreadCount(persona);
            setUnreadCount(count);

            const summaryData = getSummary(persona);
            setSummary(summaryData);
          }
        } catch {
          // Silently ignore count refresh errors
        }
      }

      return result;
    } catch (err) {
      return {
        success: false,
        error: err && err.message ? err.message : 'Failed to remove notification',
      };
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      total,
      totalPages,
      page,
      pageSize,
      loading,
      error,
      summary,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead,
      addNotification: handleAddNotification,
      removeNotification: handleRemoveNotification,
      refreshNotifications,
      setFilters,
      filters,
    }),
    [
      notifications,
      unreadCount,
      total,
      totalPages,
      page,
      pageSize,
      loading,
      error,
      summary,
      handleMarkAsRead,
      handleMarkAllAsRead,
      handleAddNotification,
      handleRemoveNotification,
      refreshNotifications,
      setFilters,
      filters,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the notification context.
 * Must be used within a NotificationProvider.
 *
 * @returns {NotificationContextValue} The notification context value.
 * @throws {Error} If used outside of a NotificationProvider.
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (context === null) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};

export default NotificationContext;