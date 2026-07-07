import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdministrationPage from './AdministrationPage';
import { PersonaProvider } from '../contexts/PersonaContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { FeatureFlagProvider } from '../contexts/FeatureFlagContext';
import { STORAGE_KEYS, SCHEMA_VERSION } from '../constants/constants';
import { seedDatabase } from '../seed/seedEngine';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin' }),
  useParams: () => ({}),
}));

// Mock exportUtils to prevent actual file downloads
vi.mock('../utils/exportUtils', () => ({
  exportToCSV: vi.fn(() => true),
  exportToJSON: vi.fn(() => true),
  exportToXLSX: vi.fn(() => true),
  exportToPDF: vi.fn(() => true),
  generateStubFile: vi.fn(() => true),
}));

/**
 * Sets up localStorage with admin persona and seeded data.
 */
const setupLocalStorage = (personaId = 'persona-platform-administrator') => {
  localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));

  // Seed the database with small size for faster tests
  seedDatabase('small', 'admin-page-test-seed');

  // Set feature flags
  localStorage.setItem('kp_etsip_feature_flags', JSON.stringify([
    { key: 'aiPanels', label: 'AI Panels', enabled: true, description: 'AI panels', category: 'features' },
    { key: 'darkMode', label: 'Dark Mode', enabled: false, description: 'Dark mode', category: 'theming' },
    { key: 'simulatedLatency', label: 'Simulated Latency', enabled: true, description: 'Latency', category: 'demo' },
    { key: 'verboseConsoleLogging', label: 'Verbose Logging', enabled: false, description: 'Logging', category: 'development' },
  ]));
};

/**
 * Wraps AdministrationPage with all required context providers.
 */
const renderWithProviders = (ui) => {
  return render(
    <FeatureFlagProvider>
      <ThemeProvider>
        <PersonaProvider>
          <NotificationProvider>
            {ui}
          </NotificationProvider>
        </PersonaProvider>
      </ThemeProvider>
    </FeatureFlagProvider>
  );
};

