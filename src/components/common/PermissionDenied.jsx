import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePersona } from '../../contexts/PersonaContext';
import { logAction } from '../../services/auditLogService';

/**
 * Permission denied state component displayed when a user navigates to a
 * disallowed route or attempts an unauthorized action.
 * Shows a message with the current persona info and logs an audit entry
 * recording the denied access attempt.
 *
 * Uses PersonaContext for current persona information.
 *
 * @param {Object} props
 * @param {string} [props.title] - Title text displayed prominently. Defaults to 'Access Denied'.
 * @param {string} [props.message] - Descriptive message displayed below the title.
 * @param {string} [props.entityType] - The entity type the user attempted to access (for audit logging).
 * @param {string} [props.action] - The action the user attempted (for audit logging).
 * @param {string} [props.resourceId] - The specific resource ID the user attempted to access (for audit logging).
 * @param {string} [props.actionLabel] - Label for the optional action button.
 * @param {function} [props.onAction] - Callback invoked when the action button is clicked.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement}
 */
const PermissionDenied = ({
  title,
  message,
  entityType,
  action,
  resourceId,
  actionLabel,
  onAction,
  className,
}) => {
  const { persona } = usePersona();
  const auditLoggedRef = useRef(false);

  const displayTitle =
    typeof title === 'string' && title.trim() !== '' ? title : 'Access Denied';
  const displayMessage =
    typeof message === 'string' && message.trim() !== ''
      ? message
      : `You do not have permission to access this resource. Your current role is "${persona.name}" with "${persona.accessLevel}" access level. Please contact your administrator if you believe this is an error.`;

  const hasAction =
    typeof actionLabel === 'string' &&
    actionLabel.trim() !== '' &&
    typeof onAction === 'function';

  // Log audit entry on mount (once per render lifecycle)
  useEffect(() => {
    if (auditLoggedRef.current) {
      return;
    }
    auditLoggedRef.current = true;

    try {
      logAction({
        action: 'read',
        userId: persona.id,
        userName: persona.name,
        entityType: entityType || 'ROUTE',
        entityId: resourceId || null,
        entityName: entityType
          ? `${entityType} access denied`
          : 'Route access denied',
        status: 'failure',
        details: `Permission denied for persona '${persona.name}' (access level: ${persona.accessLevel}).${
          action ? ` Attempted action: '${action}'.` : ''
        }${resourceId ? ` Resource ID: '${resourceId}'.` : ''}`,
      });
    } catch {
      // Audit log failure should not break the component
    }
  }, [persona.id, persona.name, persona.accessLevel, entityType, action, resourceId]);

  const handleAction = useCallback(() => {
    if (typeof onAction === 'function') {
      onAction();
    }
  }, [onAction]);

  const handleActionKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAction();
      }
    },
    [handleAction]
  );

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

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-card dark:bg-neutral-800 ${className || ''}`}
      role="alert"
      aria-label={displayTitle}
    >
      {/* Icon */}
      <div className="mb-5" aria-hidden="true">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600 dark:text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        {displayTitle}
      </h2>

      {/* Message */}
      <p className="mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        {displayMessage}
      </p>

      {/* Persona info badge */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900/50">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200"
          aria-hidden="true"
        >
          {persona.name
            .split(' ')
            .map((word) => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {persona.name}
          </p>
          <p className="truncate text-2xs text-neutral-500 dark:text-neutral-400">
            {formatAccessLevel(persona.accessLevel)}
          </p>
        </div>
      </div>

      {/* Action button */}
      {hasAction && (
        <button
          type="button"
          onClick={handleAction}
          onKeyDown={handleActionKeyDown}
          className="btn-primary mt-6 px-4 py-2 text-sm"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

PermissionDenied.propTypes = {
  /** Title text displayed prominently. Defaults to 'Access Denied'. */
  title: PropTypes.string,
  /** Descriptive message displayed below the title. */
  message: PropTypes.string,
  /** The entity type the user attempted to access (for audit logging). */
  entityType: PropTypes.string,
  /** The action the user attempted (for audit logging). */
  action: PropTypes.string,
  /** The specific resource ID the user attempted to access (for audit logging). */
  resourceId: PropTypes.string,
  /** Label for the optional action button. */
  actionLabel: PropTypes.string,
  /** Callback invoked when the action button is clicked. */
  onAction: PropTypes.func,
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

PermissionDenied.defaultProps = {
  title: 'Access Denied',
  message: null,
  entityType: null,
  action: null,
  resourceId: null,
  actionLabel: null,
  onAction: null,
  className: '',
};

export default PermissionDenied;