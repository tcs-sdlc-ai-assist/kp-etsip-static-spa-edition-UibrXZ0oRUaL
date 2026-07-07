import { NAV_SECTIONS, ACCESS_LEVELS } from './personas';

/**
 * Icon name constants used in navigation items.
 * These are string identifiers that map to icon components in the UI layer.
 * @enum {string}
 */
export const NAV_ICONS = {
  DASHBOARD: 'dashboard',
  PORTFOLIOS: 'briefcase',
  APPLICATIONS: 'applications',
  TECHNOLOGY_STANDARDS: 'standards',
  TECH_RADAR: 'radar',
  GOVERNANCE: 'governance',
  QUALITY_GATES: 'quality',
  TECH_DEBT: 'debt',
  ENVIRONMENTS: 'environments',
  INTEGRATIONS: 'integrations',
  REPORTS: 'reports',
  AI_INSIGHTS: 'ai',
  APPROVALS: 'approvals',
  WAIVERS: 'waivers',
  NOTIFICATIONS: 'notifications',
  ADMIN: 'admin',
  SETTINGS: 'settings',
  AUDIT_LOG: 'audit',
  USERS: 'users',
  ROLES: 'roles',
  USE_CASES: 'useCases',
  DEMO_SCENARIOS: 'demo',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  TEST_DATA: 'testData',
  RELEASES: 'releases',
  EVIDENCE: 'evidence',
};

/**
 * Navigation group keys for organizing navigation items into logical sections.
 * @enum {string}
 */
export const NAV_GROUPS = {
  MAIN: 'main',
  MANAGEMENT: 'management',
  GOVERNANCE: 'governance',
  ENGINEERING: 'engineering',
  INSIGHTS: 'insights',
  ADMINISTRATION: 'administration',
};

/**
 * Navigation group definitions with display order and labels.
 * @type {Array<{key: string, label: string, order: number}>}
 */
export const NAV_GROUP_DEFINITIONS = [
  { key: NAV_GROUPS.MAIN, label: 'Main', order: 1 },
  { key: NAV_GROUPS.MANAGEMENT, label: 'Management', order: 2 },
  { key: NAV_GROUPS.GOVERNANCE, label: 'Governance', order: 3 },
  { key: NAV_GROUPS.ENGINEERING, label: 'Engineering', order: 4 },
  { key: NAV_GROUPS.INSIGHTS, label: 'Insights & Analytics', order: 5 },
  { key: NAV_GROUPS.ADMINISTRATION, label: 'Administration', order: 6 },
];

/**
 * @typedef {Object} NavigationItem
 * @property {string} key - Unique key matching NAV_SECTIONS value
 * @property {string} label - Display label for the navigation item
 * @property {string} path - Route path for the navigation item
 * @property {string} icon - Icon identifier from NAV_ICONS
 * @property {string} group - Group key from NAV_GROUPS
 * @property {number} order - Display order within the group
 * @property {string[]} requiredAccessLevels - Minimum access levels required to see this item
 * @property {string} [description] - Optional description for tooltips or help text
 * @property {boolean} [badge] - Whether this item can display a notification badge
 */

/**
 * Complete navigation configuration for all 18+ navigation sections.
 * Each item defines its route, icon, label, group, ordering, and access requirements.
 * @type {NavigationItem[]}
 */
