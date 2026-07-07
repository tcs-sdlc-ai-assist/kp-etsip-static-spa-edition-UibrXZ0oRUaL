export const SCHEMA_VERSION = '1.0.0';

export const ANCHOR_DATE = '2026-07-01';

export const DEFAULT_PAGE_SIZE = 20;

export const STORAGE_KEYS = {
  PORTFOLIOS: 'kp_etsip_portfolios',
  APPLICATIONS: 'kp_etsip_applications',
  RELATIONSHIPS: 'kp_etsip_relationships',
  TECH_CATEGORIES: 'kp_etsip_tech_categories',
  TECH_STANDARDS: 'kp_etsip_tech_standards',
  TECH_ENTRIES: 'kp_etsip_tech_entries',
  DEFINITIONS: 'kp_etsip_definitions',
  ENVIRONMENTS: 'kp_etsip_environments',
  TECH_DEBT: 'kp_etsip_tech_debt',
  QUALITY_GATES: 'kp_etsip_quality_gates',
  GOVERNANCE_RECORDS: 'kp_etsip_governance_records',
  APPROVAL_REQUESTS: 'kp_etsip_approval_requests',
  WAIVERS: 'kp_etsip_waivers',
  EVIDENCE: 'kp_etsip_evidence',
  USERS: 'kp_etsip_users',
  ROLES: 'kp_etsip_roles',
  INTEGRATIONS: 'kp_etsip_integrations',
  NOTIFICATIONS: 'kp_etsip_notifications',
  AI_ANALYSES: 'kp_etsip_ai_analyses',
  PDE_CONFIGS: 'kp_etsip_pde_configs',
  DEMO_SCENARIOS: 'kp_etsip_demo_scenarios',
  SCHEDULES: 'kp_etsip_schedules',
  AUDIT_LOGS: 'kp_etsip_audit_logs',
  USE_CASES: 'kp_etsip_use_cases',
  SCHEMA_VERSION: 'kp_etsip_schema_version',
  THEME: 'kp_etsip_theme',
  SEED_SIZE: 'kp_etsip_seed_size',
};

export const SEED_SIZES = {
  SMALL: {
    key: 'small',
    label: 'Small',
    records: 50,
  },
  STANDARD: {
    key: 'standard',
    label: 'Standard',
    records: 200,
  },
  LARGE: {
    key: 'large',
    label: 'Large',
    records: 500,
  },
};

export const ID_PREFIXES = {
  PORTFOLIO: 'PF-',
  APPLICATION: 'APP-',
  RELATIONSHIP: 'REL-',
  TECH_CATEGORY: 'TC-',
  TECH_STANDARD: 'TS-',
  TECH_ENTRY: 'TE-',
  DEFINITION: 'DEF-',
  ENVIRONMENT: 'ENV-',
  TECH_DEBT: 'TD-',
  QUALITY_GATE: 'QG-',
  GOVERNANCE_RECORD: 'GOV-',
  APPROVAL_REQUEST: 'APR-',
  WAIVER: 'WAV-',
  EVIDENCE: 'EVI-',
  USER: 'USR-',
  ROLE: 'ROL-',
  INTEGRATION: 'INT-',
  NOTIFICATION: 'NOT-',
  AI_ANALYSIS: 'AI-',
  PDE_CONFIG: 'PDE-',
  DEMO_SCENARIO: 'DEM-',
  SCHEDULE: 'SCH-',
  AUDIT_LOG: 'AUD-',
  USE_CASE: 'USE-',
};

export const ENTITY_NAMES = {
  PORTFOLIO: 'Portfolio',
  APPLICATION: 'Application',
  RELATIONSHIP: 'Relationship',
  TECH_CATEGORY: 'Technology Category',
  TECH_STANDARD: 'Technology Standard',
  TECH_ENTRY: 'Technology Entry',
  DEFINITION: 'Definition',
  ENVIRONMENT: 'Environment',
  TECH_DEBT: 'Technical Debt',
  QUALITY_GATE: 'Quality Gate',
  GOVERNANCE_RECORD: 'Governance Record',
  APPROVAL_REQUEST: 'Approval Request',
  WAIVER: 'Waiver',
  EVIDENCE: 'Evidence',
  USER: 'User',
  ROLE: 'Role',
  INTEGRATION: 'Integration',
  NOTIFICATION: 'Notification',
  AI_ANALYSIS: 'AI Analysis',
  PDE_CONFIG: 'PDE Configuration',
  DEMO_SCENARIO: 'Demo Scenario',
  SCHEDULE: 'Schedule',
  AUDIT_LOG: 'Audit Log',
  USE_CASE: 'Use Case',
};

