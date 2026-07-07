import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component with ARIA live region announcing loading state.
 * Displays an animated spinner with an accessible label for screen readers.
 * Used for simulated latency states throughout the platform.
 *
 * @param {Object} props
 * @param {string} [props.size='md'] - Spinner size: 'sm', 'md', or 'lg'.
 * @param {string} [props.label='Loading...'] - Accessible label announced by screen readers.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement}
 */
const LoadingSpinner = ({ size, label, className }) => {
  /**
   * Returns the Tailwind size classes for the spinner based on the size prop.
   * @returns {{ spinner: string, text: string }}
   */
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          spinner: 'h-4 w-4 border-2',
          text: 'text-xs',
        };
      case 'lg':
        return {
          spinner: 'h-10 w-10 border-[3px]',
          text: 'text-base',
        };
      case 'md':
      default:
        return {
          spinner: 'h-6 w-6 border-2',
          text: 'text-sm',
        };
    }
  }, [size]);

  const displayLabel = typeof label === 'string' && label.trim() !== '' ? label : 'Loading...';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className || ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`animate-spin rounded-full border-primary-500 border-t-transparent ${sizeClasses.spinner}`}
        aria-hidden="true"
      />
      <span
        className={`font-medium text-neutral-500 dark:text-neutral-400 ${sizeClasses.text}`}
      >
        {displayLabel}
      </span>
      <span className="sr-only">{displayLabel}</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  /** Spinner size: 'sm', 'md', or 'lg'. */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Accessible label announced by screen readers. */
  label: PropTypes.string,
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  size: 'md',
  label: 'Loading...',
  className: '',
};

export default LoadingSpinner;