export const NAVIGATION_ITEMS = [
  {
    key: NAV_SECTIONS.DASHBOARD,
    label: 'Dashboard',
    path: '/dashboard',
    icon: NAV_ICONS.DASHBOARD,
    group: NAV_GROUPS.MAIN,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
      ACCESS_LEVELS.EXTERNAL,
    ],
    description: 'Overview of key metrics and status',
    badge: false,
  },
  {
    key: NAV_SECTIONS.PORTFOLIOS,
    label: 'Portfolios',
    path: '/portfolios',
    icon: NAV_ICONS.PORTFOLIOS,
    group: NAV_GROUPS.MAIN,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.READ_ONLY,
    ],
    description: 'Manage technology portfolios',
    badge: false,
  },
  {
    key: NAV_SECTIONS.APPLICATIONS,
    label: 'Applications',
    path: '/applications',
    icon: NAV_ICONS.APPLICATIONS,
    group: NAV_GROUPS.MAIN,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
      ACCESS_LEVELS.EXTERNAL,
    ],
    description: 'Application inventory and details',
    badge: false,
  },
  {
    key: NAV_SECTIONS.TECHNOLOGY_STANDARDS,
    label: 'Technology Standards',
    path: '/technology-standards',
    icon: NAV_ICONS.TECHNOLOGY_STANDARDS,
    group: NAV_GROUPS.MANAGEMENT,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
      ACCESS_LEVELS.EXTERNAL,
    ],
    description: 'Define and manage technology standards',
    badge: false,
  },
  {
    key: NAV_SECTIONS.TECH_RADAR,
    label: 'Tech Radar',
    path: '/tech-radar',
    icon: NAV_ICONS.TECH_RADAR,
    group: NAV_GROUPS.MANAGEMENT,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
    ],
    description: 'Technology radar visualization',
    badge: false,
  },
  {
    key: NAV_SECTIONS.ENVIRONMENTS,
    label: 'Environments',
    path: '/environments',
    icon: NAV_ICONS.ENVIRONMENTS,
    group: NAV_GROUPS.MANAGEMENT,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Environment configuration and status',
    badge: false,
  },
  {
    key: NAV_SECTIONS.GOVERNANCE,
    label: 'Governance',
    path: '/governance',
    icon: NAV_ICONS.GOVERNANCE,
    group: NAV_GROUPS.GOVERNANCE,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Governance policies and compliance',
    badge: false,
  },
  {
    key: NAV_SECTIONS.QUALITY_GATES,
    label: 'Quality Gates',
    path: '/quality-gates',
    icon: NAV_ICONS.QUALITY_GATES,
    group: NAV_GROUPS.GOVERNANCE,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
    ],
    description: 'Quality gate definitions and results',
    badge: false,
  },
  {
    key: NAV_SECTIONS.APPROVALS,
    label: 'Approvals',
    path: '/approvals',
    icon: NAV_ICONS.APPROVALS,
    group: NAV_GROUPS.GOVERNANCE,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
    ],
    description: 'Pending approval requests',
    badge: true,
  },
  {
    key: NAV_SECTIONS.WAIVERS,
    label: 'Waivers',
    path: '/waivers',
    icon: NAV_ICONS.WAIVERS,
    group: NAV_GROUPS.GOVERNANCE,
    order: 4,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
    ],
    description: 'Waiver requests and management',
    badge: true,
  },
  {
    key: NAV_SECTIONS.TECH_DEBT,
    label: 'Tech Debt',
    path: '/tech-debt',
    icon: NAV_ICONS.TECH_DEBT,
    group: NAV_GROUPS.ENGINEERING,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
    ],
    description: 'Technical debt tracking and remediation',
    badge: false,
  },
  {
    key: NAV_SECTIONS.INTEGRATIONS,
    label: 'Integrations',
    path: '/integrations',
    icon: NAV_ICONS.INTEGRATIONS,
    group: NAV_GROUPS.ENGINEERING,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'External system integrations',
    badge: false,
  },
  {
    key: NAV_SECTIONS.EVIDENCE,
    label: 'Evidence',
    path: '/evidence',
    icon: NAV_ICONS.EVIDENCE,
    group: NAV_GROUPS.ENGINEERING,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Evidence collection and management',
    badge: false,
  },
  {
    key: NAV_SECTIONS.REPORTS,
    label: 'Reports',
    path: '/reports',
    icon: NAV_ICONS.REPORTS,
    group: NAV_GROUPS.INSIGHTS,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
    ],
    description: 'Reports and analytics',
    badge: false,
  },
  {
    key: NAV_SECTIONS.AI_INSIGHTS,
    label: 'AI Insights',
    path: '/ai-insights',
    icon: NAV_ICONS.AI_INSIGHTS,
    group: NAV_GROUPS.INSIGHTS,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
    ],
    description: 'AI-powered analysis and recommendations',
    badge: false,
  },
  {
    key: NAV_SECTIONS.NOTIFICATIONS,
    label: 'Notifications',
    path: '/notifications',
    icon: NAV_ICONS.NOTIFICATIONS,
    group: NAV_GROUPS.INSIGHTS,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.EXECUTIVE,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
      ACCESS_LEVELS.CONTRIBUTOR,
      ACCESS_LEVELS.READ_ONLY,
      ACCESS_LEVELS.EXTERNAL,
    ],
    description: 'System notifications and alerts',
    badge: true,
  },
  {
    key: NAV_SECTIONS.ADMIN,
    label: 'Admin',
    path: '/admin',
    icon: NAV_ICONS.ADMIN,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 1,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
    ],
    description: 'Platform administration',
    badge: false,
  },
  {
    key: NAV_SECTIONS.AUDIT_LOG,
    label: 'Audit Log',
    path: '/audit-log',
    icon: NAV_ICONS.AUDIT_LOG,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 2,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.STRATEGIC,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'System audit trail',
    badge: false,
  },
  {
    key: NAV_SECTIONS.USERS,
    label: 'Users',
    path: '/users',
    icon: NAV_ICONS.USERS,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 3,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
    ],
    description: 'User management',
    badge: false,
  },
  {
    key: NAV_SECTIONS.ROLES,
    label: 'Roles',
    path: '/roles',
    icon: NAV_ICONS.ROLES,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 4,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
    ],
    description: 'Role management',
    badge: false,
  },
  {
    key: NAV_SECTIONS.SETTINGS,
    label: 'Settings',
    path: '/settings',
    icon: NAV_ICONS.SETTINGS,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 5,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
    ],
    description: 'System settings and configuration',
    badge: false,
  },
  {
    key: NAV_SECTIONS.USE_CASES,
    label: 'Use Cases',
    path: '/use-cases',
    icon: NAV_ICONS.USE_CASES,
    group: NAV_GROUPS.ENGINEERING,
    order: 4,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Use case definitions and tracking',
    badge: false,
  },
  {
    key: NAV_SECTIONS.DEMO_SCENARIOS,
    label: 'Demo Scenarios',
    path: '/demo-scenarios',
    icon: NAV_ICONS.DEMO_SCENARIOS,
    group: NAV_GROUPS.ADMINISTRATION,
    order: 6,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
    ],
    description: 'Demo scenario management',
    badge: false,
  },
  {
    key: NAV_SECTIONS.SECURITY,
    label: 'Security',
    path: '/security',
    icon: NAV_ICONS.SECURITY,
    group: NAV_GROUPS.ENGINEERING,
    order: 5,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Security testing and compliance',
    badge: false,
  },
  {
    key: NAV_SECTIONS.ACCESSIBILITY,
    label: 'Accessibility',
    path: '/accessibility',
    icon: NAV_ICONS.ACCESSIBILITY,
    group: NAV_GROUPS.ENGINEERING,
    order: 6,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Accessibility testing and compliance',
    badge: false,
  },
  {
    key: NAV_SECTIONS.PERFORMANCE,
    label: 'Performance',
    path: '/performance',
    icon: NAV_ICONS.PERFORMANCE,
    group: NAV_GROUPS.ENGINEERING,
    order: 7,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Performance testing and metrics',
    badge: false,
  },
  {
    key: NAV_SECTIONS.TEST_DATA,
    label: 'Test Data',
    path: '/test-data',
    icon: NAV_ICONS.TEST_DATA,
    group: NAV_GROUPS.ENGINEERING,
    order: 8,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.CONTRIBUTOR,
    ],
    description: 'Test data management',
    badge: false,
  },
  {
    key: NAV_SECTIONS.RELEASES,
    label: 'Releases',
    path: '/releases',
    icon: NAV_ICONS.RELEASES,
    group: NAV_GROUPS.MANAGEMENT,
    order: 4,
    requiredAccessLevels: [
      ACCESS_LEVELS.ADMIN,
      ACCESS_LEVELS.MANAGEMENT,
      ACCESS_LEVELS.OPERATIONAL,
    ],
    description: 'Release management and tracking',
    badge: false,
  },
];

