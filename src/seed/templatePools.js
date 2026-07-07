/**
 * Curated text template pools for realistic seed data generation.
 * Used by seedEngine for deterministic, realistic mock data.
 *
 * All pools are plain arrays of strings. The seedEngine's PRNG picks from
 * these pools to produce reproducible, human-readable records.
 */

/**
 * Realistic application names across enterprise domains.
 * @type {string[]}
 */
export const APPLICATION_NAMES = [
  'Customer Portal',
  'Order Management System',
  'Inventory Tracker',
  'Payment Gateway',
  'Employee Self-Service',
  'Claims Processing Engine',
  'Policy Administration System',
  'Underwriting Workbench',
  'Billing & Invoicing Platform',
  'Document Management System',
  'Enterprise Data Warehouse',
  'Customer Relationship Manager',
  'Supply Chain Optimizer',
  'Fraud Detection Engine',
  'Risk Analytics Dashboard',
  'Mobile Banking App',
  'Loan Origination System',
  'Compliance Monitor',
  'HR Onboarding Portal',
  'Vendor Management Platform',
  'Content Delivery Network Manager',
  'API Gateway Console',
  'Identity & Access Manager',
  'Notification Service Hub',
  'Reporting & Analytics Suite',
  'Digital Signature Service',
  'Workflow Automation Engine',
  'Data Integration Platform',
  'Real-Time Messaging Service',
  'Audit Trail Manager',
  'Configuration Management DB',
  'Service Desk Portal',
  'Knowledge Base System',
  'E-Commerce Storefront',
  'Marketing Automation Platform',
  'Campaign Manager',
  'Loyalty Rewards Engine',
  'Appointment Scheduler',
  'Telehealth Platform',
  'Clinical Data Repository',
  'Lab Results Portal',
  'Pharmacy Management System',
  'Fleet Management Tracker',
  'Asset Lifecycle Manager',
  'Facilities Booking System',
  'Learning Management System',
  'Talent Acquisition Platform',
  'Performance Review System',
  'Budget Planning Tool',
  'Contract Lifecycle Manager',
  'Regulatory Filing System',
  'Tax Calculation Engine',
  'Treasury Management System',
  'Trade Settlement Platform',
  'Market Data Feed Handler',
  'Portfolio Risk Analyzer',
  'Client Onboarding Portal',
  'KYC Verification Service',
  'Anti-Money Laundering Engine',
  'Disaster Recovery Orchestrator',
];

/**
 * Realistic portfolio names for enterprise technology groupings.
 * @type {string[]}
 */
export const PORTFOLIO_NAMES = [
  'Digital Banking',
  'Insurance Core Systems',
  'Enterprise Integration',
  'Customer Experience',
  'Data & Analytics',
  'Cloud Infrastructure',
  'Security & Compliance',
  'Human Capital Management',
  'Financial Operations',
  'Supply Chain & Logistics',
  'Healthcare Solutions',
  'Retail & Commerce',
  'Risk Management',
  'Regulatory Technology',
  'DevOps & Platform Engineering',
  'Mobile & Digital Channels',
  'AI & Machine Learning',
  'Enterprise Content Management',
  'Payments & Settlements',
  'Wealth Management',
  'Corporate Services',
  'Marketing Technology',
  'Client Services',
  'Operational Excellence',
  'Innovation Lab',
];

/**
 * Business unit names for organizational context.
 * @type {string[]}
 */
export const BUSINESS_UNITS = [
  'Retail Banking',
  'Commercial Banking',
  'Investment Services',
  'Insurance Operations',
  'Wealth Management',
  'Corporate Finance',
  'Information Technology',
  'Human Resources',
  'Marketing & Communications',
  'Legal & Compliance',
  'Risk Management',
  'Operations',
  'Customer Service',
  'Digital Transformation',
  'Enterprise Architecture',
  'Data Science',
  'Cybersecurity',
  'Infrastructure Services',
  'Application Development',
  'Quality Engineering',
];

/**
 * Technology standard names for enterprise standards catalog.
 * @type {string[]}
 */
