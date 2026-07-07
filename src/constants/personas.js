export const ACCESS_LEVELS = {
  EXECUTIVE: 'executive',
  STRATEGIC: 'strategic',
  MANAGEMENT: 'management',
  OPERATIONAL: 'operational',
  CONTRIBUTOR: 'contributor',
  READ_ONLY: 'read_only',
  EXTERNAL: 'external',
  ADMIN: 'admin',
};

export const NAV_SECTIONS = {
  DASHBOARD: 'dashboard',
  PORTFOLIOS: 'portfolios',
  APPLICATIONS: 'applications',
  TECHNOLOGY_STANDARDS: 'technology_standards',
  TECH_RADAR: 'tech_radar',
  GOVERNANCE: 'governance',
  QUALITY_GATES: 'quality_gates',
  TECH_DEBT: 'tech_debt',
  ENVIRONMENTS: 'environments',
  INTEGRATIONS: 'integrations',
  REPORTS: 'reports',
  AI_INSIGHTS: 'ai_insights',
  APPROVALS: 'approvals',
  WAIVERS: 'waivers',
  NOTIFICATIONS: 'notifications',
  ADMIN: 'admin',
  SETTINGS: 'settings',
  AUDIT_LOG: 'audit_log',
  USERS: 'users',
  ROLES: 'roles',
  USE_CASES: 'use_cases',
  DEMO_SCENARIOS: 'demo_scenarios',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  TEST_DATA: 'test_data',
  RELEASES: 'releases',
  EVIDENCE: 'evidence',
};

export const DATA_SCOPES = {
  ALL: 'all',
  PORTFOLIO: 'portfolio',
  APPLICATION: 'application',
  TEAM: 'team',
  OWN: 'own',
  ASSIGNED: 'assigned',
  READ_ONLY: 'read_only',
  EXTERNAL: 'external',
};

const ALL_NAV_SECTIONS = Object.values(NAV_SECTIONS);

const EXECUTIVE_NAV_SECTIONS = [
  NAV_SECTIONS.DASHBOARD,
  NAV_SECTIONS.PORTFOLIOS,
  NAV_SECTIONS.APPLICATIONS,
  NAV_SECTIONS.TECHNOLOGY_STANDARDS,
  NAV_SECTIONS.TECH_RADAR,
  NAV_SECTIONS.GOVERNANCE,
  NAV_SECTIONS.QUALITY_GATES,
  NAV_SECTIONS.TECH_DEBT,
  NAV_SECTIONS.REPORTS,
  NAV_SECTIONS.AI_INSIGHTS,
  NAV_SECTIONS.APPROVALS,
  NAV_SECTIONS.NOTIFICATIONS,
];

const STRATEGIC_NAV_SECTIONS = [
  NAV_SECTIONS.DASHBOARD,
  NAV_SECTIONS.PORTFOLIOS,
  NAV_SECTIONS.APPLICATIONS,
  NAV_SECTIONS.TECHNOLOGY_STANDARDS,
  NAV_SECTIONS.TECH_RADAR,
  NAV_SECTIONS.GOVERNANCE,
  NAV_SECTIONS.QUALITY_GATES,
  NAV_SECTIONS.TECH_DEBT,
  NAV_SECTIONS.ENVIRONMENTS,
  NAV_SECTIONS.INTEGRATIONS,
  NAV_SECTIONS.REPORTS,
  NAV_SECTIONS.AI_INSIGHTS,
  NAV_SECTIONS.APPROVALS,
  NAV_SECTIONS.WAIVERS,
  NAV_SECTIONS.NOTIFICATIONS,
  NAV_SECTIONS.AUDIT_LOG,
];

const MANAGEMENT_NAV_SECTIONS = [
  NAV_SECTIONS.DASHBOARD,
  NAV_SECTIONS.PORTFOLIOS,
  NAV_SECTIONS.APPLICATIONS,
  NAV_SECTIONS.TECHNOLOGY_STANDARDS,
  NAV_SECTIONS.TECH_RADAR,
  NAV_SECTIONS.GOVERNANCE,
  NAV_SECTIONS.QUALITY_GATES,
  NAV_SECTIONS.TECH_DEBT,
  NAV_SECTIONS.ENVIRONMENTS,
  NAV_SECTIONS.REPORTS,
  NAV_SECTIONS.AI_INSIGHTS,
  NAV_SECTIONS.APPROVALS,
  NAV_SECTIONS.WAIVERS,
  NAV_SECTIONS.NOTIFICATIONS,
  NAV_SECTIONS.EVIDENCE,
];

