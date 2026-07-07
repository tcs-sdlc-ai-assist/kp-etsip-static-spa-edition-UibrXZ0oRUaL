import { useState, useEffect, useCallback } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { PersonaProvider } from './contexts/PersonaContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { isDatabaseSeeded, seedDatabase } from './seed/seedEngine';
import { migrateIfNeeded } from './storage/schemaMigration';
import { isStorageAvailable } from './storage/storageAdapter';
import SSOSplash from './components/auth/SSOSplash';
import LoadingSpinner from './components/common/LoadingSpinner';

/**
 * Session storage key used to track whether the SSO splash has been shown
 * during the current browser session.
 * @type {string}
 */
const SSO_SHOWN_KEY = 'kp_etsip_sso_shown';

/**
 * Checks whether the SSO splash has already been shown in this session.
 * @returns {boolean}
 */
const hasSSOBeenShown = () => {
  try {
    return sessionStorage.getItem(SSO_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Marks the SSO splash as shown for this session.
 */
const markSSOShown = () => {
  try {
    sessionStorage.setItem(SSO_SHOWN_KEY, 'true');
  } catch {
    // sessionStorage unavailable — proceed without persisting
  }
};

/**
 * Root application component.
 * Wraps the router with all context providers (PersonaProvider, ThemeProvider,
 * NotificationProvider, FeatureFlagProvider). Handles the app boot sequence:
 * checks localStorage for existing data, runs schema migration if needed,
 * seeds data on first load. Renders SSOSplash on first visit, then the main app.
 *
 * @returns {React.ReactElement}
 */
const App = () => {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState(null);
  const [showSplash, setShowSplash] = useState(() => !hasSSOBeenShown());

  /**
   * Runs the application boot sequence:
   * 1. Checks localStorage availability.
   * 2. Checks if the database has been seeded.
   * 3. If not seeded, seeds with standard defaults.
   * 4. Runs schema migration if needed.
   */
  useEffect(() => {
    const boot = () => {
      try {
        // Step 1: Check localStorage availability
        if (!isStorageAvailable()) {
          setBootError(
            'localStorage is not available. KP ETSIP requires localStorage to function. ' +
            'Please enable localStorage in your browser settings and reload the page.'
          );
          setBooting(false);
          return;
        }

        // Step 2: Check if database has been seeded
        const seeded = isDatabaseSeeded();

        if (!seeded) {
          // Step 3: Seed with standard defaults on first load
          const seedResult = seedDatabase('standard', 'kp-etsip-default-seed');

          if (!seedResult.success) {
            setBootError(
              `Failed to initialize application data: ${seedResult.error || 'Unknown error'}. ` +
              'Try clearing your browser localStorage and reloading the page.'
            );
            setBooting(false);
            return;
          }
        }

        // Step 4: Run schema migration if needed
        try {
          const migrationResult = migrateIfNeeded();

          if (!migrationResult.success && migrationResult.errors.length > 0) {
            // Log migration errors but don't block the app — data may still be usable
            if (typeof console !== 'undefined' && typeof console.warn === 'function') {
              console.warn('Schema migration warnings:', migrationResult.errors);
            }
          }
        } catch {
          // Migration failure should not block the app from loading
          if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('Schema migration check failed. Proceeding with existing data.');
          }
        }

        setBooting(false);
      } catch (err) {
        setBootError(
          `Application initialization failed: ${err && err.message ? err.message : 'Unknown error'}. ` +
          'Try clearing your browser localStorage and reloading the page.'
        );
        setBooting(false);
      }
    };

    boot();
  }, []);

  /**
   * Handles SSO splash completion — marks as shown and hides the splash.
   */
  const handleSSOComplete = useCallback(() => {
    markSSOShown();
    setShowSplash(false);
  }, []);

  // Show boot error state
  if (bootError) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-neutral-50 p-4"
        role="alert"
        aria-label="Application initialization error"
      >
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-red-600"
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
            </div>
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Initialization Error
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {bootError}
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            aria-label="Reload application"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Show loading state during boot
  if (booting) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-neutral-50"
        role="status"
        aria-label="Initializing application"
      >
        <LoadingSpinner size="lg" label="Initializing KP ETSIP..." />
      </div>
    );
  }

  // Show SSO splash on first visit in this session
  if (showSplash) {
    return (
      <SSOSplash
        onComplete={handleSSOComplete}
        autoDismissMs={3000}
      />
    );
  }

  // Render the main application with all context providers
  return (
    <FeatureFlagProvider>
      <ThemeProvider>
        <PersonaProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </PersonaProvider>
      </ThemeProvider>
    </FeatureFlagProvider>
  );
};

export default App;