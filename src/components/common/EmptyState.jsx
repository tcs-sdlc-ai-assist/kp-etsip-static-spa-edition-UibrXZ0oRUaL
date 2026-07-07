import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Empty state placeholder component displayed when no data matches filters
 * or an entity list is empty.
 * Provides a visual indicator with optional icon, title, message, and action button.
 * Accessible with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} [props.title] - The title text displayed prominently. Defaults to 'No data found'.
 * @param {string} [props.message] - Descriptive message displayed below the title.
 * @param {string} [props.actionLabel] - Label for the optional action button.
 * @param {function} [props.onAction] - Callback invoked when the action button is clicked.
 * @param {React.ReactNode} [props.icon] - Optional custom icon element to display above the title.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement}
 */
const EmptyState = ({ title, message, actionLabel, onAction, icon, className }) => {
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

  const displayTitle = typeof title === 'string' && title.trim() !== '' ? title : 'No data found';
  const displayMessage =
    typeof message === 'string' && message.trim() !== '' ? message : null;
  const hasAction =
    typeof actionLabel === 'string' &&
    actionLabel.trim() !== '' &&
    typeof onAction === 'function';

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl bg-white px-6 py-12 text-center shadow-card dark:bg-neutral-800 ${className || ''}`}
      role="status"
      aria-label={displayTitle}
    >
      {/* Icon */}
      <div className="mb-4" aria-hidden="true">
        {icon || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
        {displayTitle}
      </h3>

      {/* Message */}
      {displayMessage && (
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          {displayMessage}
        </p>
      )}

      {/* Action button */}
      {hasAction && (
        <button
          type="button"
          onClick={handleAction}
          onKeyDown={handleActionKeyDown}
          className="btn-primary mt-5 px-4 py-2 text-sm"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  /** The title text displayed prominently. Defaults to 'No data found'. */
  title: PropTypes.string,
  /** Descriptive message displayed below the title. */
  message: PropTypes.string,
  /** Label for the optional action button. */
  actionLabel: PropTypes.string,
  /** Callback invoked when the action button is clicked. */
  onAction: PropTypes.func,
  /** Optional custom icon element to display above the title. */
  icon: PropTypes.node,
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

EmptyState.defaultProps = {
  title: 'No data found',
  message: null,
  actionLabel: null,
  onAction: null,
  icon: null,
  className: '',
};

export default EmptyState;