export const TECH_STANDARD_NAMES = [
  'React 18.x Frontend Framework',
  'Angular 17.x Frontend Framework',
  'Vue.js 3.x Frontend Framework',
  'Node.js 20 LTS Runtime',
  'Java 21 LTS Runtime',
  'Python 3.12 Runtime',
  '.NET 8 Runtime',
  'Go 1.22 Runtime',
  'PostgreSQL 16 Database',
  'Oracle 23c Database',
  'MongoDB 7.x Document Store',
  'Redis 7.x Cache',
  'Apache Kafka 3.x Event Streaming',
  'RabbitMQ 3.x Message Broker',
  'Kubernetes 1.29 Container Orchestration',
  'Docker 25.x Container Runtime',
  'Terraform 1.7 Infrastructure as Code',
  'AWS CloudFormation IaC',
  'Jenkins 2.x CI/CD Pipeline',
  'GitHub Actions CI/CD',
  'GitLab CI/CD Pipeline',
  'Azure DevOps Pipeline',
  'SonarQube 10.x Code Quality',
  'Snyk Security Scanning',
  'Checkmarx SAST',
  'Veracode Application Security',
  'Splunk Enterprise Logging',
  'Datadog Monitoring',
  'Elastic Stack 8.x Observability',
  'Prometheus & Grafana Monitoring',
  'OAuth 2.0 Authorization',
  'OpenID Connect Authentication',
  'SAML 2.0 Federation',
  'TLS 1.3 Transport Security',
  'REST API Design Standard',
  'GraphQL API Standard',
  'gRPC Service Communication',
  'Apache Spark 3.x Data Processing',
  'Snowflake Data Warehouse',
  'Databricks Lakehouse Platform',
  'Selenium 4.x Test Automation',
  'Cypress 13.x E2E Testing',
  'Playwright Test Automation',
  'JUnit 5 Unit Testing',
  'Jest 29.x JavaScript Testing',
  'Pytest 8.x Python Testing',
  'Accessibility WCAG 2.2 AA',
  'OWASP Top 10 Security Standard',
  'PCI DSS 4.0 Compliance',
  'SOC 2 Type II Compliance',
];

/**
 * Technology category names for organizing standards.
 * @type {string[]}
 */
export const TECH_CATEGORY_NAMES = [
  'Frontend Frameworks',
  'Backend Runtimes',
  'Databases',
  'Caching & In-Memory',
  'Messaging & Event Streaming',
  'Container & Orchestration',
  'Infrastructure as Code',
  'CI/CD Pipelines',
  'Code Quality & Analysis',
  'Security Scanning',
  'Monitoring & Observability',
  'Authentication & Authorization',
  'API Standards',
  'Data Processing & Analytics',
  'Test Automation',
  'Compliance Frameworks',
  'Cloud Platforms',
  'DevOps Tooling',
  'Mobile Frameworks',
  'Documentation & Collaboration',
];

/**
 * Use case / test case titles for quality engineering.
 * @type {string[]}
 */
export const USE_CASE_TITLES = [
  'Verify user login with valid credentials',
  'Validate password reset flow via email',
  'Test session timeout after inactivity',
  'Verify multi-factor authentication enrollment',
  'Validate role-based access control enforcement',
  'Test concurrent user session handling',
  'Verify data export to CSV format',
  'Validate search functionality with special characters',
  'Test pagination across large datasets',
  'Verify form validation error messages',
  'Test file upload with maximum size limit',
  'Validate email notification delivery',
  'Verify audit trail logging for sensitive actions',
  'Test API rate limiting under load',
  'Validate data encryption at rest',
  'Test cross-browser compatibility on Chrome and Firefox',
  'Verify mobile responsive layout on tablet devices',
  'Test accessibility screen reader navigation',
  'Validate keyboard-only navigation flow',
  'Test database failover and recovery',
  'Verify cache invalidation on data update',
  'Test webhook delivery retry mechanism',
  'Validate batch processing job completion',
  'Test real-time notification push delivery',
  'Verify data synchronization between systems',
  'Test graceful degradation under service outage',
  'Validate input sanitization against XSS attacks',
  'Test SQL injection prevention on search fields',
  'Verify CORS policy enforcement',
  'Test SSL certificate validation',
  'Validate user profile update persistence',
  'Test shopping cart checkout flow end-to-end',
  'Verify payment processing with test card numbers',
  'Test order cancellation and refund workflow',
  'Validate report generation with date range filters',
  'Test dashboard widget data refresh',
  'Verify user registration with duplicate email',
  'Test account lockout after failed login attempts',
  'Validate GDPR data deletion request handling',
  'Test localization for supported languages',
];