export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
  PDF: 'pdf',
};

export const NOTIFICATION_TRIGGERS = {
  STANDARD_EXPIRING: 'standard_expiring',
  STANDARD_EXPIRED: 'standard_expired',
  WAIVER_EXPIRING: 'waiver_expiring',
  WAIVER_EXPIRED: 'waiver_expired',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_GRANTED: 'approval_granted',
  APPROVAL_REJECTED: 'approval_rejected',
  TECH_DEBT_CREATED: 'tech_debt_created',
  TECH_DEBT_RESOLVED: 'tech_debt_resolved',
  QUALITY_GATE_FAILED: 'quality_gate_failed',
  QUALITY_GATE_PASSED: 'quality_gate_passed',
  GOVERNANCE_VIOLATION: 'governance_violation',
  AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
  INTEGRATION_SYNC_FAILED: 'integration_sync_failed',
};

export const INTEGRATION_TYPES = {
  REST_API: 'rest_api',
  GRAPHQL: 'graphql',
  WEBHOOK: 'webhook',
  LDAP: 'ldap',
  SAML: 'saml',
  OAUTH2: 'oauth2',
  OIDC: 'oidc',
  JIRA: 'jira',
  SERVICENOW: 'servicenow',
  CONFLUENCE: 'confluence',
  GITHUB: 'github',
  GITLAB: 'gitlab',
  AZURE_DEVOPS: 'azure_devops',
  JENKINS: 'jenkins',
  SONARQUBE: 'sonarqube',
  SNYK: 'snyk',
  SPLUNK: 'splunk',
  DATADOG: 'datadog',
  ELASTIC: 'elastic',
  SLACK: 'slack',
  TEAMS: 'teams',
  EMAIL: 'email',
};

export const AI_FEATURE_TYPES = {
  TECH_RADAR_ANALYSIS: 'tech_radar_analysis',
  LIFECYCLE_PREDICTION: 'lifecycle_prediction',
  RISK_ASSESSMENT: 'risk_assessment',
  DEPENDENCY_ANALYSIS: 'dependency_analysis',
  MIGRATION_PLANNING: 'migration_planning',
  COST_OPTIMIZATION: 'cost_optimization',
  COMPLIANCE_CHECK: 'compliance_check',
  ANOMALY_DETECTION: 'anomaly_detection',
  TREND_FORECASTING: 'trend_forecasting',
  PORTFOLIO_OPTIMIZATION: 'portfolio_optimization',
  STANDARD_RECOMMENDATION: 'standard_recommendation',
  DEBT_PRIORITIZATION: 'debt_prioritization',
  IMPACT_ANALYSIS: 'impact_analysis',
};

export const SCORE_BANDS = {
  CRITICAL: {
    key: 'critical',
    label: 'Critical',
    min: 0,
    max: 20,
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
  POOR: {
    key: 'poor',
    label: 'Poor',
    min: 21,
    max: 40,
    color: '#f97316',
    bgColor: '#ffedd5',
    textColor: '#9a3412',
  },
  FAIR: {
    key: 'fair',
    label: 'Fair',
    min: 41,
    max: 60,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
  },
  GOOD: {
    key: 'good',
    label: 'Good',
    min: 61,
    max: 80,
    color: '#22c55e',
    bgColor: '#dcfce7',
    textColor: '#166534',
  },
  EXCELLENT: {
    key: 'excellent',
    label: 'Excellent',
    min: 81,
    max: 100,
    color: '#16a34a',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
};

/**
 * Returns the score band object for a given numeric score.
 * @param {number} score - A score between 0 and 100.
 * @returns {{ key: string, label: string, min: number, max: number, color: string, bgColor: string, textColor: string } | undefined}
 */
export const getScoreBand = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return undefined;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return Object.values(SCORE_BANDS).find(
    (band) => clamped >= band.min && clamped <= band.max
  );
};