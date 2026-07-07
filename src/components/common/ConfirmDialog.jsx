import { useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

/**
 * Confirmation dialog component for destructive actions (delete, clear, reset).
 * Extends Modal with confirm/cancel buttons and warning message.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is currently open.
 * @param {function} props.onConfirm - Callback invoked when the confirm button is clicked.
 * @param {function} props.onCancel - Callback invoked when the cancel button is clicked or the dialog is dismissed.
 * @param {string} [props.title] - Dialog title. Defaults to 'Confirm Action'.
 * @param {string} [props.message] - Warning message displayed in the dialog body.
 * @param {string} [props.confirmLabel] - Label for the confirm button. Defaults to 'Confirm'.
 * @param {string} [props.cancelLabel] - Label for the cancel button. Defaults to 'Cancel'.
 * @param {string} [props.variant] - Visual variant: 'danger' or 'warning'. Defaults to 'danger'.
 * @param {boolean} [props.loading] - Whether the confirm action is in progress.
 * @returns {React.ReactElement|null}
 */
const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  loading,
}) => {
  const handleConfirm = useCallback(() => {
    if (typeof onConfirm === 'function' && !loading) {
      onConfirm();
    }
  }, [onConfirm, loading]);

  const handleCancel = useCallback(() => {
    if (typeof onCancel === 'function' && !loading) {
      onCancel();
    }
  }, [onCancel, loading]);

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBgClass = isDanger
    ? 'bg-red-100 dark:bg-red-900/30'
    : 'bg-yellow-100 dark:bg-yellow-900/30';

  const iconColorClass = isDanger
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';

  const confirmButtonClass = isDanger
    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 active:bg-red-800'
    : 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:outline-yellow-500 active:bg-yellow-700';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {/* Icon and message */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBgClass}`}
            aria-hidden="true"
          >
            {isDanger ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${iconColorClass}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${iconColorClass}`}
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
            )}
          </div>
          <div className="min-w-0 flex-1">
            {message && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`btn px-4 py-2 text-sm ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={confirmLabel}
          >
            {loading && (
              <div
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  /** Whether the dialog is currently open. */
  isOpen: PropTypes.bool.isRequired,
  /** Callback invoked when the confirm button is clicked. */
  onConfirm: PropTypes.func.isRequired,
  /** Callback invoked when the cancel button is clicked or the dialog is dismissed. */
  onCancel: PropTypes.func.isRequired,
  /** Dialog title. Defaults to 'Confirm Action'. */
  title: PropTypes.string,
  /** Warning message displayed in the dialog body. */
  message: PropTypes.string,
  /** Label for the confirm button. Defaults to 'Confirm'. */
  confirmLabel: PropTypes.string,
  /** Label for the cancel button. Defaults to 'Cancel'. */
  cancelLabel: PropTypes.string,
  /** Visual variant: 'danger' or 'warning'. Defaults to 'danger'. */
  variant: PropTypes.oneOf(['danger', 'warning']),
  /** Whether the confirm action is in progress. */
  loading: PropTypes.bool,
};

ConfirmDialog.defaultProps = {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'danger',
  loading: false,
};

export default ConfirmDialog;