/**
 * Technical debt titles for realistic debt tracking.
 * @type {string[]}
 */
export const TECH_DEBT_TITLES = [
  'Upgrade legacy jQuery to React components',
  'Migrate from Oracle 12c to PostgreSQL 16',
  'Replace custom authentication with OAuth 2.0',
  'Refactor monolithic service into microservices',
  'Address SonarQube critical code smells',
  'Update deprecated API endpoints to v3',
  'Migrate from on-premise to cloud infrastructure',
  'Replace synchronous batch jobs with event-driven processing',
  'Upgrade Node.js from v14 to v20 LTS',
  'Remediate Snyk high-severity vulnerabilities',
  'Replace hardcoded configuration with environment variables',
  'Implement proper error handling in payment service',
  'Add unit test coverage for core business logic',
  'Migrate from REST to GraphQL for mobile API',
  'Replace custom logging with structured logging framework',
  'Upgrade Spring Boot from 2.x to 3.x',
  'Decommission legacy SOAP web services',
  'Implement database connection pooling',
  'Replace manual deployment with CI/CD pipeline',
  'Address accessibility WCAG 2.2 AA violations',
  'Migrate from Angular.js to Angular 17',
  'Replace FTP file transfers with secure API integration',
  'Implement proper secrets management with Vault',
  'Upgrade TLS from 1.0/1.1 to 1.3',
  'Refactor database schema to support multi-tenancy',
  'Replace polling mechanism with WebSocket connections',
  'Implement proper caching strategy for API responses',
  'Migrate from Jenkins to GitHub Actions',
  'Address performance bottleneck in report generation',
  'Replace custom ORM with industry-standard framework',
];

/**
 * Technical debt descriptions for detailed context.
 * @type {string[]}
 */
export const TECH_DEBT_DESCRIPTIONS = [
  'The current implementation uses outdated libraries that are no longer receiving security patches. This creates a significant vulnerability surface and increases maintenance burden on the development team.',
  'Performance degradation has been observed under peak load conditions due to inefficient database queries and lack of proper indexing. This impacts user experience and SLA compliance.',
  'The existing architecture does not support horizontal scaling, limiting our ability to handle increased traffic during business-critical periods. A redesign is needed to support elastic scaling.',
  'Manual deployment processes introduce risk of human error and extend release cycles. Automating the deployment pipeline will reduce deployment time and improve reliability.',
  'The current codebase lacks adequate test coverage, making it difficult to refactor safely. Adding comprehensive unit and integration tests is essential before any major changes.',
  'Security scanning has identified multiple high-severity vulnerabilities in third-party dependencies. These must be remediated to maintain compliance with our security standards.',
  'The legacy integration uses deprecated protocols that will be discontinued by the vendor. Migration to the new API version is required to maintain connectivity.',
  'Current monitoring capabilities are insufficient to detect and diagnose production issues in a timely manner. Implementing comprehensive observability will reduce mean time to resolution.',
  'The application stores sensitive data without proper encryption, violating regulatory requirements. Implementing encryption at rest and in transit is a compliance priority.',
  'Technical documentation is outdated and incomplete, making onboarding new team members difficult and increasing the risk of knowledge loss when team members transition.',
];

/**
 * Governance record titles for compliance and policy tracking.
 * @type {string[]}
 */
export const GOVERNANCE_TITLES = [
  'Cloud Migration Security Review',
  'API Gateway Standard Adoption Policy',
  'Data Retention and Archival Guidelines',
  'Open Source Software Usage Policy',
  'Third-Party Vendor Security Assessment',
  'Production Change Management Procedure',
  'Disaster Recovery Plan Annual Review',
  'PCI DSS Compliance Assessment',
  'SOC 2 Audit Preparation Checklist',
  'GDPR Data Processing Agreement Review',
  'Microservices Architecture Decision Record',
  'Container Security Baseline Standard',
  'Database Encryption Standard',
  'API Versioning and Deprecation Policy',
  'Incident Response Procedure Update',
  'Access Control Review Quarterly Audit',
  'Software License Compliance Review',
  'Performance Testing Requirements Standard',
  'Accessibility Compliance Guideline',
  'Mobile Application Security Standard',
];