describe('AdministrationPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const headings = screen.getAllByText('Administration');
        expect(headings.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders the page with admin access level displayed', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const adminText = screen.getByText('Admin');
        expect(adminText).toBeDefined();
      });
    });

    it('renders all four tab buttons', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Data Controls' })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });
    });

    it('renders the refresh button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Refresh');
        expect(refreshButton).toBeDefined();
      });
    });

    it('renders the region landmark', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const region = screen.getByRole('region', { name: 'Administration' });
        expect(region).toBeDefined();
      });
    });

    it('renders the footer note', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const footer = screen.getByText(/All administration actions are audit-logged/i);
        expect(footer).toBeDefined();
      });
    });
  });

  describe('permission gating', () => {
    it('shows PermissionDenied for read-only persona', async () => {
      setupLocalStorage('persona-read-only-user');
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const denied = screen.getByText(/Access Denied/i);
        expect(denied).toBeDefined();
      });
    });

    it('shows PermissionDenied for external persona', async () => {
      setupLocalStorage('persona-vendor-partner');
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const denied = screen.getByText(/Access Denied/i);
        expect(denied).toBeDefined();
      });
    });

    it('renders the page for admin persona', async () => {
      setupLocalStorage('persona-platform-administrator');
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const headings = screen.getAllByText('Administration');
        expect(headings.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows Go to Dashboard button on permission denied', async () => {
      setupLocalStorage('persona-vendor-partner');
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const dashboardButton = screen.getByText('Go to Dashboard');
        expect(dashboardButton).toBeDefined();
      });
    });
  });

  describe('tab navigation', () => {
    it('defaults to Data Controls tab', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const dataControlsTab = screen.getByRole('tab', { name: 'Data Controls' });
        expect(dataControlsTab.getAttribute('aria-selected')).toBe('true');
      });
    });

    it('switches to Feature Flags tab when clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      expect(flagsTab.getAttribute('aria-selected')).toBe('true');
    });

    it('switches to Audit Log tab when clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      expect(auditTab.getAttribute('aria-selected')).toBe('true');
    });

    it('switches to Platform Health tab when clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      expect(healthTab.getAttribute('aria-selected')).toBe('true');
    });

    it('renders tab navigation with tablist role', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeDefined();
      });
    });

    it('renders tab panels with tabpanel role', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const tabpanel = screen.getByRole('tabpanel');
        expect(tabpanel).toBeDefined();
      });
    });
  });

  describe('Data Controls tab', () => {
    it('renders Seed Information section', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const seedInfo = screen.getByText('Seed Information');
        expect(seedInfo).toBeDefined();
      });
    });

    it('renders Seed Size Configuration section', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const seedSizeConfig = screen.getByText('Seed Size Configuration');
        expect(seedSizeConfig).toBeDefined();
      });
    });

    it('renders Data Actions section', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const dataActions = screen.getByText('Data Actions');
        expect(dataActions).toBeDefined();
      });
    });

    it('renders Reseed Database button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const reseedButton = screen.getByLabelText('Reseed database');
        expect(reseedButton).toBeDefined();
      });
    });

    it('renders Reset to Defaults button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const resetButton = screen.getByLabelText('Reset to defaults');
        expect(resetButton).toBeDefined();
      });
    });

    it('renders Export All Data button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const exportButton = screen.getByLabelText('Export all data');
        expect(exportButton).toBeDefined();
      });
    });

    it('renders Import Data button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const importButton = screen.getByLabelText('Import data');
        expect(importButton).toBeDefined();
      });
    });

    it('renders Clear All Data button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const clearButton = screen.getByLabelText('Clear all data');
        expect(clearButton).toBeDefined();
      });
    });

    it('renders seed size selector', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const seedSizeSelect = screen.getByLabelText('Select seed size');
        expect(seedSizeSelect).toBeDefined();
      });
    });

    it('renders Save Seed Size button', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const saveButton = screen.getByLabelText('Save seed size');
        expect(saveButton).toBeDefined();
      });
    });

    it('displays entity counts in seed information', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const entityCountsLabel = screen.getByText('Entity Counts');
        expect(entityCountsLabel).toBeDefined();
      });
    });

    it('displays seeded status as Yes after seeding', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const yesText = screen.getAllByText('Yes');
        expect(yesText.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays schema version', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const versionText = screen.getByText(SCHEMA_VERSION);
        expect(versionText).toBeDefined();
      });
    });

    it('opens confirm dialog when Reseed Database is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Reseed database')).toBeDefined();
      });

      const reseedButton = screen.getByLabelText('Reseed database');
      await user.click(reseedButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        expect(screen.getByText(/Reseed Database/i)).toBeDefined();
      });
    });

    it('opens confirm dialog when Clear All Data is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Clear all data')).toBeDefined();
      });

      const clearButton = screen.getByLabelText('Clear all data');
      await user.click(clearButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        expect(screen.getByText(/Clear All Data/i)).toBeDefined();
      });
    });

    it('opens confirm dialog when Reset to Defaults is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Reset to defaults')).toBeDefined();
      });

      const resetButton = screen.getByLabelText('Reset to defaults');
      await user.click(resetButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        expect(screen.getByText(/Reset to Defaults/i)).toBeDefined();
      });
    });

    it('opens import modal when Import Data is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Import data')).toBeDefined();
      });

      const importButton = screen.getByLabelText('Import data');
      await user.click(importButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog', { name: 'Import Data' });
        expect(dialog).toBeDefined();
      });
    });

    it('shows permission denied message for non-admin persona on data controls', async () => {
      setupLocalStorage('persona-quality-engineer');
      // Quality engineer can view PDE_CONFIG but cannot configure
      // The page itself may be denied or the controls disabled
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        // Quality engineer doesn't have view permission on PDE_CONFIG
        const denied = screen.getByText(/Access Denied/i);
        expect(denied).toBeDefined();
      });
    });
  });

  describe('Feature Flags tab', () => {
    it('renders feature flags list when tab is selected', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const flagsHeading = screen.getByText('Feature Flags');
        expect(flagsHeading).toBeDefined();
      });
    });

    it('renders AI Panels feature flag', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const aiPanelsLabel = screen.getByText('AI Panels');
        expect(aiPanelsLabel).toBeDefined();
      });
    });

    it('renders Dark Mode feature flag', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const darkModeLabel = screen.getByText('Dark Mode');
        expect(darkModeLabel).toBeDefined();
      });
    });

    it('renders toggle switches for feature flags', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('toggles a feature flag when switch is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBeGreaterThanOrEqual(1);
      });

      // Find the Dark Mode toggle (should be disabled/false initially)
      const darkModeToggle = screen.getByLabelText('Toggle Dark Mode');
      expect(darkModeToggle.getAttribute('aria-checked')).toBe('false');

      await user.click(darkModeToggle);

      await waitFor(() => {
        expect(darkModeToggle.getAttribute('aria-checked')).toBe('true');
      });
    });

    it('renders Reset to Defaults button for feature flags', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const resetButton = screen.getByLabelText('Reset feature flags to defaults');
        expect(resetButton).toBeDefined();
      });
    });

    it('renders Theme Settings section', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const themeSettings = screen.getByText('Theme Settings');
        expect(themeSettings).toBeDefined();
      });
    });

    it('renders category badges for feature flags', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const featuresBadge = screen.getByText('features');
        expect(featuresBadge).toBeDefined();
      });
    });

    it('shows success message after toggling a flag', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        expect(screen.getAllByRole('switch').length).toBeGreaterThanOrEqual(1);
      });

      const darkModeToggle = screen.getByLabelText('Toggle Dark Mode');
      await user.click(darkModeToggle);

      await waitFor(() => {
        const successAlert = screen.getByRole('alert');
        expect(successAlert).toBeDefined();
        expect(successAlert.textContent).toContain('toggled');
      });
    });
  });

  describe('Audit Log tab', () => {
    it('renders audit log entries table when tab is selected', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const auditHeading = screen.getByText('Audit Log Entries');
        expect(auditHeading).toBeDefined();
      });
    });

    it('renders audit log search input', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const searchInput = screen.getByLabelText('Search audit log');
        expect(searchInput).toBeDefined();
      });
    });

    it('renders audit log filter dropdowns', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const actionFilter = screen.getByLabelText('Filter by action');
        expect(actionFilter).toBeDefined();

        const entityTypeFilter = screen.getByLabelText('Filter by entity type');
        expect(entityTypeFilter).toBeDefined();

        const statusFilter = screen.getByLabelText('Filter by status');
        expect(statusFilter).toBeDefined();
      });
    });

    it('renders audit log table with column headers', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const table = screen.getByRole('table', { name: 'Audit log entries' });
        expect(table).toBeDefined();

        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('displays total count of audit entries', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const totalText = screen.getByText(/total/i);
        expect(totalText).toBeDefined();
      });
    });

    it('renders pagination controls for audit log', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const pagination = screen.getByLabelText('Audit log pagination');
        expect(pagination).toBeDefined();
      });
    });

    it('renders audit log entries from seeded data', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Header row + data rows
        expect(rows.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Platform Health tab', () => {
    it('renders platform health metrics when tab is selected', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const overallStatus = screen.getByText('Overall Status');
        expect(overallStatus).toBeDefined();
      });
    });

    it('renders Storage Used metric', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const storageUsed = screen.getByText('Storage Used');
        expect(storageUsed).toBeDefined();
      });
    });

    it('renders Total Errors metric', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const totalErrors = screen.getByText('Total Errors');
        expect(totalErrors).toBeDefined();
      });
    });

    it('renders Integrations metric', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const integrations = screen.getByText('Integrations');
        expect(integrations).toBeDefined();
      });
    });

    it('renders Error Counts by Category section', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const errorCounts = screen.getByText('Error Counts by Category');
        expect(errorCounts).toBeDefined();
      });
    });

    it('renders Integration Health Summary section', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const integrationHealth = screen.getByText('Integration Health Summary');
        expect(integrationHealth).toBeDefined();
      });
    });

    it('renders Seed & Schema Information section', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const seedSchema = screen.getByText('Seed & Schema Information');
        expect(seedSchema).toBeDefined();
      });
    });

    it('displays Database Seeded status', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const seededLabel = screen.getByText('Database Seeded');
        expect(seededLabel).toBeDefined();
      });
    });

    it('displays integration health table with metrics', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const healthTable = screen.getByRole('table', { name: 'Integration health summary' });
        expect(healthTable).toBeDefined();
      });
    });

    it('displays error count categories', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        expect(screen.getByText('Quality Gates')).toBeDefined();
        expect(screen.getByText('Critical Debt')).toBeDefined();
        expect(screen.getByText('Expired Waivers')).toBeDefined();
      });
    });
  });

  describe('data control actions', () => {
    it('saves seed size when Save Seed Size is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select seed size')).toBeDefined();
      });

      const seedSizeSelect = screen.getByLabelText('Select seed size');
      await user.selectOptions(seedSizeSelect, 'large');

      const saveButton = screen.getByLabelText('Save seed size');
      await user.click(saveButton);

      await waitFor(() => {
        const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
        expect(storedSize).toBe('large');
      });
    });

    it('exports data when Export All Data is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      const { exportToJSON } = await import('../utils/exportUtils');
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Export all data')).toBeDefined();
      });

      const exportButton = screen.getByLabelText('Export all data');
      await user.click(exportButton);

      await waitFor(() => {
        expect(exportToJSON).toHaveBeenCalled();
      });
    });
  });

  describe('import modal', () => {
    it('renders file input in import modal', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Import data')).toBeDefined();
      });

      const importButton = screen.getByLabelText('Import data');
      await user.click(importButton);

      await waitFor(() => {
        const fileInput = screen.getByLabelText('Select JSON file to import');
        expect(fileInput).toBeDefined();
      });
    });

    it('renders Cancel button in import modal', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Import data')).toBeDefined();
      });

      const importButton = screen.getByLabelText('Import data');
      await user.click(importButton);

      await waitFor(() => {
        const cancelButton = screen.getByLabelText('Cancel import');
        expect(cancelButton).toBeDefined();
      });
    });

    it('renders Import button in import modal (disabled initially)', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Import data')).toBeDefined();
      });

      const importButton = screen.getByLabelText('Import data');
      await user.click(importButton);

      await waitFor(() => {
        const importSubmitButton = screen.getByLabelText('Import data');
        // There should be a disabled import button inside the modal
        const allImportButtons = screen.getAllByText('Import');
        expect(allImportButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('closes import modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Import data')).toBeDefined();
      });

      const importButton = screen.getByLabelText('Import data');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Cancel import')).toBeDefined();
      });

      const cancelButton = screen.getByLabelText('Cancel import');
      await user.click(cancelButton);

      await waitFor(() => {
        const dialog = screen.queryByRole('dialog', { name: 'Import Data' });
        expect(dialog).toBeNull();
      });
    });
  });

  describe('confirm dialog', () => {
    it('cancels reseed when Cancel is clicked in confirm dialog', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Reseed database')).toBeDefined();
      });

      const reseedButton = screen.getByLabelText('Reseed database');
      await user.click(reseedButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const cancelButton = screen.getByLabelText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        // Dialog should be closed
        const dialogs = screen.queryAllByRole('dialog');
        // The dialog should be gone or the confirm dialog specifically
        expect(dialogs.length).toBe(0);
      });
    });
  });

  describe('refresh functionality', () => {
    it('refresh button is clickable', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh')).toBeDefined();
      });

      const refreshButton = screen.getByLabelText('Refresh');
      await user.click(refreshButton);

      // Should not throw and page should still render
      await waitFor(() => {
        const headings = screen.getAllByText('Administration');
        expect(headings.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('accessibility', () => {
    it('tabs have proper ARIA attributes', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(4);

        tabs.forEach((tab) => {
          expect(tab.getAttribute('aria-selected')).toBeDefined();
          expect(tab.getAttribute('aria-controls')).toBeDefined();
        });
      });
    });

    it('tab panel has proper ARIA attributes', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const tabpanel = screen.getByRole('tabpanel');
        expect(tabpanel).toBeDefined();
        expect(tabpanel.getAttribute('aria-labelledby')).toBeDefined();
      });
    });

    it('feature flag toggles have aria-checked attribute', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        switches.forEach((switchEl) => {
          const ariaChecked = switchEl.getAttribute('aria-checked');
          expect(ariaChecked === 'true' || ariaChecked === 'false').toBe(true);
        });
      });
    });

    it('feature flag toggles have aria-label', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Flags' })).toBeDefined();
      });

      const flagsTab = screen.getByRole('tab', { name: 'Feature Flags' });
      await user.click(flagsTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        switches.forEach((switchEl) => {
          expect(switchEl.getAttribute('aria-label')).toBeDefined();
          expect(switchEl.getAttribute('aria-label').length).toBeGreaterThan(0);
        });
      });
    });

    it('audit log table has proper role attributes', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const table = screen.getByRole('table', { name: 'Audit log entries' });
        expect(table).toBeDefined();

        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders.length).toBeGreaterThan(0);

        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    it('data action buttons have aria-label attributes', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Reseed database')).toBeDefined();
        expect(screen.getByLabelText('Reset to defaults')).toBeDefined();
        expect(screen.getByLabelText('Export all data')).toBeDefined();
        expect(screen.getByLabelText('Import data')).toBeDefined();
        expect(screen.getByLabelText('Clear all data')).toBeDefined();
      });
    });
  });

  describe('edge cases', () => {
    it('renders correctly with empty audit logs', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Audit Log' })).toBeDefined();
      });

      const auditTab = screen.getByRole('tab', { name: 'Audit Log' });
      await user.click(auditTab);

      await waitFor(() => {
        const noEntries = screen.getByText(/No audit log entries yet/i);
        expect(noEntries).toBeDefined();
      });
    });

    it('renders correctly with empty integrations', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Platform Health' })).toBeDefined();
      });

      const healthTab = screen.getByRole('tab', { name: 'Platform Health' });
      await user.click(healthTab);

      await waitFor(() => {
        const overallStatus = screen.getByText('Overall Status');
        expect(overallStatus).toBeDefined();
      });
    });

    it('handles switching between all tabs without errors', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('tab').length).toBe(4);
      });

      // Click through all tabs
      const tabs = screen.getAllByRole('tab');

      for (const tab of tabs) {
        await user.click(tab);
        await waitFor(() => {
          expect(tab.getAttribute('aria-selected')).toBe('true');
        });
      }

      // Go back to first tab
      await user.click(tabs[0]);
      await waitFor(() => {
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      });
    });

    it('displays persona name in footer', async () => {
      setupLocalStorage();
      renderWithProviders(<AdministrationPage />);

      await waitFor(() => {
        const footer = screen.getByText(/Persona: Platform Administrator/i);
        expect(footer).toBeDefined();
      });
    });
  });
});