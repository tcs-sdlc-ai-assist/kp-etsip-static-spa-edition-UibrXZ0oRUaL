import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Simulated SSO login splash screen shown on first load before persona selection.
 * Displays an enterprise login UI mockup with 'SSO (simulated)' label.
 * Auto-dismisses after a configurable delay or on click-through.
 * No real authentication is performed.
 *
 * @param {Object} props
 * @param {function} props.onComplete - Callback invoked when the splash screen is dismissed (auto or manual).
 * @param {number} [props.autoDissmissMs] - Auto-dismiss delay in milliseconds. Defaults to 3000. Set to 0 to disable auto-dismiss.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement}
 */
const SSOSplash = ({ onComplete, autoDismissMs, className }) => {
  const [authenticating, setAuthenticating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const completedRef = useRef(false);

  const effectiveAutoDismiss = typeof autoDismissMs === 'number' && autoDismissMs >= 0 ? autoDismissMs : 3000;

  /**
   * Handles the completion of the splash screen.
   */
  const handleComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    setDismissed(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }

    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, [onComplete]);

  /**
   * Handles the sign-in button click to simulate SSO authentication.
   */
  const handleSignIn = useCallback(() => {
    if (authenticating || dismissed) {
      return;
    }

    setAuthenticating(true);
    setProgress(0);

    // Simulate authentication progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 25 + 10;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(next, 95);
      });
    }, 200);

    progressRef.current = progressInterval;

    // Complete after simulated delay
    timerRef.current = setTimeout(() => {
      setProgress(100);
      clearInterval(progressInterval);
      progressRef.current = null;

      setTimeout(() => {
        handleComplete();
      }, 300);
    }, 1500);
  }, [authenticating, dismissed, handleComplete]);

  /**
   * Handles keyboard interaction on the sign-in button.
   */
  const handleSignInKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSignIn();
      }
    },
    [handleSignIn]
  );

  /**
   * Handles the skip/click-through action.
   */
  const handleSkip = useCallback(() => {
    if (dismissed) {
      return;
    }
    handleComplete();
  }, [dismissed, handleComplete]);

  /**
   * Handles keyboard interaction on the skip link.
   */
  const handleSkipKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    },
    [handleSkip]
  );

  // Auto-dismiss after delay if enabled
  useEffect(() => {
    if (effectiveAutoDismiss > 0 && !authenticating && !dismissed) {
      timerRef.current = setTimeout(() => {
        if (!completedRef.current) {
          handleSignIn();
        }
      }, effectiveAutoDismiss);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    };
  }, [effectiveAutoDismiss, authenticating, dismissed, handleSignIn]);

  // Handle Escape key to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !dismissed) {
        handleComplete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissed, handleComplete]);

  if (dismissed) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 ${className || ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="SSO Login (Simulated)"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="sso-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#sso-grid)" />
        </svg>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in px-4">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-elevated backdrop-blur-sm">
          {/* Logo and title */}
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white shadow-soft"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="mt-5 text-2xl font-bold text-white">
              KP ETSIP
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Enterprise Technology Standards & Innovation Platform
            </p>

            {/* SSO simulated badge */}
            <span className="mt-3 inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-2xs font-medium text-yellow-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-3 w-3"
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
              SSO (simulated)
            </span>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" aria-hidden="true" />

          {/* Simulated SSO form */}
          <div className="space-y-4">
            {/* Organization field (read-only, simulated) */}
            <div>
              <label
                htmlFor="sso-org"
                className="block text-xs font-medium text-white/60"
              >
                Organization
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white/40"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="sso-org"
                  type="text"
                  value="Kaiser Permanente"
                  readOnly
                  className="block w-full rounded-lg border border-white/20 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                  aria-label="Organization"
                />
              </div>
            </div>

            {/* Identity Provider field (read-only, simulated) */}
            <div>
              <label
                htmlFor="sso-idp"
                className="block text-xs font-medium text-white/60"
              >
                Identity Provider
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white/40"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="sso-idp"
                  type="text"
                  value="Azure AD (SAML 2.0)"
                  readOnly
                  className="block w-full rounded-lg border border-white/20 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                  aria-label="Identity Provider"
                />
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="button"
              onClick={handleSignIn}
              onKeyDown={handleSignInKeyDown}
              disabled={authenticating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary-900 shadow-soft transition-all duration-200 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label={authenticating ? 'Authenticating...' : 'Sign in with SSO'}
            >
              {authenticating ? (
                <>
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                    aria-hidden="true"
                  />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Sign in with SSO</span>
                </>
              )}
            </button>

            {/* Progress bar */}
            {authenticating && (
              <div className="space-y-1.5">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Authentication progress"
                >
                  <div
                    className="h-full rounded-full bg-white/60 transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-center text-2xs text-white/50">
                  {progress < 30
                    ? 'Connecting to identity provider...'
                    : progress < 60
                      ? 'Validating credentials...'
                      : progress < 90
                        ? 'Loading user profile...'
                        : 'Redirecting to application...'}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-white/10" aria-hidden="true" />

          {/* Skip link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              onKeyDown={handleSkipKeyDown}
              disabled={dismissed}
              className="text-xs text-white/50 underline transition-colors duration-150 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip SSO login and enter application"
            >
              Skip to application →
            </button>
          </div>

          {/* Security info */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-white/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secured with TLS 1.3 · No real authentication</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-2xs text-white/30">
          This is a simulated SSO login screen for demonstration purposes.
          <br />
          No real credentials are required or transmitted.
          Press <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-white/50">Esc</kbd> to skip.
        </p>
      </div>
    </div>
  );
};

SSOSplash.propTypes = {
  /** Callback invoked when the splash screen is dismissed (auto or manual). */
  onComplete: PropTypes.func.isRequired,
  /** Auto-dismiss delay in milliseconds. Defaults to 3000. Set to 0 to disable auto-dismiss. */
  autoDismissMs: PropTypes.number,
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

SSOSplash.defaultProps = {
  autoDismissMs: 3000,
  className: '',
};

export default SSOSplash;