import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNotifications } from '../../contexts/NotificationContext';
import { usePersona } from '../../contexts/PersonaContext';
import {
  sendSimulatedEmail,
  sendSimulatedTeams,
  getAvailableTriggers,
  getAvailableTypes,
} from '../../services/notificationService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

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
 * Formats a timestamp for display.
 * @param {string} timestamp - ISO 8601 timestamp.
 * @returns {string} Formatted relative or absolute time string.
 */
const formatTimestamp = (timestamp) => {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    return '';
  }
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) {
      return '';
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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Notification center dropdown/panel component.
 * Lists notifications with read/unread state, filtering by trigger type,
 * persona routing. Shows simulated Email/Teams preview with 'sent (simulated)' label.
 * Mark as read/mark all as read actions. Fully keyboard navigable.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the notification center panel is open.
 * @param {function} props.onClose - Callback invoked when the panel should close.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement|null}
 */
const NotificationCenter = ({ isOpen, onClose, className }) => {
  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const { persona } = usePersona();

  const [filterTrigger, setFilterTrigger] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [teamsPreview, setTeamsPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

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

  // Filtered notifications
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

    return result;
  }, [notifications, showUnreadOnly, filterTrigger, filterType]);

  // Focus management when panel opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (selectedNotification) {
          setSelectedNotification(null);
          setEmailPreview(null);
          setTeamsPreview(null);
          setPreviewError(null);
        } else if (typeof onClose === 'function') {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, selectedNotification]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedNotification(null);
      setEmailPreview(null);
      setTeamsPreview(null);
      setPreviewError(null);
    }
  }, [isOpen]);

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

  const handleSelectNotification = useCallback(
    (notification) => {
      if (!notification || !notification.id) {
        return;
      }

      setSelectedNotification(notification);
      setEmailPreview(null);
      setTeamsPreview(null);
      setPreviewError(null);

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

  const handleBackToList = useCallback(() => {
    setSelectedNotification(null);
    setEmailPreview(null);
    setTeamsPreview(null);
    setPreviewError(null);
  }, []);

  const handleBackToListKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleBackToList();
      }
    },
    [handleBackToList]
  );

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

  const handleRefresh = useCallback(() => {
    const activeFilters = {};
    if (showUnreadOnly) {
      activeFilters.unreadOnly = true;
    }
    if (filterTrigger) {
      activeFilters.trigger = filterTrigger;
    }
    if (filterType) {
      activeFilters.type = filterType;
    }
    refreshNotifications(activeFilters);
  }, [refreshNotifications, showUnreadOnly, filterTrigger, filterType]);

  const handleFilterTriggerChange = useCallback((e) => {
    setFilterTrigger(e.target.value);
  }, []);

  const handleFilterTypeChange = useCallback((e) => {
    setFilterType(e.target.value);
  }, []);

  const handleToggleUnreadOnly = useCallback(() => {
    setShowUnreadOnly((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterTrigger('');
    setFilterType('');
    setShowUnreadOnly(false);
  }, []);

  /**
   * Formats a trigger string for display.
   * @param {string} trigger - The trigger identifier.
   * @returns {string} Formatted trigger string.
   */
  const formatTrigger = (trigger) => {
    if (typeof trigger !== 'string' || trigger.trim() === '') {
      return '';
    }
    return trigger
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (!isOpen) {
    return null;
  }

  /**
   * Renders the notification detail view with simulated Email/Teams previews.
   * @returns {React.ReactElement}
   */
  const renderNotificationDetail = () => {
    if (!selectedNotification) {
      return null;
    }

    return (
      <div className="flex flex-col h-full">
        {/* Detail header */}
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleBackToList}
            onKeyDown={handleBackToListKeyDown}
            className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
            aria-label="Back to notification list"
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
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h3 className="flex-1 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Notification Detail
          </h3>
        </div>

        {/* Detail body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title and type */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge
                status={selectedNotification.type || 'info'}
                variant={typeToVariant(selectedNotification.type)}
                size="sm"
              />
              <StatusBadge
                status={selectedNotification.priority || 'low'}
                variant={
                  selectedNotification.priority === 'critical'
                    ? 'danger'
                    : selectedNotification.priority === 'high'
                      ? 'warning'
                      : 'neutral'
                }
                size="sm"
              />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mt-2">
              {selectedNotification.title || 'Notification'}
            </h4>
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
              <span className="font-medium text-neutral-500 dark:text-neutral-400">Read:</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {selectedNotification.isRead ? 'Yes' : 'No'}
              </span>
            </div>
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
      </div>
    );
  };

  /**
   * Renders the notification list view.
   * @returns {React.ReactElement}
   */
  const renderNotificationList = () => {
    const hasActiveFilters = showUnreadOnly || filterTrigger !== '' || filterType !== '';

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-error px-1 text-2xs font-bold text-white"
                aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
              aria-label="Refresh notifications"
              title="Refresh"
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
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {/* Close button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="btn-outline flex h-7 w-7 items-center justify-center rounded-lg p-0"
              aria-label="Close notification center"
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
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
          <div className="flex flex-wrap items-center gap-2">
            {/* Unread only toggle */}
            <button
              type="button"
              onClick={handleToggleUnreadOnly}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-medium transition-colors duration-150 ${
                showUnreadOnly
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600'
              }`}
              aria-pressed={showUnreadOnly}
              aria-label={showUnreadOnly ? 'Show all notifications' : 'Show unread only'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${showUnreadOnly ? 'bg-primary-500' : 'bg-neutral-400'}`} aria-hidden="true" />
              Unread
            </button>

            {/* Trigger filter */}
            <select
              value={filterTrigger}
              onChange={handleFilterTriggerChange}
              className="input py-1 text-2xs max-w-[120px]"
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
              onChange={handleFilterTypeChange}
              className="input py-1 text-2xs max-w-[100px]"
              aria-label="Filter by type"
            >
              <option value="">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-2xs text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-end border-b border-neutral-200 px-4 py-1.5 dark:border-neutral-700">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-2xs font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              aria-label="Mark all notifications as read"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto" role="list" aria-label="Notification list">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" label="Loading notifications..." />
            </div>
          )}

          {error && !loading && (
            <div
              className="mx-4 my-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {hasActiveFilters ? 'No notifications match your filters.' : 'No notifications yet.'}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredNotifications.map((notification) => {
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
                  className={`flex cursor-pointer items-start gap-3 border-b border-neutral-100 px-4 py-3 transition-colors duration-150 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-700/50 ${
                    isUnread ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                  }`}
                  aria-label={`${isUnread ? 'Unread: ' : ''}${notification.title || 'Notification'}. ${formatTimestamp(notification.createdAt)}`}
                >
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 pt-1.5">
                    {isUnread ? (
                      <span
                        className={`block h-2 w-2 rounded-full ${priorityColorClass(notification.priority)}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="block h-2 w-2" aria-hidden="true" />
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
                      <span className="flex-shrink-0 text-2xs text-neutral-400 dark:text-neutral-500">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {notification.message || ''}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusBadge
                        status={notification.type || 'info'}
                        variant={typeToVariant(notification.type)}
                        size="sm"
                      />
                      {notification.trigger && (
                        <span className="truncate text-2xs text-neutral-400 dark:text-neutral-500">
                          {formatTrigger(notification.trigger)}
                        </span>
                      )}
                    </div>
                  </div>

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
                      className="flex-shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-600 dark:hover:text-neutral-300"
                      aria-label={`Mark "${notification.title || 'notification'}" as read`}
                      title="Mark as read"
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
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
          <p className="text-2xs text-neutral-400 dark:text-neutral-500">
            {filteredNotifications.length} of {total} notification{total !== 1 ? 's' : ''}
            {hasActiveFilters ? ' (filtered)' : ''}
            {' · '}
            {unreadCount} unread
            {' · '}
            Persona: {persona.name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`fixed right-4 top-16 z-60 flex h-[calc(100vh-6rem)] w-96 max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-neutral-200 bg-white shadow-elevated transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-800 sm:h-[32rem] ${className || ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Notification Center"
    >
      {selectedNotification ? renderNotificationDetail() : renderNotificationList()}
    </div>
  );
};

NotificationCenter.propTypes = {
  /** Whether the notification center panel is open. */
  isOpen: PropTypes.bool.isRequired,
  /** Callback invoked when the panel should close. */
  onClose: PropTypes.func.isRequired,
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

NotificationCenter.defaultProps = {
  className: '',
};

export default NotificationCenter;