/**
 * Approval request titles for workflow scenarios.
 * @type {string[]}
 */
export const APPROVAL_REQUEST_TITLES = [
  'Request to adopt Kubernetes for container orchestration',
  'Exception request for legacy Java 8 runtime extension',
  'Waiver for temporary use of self-signed certificates',
  'Request to introduce GraphQL as API standard',
  'Approval for MongoDB adoption in analytics platform',
  'Exception for delayed PCI DSS remediation timeline',
  'Request to decommission legacy mainframe application',
  'Approval for cloud provider migration from AWS to Azure',
  'Request to adopt Terraform for infrastructure management',
  'Exception for non-standard authentication mechanism',
  'Approval for new open-source framework adoption',
  'Request to upgrade production database during business hours',
  'Waiver for temporary non-compliance with logging standard',
  'Approval for third-party SaaS integration',
  'Request to implement custom encryption algorithm',
  'Exception for extended support of deprecated library',
  'Approval for cross-region data replication',
  'Request to adopt serverless architecture pattern',
  'Waiver for accessibility compliance timeline extension',
  'Approval for penetration testing by external vendor',
];

/**
 * Waiver titles for standards compliance exceptions.
 * @type {string[]}
 */
export const WAIVER_TITLES = [
  'TLS 1.2 Usage Waiver for Legacy Integration',
  'Java 8 Runtime Extension Waiver',
  'On-Premise Deployment Waiver for Regulated Data',
  'Manual Testing Waiver for Low-Risk Module',
  'Self-Signed Certificate Waiver for Dev Environment',
  'Legacy Database Version Waiver',
  'Non-Standard API Format Waiver',
  'Reduced Test Coverage Waiver for Prototype',
  'Custom Authentication Mechanism Waiver',
  'Delayed Security Patch Application Waiver',
  'Non-Compliant Logging Format Waiver',
  'Extended Deprecation Timeline Waiver',
  'Accessibility Standard Partial Compliance Waiver',
  'Performance Threshold Exception Waiver',
  'Open Source License Exception Waiver',
];

/**
 * Environment names for deployment context.
 * @type {string[]}
 */
export const ENVIRONMENT_NAMES = [
  'Development',
  'Development 2',
  'Feature Branch',
  'Integration Testing',
  'System Integration Test',
  'Quality Assurance',
  'QA Automation',
  'User Acceptance Testing',
  'UAT Staging',
  'Pre-Production',
  'Performance Testing',
  'Load Testing',
  'Security Testing',
  'Staging',
  'Production Blue',
  'Production Green',
  'Production',
  'Disaster Recovery',
  'DR Hot Standby',
  'Sandbox',
  'Demo',
  'Training',
];

/**
 * First names for realistic user generation.
 * @type {string[]}
 */
export const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John',
  'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph',
  'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew',
  'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Steven', 'Ashley', 'Paul', 'Dorothy', 'Andrew',
  'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna',
  'Kevin', 'Michelle', 'Brian', 'Carol', 'George',
  'Amanda', 'Timothy', 'Melissa', 'Ronald', 'Deborah',
  'Priya', 'Raj', 'Wei', 'Mei', 'Hiroshi',
  'Yuki', 'Carlos', 'Maria', 'Ahmed', 'Fatima',
  'Olga', 'Dmitri', 'Aisha', 'Omar', 'Sanjay',
  'Anita', 'Lars', 'Ingrid', 'Chen', 'Yong',
];

/**
 * Last names for realistic user generation.
 * @type {string[]}
 */
export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright',
  'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall',
  'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Patel', 'Kumar', 'Singh', 'Chen', 'Wang',
  'Kim', 'Tanaka', 'Müller', 'Schmidt', 'Johansson',
  'Petrov', 'Ivanova', 'Ali', 'Hassan', 'O\'Brien',
  'Sullivan', 'Fernandez', 'Nakamura', 'Larsson', 'Berg',
];

/**
 * Job titles for user profile generation.
 * @type {string[]}
 */
