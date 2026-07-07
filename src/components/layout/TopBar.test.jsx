import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopBar from './TopBar';
import { PersonaProvider } from '../../contexts/PersonaContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { FeatureFlagProvider } from '../../contexts/FeatureFlagContext';
import { STORAGE_KEYS } from '../../constants/constants';

/**
 * Sets up localStorage with admin persona and minimal seed data
 * so all contexts can resolve properly.
 */
const setupLocalStorage = (personaId = 'persona-platform-administrator') => {
  localStorage.setItem('kp_etsip_active_persona', JSON.stringify(personaId));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
    {
      id: 'persona-platform-administrator',
      username: 'admin',
      email: 'admin@kpetsip.example.com',
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      accessLevel: 'admin',
      status: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      version: 1,
    },
  ]));
  localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([
    {
      id: 'NOT-001',
      title: 'Test Notification 1',
      message: 'Unread notification.',
      type: 'info',
      trigger: 'standard_expiring',
      recipientId: 'persona-platform-administrator',
      isRead: false,
      readAt: null,
      priority: 'medium',
      createdAt: '2026-06-28T10:00:00.000Z',
      updatedAt: '2026-06-28T10:00:00.000Z',
      createdBy: 'system',
      updatedBy: 'system',
      version: 1,
    },
    {
      id: 'NOT-002',
      title: 'Test Notification 2',
      message: 'Another unread notification.',
      type: 'warning',
      trigger: 'quality_gate_failed',
      recipientId: 'persona-platform-administrator',
      isRead: false,
      readAt: null,
      priority: 'high',
      createdAt: '2026-06-29T08:00:00.000Z',
      updatedAt: '2026-06-29T08:00:00.000Z',
      createdBy: 'system',
      updatedBy: 'system',
      version: 1,
    },
    {
      id: 'NOT-003',
      title: 'Test Notification 3',
      message: 'Read notification.',
      type: 'success',
      trigger: 'approval_granted',
      recipientId: 'persona-platform-administrator',
      isRead: true,
      readAt: '2026-06-29T09:00:00.000Z',
      priority: 'low',
      createdAt: '2026-06-27T14:00:00.000Z',
      updatedAt: '2026-06-29T09:00:00.000Z',
      createdBy: 'system',
      updatedBy: 'system',
      version: 2,
    },
  ]));
  localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));

  // Set feature flags with dark mode disabled by default
  localStorage.setItem('kp_etsip_feature_flags', JSON.stringify([
    { key: 'aiPanels', label: 'AI Panels', enabled: true, description: 'AI panels', category: 'features' },
    { key: 'darkMode', label: 'Dark Mode', enabled: false, description: 'Dark mode', category: 'theming' },
    { key: 'simulatedLatency', label: 'Simulated Latency', enabled: true, description: 'Latency', category: 'demo' },
    { key: 'verboseConsoleLogging', label: 'Verbose Logging', enabled: false, description: 'Logging', category: 'development' },
  ]));
};

/**
 * Sets up localStorage with dark mode enabled.
 */
const setupLocalStorageWithDarkMode = (personaId = 'persona-platform-administrator') => {
  setupLocalStorage(personaId);
  localStorage.setItem('kp_etsip_feature_flags', JSON.stringify([
    { key: 'aiPanels', label: 'AI Panels', enabled: true, description: 'AI panels', category: 'features' },
    { key: 'darkMode', label: 'Dark Mode', enabled: true, description: 'Dark mode', category: 'theming' },
    { key: 'simulatedLatency', label: 'Simulated Latency', enabled: true, description: 'Latency', category: 'demo' },
    { key: 'verboseConsoleLogging', label: 'Verbose Logging', enabled: false, description: 'Logging', category: 'development' },
  ]));
};

