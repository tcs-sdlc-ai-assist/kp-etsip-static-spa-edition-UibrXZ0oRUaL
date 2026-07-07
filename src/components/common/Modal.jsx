import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable accessible modal dialog component.
 * Features: overlay backdrop, focus trap, escape-to-close, ARIA dialog role,
 * and configurable size.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently open.
 * @param {function} props.onClose - Callback invoked when the modal should close.
 * @param {string} [props.title] - Optional title displayed in the modal header.
 * @param {React.ReactNode} props.children - Modal body content.
 * @param {string} [props.size='md'] - Modal size: 'sm', 'md', or 'lg'.
 * @returns {React.ReactElement|null}
 */
const Modal = ({ isOpen, onClose, title, children, size }) => {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  /**
   * Returns the appropriate max-width class based on the size prop.
   * @returns {string}
   */
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'md':
      default:
        return 'max-w-lg';
    }
  };

  /**
   * Returns all focusable elements within the dialog.
   * @returns {HTMLElement[]}
   */
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) {
      return [];
    }
    const elements = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), a'
    );
    return Array.from(elements).filter(
      (el) => !el.disabled && el.offsetParent !== null
    );
  }, []);

  /**
   * Handles keydown events for escape-to-close and focus trapping.
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (typeof onClose === 'function') {
          onClose();
        }
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose, getFocusableElements]
  );

  /**
   * Handles clicks on the overlay backdrop to close the modal.
   */
  const handleOverlayClick = useCallback(
    (event) => {
      if (event.target === overlayRef.current) {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    },
    [onClose]
  );

  // Manage focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousActiveElementRef.current = document.activeElement;

      // Focus the dialog or the first focusable element after render
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    } else {
      // Restore focus to the previously focused element
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen, getFocusableElements]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Add keydown listener when modal is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200"
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={`${getSizeClass()} w-full animate-fade-in rounded-xl border border-neutral-200 bg-white shadow-elevated dark:border-neutral-700 dark:bg-neutral-800`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0"
              aria-label="Close dialog"
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
        )}

        {/* Close button when no title */}
        {!title && (
          <div className="flex justify-end px-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0"
              aria-label="Close dialog"
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
        )}

        {/* Body */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  /** Whether the modal is currently open. */
  isOpen: PropTypes.bool.isRequired,
  /** Callback invoked when the modal should close (escape key, overlay click, or close button). */
  onClose: PropTypes.func.isRequired,
  /** Optional title displayed in the modal header. */
  title: PropTypes.string,
  /** Modal body content. */
  children: PropTypes.node.isRequired,
  /** Modal size: 'sm', 'md', or 'lg'. */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

Modal.defaultProps = {
  title: null,
  size: 'md',
};

export default Modal;