export const JOB_TITLES = [
  'Senior Software Engineer',
  'Staff Software Engineer',
  'Principal Engineer',
  'Software Architect',
  'Technical Lead',
  'Engineering Manager',
  'Director of Engineering',
  'VP of Engineering',
  'Quality Engineer',
  'Senior QA Engineer',
  'QA Lead',
  'SDET',
  'Automation Engineer',
  'Performance Engineer',
  'Security Engineer',
  'Accessibility Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
  'Cloud Architect',
  'Data Engineer',
  'Data Scientist',
  'Product Owner',
  'Product Manager',
  'Scrum Master',
  'Program Manager',
  'Project Manager',
  'Release Manager',
  'Environment Manager',
  'Business Analyst',
  'Solutions Architect',
  'Enterprise Architect',
  'Technical Writer',
  'UX Designer',
  'Database Administrator',
  'Network Engineer',
  'Systems Administrator',
  'IT Operations Manager',
  'Chief Technology Officer',
  'Chief Information Officer',
];

/**
 * Department names for organizational context.
 * @type {string[]}
 */
export const DEPARTMENTS = [
  'Engineering',
  'Quality Engineering',
  'Platform Engineering',
  'DevOps',
  'Information Security',
  'Data Engineering',
  'Product Management',
  'IT Operations',
  'Enterprise Architecture',
  'Cloud Services',
  'Application Development',
  'Infrastructure',
  'Release Management',
  'Compliance',
  'Digital Transformation',
];

/**
 * Notification message templates with placeholders.
 * @type {string[]}
 */
export const NOTIFICATION_MESSAGES = [
  'Technology standard is expiring in 30 days. Please review and renew.',
  'Your approval request has been approved by the review board.',
  'Your approval request has been rejected. See comments for details.',
  'A new waiver request requires your review and approval.',
  'Technical debt item has been resolved and closed.',
  'Quality gate check has failed for the latest deployment.',
  'Quality gate check has passed. Deployment is cleared to proceed.',
  'A new governance violation has been detected. Immediate action required.',
  'AI analysis has completed. Review the recommendations.',
  'Integration sync has failed. Check connection settings.',
  'Your waiver is expiring in 14 days. Please submit a renewal or remediation plan.',
  'A new technology standard has been published. Review for applicability.',
  'Scheduled assessment is due this week. Please complete the review.',
  'A critical security vulnerability has been identified in a dependency.',
  'System maintenance is scheduled for this weekend. Plan accordingly.',
];

/**
 * AI analysis titles for simulated AI insights.
 * @type {string[]}
 */
export const AI_ANALYSIS_TITLES = [
  'Technology Radar Q1 Analysis',
  'Application Lifecycle Risk Assessment',
  'Dependency Vulnerability Impact Analysis',
  'Cloud Migration Readiness Assessment',
  'Cost Optimization Recommendations',
  'Compliance Gap Analysis',
  'Technical Debt Prioritization Report',
  'Portfolio Health Score Trend Analysis',
  'Standard Adoption Rate Forecast',
  'Anomaly Detection in Deployment Patterns',
  'Migration Path Recommendation for Legacy Systems',
  'Risk-Based Test Prioritization Analysis',
  'Infrastructure Cost Trend Forecast',
  'Security Posture Assessment',
  'Performance Bottleneck Identification',
];

/**
 * Integration names for external system connections.
 * @type {string[]}
 */
export const INTEGRATION_NAMES = [
  'Jira Cloud Integration',
  'ServiceNow ITSM Connector',
  'Confluence Documentation Sync',
  'GitHub Enterprise Integration',
  'GitLab CI/CD Connector',
  'Azure DevOps Pipeline Sync',
  'Jenkins Build Server Integration',
  'SonarQube Code Quality Feed',
  'Snyk Vulnerability Scanner',
  'Splunk Log Aggregation',
  'Datadog APM Integration',
  'Elastic Stack Connector',
  'Slack Notification Channel',
  'Microsoft Teams Webhook',
  'LDAP Directory Sync',
  'Okta SSO Integration',
  'PagerDuty Incident Connector',
  'Artifactory Repository Sync',
  'Terraform Cloud Integration',
  'AWS CloudWatch Connector',
];

/**
 * Quality gate names for assessment scenarios.
 * @type {string[]}
 */
