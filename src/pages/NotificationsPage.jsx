import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  sendSimulatedEmail,
  sendSimulatedTeams,
  getAvailableTriggers,
  getAvailableTypes,
  simulateNotification,
  getNotificationById,
} from '../services/notificationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

/**
 * Maps notification type to StatusBadge variant.
 * @param {string} type - The notification type.
 * @returns {string} The StatusBadge variant.
 */
const typeToVariant = (type) => {
  switch (type) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    case 'action_required':
      return 'info';
    case 'info':
    default:
      return 'neutral';
  }
};

/**
 * Maps notification priority to a color class for the priority indicator.
 * @param {string} priority - The notification priority.
 * @returns {string} Tailwind color class.
 */
const priorityColorClass = (priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-500 dark:bg-red-400';
    case 'high':
      return 'bg-orange-500 dark:bg-orange-400';
    case 'medium':
      return 'bg-yellow-500 dark:bg-yellow-400';
    case 'low':
    default:
      return 'bg-blue-500 dark:bg-blue-400';
  }
};

/**
 * Maps priority to StatusBadge variant.
 * @param {string} priority - The priority level.
 * @returns {string}
 */
const priorityToVariant = (priority) => {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
};

/**
 * Formats a timestamp for display.
 * @param {string} timestamp - ISO 8601 timestamp.
 * @returns {string} Formatted relative or absolute time string.
 */
const formatTimestamp = (timestamp) => {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    return '—';
  }
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
};

/**
 * Formats a trigger string for display.
 * @param {string} trigger - The trigger identifier.
 * @returns {string} Formatted trigger string.
 */
const formatTrigger = (trigger) => {
  if (typeof trigger !== 'string' || trigger.trim() === '') {
    return '—';
  }
  return trigger
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats the access level for display.
 * @param {string} accessLevel - The raw access level string.
 * @returns {string}
 */
const formatAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') {
    return '';
  }
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Number of notifications per page.
 * @type {number}
 */
const PAGE_SIZE = 20;

