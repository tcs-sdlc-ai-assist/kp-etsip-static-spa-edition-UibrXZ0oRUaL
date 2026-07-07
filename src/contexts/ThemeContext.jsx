import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { STORAGE_KEYS } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { getActivePersona } from '../services/personaManager';
import { isFeatureEnabled } from '../services/featureFlagService';

/**
 * localStorage key used to persist theme preferences per persona.
 * @type {string}
 */
const THEME_PREFERENCES_KEY = STORAGE_KEYS.THEME;

/**
 * Valid theme values.
 * @type {string[]}
 */
const VALID_THEMES = ['light', 'dark'];

/**
 * Default theme when no preference is stored.
 * @type {string}
 */
const DEFAULT_THEME = 'light';

/**
 * @typedef {Object} ThemeContextValue
 * @property {string} theme - The currently active theme ('light' or 'dark').
 * @property {function(string): void} setTheme - Sets the theme to 'light' or 'dark'.
 * @property {function(): void} toggleTheme - Toggles between 'light' and 'dark'.
 * @property {boolean} isDark - Whether the current theme is dark.
 * @property {boolean} darkModeEnabled - Whether dark mode feature flag is enabled.
 */

const ThemeContext = createContext(null);

/**
 * Loads the persisted theme preferences object from localStorage.
 * @returns {Object<string, string>} Theme preferences keyed by persona ID.
 */
const loadThemePreferences = () => {
  const stored = getItem(THEME_PREFERENCES_KEY);
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    return stored;
  }
  if (typeof stored === 'string' && VALID_THEMES.includes(stored)) {
    return { _global: stored };
  }
  return {};
};

/**
 * Persists the theme preferences object to localStorage.
 * @param {Object<string, string>} preferences - Theme preferences keyed by persona ID.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveThemePreferences = (preferences) => {
  return setItem(THEME_PREFERENCES_KEY, preferences);
};

/**
 * Resolves the current persona ID for theme preference storage.
 * @returns {string} The persona ID or '_global' as fallback.
 */
const resolvePersonaId = () => {
  try {
    const persona = getActivePersona();
    if (persona && typeof persona.id === 'string' && persona.id.trim() !== '') {
      return persona.id;
    }
    return '_global';
  } catch {
    return '_global';
  }
};

/**
 * Gets the theme preference for a specific persona ID.
 * Falls back to global preference, then to DEFAULT_THEME.
 * @param {string} personaId - The persona ID to look up.
 * @returns {string} The theme preference ('light' or 'dark').
 */
const getThemeForPersona = (personaId) => {
  const preferences = loadThemePreferences();

  if (typeof personaId === 'string' && personaId.trim() !== '') {
    const personaPref = preferences[personaId];
    if (typeof personaPref === 'string' && VALID_THEMES.includes(personaPref)) {
      return personaPref;
    }
  }

  const globalPref = preferences._global;
  if (typeof globalPref === 'string' && VALID_THEMES.includes(globalPref)) {
    return globalPref;
  }

  return DEFAULT_THEME;
};

/**
 * Applies or removes the 'dark' class on the document root element.
 * @param {string} theme - The theme to apply ('light' or 'dark').
 */
const applyThemeToDocument = (theme) => {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch {
    // Silently ignore errors in non-browser environments
  }
};

/**
 * ThemeProvider wraps the application and provides theme state to all child components.
 * Persists theme preference per persona in localStorage.
 * Applies 'dark' class to document root when dark mode is active.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement}
 */
export const ThemeProvider = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(() => {
    try {
      return isFeatureEnabled('darkMode');
    } catch {
      return false;
    }
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const personaId = resolvePersonaId();
      const storedTheme = getThemeForPersona(personaId);

      // If dark mode feature is not enabled, always use light
      const darkEnabled = isFeatureEnabled('darkMode');
      if (!darkEnabled && storedTheme === 'dark') {
        return DEFAULT_THEME;
      }

      return storedTheme;
    } catch {
      return DEFAULT_THEME;
    }
  });

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    if (darkModeEnabled) {
      applyThemeToDocument(theme);
    } else {
      applyThemeToDocument('light');
    }
  }, [theme, darkModeEnabled]);

  // Periodically check if dark mode feature flag has changed
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const enabled = isFeatureEnabled('darkMode');
        setDarkModeEnabled((prev) => {
          if (prev !== enabled) {
            if (!enabled) {
              // If dark mode was just disabled, revert to light
              setThemeState('light');
              applyThemeToDocument('light');
            }
            return enabled;
          }
          return prev;
        });
      } catch {
        // Silently ignore errors during periodic check
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (typeof newTheme !== 'string' || !VALID_THEMES.includes(newTheme)) {
      return;
    }

    // If dark mode is not enabled and trying to set dark, ignore
    try {
      const darkEnabled = isFeatureEnabled('darkMode');
      if (!darkEnabled && newTheme === 'dark') {
        return;
      }
    } catch {
      if (newTheme === 'dark') {
        return;
      }
    }

    setThemeState(newTheme);

    // Persist preference for current persona
    try {
      const personaId = resolvePersonaId();
      const preferences = loadThemePreferences();
      preferences[personaId] = newTheme;
      preferences._global = newTheme;
      saveThemePreferences(preferences);
    } catch {
      // Persistence failure should not block theme change
    }

    applyThemeToDocument(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // If dark mode is not enabled and trying to switch to dark, stay on light
      try {
        const darkEnabled = isFeatureEnabled('darkMode');
        if (!darkEnabled && newTheme === 'dark') {
          return currentTheme;
        }
      } catch {
        if (newTheme === 'dark') {
          return currentTheme;
        }
      }

      // Persist preference for current persona
      try {
        const personaId = resolvePersonaId();
        const preferences = loadThemePreferences();
        preferences[personaId] = newTheme;
        preferences._global = newTheme;
        saveThemePreferences(preferences);
      } catch {
        // Persistence failure should not block theme change
      }

      applyThemeToDocument(newTheme);

      return newTheme;
    });
  }, []);

  const isDark = useMemo(() => {
    return theme === 'dark' && darkModeEnabled;
  }, [theme, darkModeEnabled]);

  const contextValue = useMemo(
    () => ({
      theme: darkModeEnabled ? theme : 'light',
      setTheme,
      toggleTheme,
      isDark,
      darkModeEnabled,
    }),
    [theme, setTheme, toggleTheme, isDark, darkModeEnabled]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the theme context.
 * Must be used within a ThemeProvider.
 *
 * @returns {ThemeContextValue} The theme context value.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * Returns the stored theme preference for a given persona ID.
 * Can be called outside of React components.
 *
 * @param {string} personaId - The persona ID to look up.
 * @returns {string} The theme preference ('light' or 'dark').
 */
export const getThemePreference = (personaId) => {
  return getThemeForPersona(personaId);
};

export default ThemeContext;