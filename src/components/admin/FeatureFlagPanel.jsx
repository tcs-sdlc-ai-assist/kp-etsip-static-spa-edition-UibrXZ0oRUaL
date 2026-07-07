import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

/**
 * Feature flag management panel component used within the AdministrationPage.
 * Lists all feature flags with toggle switches. Toggling updates UI immediately
 * and persists to localStorage. Permission-gated. Audit-logged.
 * Accessible with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @param {boolean} [props.disabled] - Whether all toggles should be disabled (e.g., no admin permission).
 * @param {function} [props.onToggle] - Optional callback invoked after a flag is toggled.
 * @param {function} [props.onReset] - Optional callback invoked after flags are reset to defaults.
 * @returns {React.ReactElement}
 */
const FeatureFlagPanel = ({ className, disabled, onToggle, onReset }) => {
  const {
    flags,
    loading,
    error,
    toggleFlag,
    resetFlags,
    flagsByCategory,
    categories,
    summary,
  } = useFeatureFlags();

  const [actionLoading, setActionLoading] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  /**
   * Handles toggling a feature flag.
   * @param {string} flagKey - The key of the flag to toggle.
   */
  const handleToggleFlag = useCallback(
    (flagKey) => {
      if (!flagKey || disabled || actionLoading) {
        return;
      }

      setActionResult(null);
      setActionLoading(flagKey);

      const result = toggleFlag(flagKey);

      setActionLoading(null);

      if (result.success) {
        setActionResult({
          type: 'success',
          message: `Feature flag "${flagKey}" toggled successfully.`,
        });

        if (typeof onToggle === 'function') {
          onToggle(flagKey, result.data);
        }
      } else {
        setActionResult({
          type: 'error',
          message: result.error || `Failed to toggle flag "${flagKey}".`,
        });
      }

      // Clear result after a delay
      setTimeout(() => {
        setActionResult(null);
      }, 3000);
    },
    [disabled, actionLoading, toggleFlag, onToggle]
  );

  /**
   * Handles resetting all feature flags to defaults.
   */
  const handleResetFlags = useCallback(() => {
    if (disabled || actionLoading) {
      return;
    }

    setActionResult(null);
    setActionLoading('_reset');

    const result = resetFlags();

    setActionLoading(null);

    if (result.success) {
      setActionResult({
        type: 'success',
        message: 'All feature flags reset to defaults.',
      });

      if (typeof onReset === 'function') {
        onReset(result.data);
      }
    } else {
      setActionResult({
        type: 'error',
        message: result.error || 'Failed to reset feature flags.',
      });
    }

    // Clear result after a delay
    setTimeout(() => {
      setActionResult(null);
    }, 3000);
  }, [disabled, actionLoading, resetFlags, onReset]);

  /**
   * Formats a category string for display.
   * @param {string} category - The category identifier.
   * @returns {string}
   */
  const formatCategory = (category) => {
    if (typeof category !== 'string' || category.trim() === '') {
      return 'General';
    }
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /**
   * Returns a color class for a category badge.
   * @param {string} category - The category identifier.
   * @returns {string}
   */
  const getCategoryBadgeClass = (category) => {
    if (typeof category !== 'string') {
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
    }
    switch (category.toLowerCase()) {
      case 'features':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'theming':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'demo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'development':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'custom':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
    }
  };

  /**
   * Sorted categories for consistent display order.
   */
  const sortedCategories = useMemo(() => {
    const order = ['features', 'theming', 'demo', 'development', 'custom'];
    return [...categories].sort((a, b) => {
      const aIdx = order.indexOf(a.toLowerCase());
      const bIdx = order.indexOf(b.toLowerCase());
      const aOrder = aIdx === -1 ? 99 : aIdx;
      const bOrder = bIdx === -1 ? 99 : bIdx;
      return aOrder - bOrder;
    });
  }, [categories]);

  if (loading && (!Array.isArray(flags) || flags.length === 0)) {
    return (
      <div
        className={`flex items-center justify-center py-8 ${className || ''}`}
        role="status"
        aria-label="Loading feature flags"
      >
        <LoadingSpinner size="sm" label="Loading feature flags..." />
      </div>
    );
  }

  if (error && (!Array.isArray(flags) || flags.length === 0)) {
    return (
      <div
        className={`rounded-xl bg-white shadow-card dark:bg-neutral-800 ${className || ''}`}
        role="region"
        aria-label="Feature flags"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
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
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {error || 'Feature flags could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className || ''}`}
      role="region"
      aria-label="Feature flag management"
    >
      {/* Action result banner */}
      {actionResult && (
        <div
          className={`rounded-lg p-3 text-sm ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
          role="alert"
        >
          {actionResult.message}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <section aria-label="Feature flag summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <p className="text-2xs text-neutral-500 dark:text-neutral-400">Total</p>
            <p className="mt-0.5 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {summary.total}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <p className="text-2xs text-neutral-500 dark:text-neutral-400">Enabled</p>
            <p className="mt-0.5 text-lg font-bold text-green-600 dark:text-green-400">
              {summary.enabled}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <p className="text-2xs text-neutral-500 dark:text-neutral-400">Disabled</p>
            <p className="mt-0.5 text-lg font-bold text-neutral-600 dark:text-neutral-400">
              {summary.disabled}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <p className="text-2xs text-neutral-500 dark:text-neutral-400">Categories</p>
            <p className="mt-0.5 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {categories.length}
            </p>
          </div>
        </section>
      )}

      {/* Feature Flags List */}
      <section aria-label="Feature flags" className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Feature Flags
          </h3>
          <button
            type="button"
            onClick={handleResetFlags}
            disabled={disabled || !!actionLoading}
            className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset feature flags to defaults"
          >
            {actionLoading === '_reset' ? (
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                aria-hidden="true"
              />
            ) : (
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
            )}
            <span>Reset to Defaults</span>
          </button>
        </div>

        {/* Grouped by category */}
        {sortedCategories.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {sortedCategories.map((category) => {
              const categoryFlags = flagsByCategory[category];
              if (!Array.isArray(categoryFlags) || categoryFlags.length === 0) {
                return null;
              }

              return (
                <div key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 bg-neutral-50 px-5 py-2 dark:bg-neutral-900/50">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${getCategoryBadgeClass(category)}`}
                    >
                      {formatCategory(category)}
                    </span>
                    <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                      {categoryFlags.length} flag{categoryFlags.length !== 1 ? 's' : ''}
                    </span>
                    {summary && summary.byCategory && summary.byCategory[category] && (
                      <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                        · {summary.byCategory[category].enabled} enabled
                      </span>
                    )}
                  </div>

                  {/* Flags in this category */}
                  {categoryFlags.map((flag) => {
                    if (!flag || !flag.key) {
                      return null;
                    }

                    const isToggling = actionLoading === flag.key;

                    return (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between px-5 py-4 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {flag.label || flag.key}
                            </p>
                            <StatusBadge
                              status={flag.enabled ? 'Enabled' : 'Disabled'}
                              variant={flag.enabled ? 'success' : 'neutral'}
                              size="sm"
                            />
                          </div>
                          {flag.description && (
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                              {flag.description}
                            </p>
                          )}
                          <p className="mt-0.5 text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                            {flag.key}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isToggling ? (
                            <div
                              className="flex h-6 w-11 items-center justify-center"
                              aria-label={`Toggling ${flag.label || flag.key}`}
                            >
                              <div
                                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                                aria-hidden="true"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={flag.enabled}
                              aria-label={`Toggle ${flag.label || flag.key}`}
                              onClick={() => handleToggleFlag(flag.key)}
                              disabled={disabled || !!actionLoading}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                flag.enabled
                                  ? 'bg-primary-500'
                                  : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  flag.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No feature flags available.
          </div>
        )}

        {/* Flags without a category (fallback) */}
        {Array.isArray(flags) &&
          flags.length > 0 &&
          sortedCategories.length === 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {flags.map((flag) => {
                if (!flag || !flag.key) {
                  return null;
                }

                const isToggling = actionLoading === flag.key;

                return (
                  <div
                    key={flag.key}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {flag.label || flag.key}
                        </p>
                        {flag.category && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${getCategoryBadgeClass(flag.category)}`}
                          >
                            {formatCategory(flag.category)}
                          </span>
                        )}
                      </div>
                      {flag.description && (
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {flag.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isToggling ? (
                        <div
                          className="flex h-6 w-11 items-center justify-center"
                          aria-label={`Toggling ${flag.label || flag.key}`}
                        >
                          <div
                            className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                            aria-hidden="true"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={flag.enabled}
                          aria-label={`Toggle ${flag.label || flag.key}`}
                          onClick={() => handleToggleFlag(flag.key)}
                          disabled={disabled || !!actionLoading}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            flag.enabled
                              ? 'bg-primary-500'
                              : 'bg-neutral-300 dark:bg-neutral-600'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              flag.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </section>

      {/* Disabled notice */}
      {disabled && (
        <div
          className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          role="alert"
        >
          You do not have permission to modify feature flags. Switch to the Platform Administrator persona to manage feature flags.
        </div>
      )}

      {/* Footer */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          Feature flags control optional platform capabilities. Changes are persisted to localStorage
          and take effect immediately. All changes are audit-logged.
        </p>
      </footer>
    </div>
  );
};

FeatureFlagPanel.propTypes = {
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
  /** Whether all toggles should be disabled (e.g., no admin permission). */
  disabled: PropTypes.bool,
  /** Optional callback invoked after a flag is toggled. */
  onToggle: PropTypes.func,
  /** Optional callback invoked after flags are reset to defaults. */
  onReset: PropTypes.func,
};

FeatureFlagPanel.defaultProps = {
  className: '',
  disabled: false,
  onToggle: null,
  onReset: null,
};

export default FeatureFlagPanel;