/**
 * Returns all navigation items sorted by group order then item order.
 * @returns {NavigationItem[]}
 */
export const getAllNavigationItems = () => {
  const groupOrderMap = {};
  NAV_GROUP_DEFINITIONS.forEach((group) => {
    groupOrderMap[group.key] = group.order;
  });

  return [...NAVIGATION_ITEMS].sort((a, b) => {
    const groupDiff = (groupOrderMap[a.group] || 99) - (groupOrderMap[b.group] || 99);
    if (groupDiff !== 0) {
      return groupDiff;
    }
    return a.order - b.order;
  });
};

/**
 * Returns navigation items filtered by a specific access level.
 * Only items whose requiredAccessLevels include the given level are returned.
 * @param {string} accessLevel - One of ACCESS_LEVELS values.
 * @returns {NavigationItem[]}
 */
export const getNavigationItemsByAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') {
    return [];
  }

  return getAllNavigationItems().filter((item) =>
    item.requiredAccessLevels.includes(accessLevel)
  );
};

/**
 * Returns navigation items filtered by allowed navigation section keys.
 * Used to build persona-specific menus based on allowedNavSections.
 * @param {string[]} allowedSections - Array of NAV_SECTIONS values.
 * @returns {NavigationItem[]}
 */
export const getNavigationItemsBySections = (allowedSections) => {
  if (!Array.isArray(allowedSections)) {
    return [];
  }

  return getAllNavigationItems().filter((item) =>
    allowedSections.includes(item.key)
  );
};