export const QUALITY_GATE_NAMES = [
  'Code Coverage Threshold Check',
  'Static Analysis Quality Gate',
  'Security Vulnerability Scan',
  'Performance Benchmark Validation',
  'Accessibility Compliance Check',
  'API Contract Validation',
  'Database Migration Verification',
  'Integration Test Suite Pass Rate',
  'Deployment Smoke Test',
  'Load Test Throughput Threshold',
  'Memory Leak Detection Check',
  'Dependency License Compliance',
  'Code Review Approval Gate',
  'Documentation Completeness Check',
  'Regression Test Suite Validation',
  'Container Image Security Scan',
  'Infrastructure Compliance Check',
  'Data Quality Validation Gate',
  'End-to-End Test Pass Rate',
  'Release Readiness Assessment',
];

/**
 * Evidence titles for compliance documentation.
 * @type {string[]}
 */
export const EVIDENCE_TITLES = [
  'SonarQube Analysis Report - Sprint 24',
  'Penetration Test Results - Q4 Assessment',
  'Load Test Report - Black Friday Readiness',
  'WCAG 2.2 AA Audit Results',
  'Unit Test Coverage Report',
  'Integration Test Execution Summary',
  'Security Scan Results - Monthly Review',
  'Performance Benchmark Comparison',
  'Accessibility Audit Findings',
  'Code Review Metrics Dashboard Export',
  'Deployment Verification Checklist',
  'Disaster Recovery Test Results',
  'Compliance Certification Document',
  'Vulnerability Remediation Evidence',
  'Change Management Approval Record',
  'Incident Post-Mortem Report',
  'Capacity Planning Assessment',
  'Data Classification Audit Results',
  'Third-Party Security Assessment Report',
  'SOC 2 Control Evidence Package',
];

/**
 * Definition terms for the glossary.
 * @type {Array<{term: string, definition: string, category: string}>}
 */
export const DEFINITION_ENTRIES = [
  {
    term: 'Technical Debt',
    definition: 'The implied cost of additional rework caused by choosing an easy or limited solution now instead of using a better approach that would take longer.',
    category: 'Engineering',
  },
  {
    term: 'Quality Gate',
    definition: 'A set of predefined criteria that a software project must meet before it can proceed to the next stage of its lifecycle.',
    category: 'Quality Engineering',
  },
  {
    term: 'Technology Standard',
    definition: 'An approved technology, framework, or tool that has been vetted and sanctioned for use within the organization.',
    category: 'Governance',
  },
  {
    term: 'Waiver',
    definition: 'A formal exception granted to allow temporary non-compliance with a technology standard, subject to conditions and an expiration date.',
    category: 'Governance',
  },
  {
    term: 'Compliance Score',
    definition: 'A numeric measure (0-100) indicating the degree to which an application or portfolio adheres to established technology standards.',
    category: 'Governance',
  },
  {
    term: 'Tech Radar',
    definition: 'A visualization tool that categorizes technologies into rings (Adopt, Trial, Assess, Hold) to guide technology adoption decisions.',
    category: 'Strategy',
  },
  {
    term: 'CI/CD Pipeline',
    definition: 'A series of automated steps that software changes go through from code commit to production deployment, including build, test, and deploy stages.',
    category: 'DevOps',
  },
  {
    term: 'Microservices',
    definition: 'An architectural style that structures an application as a collection of loosely coupled, independently deployable services.',
    category: 'Architecture',
  },
  {
    term: 'Infrastructure as Code',
    definition: 'The practice of managing and provisioning computing infrastructure through machine-readable configuration files rather than manual processes.',
    category: 'DevOps',
  },
  {
    term: 'SLA',
    definition: 'Service Level Agreement - a commitment between a service provider and a client that defines the expected level of service quality.',
    category: 'Operations',
  },
  {
    term: 'MTTR',
    definition: 'Mean Time to Recovery - the average time it takes to restore a system or service after a failure.',
    category: 'Operations',
  },
  {
    term: 'SAST',
    definition: 'Static Application Security Testing - a methodology that analyzes source code to find security vulnerabilities without executing the program.',
    category: 'Security',
  },
  {
    term: 'DAST',
    definition: 'Dynamic Application Security Testing - a methodology that tests running applications to find security vulnerabilities by simulating attacks.',
    category: 'Security',
  },
  {
    term: 'RBAC',
    definition: 'Role-Based Access Control - a method of regulating access to resources based on the roles of individual users within an organization.',
    category: 'Security',
  },
  {
    term: 'API Gateway',
    definition: 'A server that acts as a single entry point for a set of microservices, handling request routing, composition, and protocol translation.',
    category: 'Architecture',
  },
  {
    term: 'Blue-Green Deployment',
    definition: 'A deployment strategy that reduces downtime by running two identical production environments, switching traffic between them during releases.',
    category: 'DevOps',
  },
  {
    term: 'Canary Release',
    definition: 'A deployment technique where a new version is gradually rolled out to a small subset of users before being deployed to the entire infrastructure.',
    category: 'DevOps',
  },
  {
    term: 'Observability',
    definition: 'The ability to measure the internal states of a system by examining its outputs, typically through logs, metrics, and traces.',
    category: 'Operations',
  },
  {
    term: 'Data Mesh',
    definition: 'A decentralized data architecture that organizes data by business domain, treating data as a product with dedicated ownership.',
    category: 'Architecture',
  },
  {
    term: 'Zero Trust',
    definition: 'A security model that requires strict identity verification for every person and device trying to access resources, regardless of network location.',
    category: 'Security',
  },
];

