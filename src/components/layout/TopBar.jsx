import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { usePersona } from '../../contexts/PersonaContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getAllPersonas } from '../../constants/personas';

/**
 * TopBar component — application top navigation bar.
 *
 * Features:
 * - App logo and title
 * - Role Switcher dropdown (persona selector)
 * - Theme toggle button (light/dark)
 * - Notification bell icon with unread badge
 * - User persona display (name, title, access level)
 *
 * Fully keyboard navigable with ARIA roles.
 *
 * @returns {React.ReactElement}
 */
const TopBar = () => {
  const {
    persona,
    switchPersona,
    unreadNotificationCount,
  } = usePersona();

  const { theme, toggleTheme, isDark, darkModeEnabled } = useTheme();
  const { unreadCount } = useNotifications();

  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const roleSwitcherRef = useRef(null);
  const roleSwitcherButtonRef = useRef(null);
  const searchInputRef = useRef(null);

  const allPersonas = getAllPersonas();

  const effectiveUnreadCount = unreadCount || unreadNotificationCount || 0;

  // Close role switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleSwitcherRef.current &&
        !roleSwitcherRef.current.contains(event.target)
      ) {
        setRoleSwitcherOpen(false);
        setSearchTerm('');
      }
    };

    if (roleSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [roleSwitcherOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (roleSwitcherOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [roleSwitcherOpen]);

  const handleToggleRoleSwitcher = useCallback(() => {
    setRoleSwitcherOpen((prev) => {
      if (prev) {
        setSearchTerm('');
      }
      return !prev;
    });
  }, []);

  const handleSelectPersona = useCallback(
    (personaId) => {
      if (typeof personaId !== 'string' || personaId.trim() === '') {
        return;
      }
      const result = switchPersona(personaId);
      if (result.success) {
        setRoleSwitcherOpen(false);
        setSearchTerm('');
      }
    },
    [switchPersona]
  );

  const handleRoleSwitcherKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        setRoleSwitcherOpen(false);
        setSearchTerm('');
        if (roleSwitcherButtonRef.current) {
          roleSwitcherButtonRef.current.focus();
        }
      }
    },
    []
  );

  const handlePersonaItemKeyDown = useCallback(
    (event, personaId) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelectPersona(personaId);
      }
    },
    [handleSelectPersona]
  );

  const filteredPersonas = allPersonas.filter((p) => {
    if (searchTerm.trim() === '') {
      return true;
    }
    const term = searchTerm.trim().toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.accessLevel && p.accessLevel.toLowerCase().includes(term))
    );
  });

  const formatAccessLevel = (accessLevel) => {
    if (typeof accessLevel !== 'string') {
      return '';
    }
    return accessLevel
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getAccessLevelBadgeClasses = (accessLevel) => {
    switch (accessLevel) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'executive':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'strategic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'management':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'contributor':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'read_only':
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
      case 'external':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };

  return (
    <header
      className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-card transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6"
      role="banner"
    >
      {/* Left section: Logo and title */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            KP ETSIP
          </h1>
          <p className="text-2xs text-neutral-500 dark:text-neutral-400">
            Enterprise Technology Standards & Innovation Platform
          </p>
        </div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 sm:hidden">
          KP ETSIP
        </h1>
      </div>

      {/* Right section: Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher */}
        <div className="relative" ref={roleSwitcherRef}>
          <button
            ref={roleSwitcherButtonRef}
            type="button"
            onClick={handleToggleRoleSwitcher}
            onKeyDown={handleRoleSwitcherKeyDown}
            className="btn-outline flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm"
            aria-haspopup="listbox"
            aria-expanded={roleSwitcherOpen}
            aria-label={`Switch persona. Current: ${persona.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden max-w-[120px] truncate md:inline">
              {persona.name}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${
                roleSwitcherOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {roleSwitcherOpen && (
            <div
              className="absolute right-0 top-full z-60 mt-1 w-80 rounded-xl border border-neutral-200 bg-white shadow-elevated dark:border-neutral-700 dark:bg-neutral-800"
              role="dialog"
              aria-label="Select persona"
              onKeyDown={handleRoleSwitcherKeyDown}
            >
              {/* Search input */}
              <div className="border-b border-neutral-200 p-2 dark:border-neutral-700">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search personas..."
                  className="input text-sm"
                  aria-label="Search personas"
                />
              </div>

              {/* Persona list */}
              <ul
                className="max-h-72 overflow-y-auto p-1"
                role="listbox"
                aria-label="Available personas"
              >
                {filteredPersonas.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    No personas match your search.
                  </li>
                )}
                {filteredPersonas.map((p) => {
                  const isActive = persona.id === p.id;
                  return (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => handleSelectPersona(p.id)}
                      onKeyDown={(e) => handlePersonaItemKeyDown(e, p.id)}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200">
                        {p.name
                          .split(' ')
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate font-medium ${
                              isActive
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {p.name}
                          </span>
                          {isActive && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 flex-shrink-0 text-primary-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {p.title}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-2xs font-medium ${getAccessLevelBadgeClasses(
                            p.accessLevel
                          )}`}
                        >
                          {formatAccessLevel(p.accessLevel)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Footer */}
              <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
                <p className="text-2xs text-neutral-400 dark:text-neutral-500">
                  {allPersonas.length} persona{allPersonas.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        {darkModeEnabled && (
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-outline flex h-9 w-9 items-center justify-center rounded-lg p-0"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        )}

        {/* Notification bell */}
        <button
          type="button"
          className="btn-outline relative flex h-9 w-9 items-center justify-center rounded-lg p-0"
          aria-label={`Notifications${
            effectiveUnreadCount > 0
              ? `. ${effectiveUnreadCount} unread`
              : ''
          }`}
          title={`Notifications${
            effectiveUnreadCount > 0
              ? ` (${effectiveUnreadCount} unread)`
              : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          {effectiveUnreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-error px-1 text-2xs font-bold text-white"
              aria-hidden="true"
            >
              {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
            </span>
          )}
        </button>

        {/* User persona display */}
        <div className="hidden items-center gap-2 border-l border-neutral-200 pl-3 dark:border-neutral-700 lg:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {persona.name
              .split(' ')
              .map((word) => word[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="max-w-[140px] truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {persona.name}
            </p>
            <p className="max-w-[140px] truncate text-2xs text-neutral-500 dark:text-neutral-400">
              {formatAccessLevel(persona.accessLevel)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;