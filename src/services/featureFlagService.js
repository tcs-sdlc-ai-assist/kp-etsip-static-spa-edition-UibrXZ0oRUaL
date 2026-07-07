import { getItem, setItem } from '../storage/storageAdapter';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';

/**
 * localStorage key used to persist feature flag state.
 * @type {string}
 */
const FEATURE_FLAGS_KEY = 'kp_etsip_feature_flags';

/**
 * @typedef {Object} FeatureFlag
 * @property {string} key - Unique flag identifier.
 * @property {string} label - Human-readable label for the flag.
 * @property {boolean} enabled - Whether the flag is currently enabled.
 * @property {string} description - Description of what the flag controls.
 * @property {string} category - Category for grouping flags in the UI.
 */

/**
 * Default feature flag definitions.
 * These are used when no persisted flags exist in localStorage.
 * @type {FeatureFlag[]}
 */
const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'aiPanels',
    label: 'AI Panels',
    enabled: true,
    description: 'Enable AI-powered insight panels and recommendations across the platform. All AI output is simulated and generated locally from seeded data.',
    category: 'features',
  },
  {
    key: 'darkMode',
    label: 'Dark Mode',
    enabled: false,
    description: 'Enable dark mode theme support. When enabled, users can toggle between light and dark themes.',
    category: 'theming',
  },
  {
    key: 'simulatedLatency',
    label: 'Simulated Latency',
    enabled: true,
    description: 'Add simulated network latency to async operations (integration tests, sync actions) to demonstrate realistic loading states.',
    category: 'demo',
  },
  {
    key: 'verboseConsoleLogging',
    label: 'Verbose Console Logging',
    enabled: false,
    description: 'Enable verbose console logging for debugging purposes. Logs detailed information about service calls, state changes, and data operations.',
    category: 'development',
  },
];

/**
 * Returns the current active persona info for audit logging.
 * @returns {{ id: string, name: string }}
 */
const getAuditActor = () => {
  try {
    const persona = getActivePersona();
    return { id: persona.id, name: persona.name };
  } catch {
    return { id: 'system', name: 'System' };
  }
};

/**
 * Loads feature flags from localStorage.
 * If no flags are persisted, returns a deep copy of the default flags.
 * If persisted flags are missing any default flag keys, the missing flags
 * are added with their default values.
 *
 * @returns {FeatureFlag[]}
 */
const loadFlags = () => {
  const stored = getItem(FEATURE_FLAGS_KEY);

  if (!Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
  }

  // Build a map of stored flags by key for quick lookup
  const storedMap = {};
  stored.forEach((flag) => {
    if (flag && typeof flag.key === 'string') {
      storedMap[flag.key] = flag;
    }
  });

  // Merge: use stored values where available, add missing defaults
  const merged = DEFAULT_FEATURE_FLAGS.map((defaultFlag) => {
    const storedFlag = storedMap[defaultFlag.key];
    if (storedFlag) {
      return {
        key: defaultFlag.key,
        label: storedFlag.label || defaultFlag.label,
        enabled: typeof storedFlag.enabled === 'boolean' ? storedFlag.enabled : defaultFlag.enabled,
        description: storedFlag.description || defaultFlag.description,
        category: storedFlag.category || defaultFlag.category,
      };
    }
    return { ...defaultFlag };
  });

  // Include any custom flags that are not in the defaults
  const defaultKeys = new Set(DEFAULT_FEATURE_FLAGS.map((f) => f.key));
  stored.forEach((flag) => {
    if (flag && typeof flag.key === 'string' && !defaultKeys.has(flag.key)) {
      merged.push({
        key: flag.key,
        label: flag.label || flag.key,
        enabled: typeof flag.enabled === 'boolean' ? flag.enabled : false,
        description: flag.description || '',
        category: flag.category || 'custom',
      });
    }
  });

  return merged;
};