/**
 * Returns navigation items grouped by their NAV_GROUPS key.
 * Each group includes its definition and sorted items.
 * @param {NavigationItem[]} items - Array of navigation items to group.
 * @returns {Array<{group: {key: string, label: string, order: number}, items: NavigationItem[]}>}
 */
export const groupNavigationItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const groupMap = {};

  items.forEach((item) => {
    if (!groupMap[item.group]) {
      groupMap[item.group] = [];
    }
    groupMap[item.group].push(item);
  });

  return NAV_GROUP_DEFINITIONS
    .filter((groupDef) => groupMap[groupDef.key] && groupMap[groupDef.key].length > 0)
    .map((groupDef) => ({
      group: groupDef,
      items: groupMap[groupDef.key].sort((a, b) => a.order - b.order),
    }));
};

/**
 * Finds a navigation item by its key.
 * @param {string} key - The NAV_SECTIONS key to look up.
 * @returns {NavigationItem | undefined}
 */
export const getNavigationItemByKey = (key) => {
  if (typeof key !== 'string') {
    return undefined;
  }
  return NAVIGATION_ITEMS.find((item) => item.key === key);
};

/**
 * Finds a navigation item by its route path.
 * @param {string} path - The route path to look up.
 * @returns {NavigationItem | undefined}
 */
export const getNavigationItemByPath = (path) => {
  if (typeof path !== 'string') {
    return undefined;
  }
  return NAVIGATION_ITEMS.find((item) => item.path === path);
};

/**
 * Returns all navigation items that can display a badge.
 * @returns {NavigationItem[]}
 */
export const getBadgeableNavigationItems = () => {
  return NAVIGATION_ITEMS.filter((item) => item.badge === true);
};

/**
 * Checks whether a given access level has access to a specific navigation section.
 * @param {string} accessLevel - One of ACCESS_LEVELS values.
 * @param {string} navSectionKey - One of NAV_SECTIONS values.
 * @returns {boolean}
 */
export const hasNavigationAccess = (accessLevel, navSectionKey) => {
  if (typeof accessLevel !== 'string' || typeof navSectionKey !== 'string') {
    return false;
  }

  const item = getNavigationItemByKey(navSectionKey);
  if (!item) {
    return false;
  }

  return item.requiredAccessLevels.includes(accessLevel);
};