/**
 * Schedule names for recurring activities.
 * @type {string[]}
 */
export const SCHEDULE_NAMES = [
  'Weekly Technology Standards Review',
  'Monthly Compliance Assessment',
  'Quarterly Portfolio Health Check',
  'Annual Disaster Recovery Test',
  'Bi-Weekly Sprint Quality Review',
  'Monthly Security Vulnerability Scan',
  'Weekly Integration Sync Check',
  'Quarterly Architecture Review Board',
  'Monthly Tech Debt Prioritization',
  'Annual Technology Radar Update',
  'Weekly Deployment Readiness Review',
  'Monthly Performance Benchmark Run',
  'Quarterly Vendor Assessment Review',
  'Annual License Compliance Audit',
  'Monthly Accessibility Audit',
];

/**
 * Demo scenario names for guided walkthroughs.
 * @type {string[]}
 */
export const DEMO_SCENARIO_NAMES = [
  'Executive Dashboard Overview',
  'Technology Standards Lifecycle Management',
  'Application Portfolio Assessment',
  'Technical Debt Remediation Workflow',
  'Approval Request and Waiver Process',
  'Quality Gate Configuration and Monitoring',
  'AI-Powered Risk Assessment',
  'Compliance Reporting and Export',
  'Integration Setup and Monitoring',
  'Persona-Based Access Control Demo',
];

/**
 * Tags commonly used across entities for categorization.
 * @type {string[]}
 */
export const COMMON_TAGS = [
  'critical',
  'high-priority',
  'security',
  'compliance',
  'performance',
  'accessibility',
  'cloud-native',
  'legacy',
  'migration',
  'modernization',
  'automation',
  'api',
  'frontend',
  'backend',
  'database',
  'infrastructure',
  'monitoring',
  'testing',
  'documentation',
  'cost-optimization',
  'scalability',
  'reliability',
  'data-privacy',
  'regulatory',
  'open-source',
  'vendor-managed',
  'internal',
  'customer-facing',
  'b2b',
  'b2c',
];

/**
 * Business domain names for application categorization.
 * @type {string[]}
 */
export const BUSINESS_DOMAINS = [
  'Retail Banking',
  'Commercial Lending',
  'Wealth Management',
  'Insurance Claims',
  'Policy Administration',
  'Payment Processing',
  'Fraud Prevention',
  'Regulatory Reporting',
  'Customer Onboarding',
  'Digital Channels',
  'Trade Finance',
  'Treasury Operations',
  'Risk Analytics',
  'Compliance Management',
  'Human Resources',
  'Supply Chain',
  'Marketing',
  'Customer Service',
  'Data Analytics',
  'Enterprise Integration',
];

/**
 * Justification text templates for approval requests and waivers.
 * @type {string[]}
 */