/**
 * Full notifications management page with list view, filtering by trigger type
 * and read/unread state, search, pagination, and simulated Email/Teams delivery previews.
 * Permission-gated actions. Accessible with ARIA landmarks.
 *
 * @returns {React.ReactElement}
 */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { persona, canView } = usePersona();
  const {
    notifications,
    unreadCount,
    total,
    loading: contextLoading,
    error: contextError,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [filterTrigger, setFilterTrigger] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Email/Teams preview state
  const [emailPreview, setEmailPreview] = useState(null);
  const [teamsPreview, setTeamsPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const hasViewPermission = useMemo(() => {
    return canView('NOTIFICATION');
  }, [canView]);

  // Available triggers and types for filter dropdowns
  const availableTriggers = useMemo(() => {
    try {
      return getAvailableTriggers();
    } catch {
      return [];
    }
  }, [notifications]);

  const availableTypes = useMemo(() => {
    try {
      return getAvailableTypes();
    } catch {
      return [];
    }
  }, [notifications]);

  const availablePriorities = useMemo(() => {
    const priorities = new Set();
    if (Array.isArray(notifications)) {
      notifications.forEach((n) => {
        if (n && n.priority) {
          priorities.add(n.priority);
        }
      });
    }
    return Array.from(priorities).sort();
  }, [notifications]);

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Refresh notifications on mount
  useEffect(() => {
    if (hasViewPermission) {
      refreshNotifications();
    }
  }, [hasViewPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Filters notifications based on current filter state.
   */
  const filteredNotifications = useMemo(() => {
    let result = Array.isArray(notifications) ? [...notifications] : [];

    if (showUnreadOnly) {
      result = result.filter((n) => n && n.isRead === false);
    }

    if (typeof filterTrigger === 'string' && filterTrigger.trim() !== '') {
      const triggerLower = filterTrigger.trim().toLowerCase();
      result = result.filter(
        (n) => n && n.trigger && n.trigger.toLowerCase() === triggerLower
      );
    }

    if (typeof filterType === 'string' && filterType.trim() !== '') {
      const typeLower = filterType.trim().toLowerCase();
      result = result.filter(
        (n) => n && n.type && n.type.toLowerCase() === typeLower
      );
    }

    if (typeof filterPriority === 'string' && filterPriority.trim() !== '') {
      const priorityLower = filterPriority.trim().toLowerCase();
      result = result.filter(
        (n) => n && n.priority && n.priority.toLowerCase() === priorityLower
      );
    }

    if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const searchLower = searchTerm.trim().toLowerCase();
      result = result.filter((n) => {
        if (!n) return false;
        const searchableFields = [n.title, n.message, n.trigger, n.type];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by createdAt descending (newest first)
    result.sort((a, b) => {
      const tsA = a && a.createdAt ? a.createdAt : '';
      const tsB = b && b.createdAt ? b.createdAt : '';
      return tsB.localeCompare(tsA);
    });

    return result;
  }, [notifications, showUnreadOnly, filterTrigger, filterType, filterPriority, searchTerm]);

  /**
   * Paginated notifications for the current page.
   */
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredNotifications, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  }, [filteredNotifications]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTrigger, filterType, filterPriority, showUnreadOnly, searchTerm]);

  const hasActiveFilters = filterTrigger !== '' || filterType !== '' || filterPriority !== '' || showUnreadOnly || searchTerm !== '';

  const handleClearFilters = useCallback(() => {
    setFilterTrigger('');
    setFilterType('');
    setFilterPriority('');
    setShowUnreadOnly(false);
    setSearchTerm('');
  }, []);

  const handleMarkAsRead = useCallback(
    (notificationId) => {
      if (typeof notificationId !== 'string' || notificationId.trim() === '') {
        return;
      }
      markAsRead(notificationId);
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    refreshNotifications();
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
  }, [refreshNotifications]);

  const handleSelectNotification = useCallback(
    (notification) => {
      if (!notification || !notification.id) {
        return;
      }
      setSelectedNotification(notification);
      setEmailPreview(null);
      setTeamsPreview(null);
      setPreviewError(null);
      setDetailModalOpen(true);

      // Mark as read when selected
      if (notification.isRead === false) {
        handleMarkAsRead(notification.id);
      }
    },
    [handleMarkAsRead]
  );

  const handleSelectNotificationKeyDown = useCallback(
    (event, notification) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelectNotification(notification);
      }
    },
    [handleSelectNotification]
  );

  const handleCloseDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedNotification(null);
    setEmailPreview(null);
    setTeamsPreview(null);
    setPreviewError(null);
  }, []);

  const handleSimulateEmail = useCallback(
    (notification) => {
      if (!notification || !notification.id) {
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const result = sendSimulatedEmail(notification);
        if (result.success && result.preview) {
          setEmailPreview(result.preview);
        } else {
          setPreviewError(result.error || 'Failed to simulate email');
        }
      } catch (err) {
        setPreviewError(err && err.message ? err.message : 'Failed to simulate email');
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  const handleSimulateTeams = useCallback(
    (notification) => {
      if (!notification || !notification.id) {
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const result = sendSimulatedTeams(notification);
        if (result.success && result.preview) {
          setTeamsPreview(result.preview);
        } else {
          setPreviewError(result.error || 'Failed to simulate Teams message');
        }
      } catch (err) {
        setPreviewError(err && err.message ? err.message : 'Failed to simulate Teams message');
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  const handlePageChange = useCallback((newPage) => {
    if (typeof newPage !== 'number' || newPage < 1) {
      return;
    }
    setCurrentPage(newPage);
  }, []);

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title="Access Denied — Notifications"
        entityType="NOTIFICATION"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading || contextLoading;

  if (isLoading && (!Array.isArray(notifications) || notifications.length === 0)) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading notifications"
      >
        <LoadingSpinner size="lg" label="Loading notifications..." />
      </div>
    );
  }

  if (contextError && (!Array.isArray(notifications) || notifications.length === 0)) {
    return (
      <EmptyState
        title="Unable to Load Notifications"
        message={contextError}
        actionLabel="Retry"
        onAction={handleRefresh}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-300 dark:text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        }
      />
    );
  }

  const startRecord = filteredNotifications.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(currentPage * PAGE_SIZE, filteredNotifications.length);

  return (
    <div className="space-y-6" role="region" aria-label="Notifications">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Notifications
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {total} notification{total !== 1 ? 's' : ''}
            <span className="mx-1.5">·</span>
            {unreadCount} unread
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
              aria-label="Mark all notifications as read"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Mark All Read</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
            aria-label="Refresh notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section aria-label="Notification summary" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-card dark:bg-neutral-800">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-card dark:bg-neutral-800">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Unread</p>
          <p className="mt-1 text-2xl font-bold text-primary-500">{unreadCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-card dark:bg-neutral-800">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Read</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{total - unreadCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-card dark:bg-neutral-800">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Filtered</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{filteredNotifications.length}</p>
        </div>
      </section>

      {/* Filters */}
      <section aria-label="Notification filters" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <label htmlFor="notification-search" className="sr-only">
              Search notifications
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-neutral-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="notification-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
                className="input pl-9 pr-8 text-sm"
                aria-label="Search notifications"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Unread only toggle */}
          <button
            type="button"
            onClick={() => setShowUnreadOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              showUnreadOnly
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600'
            }`}
            aria-pressed={showUnreadOnly}
            aria-label={showUnreadOnly ? 'Show all notifications' : 'Show unread only'}
          >
            <span className={`h-2 w-2 rounded-full ${showUnreadOnly ? 'bg-primary-500' : 'bg-neutral-400'}`} aria-hidden="true" />
            Unread Only
          </button>

          {/* Trigger filter */}
          <select
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value)}
            className="input py-1.5 text-xs max-w-[160px]"
            aria-label="Filter by trigger"
          >
            <option value="">All Triggers</option>
            {availableTriggers.map((trigger) => (
              <option key={trigger} value={trigger}>
                {formatTrigger(trigger)}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-1.5 text-xs max-w-[130px]"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input py-1.5 text-xs max-w-[130px]"
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            {availablePriorities.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No Matching Notifications' : 'No Notifications'}
          message={
            hasActiveFilters
              ? 'No notifications match your current filters. Try adjusting your search or filter criteria.'
              : 'No notifications are available for your persona.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Refresh'}
          onAction={hasActiveFilters ? handleClearFilters : handleRefresh}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          }
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          {/* List header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Notifications
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {filteredNotifications.length} result{filteredNotifications.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </span>
          </div>

          {/* Notification items */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700" role="list" aria-label="Notification list">
            {paginatedNotifications.map((notification) => {
              if (!notification || !notification.id) {
                return null;
              }

              const isUnread = notification.isRead === false;

              return (
                <div
                  key={notification.id}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => handleSelectNotification(notification)}
                  onKeyDown={(e) => handleSelectNotificationKeyDown(e, notification)}
                  className={`flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 ${
                    isUnread ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                  }`}
                  aria-label={`${isUnread ? 'Unread: ' : ''}${notification.title || 'Notification'}. ${formatTimestamp(notification.createdAt)}`}
                >
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 pt-1.5">
                    {isUnread ? (
                      <span
                        className={`block h-2.5 w-2.5 rounded-full ${priorityColorClass(notification.priority)}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="block h-2.5 w-2.5" aria-hidden="true" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          isUnread
                            ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                            : 'font-medium text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {notification.title || 'Notification'}
                      </p>
                      <span className="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {notification.message || ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge
                        status={notification.type || 'info'}
                        variant={typeToVariant(notification.type)}
                        size="sm"
                      />
                      <StatusBadge
                        status={notification.priority || 'low'}
                        variant={priorityToVariant(notification.priority)}
                        size="sm"
                      />
                      {notification.trigger && (
                        <span className="truncate text-2xs text-neutral-400 dark:text-neutral-500">
                          {formatTrigger(notification.trigger)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {/* Mark as read button */}
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        className="flex-shrink-0 rounded p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-600 dark:hover:text-neutral-300"
                        aria-label={`Mark "${notification.title || 'notification'}" as read`}
                        title="Mark as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}

                    {/* View detail arrow */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 flex-shrink-0 text-neutral-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3 dark:border-neutral-700 sm:flex-row">
            {/* Record count info */}
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {filteredNotifications.length > 0 ? (
                <span>
                  Showing <span className="font-medium text-neutral-700 dark:text-neutral-200">{startRecord}</span> to{' '}
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">{endRecord}</span> of{' '}
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">{filteredNotifications.length}</span> results
                </span>
              ) : (
                <span>No results</span>
              )}
            </div>

            {/* Pagination controls */}
            <nav aria-label="Notification pagination" className="flex items-center gap-1">
              {/* First page */}
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to first page"
                title="First page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Previous page */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to previous page"
                title="Previous page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Page indicator */}
              <span className="flex items-center px-2 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{currentPage}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </span>

              {/* Next page */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to next page"
                title="Next page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Last page */}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to last page"
                title="Last page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        title="Notification Detail"
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-4">
            {/* Title and badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge
                  status={selectedNotification.type || 'info'}
                  variant={typeToVariant(selectedNotification.type)}
                  size="sm"
                />
                <StatusBadge
                  status={selectedNotification.priority || 'low'}
                  variant={priorityToVariant(selectedNotification.priority)}
                  size="sm"
                />
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
                    selectedNotification.isRead
                      ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                      : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  }`}
                >
                  {selectedNotification.isRead ? 'Read' : 'Unread'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {selectedNotification.title || 'Notification'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {formatTimestamp(selectedNotification.createdAt)}
              </p>
            </div>

            {/* Message */}
            <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/50">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {selectedNotification.message || ''}
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-1.5">
              {selectedNotification.trigger && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">Trigger:</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {formatTrigger(selectedNotification.trigger)}
                  </span>
                </div>
              )}
              {selectedNotification.relatedEntityType && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">Related Entity:</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {selectedNotification.relatedEntityType}
                    {selectedNotification.relatedEntityId ? ` (${selectedNotification.relatedEntityId})` : ''}
                  </span>
                </div>
              )}
              {selectedNotification.recipientId && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">Recipient:</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {selectedNotification.recipientId}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">ID:</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                  {selectedNotification.id}
                </span>
              </div>
              {selectedNotification.readAt && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">Read At:</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {formatTimestamp(selectedNotification.readAt)}
                  </span>
                </div>
              )}
              {selectedNotification.actionUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">Action URL:</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseDetail();
                      navigate(selectedNotification.actionUrl);
                    }}
                    className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    {selectedNotification.actionUrl}
                  </button>
                </div>
              )}
            </div>

            {/* Simulated channel actions */}
            <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                Simulate Delivery
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateEmail(selectedNotification)}
                  disabled={previewLoading}
                  className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Simulate email delivery"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateTeams(selectedNotification)}
                  disabled={previewLoading}
                  className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Simulate Teams delivery"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Teams</span>
                </button>
              </div>

              {previewLoading && (
                <div className="mt-3">
                  <LoadingSpinner size="sm" label="Generating preview..." />
                </div>
              )}

              {previewError && (
                <div
                  className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  role="alert"
                >
                  {previewError}
                </div>
              )}

              {/* Email preview */}
              {emailPreview && (
                <div className="mt-3 space-y-2" role="region" aria-label="Simulated email preview">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Email Preview
                    </h5>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      sent (simulated)
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2">
                        <span className="font-medium text-neutral-500 dark:text-neutral-400">To:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{emailPreview.to}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-neutral-500 dark:text-neutral-400">From:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{emailPreview.from}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-neutral-500 dark:text-neutral-400">Subject:</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{emailPreview.subject}</span>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {emailPreview.body}
                      </p>
                    </div>
                    <div className="mt-2 text-2xs text-neutral-400 dark:text-neutral-500">
                      Sent at: {formatTimestamp(emailPreview.sentAt)}
                    </div>
                  </div>
                </div>
              )}

              {/* Teams preview */}
              {teamsPreview && (
                <div className="mt-3 space-y-2" role="region" aria-label="Simulated Teams preview">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Teams Preview
                    </h5>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      sent (simulated)
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2">
                        <span className="font-medium text-neutral-500 dark:text-neutral-400">Channel:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{teamsPreview.channel}</span>
                      </div>
                      {teamsPreview.card && teamsPreview.card.sections && teamsPreview.card.sections[0] && (
                        <>
                          <div className="flex gap-2">
                            <span className="font-medium text-neutral-500 dark:text-neutral-400">Title:</span>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {teamsPreview.card.sections[0].activityTitle}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {teamsPreview.card.sections[0].text}
                            </p>
                          </div>
                          {Array.isArray(teamsPreview.card.sections[0].facts) && (
                            <div className="mt-2 space-y-0.5">
                              {teamsPreview.card.sections[0].facts.map((fact, idx) => (
                                <div key={idx} className="flex gap-2 text-2xs">
                                  <span className="font-medium text-neutral-400 dark:text-neutral-500">
                                    {fact.name}:
                                  </span>
                                  <span className="text-neutral-600 dark:text-neutral-400">
                                    {fact.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-2xs text-neutral-400 dark:text-neutral-500">
                      Sent at: {formatTimestamp(teamsPreview.sentAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All notifications are simulated. Email and Teams delivery previews are generated locally.
          No real messages are sent. Persona: {persona.name}.
        </p>
      </footer>
    </div>
  );
};

export default NotificationsPage;