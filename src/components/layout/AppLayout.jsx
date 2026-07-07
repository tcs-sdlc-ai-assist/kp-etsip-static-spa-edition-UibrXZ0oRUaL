import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

/**
 * Main application layout component composing TopBar, Sidebar, and main content area.
 * Handles responsive layout with Tailwind breakpoints.
 * Provides skip-to-content link for accessibility.
 *
 * @returns {React.ReactElement}
 */
const AppLayout = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50 transition-colors duration-300 dark:bg-neutral-900">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-elevated focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top navigation bar */}
      <TopBar />

      {/* Body: Sidebar + Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-neutral-50 transition-colors duration-300 dark:bg-neutral-900"
          role="main"
          aria-label="Main content"
        >
          <div className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;