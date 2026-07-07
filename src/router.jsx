import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EntityListPage from './pages/EntityListPage';
import EntityDetailPage from './pages/EntityDetailPage';
import EntityCreatePage from './pages/EntityCreatePage';
import AIInsightsPage from './pages/AIInsightsPage';
import AdministrationPage from './pages/AdministrationPage';
import IntegrationsPage from './pages/IntegrationsPage';
import NotificationsPage from './pages/NotificationsPage';
import SchedulerPage from './pages/SchedulerPage';
import PermissionDenied from './components/common/PermissionDenied';
import EmptyState from './components/common/EmptyState';

/**
 * 404 Not Found page component.
 * Displays an empty state with a link back to the dashboard.
 *
 * @returns {React.ReactElement}
 */
const NotFoundPage = () => {
  return (
    <EmptyState
      title="Page Not Found"
      message="The page you are looking for does not exist or you do not have permission to access it."
      actionLabel="Go to Dashboard"
      onAction={() => {
        window.location.href = '/dashboard';
      }}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      }
    />
  );
};

/**
 * React Router v6 configuration with all application routes.
 * Uses AppLayout as the parent layout component.
 * Includes routes for all entity types, specialized pages, and catch-all 404.
 *
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Root redirect to dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Dashboard
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },

      // Portfolios
      {
        path: 'portfolios',
        element: <EntityListPage />,
      },
      {
        path: 'portfolios/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'portfolios/:id',
        element: <EntityDetailPage />,
      },

      // Applications
      {
        path: 'applications',
        element: <EntityListPage />,
      },
      {
        path: 'applications/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'applications/:id',
        element: <EntityDetailPage />,
      },

      // Technology Standards
      {
        path: 'technology-standards',
        element: <EntityListPage />,
      },
      {
        path: 'technology-standards/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'technology-standards/:id',
        element: <EntityDetailPage />,
      },

      // Tech Radar
      {
        path: 'tech-radar',
        element: <EntityListPage />,
      },
      {
        path: 'tech-radar/:id',
        element: <EntityDetailPage />,
      },

      // Tech Debt
      {
        path: 'tech-debt',
        element: <EntityListPage />,
      },
      {
        path: 'tech-debt/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'tech-debt/:id',
        element: <EntityDetailPage />,
      },

      // Quality Gates
      {
        path: 'quality-gates',
        element: <EntityListPage />,
      },
      {
        path: 'quality-gates/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'quality-gates/:id',
        element: <EntityDetailPage />,
      },

      // Governance
      {
        path: 'governance',
        element: <EntityListPage />,
      },
      {
        path: 'governance/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'governance/:id',
        element: <EntityDetailPage />,
      },

      // Approvals
      {
        path: 'approvals',
        element: <EntityListPage />,
      },
      {
        path: 'approvals/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'approvals/:id',
        element: <EntityDetailPage />,
      },

      // Waivers
      {
        path: 'waivers',
        element: <EntityListPage />,
      },
      {
        path: 'waivers/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'waivers/:id',
        element: <EntityDetailPage />,
      },

      // Environments
      {
        path: 'environments',
        element: <EntityListPage />,
      },
      {
        path: 'environments/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'environments/:id',
        element: <EntityDetailPage />,
      },

      // Integrations
      {
        path: 'integrations',
        element: <IntegrationsPage />,
      },
      {
        path: 'integrations/:id',
        element: <EntityDetailPage />,
      },

      // Evidence
      {
        path: 'evidence',
        element: <EntityListPage />,
      },
      {
        path: 'evidence/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'evidence/:id',
        element: <EntityDetailPage />,
      },

      // Reports
      {
        path: 'reports',
        element: <EntityListPage />,
      },

      // AI Insights
      {
        path: 'ai-insights',
        element: <AIInsightsPage />,
      },
      {
        path: 'ai-insights/:id',
        element: <EntityDetailPage />,
      },

      // Notifications
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'notifications/:id',
        element: <EntityDetailPage />,
      },

      // Administration
      {
        path: 'admin',
        element: <AdministrationPage />,
      },

      // Audit Log
      {
        path: 'audit-log',
        element: <EntityListPage />,
      },
      {
        path: 'audit-log/:id',
        element: <EntityDetailPage />,
      },

      // Users
      {
        path: 'users',
        element: <EntityListPage />,
      },
      {
        path: 'users/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'users/:id',
        element: <EntityDetailPage />,
      },

      // Roles
      {
        path: 'roles',
        element: <EntityListPage />,
      },
      {
        path: 'roles/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'roles/:id',
        element: <EntityDetailPage />,
      },

      // Settings
      {
        path: 'settings',
        element: <AdministrationPage />,
      },

      // Use Cases
      {
        path: 'use-cases',
        element: <EntityListPage />,
      },
      {
        path: 'use-cases/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'use-cases/:id',
        element: <EntityDetailPage />,
      },

      // Demo Scenarios
      {
        path: 'demo-scenarios',
        element: <EntityListPage />,
      },
      {
        path: 'demo-scenarios/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'demo-scenarios/:id',
        element: <EntityDetailPage />,
      },

      // Security
      {
        path: 'security',
        element: <EntityListPage />,
      },

      // Accessibility
      {
        path: 'accessibility',
        element: <EntityListPage />,
      },

      // Performance
      {
        path: 'performance',
        element: <EntityListPage />,
      },

      // Test Data
      {
        path: 'test-data',
        element: <EntityListPage />,
      },

      // Releases
      {
        path: 'releases',
        element: <EntityListPage />,
      },
      {
        path: 'releases/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'releases/:id',
        element: <EntityDetailPage />,
      },

      // Scheduler / Schedules
      {
        path: 'scheduler',
        element: <SchedulerPage />,
      },
      {
        path: 'schedules',
        element: <SchedulerPage />,
      },
      {
        path: 'schedules/:id',
        element: <EntityDetailPage />,
      },

      // Relationships
      {
        path: 'relationships',
        element: <EntityListPage />,
      },
      {
        path: 'relationships/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'relationships/:id',
        element: <EntityDetailPage />,
      },

      // Tech Categories
      {
        path: 'tech-categories',
        element: <EntityListPage />,
      },
      {
        path: 'tech-categories/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'tech-categories/:id',
        element: <EntityDetailPage />,
      },

      // Tech Entries
      {
        path: 'tech-entries',
        element: <EntityListPage />,
      },
      {
        path: 'tech-entries/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'tech-entries/:id',
        element: <EntityDetailPage />,
      },

      // Definitions
      {
        path: 'definitions',
        element: <EntityListPage />,
      },
      {
        path: 'definitions/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'definitions/:id',
        element: <EntityDetailPage />,
      },

      // PDE Configs
      {
        path: 'pde-configs',
        element: <EntityListPage />,
      },
      {
        path: 'pde-configs/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'pde-configs/:id',
        element: <EntityDetailPage />,
      },

      // Demands (alias route)
      {
        path: 'demands',
        element: <EntityListPage />,
      },
      {
        path: 'demands/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'demands/:id',
        element: <EntityDetailPage />,
      },

      // Post Deployment (alias route)
      {
        path: 'post-deployment',
        element: <EntityListPage />,
      },
      {
        path: 'post-deployment/:id',
        element: <EntityDetailPage />,
      },

      // Test Cases (alias route)
      {
        path: 'test-cases',
        element: <EntityListPage />,
      },
      {
        path: 'test-cases/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'test-cases/:id',
        element: <EntityDetailPage />,
      },

      // Test Suites (alias route)
      {
        path: 'test-suites',
        element: <EntityListPage />,
      },
      {
        path: 'test-suites/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'test-suites/:id',
        element: <EntityDetailPage />,
      },

      // Test Executions (alias route)
      {
        path: 'test-executions',
        element: <EntityListPage />,
      },
      {
        path: 'test-executions/:id',
        element: <EntityDetailPage />,
      },

      // Defects (alias route)
      {
        path: 'defects',
        element: <EntityListPage />,
      },
      {
        path: 'defects/create',
        element: <EntityCreatePage />,
      },
      {
        path: 'defects/:id',
        element: <EntityDetailPage />,
      },

      // Permission Denied
      {
        path: 'permission-denied',
        element: <PermissionDenied />,
      },

      // Catch-all 404
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;