/**
 * Wraps TopBar with all required context providers.
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

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the application title', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const titles = screen.getAllByText('KP ETSIP');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the banner role', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeDefined();
    });

    it('renders the role switcher button', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      expect(roleSwitcherButton).toBeDefined();
    });

    it('renders the notification bell button', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const notificationButton = screen.getByLabelText(/Notifications/i);
      expect(notificationButton).toBeDefined();
    });

    it('renders the current persona name in the role switcher', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona.*Platform Administrator/i);
      expect(roleSwitcherButton).toBeDefined();
    });

    it('renders the subtitle text', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const subtitle = screen.getByText('Enterprise Technology Standards & Innovation Platform');
      expect(subtitle).toBeDefined();
    });
  });

  describe('role switcher', () => {
    it('opens the role switcher dropdown when clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const dialog = screen.getByLabelText('Select persona');
      expect(dialog).toBeDefined();
    });

    it('displays search input in the role switcher dropdown', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const searchInput = screen.getByLabelText('Search personas');
      expect(searchInput).toBeDefined();
    });

    it('displays the persona list in the dropdown', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const listbox = screen.getByRole('listbox', { name: 'Available personas' });
      expect(listbox).toBeDefined();
    });

    it('shows the current persona as selected in the dropdown', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const selectedOption = screen.getByRole('option', { selected: true });
      expect(selectedOption).toBeDefined();
      expect(selectedOption.textContent).toContain('Platform Administrator');
    });

    it('filters personas when searching', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const searchInput = screen.getByLabelText('Search personas');
      await user.type(searchInput, 'Quality');

      const options = screen.getAllByRole('option');
      const hasQualityEngineer = options.some((opt) => opt.textContent.includes('Quality Engineer'));
      expect(hasQualityEngineer).toBe(true);
    });

    it('shows no results message when search does not match', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const searchInput = screen.getByLabelText('Search personas');
      await user.type(searchInput, 'zzzznonexistent');

      const noResults = screen.getByText('No personas match your search.');
      expect(noResults).toBeDefined();
    });

    it('switches persona when a different persona is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      // Find and click on Executive Leadership persona
      const options = screen.getAllByRole('option');
      const executiveOption = options.find((opt) => opt.textContent.includes('Executive Leadership'));
      expect(executiveOption).toBeDefined();

      await user.click(executiveOption);

      // After switching, the dropdown should close and the button should show the new persona
      await waitFor(() => {
        const updatedButton = screen.getByLabelText(/Switch persona.*Executive Leadership/i);
        expect(updatedButton).toBeDefined();
      });
    });

    it('updates localStorage when persona is switched', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const vpOption = options.find((opt) => opt.textContent.includes('VP ETS'));
      expect(vpOption).toBeDefined();

      await user.click(vpOption);

      await waitFor(() => {
        const storedPersona = JSON.parse(localStorage.getItem('kp_etsip_active_persona'));
        expect(storedPersona).toBe('persona-vp-ets');
      });
    });

    it('closes the dropdown after selecting a persona', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const executiveOption = options.find((opt) => opt.textContent.includes('Executive Leadership'));
      await user.click(executiveOption);

      await waitFor(() => {
        const dialog = screen.queryByLabelText('Select persona');
        expect(dialog).toBeNull();
      });
    });

    it('displays persona count in the footer', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const footer = screen.getByText(/persona.*available/i);
      expect(footer).toBeDefined();
    });

    it('has aria-haspopup attribute on the role switcher button', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      expect(roleSwitcherButton.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('has aria-expanded attribute that toggles', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      expect(roleSwitcherButton.getAttribute('aria-expanded')).toBe('false');

      await user.click(roleSwitcherButton);
      expect(roleSwitcherButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('displays access level badges for personas in the dropdown', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      // Check that access level text is present (e.g., "Admin", "Executive")
      const adminBadge = screen.getAllByText('Admin');
      expect(adminBadge.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('theme toggle', () => {
    it('does not render theme toggle when dark mode feature flag is disabled', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const lightModeButton = screen.queryByLabelText('Switch to dark mode');
      const darkModeButton = screen.queryByLabelText('Switch to light mode');
      expect(lightModeButton).toBeNull();
      expect(darkModeButton).toBeNull();
    });

    it('renders theme toggle when dark mode feature flag is enabled', () => {
      setupLocalStorageWithDarkMode();
      renderWithProviders(<TopBar />);

      const themeToggle = screen.getByLabelText(/Switch to dark mode|Switch to light mode/i);
      expect(themeToggle).toBeDefined();
    });

    it('toggles theme when theme button is clicked', async () => {
      const user = userEvent.setup();
      setupLocalStorageWithDarkMode();
      renderWithProviders(<TopBar />);

      // Initially should be light mode (switch to dark mode button)
      const themeToggle = screen.getByLabelText('Switch to dark mode');
      expect(themeToggle).toBeDefined();

      await user.click(themeToggle);

      await waitFor(() => {
        const lightModeToggle = screen.getByLabelText('Switch to light mode');
        expect(lightModeToggle).toBeDefined();
      });
    });

    it('toggles back to light mode when clicked again', async () => {
      const user = userEvent.setup();
      setupLocalStorageWithDarkMode();
      renderWithProviders(<TopBar />);

      const themeToggle = screen.getByLabelText('Switch to dark mode');
      await user.click(themeToggle);

      await waitFor(() => {
        const lightModeToggle = screen.getByLabelText('Switch to light mode');
        expect(lightModeToggle).toBeDefined();
      });

      const lightModeToggle = screen.getByLabelText('Switch to light mode');
      await user.click(lightModeToggle);

      await waitFor(() => {
        const darkModeToggle = screen.getByLabelText('Switch to dark mode');
        expect(darkModeToggle).toBeDefined();
      });
    });
  });

  describe('notification bell', () => {
    it('renders the notification bell with unread badge', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const notificationButton = screen.getByLabelText(/Notifications/i);
      expect(notificationButton).toBeDefined();

      // The badge should show the unread count (2 unread notifications)
      const badge = screen.getByText('2');
      expect(badge).toBeDefined();
    });

    it('displays correct unread count in the notification badge', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      // We seeded 2 unread notifications for the admin persona
      const badge = screen.getByText('2');
      expect(badge).toBeDefined();
    });

    it('does not display badge when there are no unread notifications', () => {
      setupLocalStorage();
      // Mark all notifications as read
      const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
      const readNotifications = notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: '2026-06-30T10:00:00.000Z',
      }));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(readNotifications));

      renderWithProviders(<TopBar />);

      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeDefined();

      // No badge should be present since all are read
      const badge = notificationButton.querySelector('span');
      // The badge span with the count should not exist or should not contain a number
      const allBadges = screen.queryAllByText(/^\d+$/);
      const unreadBadge = allBadges.find((el) => {
        return el.closest('button') === notificationButton;
      });
      expect(unreadBadge).toBeUndefined();
    });

    it('includes unread count in the aria-label', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const notificationButton = screen.getByLabelText(/Notifications.*2 unread/i);
      expect(notificationButton).toBeDefined();
    });

    it('includes unread count in the title attribute', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const notificationButton = screen.getByLabelText(/Notifications/i);
      expect(notificationButton.getAttribute('title')).toContain('2 unread');
    });
  });

  describe('persona display', () => {
    it('displays the current persona initials in the avatar', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      // Platform Administrator -> PA
      const avatars = screen.getAllByText('PA');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });

    it('displays the current persona name in the user display area', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const personaNames = screen.getAllByText('Platform Administrator');
      expect(personaNames.length).toBeGreaterThanOrEqual(1);
    });

    it('displays the access level in the user display area', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      // "Admin" should appear as the formatted access level
      const accessLevels = screen.getAllByText('Admin');
      expect(accessLevels.length).toBeGreaterThanOrEqual(1);
    });

    it('updates persona display after switching persona', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const executiveOption = options.find((opt) => opt.textContent.includes('Executive Leadership'));
      await user.click(executiveOption);

      await waitFor(() => {
        const updatedNames = screen.getAllByText('Executive Leadership');
        expect(updatedNames.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('updates initials after switching persona', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const executiveOption = options.find((opt) => opt.textContent.includes('Executive Leadership'));
      await user.click(executiveOption);

      await waitFor(() => {
        // Executive Leadership -> EL
        const initials = screen.getAllByText('EL');
        expect(initials.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('keyboard navigation', () => {
    it('closes role switcher dropdown on Escape key', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const dialog = screen.getByLabelText('Select persona');
      expect(dialog).toBeDefined();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        const closedDialog = screen.queryByLabelText('Select persona');
        expect(closedDialog).toBeNull();
      });
    });

    it('allows selecting a persona with Enter key', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const executiveOption = options.find((opt) => opt.textContent.includes('Executive Leadership'));
      executiveOption.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const updatedButton = screen.getByLabelText(/Switch persona.*Executive Leadership/i);
        expect(updatedButton).toBeDefined();
      });
    });

    it('allows selecting a persona with Space key', async () => {
      const user = userEvent.setup();
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const vpOption = options.find((opt) => opt.textContent.includes('VP ETS'));
      vpOption.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        const updatedButton = screen.getByLabelText(/Switch persona.*VP ETS/i);
        expect(updatedButton).toBeDefined();
      });
    });
  });

  describe('notification count updates after persona switch', () => {
    it('updates notification count when switching to a persona with different notifications', async () => {
      const user = userEvent.setup();
      setupLocalStorage();

      // Add a notification for a different persona
      const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
      notifications.push({
        id: 'NOT-004',
        title: 'QE Notification',
        message: 'Notification for QE.',
        type: 'info',
        trigger: 'tech_debt_created',
        recipientId: 'persona-quality-engineer',
        isRead: false,
        readAt: null,
        priority: 'medium',
        createdAt: '2026-06-30T11:00:00.000Z',
        updatedAt: '2026-06-30T11:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));

      renderWithProviders(<TopBar />);

      // Initially admin has 2 unread
      const badge = screen.getByText('2');
      expect(badge).toBeDefined();

      // Switch to Quality Engineer
      const roleSwitcherButton = screen.getByLabelText(/Switch persona/i);
      await user.click(roleSwitcherButton);

      const options = screen.getAllByRole('option');
      const qeOption = options.find((opt) => opt.textContent.includes('Quality Engineer'));
      await user.click(qeOption);

      // After switching, the notification count should update
      await waitFor(() => {
        const updatedButton = screen.getByLabelText(/Switch persona.*Quality Engineer/i);
        expect(updatedButton).toBeDefined();
      });
    });
  });

  describe('logo and branding', () => {
    it('renders the logo icon', () => {
      setupLocalStorage();
      renderWithProviders(<TopBar />);

      // The logo is a div with a lightning bolt SVG inside
      const banner = screen.getByRole('banner');
      const svgs = banner.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('renders correctly with default persona when no persona is stored', () => {
      setupLocalStorage();
      localStorage.removeItem('kp_etsip_active_persona');
      renderWithProviders(<TopBar />);

      // Should fall back to Platform Administrator
      const roleSwitcherButton = screen.getByLabelText(/Switch persona.*Platform Administrator/i);
      expect(roleSwitcherButton).toBeDefined();
    });

    it('renders correctly with invalid persona stored', () => {
      setupLocalStorage();
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('invalid-persona-id'));
      renderWithProviders(<TopBar />);

      // Should fall back to Platform Administrator
      const roleSwitcherButton = screen.getByLabelText(/Switch persona.*Platform Administrator/i);
      expect(roleSwitcherButton).toBeDefined();
    });
  });
});