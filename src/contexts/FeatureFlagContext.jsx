import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getFeatureFlags,
  toggleFeatureFlag,
  isFeatureEnabled,
  setFeatureFlag,
  getFeatureFlagsByCategory,
  getFeatureFlagCategories,
  resetFeatureFlags,
  getFeatureFlagSummary,
  getFeatureFlag,
} from '../services/featureFlagService';

/**
 * @typedef {Object} FeatureFlagContextValue
 * @property {Array<{key: string, label: string, enabled: boolean, description: string, category: string}>} flags - All feature flags with their current state.
 * @property {boolean} loading - Whether feature flags are currently being loaded.
 * @property {string|null} error - Error message if the last operation failed.
 * @property {function(string): boolean} isEnabled - Checks whether a specific feature flag is enabled.
 * @property {function(string): { success: boolean, data: Object|null, error: string|null }} toggleFlag - Toggles a feature flag by its key.
 * @property {function(string, boolean): { success: boolean, data: Object|null, error: string|null }} setFlag - Sets a feature flag to a specific enabled/disabled state.
 * @property {function(): void} refreshFlags - Refreshes the feature flag list from localStorage.
 * @property {function(): { success: boolean, data: Array|null, error: string|null }} resetFlags - Resets all feature flags to their default values.
 * @property {Object<string, Array<{key: string, label: string, enabled: boolean, description: string, category: string}>>} flagsByCategory - Feature flags grouped by category.
 * @property {string[]} categories - All distinct feature flag categories.
 * @property {{ total: number, enabled: number, disabled: number, byCategory: Object<string, { enabled: number, disabled: number }> }} summary - Feature flag summary statistics.
 */

const FeatureFlagContext = createContext(null);

/**
 * FeatureFlagProvider wraps the application and provides feature flag state,
 * actions, and summary data to all child components.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement}
 */
export const FeatureFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Loads feature flags from the feature flag service.
   */
  const loadFlags = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const currentFlags = getFeatureFlags();
      setFlags(Array.isArray(currentFlags) ? currentFlags : []);
    } catch (err) {
      setError(err && err.message ? err.message : 'Failed to load feature flags');
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load flags on mount
  useEffect(() => {
    loadFlags();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodically sync flags from localStorage to detect external changes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const currentFlags = getFeatureFlags();
        setFlags((prev) => {
          // Only update if flags have actually changed
          const prevStr = JSON.stringify(prev);
          const currentStr = JSON.stringify(currentFlags);
          if (prevStr !== currentStr) {
            return Array.isArray(currentFlags) ? currentFlags : [];
          }
          return prev;
        });
      } catch {
        // Silently ignore errors during periodic sync
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleIsEnabled = useCallback((flagKey) => {
    if (typeof flagKey !== 'string' || flagKey.trim() === '') {
      return false;
    }

    try {
      return isFeatureEnabled(flagKey);
    } catch {
      return false;
    }
  }, []);

  const handleToggleFlag = useCallback((flagKey) => {
    if (typeof flagKey !== 'string' || flagKey.trim() === '') {
      return { success: false, data: null, error: 'Flag key must be a non-empty string' };
    }

    try {
      const result = toggleFeatureFlag(flagKey);

      if (result.success) {
        // Update local state to reflect the change
        setFlags((prev) =>
          prev.map((flag) => {
            if (flag && flag.key === flagKey) {
              return { ...flag, enabled: !flag.enabled };
            }
            return flag;
          })
        );
      }

      return result;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err && err.message ? err.message : 'Failed to toggle feature flag',
      };
    }
  }, []);

  const handleSetFlag = useCallback((flagKey, enabled) => {
    if (typeof flagKey !== 'string' || flagKey.trim() === '') {
      return { success: false, data: null, error: 'Flag key must be a non-empty string' };
    }

    if (typeof enabled !== 'boolean') {
      return { success: false, data: null, error: 'Enabled must be a boolean value' };
    }

    try {
      const result = setFeatureFlag(flagKey, enabled);

      if (result.success) {
        // Update local state to reflect the change
        setFlags((prev) =>
          prev.map((flag) => {
            if (flag && flag.key === flagKey) {
              return { ...flag, enabled };
            }
            return flag;
          })
        );
      }

      return result;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err && err.message ? err.message : 'Failed to set feature flag',
      };
    }
  }, []);

  const refreshFlags = useCallback(() => {
    loadFlags();
  }, [loadFlags]);

  const handleResetFlags = useCallback(() => {
    try {
      const result = resetFeatureFlags();

      if (result.success && Array.isArray(result.data)) {
        setFlags(result.data);
      } else if (result.success) {
        // Reload flags from service if reset succeeded but data wasn't returned
        loadFlags();
      }

      return result;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err && err.message ? err.message : 'Failed to reset feature flags',
      };
    }
  }, [loadFlags]);

  const flagsByCategory = useMemo(() => {
    const grouped = {};

    flags.forEach((flag) => {
      if (!flag) {
        return;
      }
      const category = flag.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ ...flag });
    });

    return grouped;
  }, [flags]);

  const categories = useMemo(() => {
    const cats = new Set();

    flags.forEach((flag) => {
      if (flag && flag.category) {
        cats.add(flag.category);
      }
    });

    return Array.from(cats).sort();
  }, [flags]);

  const summary = useMemo(() => {
    const result = {
      total: flags.length,
      enabled: 0,
      disabled: 0,
      byCategory: {},
    };

    flags.forEach((flag) => {
      if (!flag) {
        return;
      }

      if (flag.enabled) {
        result.enabled += 1;
      } else {
        result.disabled += 1;
      }

      const category = flag.category || 'general';
      if (!result.byCategory[category]) {
        result.byCategory[category] = { enabled: 0, disabled: 0 };
      }

      if (flag.enabled) {
        result.byCategory[category].enabled += 1;
      } else {
        result.byCategory[category].disabled += 1;
      }
    });

    return result;
  }, [flags]);

  const contextValue = useMemo(
    () => ({
      flags,
      loading,
      error,
      isEnabled: handleIsEnabled,
      toggleFlag: handleToggleFlag,
      setFlag: handleSetFlag,
      refreshFlags,
      resetFlags: handleResetFlags,
      flagsByCategory,
      categories,
      summary,
    }),
    [
      flags,
      loading,
      error,
      handleIsEnabled,
      handleToggleFlag,
      handleSetFlag,
      refreshFlags,
      handleResetFlags,
      flagsByCategory,
      categories,
      summary,
    ]
  );

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

FeatureFlagProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the feature flag context.
 * Must be used within a FeatureFlagProvider.
 *
 * @returns {FeatureFlagContextValue} The feature flag context value.
 * @throws {Error} If used outside of a FeatureFlagProvider.
 */
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);

  if (context === null) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }

  return context;
};

export default FeatureFlagContext;