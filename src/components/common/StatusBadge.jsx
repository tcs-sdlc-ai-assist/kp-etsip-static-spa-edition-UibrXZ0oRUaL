import PropTypes from 'prop-types';

/**
 * Status badge component displaying colored status indicators with text.
 * Uses Tailwind utility classes for styling with support for multiple variants and sizes.
 *
 * @param {Object} props
 * @param {string} props.status - The status text to display inside the badge.
 * @param {string} [props.variant] - Visual variant: 'success', 'warning', 'danger', 'info', or 'neutral'. Defaults to 'neutral'.
 * @param {string} [props.size] - Badge size: 'sm' or 'md'. Defaults to 'md'.
 * @param {string} [props.className] - Additional CSS classes to apply to the badge.
 * @returns {React.ReactElement}
 */
const StatusBadge = ({ status, variant, size, className }) => {
  /**
   * Returns the Tailwind color classes for the given variant.
   * @returns {string}
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'danger':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'neutral':
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };

  /**
   * Returns the Tailwind size classes for the given size.
   * @returns {string}
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-1.5 py-0.5 text-2xs';
      case 'md':
      default:
        return 'px-2 py-0.5 text-xs';
    }
  };

  /**
   * Returns the dot indicator color class for the given variant.
   * @returns {string}
   */
  const getDotColorClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 dark:bg-green-400';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-400';
      case 'danger':
        return 'bg-red-500 dark:bg-red-400';
      case 'info':
        return 'bg-blue-500 dark:bg-blue-400';
      case 'neutral':
      default:
        return 'bg-neutral-500 dark:bg-neutral-400';
    }
  };

  /**
   * Formats the status text for display.
   * Replaces underscores with spaces and capitalizes the first letter of each word.
   * @returns {string}
   */
  const formatStatus = () => {
    if (typeof status !== 'string' || status.trim() === '') {
      return '';
    }
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();
  const dotColorClass = getDotColorClass();
  const displayText = formatStatus();

  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${variantClasses} ${sizeClasses} ${className || ''}`}
      role="status"
      aria-label={displayText}
    >
      <span
        className={`flex-shrink-0 rounded-full ${dotSize} ${dotColorClass}`}
        aria-hidden="true"
      />
      <span className="truncate">{displayText}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  /** The status text to display inside the badge. */
  status: PropTypes.string.isRequired,
  /** Visual variant: 'success', 'warning', 'danger', 'info', or 'neutral'. */
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'neutral']),
  /** Badge size: 'sm' or 'md'. */
  size: PropTypes.oneOf(['sm', 'md']),
  /** Additional CSS classes to apply to the badge. */
  className: PropTypes.string,
};

StatusBadge.defaultProps = {
  variant: 'neutral',
  size: 'md',
  className: '',
};

export default StatusBadge;