/**
 * Persists the full feature flags array to localStorage.
 * @param {FeatureFlag[]} flags - The flags to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveFlags = (flags) => {
  return setItem(FEATURE_FLAGS_KEY, flags);
};

/**
 * Returns all feature flags with their current state.
 * Merges persisted state with default flag definitions.
 *
 * @returns {FeatureFlag[]}
 */
export const getFeatureFlags = () => {
  return loadFlags();
};

/**
 * Toggles a feature flag by its key.
 * If the flag is currently enabled, it will be disabled, and vice versa.
 * Persists the updated state to localStorage and logs the action to the audit log.
 *
 * @param {string} flagKey - The key of the feature flag to toggle.
 * @returns {{ success: boolean, data: FeatureFlag|null, error: string|null }}
 */
export const toggleFeatureFlag = (flagKey) => {
  if (typeof flagKey !== 'string' || flagKey.trim() === '') {
    return { success: false, data: null, error: 'Flag key must be a non-empty string' };
  }

  try {
    const flags = loadFlags();
    const trimmedKey = flagKey.trim();
    const flagIndex = flags.findIndex((f) => f.key === trimmedKey);

    if (flagIndex === -1) {
      return { success: false, data: null, error: `Feature flag '${trimmedKey}' not found` };
    }

    const previousValue = flags[flagIndex].enabled;
    const newValue = !previousValue;

    flags[flagIndex] = {
      ...flags[flagIndex],
      enabled: newValue,
    };

    const writeResult = saveFlags(flags);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    const actor = getAuditActor();
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'FEATURE_FLAG',
        entityId: trimmedKey,
        entityName: flags[flagIndex].label,
        status: 'success',
        previousValues: { enabled: previousValue },
        newValues: { enabled: newValue },
        details: `Toggled feature flag '${flags[flagIndex].label}' from ${previousValue} to ${newValue}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...flags[flagIndex] }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to toggle feature flag',
    };
  }
};

/**
 * Checks whether a specific feature flag is enabled.
 * Returns false if the flag is not found or an error occurs.
 *
 * @param {string} flagKey - The key of the feature flag to check.
 * @returns {boolean} True if the flag is enabled, false otherwise.
 */
export const isFeatureEnabled = (flagKey) => {
  if (typeof flagKey !== 'string' || flagKey.trim() === '') {
    return false;
  }

  try {
    const flags = loadFlags();
    const trimmedKey = flagKey.trim();
    const flag = flags.find((f) => f.key === trimmedKey);

    if (!flag) {
      return false;
    }

    return flag.enabled === true;
  } catch {
    return false;
  }
};

/**
 * Sets a feature flag to a specific enabled/disabled state.
 * Persists the updated state to localStorage and logs the action to the audit log.
 *
 * @param {string} flagKey - The key of the feature flag to set.
 * @param {boolean} enabled - The desired enabled state.
 * @returns {{ success: boolean, data: FeatureFlag|null, error: string|null }}
 */
export const setFeatureFlag = (flagKey, enabled) => {
  if (typeof flagKey !== 'string' || flagKey.trim() === '') {
    return { success: false, data: null, error: 'Flag key must be a non-empty string' };
  }

  if (typeof enabled !== 'boolean') {
    return { success: false, data: null, error: 'Enabled must be a boolean value' };
  }

  try {
    const flags = loadFlags();
    const trimmedKey = flagKey.trim();
    const flagIndex = flags.findIndex((f) => f.key === trimmedKey);

    if (flagIndex === -1) {
      return { success: false, data: null, error: `Feature flag '${trimmedKey}' not found` };
    }

    const previousValue = flags[flagIndex].enabled;

    // No change needed
    if (previousValue === enabled) {
      return { success: true, data: { ...flags[flagIndex] }, error: null };
    }

    flags[flagIndex] = {
      ...flags[flagIndex],
      enabled,
    };

    const writeResult = saveFlags(flags);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    const actor = getAuditActor();
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'FEATURE_FLAG',
        entityId: trimmedKey,
        entityName: flags[flagIndex].label,
        status: 'success',
        previousValues: { enabled: previousValue },
        newValues: { enabled },
        details: `Set feature flag '${flags[flagIndex].label}' to ${enabled}`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: { ...flags[flagIndex] }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to set feature flag',
    };
  }
};

/**
 * Returns a single feature flag by its key.
 *
 * @param {string} flagKey - The key of the feature flag to retrieve.
 * @returns {{ success: boolean, data: FeatureFlag|null, error: string|null }}
 */
export const getFeatureFlag = (flagKey) => {
  if (typeof flagKey !== 'string' || flagKey.trim() === '') {
    return { success: false, data: null, error: 'Flag key must be a non-empty string' };
  }

  try {
    const flags = loadFlags();
    const trimmedKey = flagKey.trim();
    const flag = flags.find((f) => f.key === trimmedKey);

    if (!flag) {
      return { success: false, data: null, error: `Feature flag '${trimmedKey}' not found` };
    }

    return { success: true, data: { ...flag }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to retrieve feature flag',
    };
  }
};

/**
 * Returns all feature flags grouped by category.
 *
 * @returns {Object<string, FeatureFlag[]>}
 */
export const getFeatureFlagsByCategory = () => {
  const flags = loadFlags();
  const grouped = {};

  flags.forEach((flag) => {
    const category = flag.category || 'general';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ ...flag });
  });

  return grouped;
};

/**
 * Returns all distinct categories present in the feature flags.
 *
 * @returns {string[]}
 */
export const getFeatureFlagCategories = () => {
  const flags = loadFlags();
  const categories = new Set();

  flags.forEach((flag) => {
    if (flag.category) {
      categories.add(flag.category);
    }
  });

  return Array.from(categories).sort();
};

/**
 * Resets all feature flags to their default values.
 * Persists the reset state to localStorage and logs the action to the audit log.
 *
 * @returns {{ success: boolean, data: FeatureFlag[]|null, error: string|null }}
 */
export const resetFeatureFlags = () => {
  try {
    const previousFlags = loadFlags();
    const defaultFlags = DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));

    const writeResult = saveFlags(defaultFlags);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    // Audit log
    const actor = getAuditActor();
    try {
      logAction({
        action: 'configure',
        userId: actor.id,
        userName: actor.name,
        entityType: 'FEATURE_FLAG',
        entityId: 'all',
        entityName: 'All Feature Flags',
        status: 'success',
        previousValues: { flags: previousFlags },
        newValues: { flags: defaultFlags },
        details: `Reset all feature flags to default values (${defaultFlags.length} flags)`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: defaultFlags, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to reset feature flags',
    };
  }
};

/**
 * Returns the total count of feature flags.
 *
 * @returns {number}
 */
export const getFeatureFlagCount = () => {
  const flags = loadFlags();
  return flags.length;
};

/**
 * Returns a summary of feature flag states.
 *
 * @returns {{ total: number, enabled: number, disabled: number, byCategory: Object<string, { enabled: number, disabled: number }> }}
 */
export const getFeatureFlagSummary = () => {
  const flags = loadFlags();
  const summary = {
    total: flags.length,
    enabled: 0,
    disabled: 0,
    byCategory: {},
  };

  flags.forEach((flag) => {
    if (flag.enabled) {
      summary.enabled += 1;
    } else {
      summary.disabled += 1;
    }

    const category = flag.category || 'general';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = { enabled: 0, disabled: 0 };
    }

    if (flag.enabled) {
      summary.byCategory[category].enabled += 1;
    } else {
      summary.byCategory[category].disabled += 1;
    }
  });

  return summary;
};

/**
 * Returns the default feature flag definitions.
 * Useful for comparing current state against defaults.
 *
 * @returns {FeatureFlag[]}
 */
export const getDefaultFeatureFlags = () => {
  return DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
};