const OPERATIONAL_NAV_SECTIONS = [
  NAV_SECTIONS.DASHBOARD,
  NAV_SECTIONS.APPLICATIONS,
  NAV_SECTIONS.TECHNOLOGY_STANDARDS,
  NAV_SECTIONS.QUALITY_GATES,
  NAV_SECTIONS.TECH_DEBT,
  NAV_SECTIONS.ENVIRONMENTS,
  NAV_SECTIONS.REPORTS,
  NAV_SECTIONS.NOTIFICATIONS,
  NAV_SECTIONS.EVIDENCE,
];

const READ_ONLY_NAV_SECTIONS = [
  NAV_SECTIONS.DASHBOARD,
  NAV_SECTIONS.PORTFOLIOS,
  NAV_SECTIONS.APPLICATIONS,
  NAV_SECTIONS.TECHNOLOGY_STANDARDS,
  NAV_SECTIONS.TECH_RADAR,
  NAV_SECTIONS.REPORTS,
  NAV_SECTIONS.NOTIFICATIONS,
];

/**
 * Complete persona definitions for all 22 roles in the KP ETSIP system.
 * Each persona includes:
 * @property {string} id - Unique identifier for the persona
 * @property {string} name - Display name of the persona
 * @property {string} title - Job title associated with the persona
 * @property {string} accessLevel - One of ACCESS_LEVELS values
 * @property {string} landingPage - Default route after login
 * @property {string[]} allowedNavSections - Navigation sections visible to this persona
 * @property {string} dataScope - Scope of data access
 */
