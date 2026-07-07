import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * KPI/score display card component.
 * Displays a metric value with label, trend indicator, and score band color.
 * Accessible with ARIA live region for dynamic updates.
 *
 * @param {Object} props
 * @param {string} props.label - The metric label displayed above the value.
 * @param {string|number} props.value - The metric value to display.
 * @param {string} [props.trend] - Trend direction: 'up', 'down', or 'stable'. Defaults to null (no trend shown).
 * @param {number} [props.trendValue] - Numeric trend value to display alongside the trend indicator.
 * @param {Object} [props.scoreBand] - Score band object from getScoreBand(). Contains key, label, color, bgColor, textColor.
 * @param {React.ReactNode} [props.icon] - Optional icon element to display in the card header.
 * @param {string} [props.suffix] - Optional suffix to display after the value (e.g., '%', 'items').
 * @param {string} [props.prefix] - Optional prefix to display before the value (e.g., '$').
 * @param {string} [props.description] - Optional description text displayed below the value.
 * @param {string} [props.className] - Additional CSS classes to apply to the card container.
 * @returns {React.ReactElement}
 */
const ScoreCard = ({
  label,
  value,
  trend,
  trendValue,
  scoreBand,
  icon,
  suffix,
  prefix,
  description,
  className,
}) => {
  /**
   * Returns the trend indicator icon and color classes based on the trend direction.
   * @returns {{ iconPath: string, colorClass: string, ariaLabel: string } | null}
   */
  const trendInfo = useMemo(() => {
    if (!trend || (trend !== 'up' && trend !== 'down' && trend !== 'stable')) {
      return null;
    }

    switch (trend) {
      case 'up':
        return {
          iconPath:
            'M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z',
          colorClass: 'text-green-600 dark:text-green-400',
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          ariaLabel: 'Trending up',
        };
      case 'down':
        return {
          iconPath:
            'M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z',
          colorClass: 'text-red-600 dark:text-red-400',
          bgClass: 'bg-red-100 dark:bg-red-900/30',
          ariaLabel: 'Trending down',
        };
      case 'stable':
        return {
          iconPath:
            'M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
          colorClass: 'text-neutral-500 dark:text-neutral-400',
          bgClass: 'bg-neutral-100 dark:bg-neutral-700',
          ariaLabel: 'Stable trend',
        };
      default:
        return null;
    }
  }, [trend]);

  /**
   * Returns the score band indicator styles.
   * @returns {{ dotColor: string, bandLabel: string, bandBgClass: string, bandTextClass: string } | null}
   */
  const bandInfo = useMemo(() => {
    if (!scoreBand || typeof scoreBand !== 'object') {
      return null;
    }

    const { key, label: bandLabel, color, bgColor, textColor } = scoreBand;

    if (!key || !bandLabel) {
      return null;
    }

    // Map score band keys to Tailwind classes
    const bandClassMap = {
      critical: {
        dotColor: 'bg-red-500 dark:bg-red-400',
        bandBgClass: 'bg-red-100 dark:bg-red-900/30',
        bandTextClass: 'text-red-800 dark:text-red-200',
      },
      poor: {
        dotColor: 'bg-orange-500 dark:bg-orange-400',
        bandBgClass: 'bg-orange-100 dark:bg-orange-900/30',
        bandTextClass: 'text-orange-800 dark:text-orange-200',
      },
      fair: {
        dotColor: 'bg-yellow-500 dark:bg-yellow-400',
        bandBgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        bandTextClass: 'text-yellow-800 dark:text-yellow-200',
      },
      good: {
        dotColor: 'bg-green-500 dark:bg-green-400',
        bandBgClass: 'bg-green-100 dark:bg-green-900/30',
        bandTextClass: 'text-green-800 dark:text-green-200',
      },
      excellent: {
        dotColor: 'bg-emerald-600 dark:bg-emerald-400',
        bandBgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
        bandTextClass: 'text-emerald-800 dark:text-emerald-200',
      },
    };

    const classes = bandClassMap[key] || {
      dotColor: 'bg-neutral-500 dark:bg-neutral-400',
      bandBgClass: 'bg-neutral-100 dark:bg-neutral-700',
      bandTextClass: 'text-neutral-800 dark:text-neutral-200',
    };

    return {
      ...classes,
      bandLabel,
    };
  }, [scoreBand]);

  /**
   * Formats the display value.
   * @returns {string}
   */
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'number') {
      // Format large numbers with locale string
      if (Number.isNaN(value)) {
        return '—';
      }
      return value.toLocaleString();
    }

    return String(value);
  }, [value]);

  /**
   * Formats the trend value for display.
   * @returns {string|null}
   */
  const formattedTrendValue = useMemo(() => {
    if (trendValue === null || trendValue === undefined) {
      return null;
    }

    if (typeof trendValue === 'number') {
      if (Number.isNaN(trendValue)) {
        return null;
      }
      const sign = trendValue > 0 ? '+' : '';
      return `${sign}${trendValue.toLocaleString()}`;
    }

    return String(trendValue);
  }, [trendValue]);

  /**
   * Builds the ARIA label for the score card.
   * @returns {string}
   */
  const ariaLabel = useMemo(() => {
    const parts = [`${label}: ${prefix || ''}${formattedValue}${suffix || ''}`];

    if (bandInfo) {
      parts.push(`Score band: ${bandInfo.bandLabel}`);
    }

    if (trendInfo) {
      parts.push(trendInfo.ariaLabel);
      if (formattedTrendValue) {
        parts.push(formattedTrendValue);
      }
    }

    if (description) {
      parts.push(description);
    }

    return parts.join('. ');
  }, [label, prefix, formattedValue, suffix, bandInfo, trendInfo, formattedTrendValue, description]);

  return (
    <div
      className={`rounded-xl bg-white p-5 shadow-card transition-shadow duration-300 hover:shadow-soft dark:bg-neutral-800 ${className || ''}`}
      role="region"
      aria-label={ariaLabel}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header: Icon and Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <h3 className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {label}
          </h3>
        </div>

        {/* Score band badge */}
        {bandInfo && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${bandInfo.bandBgClass} ${bandInfo.bandTextClass}`}
            aria-label={`Score band: ${bandInfo.bandLabel}`}
          >
            <span
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${bandInfo.dotColor}`}
              aria-hidden="true"
            />
            <span className="truncate">{bandInfo.bandLabel}</span>
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-3 flex items-baseline gap-1">
        {prefix && (
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {prefix}
          </span>
        )}
        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {formattedValue}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {suffix}
          </span>
        )}
      </div>

      {/* Trend indicator and description */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Trend */}
        {trendInfo && (
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded ${trendInfo.bgClass}`}
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 ${trendInfo.colorClass}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d={trendInfo.iconPath}
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {formattedTrendValue && (
              <span
                className={`text-xs font-medium ${trendInfo.colorClass}`}
                aria-label={`Trend value: ${formattedTrendValue}`}
              >
                {formattedTrendValue}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}

        {/* Spacer when neither trend nor description is present */}
        {!trendInfo && !description && <div className="h-5" aria-hidden="true" />}
      </div>
    </div>
  );
};

ScoreCard.propTypes = {
  /** The metric label displayed above the value. */
  label: PropTypes.string.isRequired,
  /** The metric value to display. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Trend direction: 'up', 'down', or 'stable'. */
  trend: PropTypes.oneOf(['up', 'down', 'stable']),
  /** Numeric trend value to display alongside the trend indicator. */
  trendValue: PropTypes.number,
  /** Score band object from getScoreBand(). Contains key, label, color, bgColor, textColor. */
  scoreBand: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    textColor: PropTypes.string,
  }),
  /** Optional icon element to display in the card header. */
  icon: PropTypes.node,
  /** Optional suffix to display after the value (e.g., '%', 'items'). */
  suffix: PropTypes.string,
  /** Optional prefix to display before the value (e.g., '$'). */
  prefix: PropTypes.string,
  /** Optional description text displayed below the value. */
  description: PropTypes.string,
  /** Additional CSS classes to apply to the card container. */
  className: PropTypes.string,
};

ScoreCard.defaultProps = {
  value: null,
  trend: null,
  trendValue: null,
  scoreBand: null,
  icon: null,
  suffix: '',
  prefix: '',
  description: null,
  className: '',
};

export default ScoreCard;