export const JUSTIFICATION_TEXTS = [
  'This technology is required to meet the project deadline for the Q2 release. The standard alternative does not support the specific integration requirements of our partner system.',
  'The current standard version has a known compatibility issue with our legacy middleware. We need to use the previous version until the vendor provides a patch.',
  'Our team has evaluated the standard alternative and determined that it would require 6 months of additional development effort. The proposed technology achieves the same outcome with lower risk.',
  'This exception is needed to support a regulatory requirement that mandates specific encryption algorithms not yet supported by the approved standard.',
  'The vendor has announced end-of-life for the current standard. We are requesting early adoption of the replacement technology to avoid a forced migration under time pressure.',
  'Business stakeholders have identified this as a critical capability gap. The proposed technology has been successfully used by peer organizations in our industry.',
  'The approved standard does not meet the performance requirements for our real-time processing use case. Benchmarks show the proposed alternative delivers 3x throughput improvement.',
  'This waiver is requested to allow continued operation while the migration plan is being executed. The remediation is scheduled for completion within the next quarter.',
  'Security assessment has confirmed that the proposed technology meets all security requirements despite not being on the approved standards list.',
  'Cost analysis shows that the proposed solution reduces annual licensing costs by 40% compared to the approved standard, with equivalent functionality.',
];

/**
 * Mitigation plan text templates for waivers.
 * @type {string[]}
 */
export const MITIGATION_PLANS = [
  'We will implement additional monitoring and alerting to detect any security issues. A migration plan to the approved standard will be executed within 6 months.',
  'The team will conduct monthly security reviews and apply all available patches. A full migration is planned for the next fiscal year.',
  'Compensating controls including network segmentation and enhanced logging have been implemented. The waiver will be reviewed quarterly.',
  'We have engaged the vendor for extended support and will maintain a parallel environment running the approved standard for failover.',
  'Additional automated testing has been implemented to catch any compatibility issues. The team is actively contributing to the standard to add the required features.',
  'A dedicated security engineer will monitor the non-standard component. Incident response procedures have been updated to include specific runbooks.',
  'We will limit the scope of the non-standard technology to the specific use case and prevent its adoption in other applications.',
  'Regular vulnerability scanning will be performed weekly instead of monthly. Any critical findings will trigger an immediate remediation or escalation.',
];

/**
 * Cloud regions for environment configuration.
 * @type {string[]}
 */
export const CLOUD_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ca-central-1',
  'sa-east-1',
  'us-central',
  'europe-west1',
  'asia-east1',
  'australia-southeast1',
];

/**
 * Infrastructure providers for environment context.
 * @type {string[]}
 */
export const INFRASTRUCTURE_PROVIDERS = [
  'AWS',
  'Microsoft Azure',
  'Google Cloud Platform',
  'On-Premise Data Center',
  'IBM Cloud',
  'Oracle Cloud',
  'VMware vSphere',
  'Red Hat OpenShift',
  'Heroku',
  'DigitalOcean',
];

/**
 * Role names for RBAC configuration.
 * @type {string[]}
 */
export const ROLE_NAMES = [
  'Platform Administrator',
  'Executive Viewer',
  'Portfolio Leader',
  'Application Owner',
  'Quality Engineer',
  'Security Analyst',
  'DevOps Engineer',
  'Release Manager',
  'Compliance Officer',
  'Read-Only Auditor',
  'External Vendor',
  'Scrum Master',
  'Product Owner',
  'Technical Architect',
  'Data Steward',
];

/**
 * PDE configuration names for platform settings.
 * @type {string[]}
 */
export const PDE_CONFIG_NAMES = [
  'Default Dashboard Layout',
  'Notification Preferences',
  'Data Retention Policy',
  'Export Format Settings',
  'Theme Configuration',
  'API Rate Limit Settings',
  'Audit Log Retention',
  'Session Timeout Configuration',
  'Password Policy Settings',
  'Feature Flag Configuration',
];

/**
 * Technology stack component names for application profiles.
 * @type {string[]}
 */
export const TECHNOLOGY_STACK_COMPONENTS = [
  'React',
  'Angular',
  'Vue.js',
  'Node.js',
  'Java',
  'Python',
  '.NET',
  'Go',
  'Ruby',
  'PHP',
  'PostgreSQL',
  'MySQL',
  'Oracle',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'Kafka',
  'RabbitMQ',
  'Docker',
  'Kubernetes',
  'Terraform',
  'AWS Lambda',
  'Azure Functions',
  'Spring Boot',
  'Express.js',
  'Django',
  'FastAPI',
  'GraphQL',
  'REST API',
  'gRPC',
  'Nginx',
  'Apache',
  'Jenkins',
  'GitHub Actions',
  'Datadog',
  'Splunk',
  'Prometheus',
  'Grafana',
  'SonarQube',
  'Selenium',
];