export const PERSONAS = {
  EXECUTIVE_LEADERSHIP: {
    id: 'persona-executive-leadership',
    name: 'Executive Leadership',
    title: 'Executive Leadership',
    accessLevel: ACCESS_LEVELS.EXECUTIVE,
    landingPage: '/dashboard',
    allowedNavSections: EXECUTIVE_NAV_SECTIONS,
    dataScope: DATA_SCOPES.ALL,
  },
  VP_ETS: {
    id: 'persona-vp-ets',
    name: 'VP ETS',
    title: 'Vice President, Enterprise Technology Services',
    accessLevel: ACCESS_LEVELS.EXECUTIVE,
    landingPage: '/dashboard',
    allowedNavSections: [
      ...EXECUTIVE_NAV_SECTIONS,
      NAV_SECTIONS.WAIVERS,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.INTEGRATIONS,
      NAV_SECTIONS.AUDIT_LOG,
    ],
    dataScope: DATA_SCOPES.ALL,
  },
  EXECUTIVE_DIRECTOR_ETS: {
    id: 'persona-executive-director-ets',
    name: 'Executive Director ETS',
    title: 'Executive Director, Enterprise Technology Services',
    accessLevel: ACCESS_LEVELS.STRATEGIC,
    landingPage: '/dashboard',
    allowedNavSections: STRATEGIC_NAV_SECTIONS,
    dataScope: DATA_SCOPES.ALL,
  },
  SR_DIRECTOR_ETS_PORTFOLIO_LEADER: {
    id: 'persona-sr-director-ets-portfolio-leader',
    name: 'Sr Director ETS Portfolio Leader',
    title: 'Senior Director, ETS Portfolio Leader',
    accessLevel: ACCESS_LEVELS.STRATEGIC,
    landingPage: '/portfolios',
    allowedNavSections: STRATEGIC_NAV_SECTIONS,
    dataScope: DATA_SCOPES.PORTFOLIO,
  },
  DIRECTOR_ETS_PORTFOLIO_LEADER: {
    id: 'persona-director-ets-portfolio-leader',
    name: 'Director ETS Portfolio Leader',
    title: 'Director, ETS Portfolio Leader',
    accessLevel: ACCESS_LEVELS.MANAGEMENT,
    landingPage: '/portfolios',
    allowedNavSections: MANAGEMENT_NAV_SECTIONS,
    dataScope: DATA_SCOPES.PORTFOLIO,
  },
  QUALITY_ENGINEER: {
    id: 'persona-quality-engineer',
    name: 'Quality Engineer',
    title: 'Quality Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/quality-gates',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
      NAV_SECTIONS.USE_CASES,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  AUTOMATION_ENGINEER: {
    id: 'persona-automation-engineer',
    name: 'Automation Engineer',
    title: 'Automation Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/applications',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
      NAV_SECTIONS.INTEGRATIONS,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  SDET: {
    id: 'persona-sdet',
    name: 'SDET',
    title: 'Software Development Engineer in Test',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/applications',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
      NAV_SECTIONS.USE_CASES,
      NAV_SECTIONS.INTEGRATIONS,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  DEVELOPER: {
    id: 'persona-developer',
    name: 'Developer',
    title: 'Software Developer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/applications',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.TECH_RADAR,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  PRODUCT_OWNER_QE_MANAGER: {
    id: 'persona-product-owner-qe-manager',
    name: 'Product Owner QE Manager',
    title: 'Product Owner / QE Manager',
    accessLevel: ACCESS_LEVELS.MANAGEMENT,
    landingPage: '/dashboard',
    allowedNavSections: [
      ...MANAGEMENT_NAV_SECTIONS,
      NAV_SECTIONS.USE_CASES,
      NAV_SECTIONS.RELEASES,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  SCRUM_MASTER_QE_MANAGER: {
    id: 'persona-scrum-master-qe-manager',
    name: 'Scrum Master QE Manager',
    title: 'Scrum Master / QE Manager',
    accessLevel: ACCESS_LEVELS.MANAGEMENT,
    landingPage: '/dashboard',
    allowedNavSections: [
      ...MANAGEMENT_NAV_SECTIONS,
      NAV_SECTIONS.USE_CASES,
      NAV_SECTIONS.RELEASES,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  RELEASE_MANAGER: {
    id: 'persona-release-manager',
    name: 'Release Manager',
    title: 'Release Manager',
    accessLevel: ACCESS_LEVELS.OPERATIONAL,
    landingPage: '/releases',
    allowedNavSections: [
      ...OPERATIONAL_NAV_SECTIONS,
      NAV_SECTIONS.RELEASES,
      NAV_SECTIONS.INTEGRATIONS,
      NAV_SECTIONS.GOVERNANCE,
      NAV_SECTIONS.APPROVALS,
    ],
    dataScope: DATA_SCOPES.PORTFOLIO,
  },
  PROGRAM_MANAGER_PORTFOLIO_LEADER: {
    id: 'persona-program-manager-portfolio-leader',
    name: 'Program Manager Portfolio Leader',
    title: 'Program Manager / Portfolio Leader',
    accessLevel: ACCESS_LEVELS.MANAGEMENT,
    landingPage: '/portfolios',
    allowedNavSections: [
      ...MANAGEMENT_NAV_SECTIONS,
      NAV_SECTIONS.INTEGRATIONS,
      NAV_SECTIONS.RELEASES,
      NAV_SECTIONS.TECH_RADAR,
    ],
    dataScope: DATA_SCOPES.PORTFOLIO,
  },
  APPLICATION_OWNER_QE_MANAGER: {
    id: 'persona-application-owner-qe-manager',
    name: 'Application Owner QE Manager',
    title: 'Application Owner / QE Manager',
    accessLevel: ACCESS_LEVELS.MANAGEMENT,
    landingPage: '/applications',
    allowedNavSections: [
      ...MANAGEMENT_NAV_SECTIONS,
      NAV_SECTIONS.USE_CASES,
      NAV_SECTIONS.INTEGRATIONS,
      NAV_SECTIONS.RELEASES,
    ],
    dataScope: DATA_SCOPES.APPLICATION,
  },
  ENVIRONMENT_MANAGER: {
    id: 'persona-environment-manager',
    name: 'Environment Manager',
    title: 'Environment Manager',
    accessLevel: ACCESS_LEVELS.OPERATIONAL,
    landingPage: '/environments',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.INTEGRATIONS,
      NAV_SECTIONS.EVIDENCE,
    ],
    dataScope: DATA_SCOPES.PORTFOLIO,
  },
  TEST_DATA_ENGINEER: {
    id: 'persona-test-data-engineer',
    name: 'Test Data Engineer',
    title: 'Test Data Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/test-data',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.TEST_DATA,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  PERFORMANCE_ENGINEER: {
    id: 'persona-performance-engineer',
    name: 'Performance Engineer',
    title: 'Performance Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/performance',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.PERFORMANCE,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
    ],
    dataScope: DATA_SCOPES.TEAM,
  },
  SECURITY_ENGINEER: {
    id: 'persona-security-engineer',
    name: 'Security Engineer',
    title: 'Security Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/security',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.SECURITY,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.GOVERNANCE,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
      NAV_SECTIONS.AUDIT_LOG,
    ],
    dataScope: DATA_SCOPES.ALL,
  },
  ACCESSIBILITY_ENGINEER: {
    id: 'persona-accessibility-engineer',
    name: 'Accessibility Engineer',
    title: 'Accessibility Engineer',
    accessLevel: ACCESS_LEVELS.CONTRIBUTOR,
    landingPage: '/accessibility',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.ACCESSIBILITY,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
      NAV_SECTIONS.REPORTS,
      NAV_SECTIONS.NOTIFICATIONS,
      NAV_SECTIONS.EVIDENCE,
    ],
    dataScope: DATA_SCOPES.ALL,
  },
  PRODUCTION_SUPPORT_READ_ONLY: {
    id: 'persona-production-support-read-only',
    name: 'Production Support Read Only',
    title: 'Production Support (Read Only)',
    accessLevel: ACCESS_LEVELS.READ_ONLY,
    landingPage: '/dashboard',
    allowedNavSections: [
      ...READ_ONLY_NAV_SECTIONS,
      NAV_SECTIONS.ENVIRONMENTS,
      NAV_SECTIONS.QUALITY_GATES,
      NAV_SECTIONS.TECH_DEBT,
    ],
    dataScope: DATA_SCOPES.READ_ONLY,
  },
  VENDOR_PARTNER: {
    id: 'persona-vendor-partner',
    name: 'Vendor Partner',
    title: 'Vendor / Partner',
    accessLevel: ACCESS_LEVELS.EXTERNAL,
    landingPage: '/dashboard',
    allowedNavSections: [
      NAV_SECTIONS.DASHBOARD,
      NAV_SECTIONS.APPLICATIONS,
      NAV_SECTIONS.TECHNOLOGY_STANDARDS,
      NAV_SECTIONS.NOTIFICATIONS,
    ],
    dataScope: DATA_SCOPES.EXTERNAL,
  },
  PLATFORM_ADMINISTRATOR: {
    id: 'persona-platform-administrator',
    name: 'Platform Administrator',
    title: 'Platform Administrator',
    accessLevel: ACCESS_LEVELS.ADMIN,
    landingPage: '/admin',
    allowedNavSections: ALL_NAV_SECTIONS,
    dataScope: DATA_SCOPES.ALL,
  },
  READ_ONLY_USER: {
    id: 'persona-read-only-user',
    name: 'Read Only User',
    title: 'Read Only User',
    accessLevel: ACCESS_LEVELS.READ_ONLY,
    landingPage: '/dashboard',
    allowedNavSections: READ_ONLY_NAV_SECTIONS,
    dataScope: DATA_SCOPES.READ_ONLY,
  },
};

/**
 * Returns a flat array of all persona definitions.
 * @returns {Array<{id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string}>}
 */
export const getAllPersonas = () => Object.values(PERSONAS);

/**
 * Finds a persona by its unique id.
 * @param {string} id - The persona id to look up.
 * @returns {{id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string} | undefined}
 */
export const getPersonaById = (id) => {
  if (typeof id !== 'string') {
    return undefined;
  }
  return getAllPersonas().find((persona) => persona.id === id);
};

/**
 * Returns all personas that match a given access level.
 * @param {string} accessLevel - One of ACCESS_LEVELS values.
 * @returns {Array<{id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string}>}
 */
export const getPersonasByAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') {
    return [];
  }
  return getAllPersonas().filter((persona) => persona.accessLevel === accessLevel);
};

/**
 * Checks whether a persona has access to a specific navigation section.
 * @param {string} personaId - The persona id.
 * @param {string} navSection - The navigation section key.
 * @returns {boolean}
 */
export const hasNavAccess = (personaId, navSection) => {
  const persona = getPersonaById(personaId);
  if (!persona) {
    return false;
  }
  return persona.allowedNavSections.includes(navSection);
};

/**
 * Returns the total number of defined personas.
 * @returns {number}
 */
export const getPersonaCount = () => getAllPersonas().length;