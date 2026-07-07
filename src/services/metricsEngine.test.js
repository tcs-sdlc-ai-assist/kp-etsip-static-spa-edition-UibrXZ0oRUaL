import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeMetrics,
  computeDashboardMetrics,
  computeTrends,
  getScoreBand,
} from './metricsEngine';
import { STORAGE_KEYS, SCORE_BANDS } from '../constants/constants';

describe('metricsEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set active persona to admin
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));

    // Seed portfolios
    const portfolios = [
      {
        id: 'PF-001',
        name: 'Digital Banking',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        businessUnit: 'Retail Banking',
        criticality: 'high',
        applicationCount: 2,
        complianceScore: 80,
        riskLevel: 'medium',
        tags: [],
        metadata: {
          trendSeries: [
            { month: '2025-08', value: 70 },
            { month: '2025-09', value: 72 },
            { month: '2025-10', value: 74 },
            { month: '2025-11', value: 76 },
            { month: '2025-12', value: 78 },
            { month: '2026-01', value: 79 },
            { month: '2026-02', value: 80 },
            { month: '2026-03', value: 81 },
            { month: '2026-04', value: 82 },
            { month: '2026-05', value: 83 },
            { month: '2026-06', value: 84 },
            { month: '2026-07', value: 85 },
          ],
        },
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'PF-002',
        name: 'Financial Operations',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'planning',
        businessUnit: 'Corporate Finance',
        criticality: 'critical',
        applicationCount: 1,
        complianceScore: 60,
        riskLevel: 'high',
        tags: [],
        metadata: {
          trendSeries: [
            { month: '2025-08', value: 50 },
            { month: '2025-09', value: 52 },
            { month: '2025-10', value: 54 },
            { month: '2025-11', value: 55 },
            { month: '2025-12', value: 56 },
            { month: '2026-01', value: 57 },
            { month: '2026-02', value: 58 },
            { month: '2026-03', value: 59 },
            { month: '2026-04', value: 60 },
            { month: '2026-05', value: 61 },
            { month: '2026-06', value: 62 },
            { month: '2026-07', value: 63 },
          ],
        },
        createdAt: '2025-02-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));

    // Seed applications
    const applications = [
      {
        id: 'APP-001',
        name: 'Customer Portal',
        portfolioId: 'PF-001',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        criticality: 'high',
        technologyStack: ['React', 'Node.js'],
        complianceScore: 85,
        riskLevel: 'low',
        deploymentModel: 'cloud',
        businessDomain: 'Retail Banking',
        teamSize: 12,
        tags: [],
        metadata: {
          trendSeries: [
            { month: '2025-08', value: 75 },
            { month: '2025-09', value: 77 },
            { month: '2025-10', value: 79 },
            { month: '2025-11', value: 80 },
            { month: '2025-12', value: 81 },
            { month: '2026-01', value: 82 },
            { month: '2026-02', value: 83 },
            { month: '2026-03', value: 84 },
            { month: '2026-04', value: 85 },
            { month: '2026-05', value: 86 },
            { month: '2026-06', value: 87 },
            { month: '2026-07', value: 88 },
          ],
        },
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'APP-002',
        name: 'Order Management',
        portfolioId: 'PF-001',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        criticality: 'medium',
        technologyStack: ['Angular', 'Java'],
        complianceScore: 70,
        riskLevel: 'medium',
        deploymentModel: 'on_premise',
        businessDomain: 'Commercial Lending',
        teamSize: 8,
        tags: [],
        metadata: {
          trendSeries: [
            { month: '2025-08', value: 60 },
            { month: '2025-09', value: 62 },
            { month: '2025-10', value: 63 },
            { month: '2025-11', value: 64 },
            { month: '2025-12', value: 65 },
            { month: '2026-01', value: 66 },
            { month: '2026-02', value: 67 },
            { month: '2026-03', value: 68 },
            { month: '2026-04', value: 69 },
            { month: '2026-05', value: 70 },
            { month: '2026-06', value: 71 },
            { month: '2026-07', value: 72 },
          ],
        },
        createdAt: '2025-03-15T08:00:00.000Z',
        updatedAt: '2026-06-20T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'APP-003',
        name: 'Payment Gateway',
        portfolioId: 'PF-002',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'retiring',
        criticality: 'critical',
        technologyStack: ['Java', 'Kafka'],
        complianceScore: 40,
        riskLevel: 'critical',
        deploymentModel: 'hybrid',
        businessDomain: 'Payment Processing',
        teamSize: 15,
        tags: [],
        metadata: {},
        createdAt: '2024-11-01T08:00:00.000Z',
        updatedAt: '2026-06-25T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

    // Seed tech standards
    const techStandards = [
      {
        id: 'TS-001',
        name: 'React 18.x',
        categoryId: 'TC-001',
        status: 'preferred',
        effectiveDate: '2025-01-01',
        owner: 'Admin User',
        adoptionPercentage: 75,
        complianceLevel: 'mandatory',
        riskLevel: 'low',
        tags: [],
        metadata: {
          trendSeries: [
            { month: '2025-08', value: 60 },
            { month: '2025-09', value: 62 },
            { month: '2025-10', value: 64 },
            { month: '2025-11', value: 66 },
            { month: '2025-12', value: 68 },
            { month: '2026-01', value: 70 },
            { month: '2026-02', value: 71 },
            { month: '2026-03', value: 72 },
            { month: '2026-04', value: 73 },
            { month: '2026-05', value: 74 },
            { month: '2026-06', value: 75 },
            { month: '2026-07', value: 76 },
          ],
        },
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-002',
        name: 'Node.js 20 LTS',
        categoryId: 'TC-002',
        status: 'recommended',
        effectiveDate: '2025-03-01',
        owner: 'Admin User',
        adoptionPercentage: 60,
        complianceLevel: 'recommended',
        riskLevel: 'low',
        tags: [],
        metadata: {},
        createdAt: '2025-03-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-003',
        name: 'Legacy jQuery',
        categoryId: 'TC-001',
        status: 'retiring',
        effectiveDate: '2020-01-01',
        owner: 'Admin User',
        adoptionPercentage: 15,
        complianceLevel: 'optional',
        riskLevel: 'high',
        tags: [],
        metadata: {},
        createdAt: '2020-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-004',
        name: 'GraphQL API',
        categoryId: 'TC-003',
        status: 'emerging',
        effectiveDate: '2026-01-01',
        owner: 'Admin User',
        adoptionPercentage: 10,
        complianceLevel: 'optional',
        riskLevel: 'low',
        tags: [],
        metadata: {},
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify(techStandards));

    // Seed tech entries
    const techEntries = [
      {
        id: 'TE-001',
        name: 'APP-001 - React 18.x',
        standardId: 'TS-001',
        applicationId: 'APP-001',
        complianceStatus: 'compliant',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TE-002',
        name: 'APP-002 - Legacy jQuery',
        standardId: 'TS-003',
        applicationId: 'APP-002',
        complianceStatus: 'non_compliant',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TE-003',
        name: 'APP-003 - Node.js 20',
        standardId: 'TS-002',
        applicationId: 'APP-003',
        complianceStatus: 'partially_compliant',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TE-004',
        name: 'APP-001 - Node.js 20',
        standardId: 'TS-002',
        applicationId: 'APP-001',
        complianceStatus: 'compliant',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify(techEntries));

    // Seed tech debt
    const techDebt = [
      {
        id: 'TD-001',
        title: 'Upgrade legacy jQuery',
        description: 'Need to upgrade.',
        applicationId: 'APP-001',
        status: 'identified',
        priority: 'critical',
        severity: 'high',
        category: 'dependency',
        estimatedCost: 50000,
        impactScore: 85,
        tags: [],
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TD-002',
        title: 'Migrate from Oracle',
        description: 'Database migration.',
        applicationId: 'APP-002',
        status: 'planned',
        priority: 'high',
        severity: 'medium',
        category: 'infrastructure',
        estimatedCost: 120000,
        impactScore: 70,
        tags: [],
        createdAt: '2026-02-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TD-003',
        title: 'Resolved debt',
        description: 'Already resolved.',
        applicationId: 'APP-001',
        status: 'resolved',
        priority: 'low',
        severity: 'low',
        category: 'code_quality',
        estimatedCost: 5000,
        impactScore: 20,
        tags: [],
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify(techDebt));

    // Seed quality gates
    const qualityGates = [
      {
        id: 'QG-001',
        name: 'Code Coverage Gate',
        applicationId: 'APP-001',
        type: 'code_quality',
        status: 'passed',
        score: 82,
        threshold: 70,
        isBlocking: true,
        results: {
          trendSeries: [
            { month: '2025-08', value: 70 },
            { month: '2025-09', value: 72 },
            { month: '2025-10', value: 74 },
            { month: '2025-11', value: 75 },
            { month: '2025-12', value: 76 },
            { month: '2026-01', value: 77 },
            { month: '2026-02', value: 78 },
            { month: '2026-03', value: 79 },
            { month: '2026-04', value: 80 },
            { month: '2026-05', value: 81 },
            { month: '2026-06', value: 82 },
            { month: '2026-07', value: 83 },
          ],
        },
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'QG-002',
        name: 'Security Scan Gate',
        applicationId: 'APP-002',
        type: 'security',
        status: 'failed',
        score: 45,
        threshold: 70,
        isBlocking: true,
        results: {
          trendSeries: [
            { month: '2025-08', value: 40 },
            { month: '2025-09', value: 42 },
            { month: '2025-10', value: 43 },
            { month: '2025-11', value: 44 },
            { month: '2025-12', value: 44 },
            { month: '2026-01', value: 45 },
            { month: '2026-02', value: 45 },
            { month: '2026-03', value: 44 },
            { month: '2026-04', value: 45 },
            { month: '2026-05', value: 45 },
            { month: '2026-06', value: 46 },
            { month: '2026-07', value: 45 },
          ],
        },
        createdAt: '2026-06-15T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'QG-003',
        name: 'Performance Gate',
        applicationId: 'APP-003',
        type: 'performance',
        status: 'passed',
        score: 90,
        threshold: 80,
        isBlocking: false,
        results: {},
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'QG-004',
        name: 'Not Evaluated Gate',
        applicationId: 'APP-001',
        type: 'compliance',
        status: 'not_evaluated',
        score: null,
        threshold: 70,
        isBlocking: false,
        results: {},
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify(qualityGates));

    // Seed governance records
    const governanceRecords = [
      {
        id: 'GOV-001',
        title: 'Cloud Migration Review',
        description: 'Review cloud migration.',
        type: 'review',
        status: 'approved',
        owner: 'Admin User',
        complianceImpact: 'high',
        tags: [],
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'GOV-002',
        title: 'API Standard Policy',
        description: 'API standard adoption.',
        type: 'policy',
        status: 'pending_review',
        owner: 'Admin User',
        complianceImpact: 'medium',
        tags: [],
        createdAt: '2026-02-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'GOV-003',
        title: 'Data Retention Guidelines',
        description: 'Data retention.',
        type: 'guideline',
        status: 'draft',
        owner: 'Admin User',
        complianceImpact: 'low',
        tags: [],
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify(governanceRecords));

    // Seed approval requests
    const approvalRequests = [
      {
        id: 'APR-001',
        title: 'Adopt Kubernetes',
        description: 'Request to adopt K8s.',
        requestType: 'new_technology',
        status: 'pending',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        priority: 'high',
        submittedAt: '2026-06-01T08:00:00.000Z',
        justification: 'Needed for scaling.',
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'APR-002',
        title: 'Exception for Java 8',
        description: 'Legacy Java 8 extension.',
        requestType: 'exception',
        status: 'approved',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        priority: 'medium',
        submittedAt: '2026-05-01T08:00:00.000Z',
        justification: 'Vendor dependency.',
        createdAt: '2026-05-01T08:00:00.000Z',
        updatedAt: '2026-06-15T10:00:00.000Z',
        version: 2,
      },
      {
        id: 'APR-003',
        title: 'Rejected request',
        description: 'Rejected.',
        requestType: 'change',
        status: 'rejected',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        priority: 'low',
        submittedAt: '2026-04-01T08:00:00.000Z',
        justification: 'Not justified.',
        createdAt: '2026-04-01T08:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
        version: 2,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify(approvalRequests));

    // Seed waivers
    const waivers = [
      {
        id: 'WAV-001',
        title: 'Legacy jQuery Waiver',
        description: 'Waiver for jQuery.',
        standardId: 'TS-003',
        applicationId: 'APP-002',
        status: 'approved',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        riskLevel: 'medium',
        justification: 'Migration planned.',
        effectiveDate: '2026-01-01',
        expirationDate: '2026-12-31',
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'WAV-002',
        title: 'Expired Waiver',
        description: 'Expired.',
        standardId: 'TS-003',
        applicationId: 'APP-003',
        status: 'expired',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        riskLevel: 'high',
        justification: 'Temporary.',
        effectiveDate: '2025-01-01',
        expirationDate: '2025-12-31',
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify(waivers));

    // Seed environments
    const environments = [
      {
        id: 'ENV-001',
        name: 'Production',
        type: 'production',
        applicationId: 'APP-001',
        status: 'active',
        healthStatus: 'healthy',
        region: 'us-east-1',
        provider: 'AWS',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'ENV-002',
        name: 'Staging',
        type: 'staging',
        applicationId: 'APP-001',
        status: 'active',
        healthStatus: 'healthy',
        region: 'us-west-2',
        provider: 'AWS',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'ENV-003',
        name: 'Development',
        type: 'development',
        applicationId: 'APP-002',
        status: 'active',
        healthStatus: 'degraded',
        region: 'eu-west-1',
        provider: 'Azure',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'ENV-004',
        name: 'DR',
        type: 'dr',
        applicationId: 'APP-003',
        status: 'inactive',
        healthStatus: 'down',
        region: 'us-east-1',
        provider: 'AWS',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(environments));

    // Seed integrations
    const integrations = [
      {
        id: 'INT-001',
        name: 'Jira Integration',
        type: 'jira',
        status: 'active',
        direction: 'bidirectional',
        healthScore: 90,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'INT-002',
        name: 'GitHub Integration',
        type: 'github',
        status: 'active',
        direction: 'inbound',
        healthScore: 85,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'INT-003',
        name: 'Slack Integration',
        type: 'slack',
        status: 'error',
        direction: 'outbound',
        healthScore: 20,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'INT-004',
        name: 'Datadog Integration',
        type: 'datadog',
        status: 'inactive',
        direction: 'inbound',
        healthScore: 50,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));

    // Seed notifications
    const notifications = [
      {
        id: 'NOT-001',
        title: 'Standard Expiring',
        message: 'Standard expiring.',
        type: 'warning',
        trigger: 'standard_expiring',
        recipientId: 'persona-platform-administrator',
        isRead: false,
        priority: 'medium',
        createdAt: '2026-06-28T10:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'NOT-002',
        title: 'Quality Gate Failed',
        message: 'Gate failed.',
        type: 'error',
        trigger: 'quality_gate_failed',
        recipientId: 'persona-platform-administrator',
        isRead: true,
        priority: 'high',
        createdAt: '2026-06-29T08:00:00.000Z',
        updatedAt: '2026-06-29T08:00:00.000Z',
        version: 1,
      },
      {
        id: 'NOT-003',
        title: 'Notification for QE',
        message: 'QE notification.',
        type: 'info',
        trigger: 'tech_debt_created',
        recipientId: 'persona-quality-engineer',
        isRead: false,
        priority: 'low',
        createdAt: '2026-06-30T11:00:00.000Z',
        updatedAt: '2026-06-30T11:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));

    // Seed AI analyses
    const aiAnalyses = [
      {
        id: 'AI-001',
        title: 'Risk Assessment',
        featureType: 'risk_assessment',
        status: 'completed',
        confidenceScore: 85,
        recommendations: [{ id: 'rec-1', title: 'Rec 1', simulated: true }],
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'AI-002',
        title: 'Tech Radar Analysis',
        featureType: 'tech_radar_analysis',
        status: 'completed',
        confidenceScore: 90,
        recommendations: [{ id: 'rec-2', title: 'Rec 2', simulated: true }, { id: 'rec-3', title: 'Rec 3', simulated: true }],
        createdAt: '2026-06-15T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'AI-003',
        title: 'Failed Analysis',
        featureType: 'lifecycle_prediction',
        status: 'failed',
        confidenceScore: null,
        recommendations: [],
        errorMessage: 'Simulated failure.',
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify(aiAnalyses));

    // Seed evidence
    const evidence = [
      {
        id: 'EVI-001',
        title: 'SonarQube Report',
        type: 'scan_report',
        applicationId: 'APP-001',
        status: 'valid',
        collectedAt: '2026-06-01T08:00:00.000Z',
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'EVI-002',
        title: 'Pen Test Results',
        type: 'audit_report',
        applicationId: 'APP-002',
        status: 'expired',
        collectedAt: '2025-06-01T08:00:00.000Z',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'EVI-003',
        title: 'Load Test Report',
        type: 'test_result',
        applicationId: 'APP-003',
        status: 'valid',
        collectedAt: '2026-06-15T08:00:00.000Z',
        createdAt: '2026-06-15T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(evidence));

    // Seed relationships
    const relationships = [
      {
        id: 'REL-001',
        sourceApplicationId: 'APP-001',
        targetApplicationId: 'APP-002',
        relationshipType: 'depends_on',
        status: 'active',
        criticality: 'high',
        dataFlow: 'unidirectional',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'REL-002',
        sourceApplicationId: 'APP-002',
        targetApplicationId: 'APP-003',
        relationshipType: 'integrates_with',
        status: 'active',
        criticality: 'critical',
        dataFlow: 'bidirectional',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'REL-003',
        sourceApplicationId: 'APP-003',
        targetApplicationId: 'APP-001',
        relationshipType: 'consumes',
        status: 'inactive',
        criticality: 'low',
        dataFlow: 'unidirectional',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify(relationships));

    // Seed use cases
    const useCases = [
      {
        id: 'USE-001',
        title: 'Login Test',
        description: 'Test login.',
        applicationId: 'APP-001',
        status: 'completed',
        priority: 'high',
        category: 'functional',
        executionCount: 10,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'USE-002',
        title: 'Search Test',
        description: 'Test search.',
        applicationId: 'APP-002',
        status: 'active',
        priority: 'medium',
        category: 'functional',
        executionCount: 5,
        createdAt: '2026-02-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'USE-003',
        title: 'Draft Test',
        description: 'Draft.',
        applicationId: 'APP-003',
        status: 'draft',
        priority: 'low',
        category: 'regression',
        executionCount: 0,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify(useCases));

    // Seed users
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

    // Seed empty arrays for remaining entity types
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getScoreBand', () => {
    it('returns critical band for score 0', () => {
      const band = getScoreBand(0);
      expect(band).toBeDefined();
      expect(band.key).toBe('critical');
      expect(band.label).toBe('Critical');
      expect(typeof band.color).toBe('string');
      expect(band.color).toBe('#ef4444');
    });

    it('returns critical band for score 15', () => {
      const band = getScoreBand(15);
      expect(band).toBeDefined();
      expect(band.key).toBe('critical');
    });

    it('returns critical band for score 20', () => {
      const band = getScoreBand(20);
      expect(band).toBeDefined();
      expect(band.key).toBe('critical');
    });

    it('returns poor band for score 21', () => {
      const band = getScoreBand(21);
      expect(band).toBeDefined();
      expect(band.key).toBe('poor');
      expect(band.label).toBe('Poor');
      expect(band.color).toBe('#f97316');
    });

    it('returns poor band for score 40', () => {
      const band = getScoreBand(40);
      expect(band).toBeDefined();
      expect(band.key).toBe('poor');
    });

    it('returns fair band for score 41', () => {
      const band = getScoreBand(41);
      expect(band).toBeDefined();
      expect(band.key).toBe('fair');
      expect(band.label).toBe('Fair');
      expect(band.color).toBe('#f59e0b');
    });

    it('returns fair band for score 60', () => {
      const band = getScoreBand(60);
      expect(band).toBeDefined();
      expect(band.key).toBe('fair');
    });

    it('returns good band for score 61', () => {
      const band = getScoreBand(61);
      expect(band).toBeDefined();
      expect(band.key).toBe('good');
      expect(band.label).toBe('Good');
      expect(band.color).toBe('#22c55e');
    });

    it('returns good band for score 80', () => {
      const band = getScoreBand(80);
      expect(band).toBeDefined();
      expect(band.key).toBe('good');
    });

    it('returns excellent band for score 81', () => {
      const band = getScoreBand(81);
      expect(band).toBeDefined();
      expect(band.key).toBe('excellent');
      expect(band.label).toBe('Excellent');
      expect(band.color).toBe('#16a34a');
    });

    it('returns excellent band for score 100', () => {
      const band = getScoreBand(100);
      expect(band).toBeDefined();
      expect(band.key).toBe('excellent');
    });

    it('returns undefined for NaN', () => {
      const band = getScoreBand(NaN);
      expect(band).toBeUndefined();
    });

    it('returns undefined for non-number', () => {
      const band = getScoreBand('abc');
      expect(band).toBeUndefined();
    });

    it('returns undefined for null', () => {
      const band = getScoreBand(null);
      expect(band).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      const band = getScoreBand(undefined);
      expect(band).toBeUndefined();
    });

    it('clamps negative scores to 0 (critical)', () => {
      const band = getScoreBand(-10);
      expect(band).toBeDefined();
      expect(band.key).toBe('critical');
    });

    it('clamps scores above 100 to 100 (excellent)', () => {
      const band = getScoreBand(150);
      expect(band).toBeDefined();
      expect(band.key).toBe('excellent');
    });

    it('returns band with all expected properties', () => {
      const band = getScoreBand(50);
      expect(band).toBeDefined();
      expect(typeof band.key).toBe('string');
      expect(typeof band.label).toBe('string');
      expect(typeof band.min).toBe('number');
      expect(typeof band.max).toBe('number');
      expect(typeof band.color).toBe('string');
      expect(typeof band.bgColor).toBe('string');
      expect(typeof band.textColor).toBe('string');
    });
  });

  describe('computeMetrics', () => {
    describe('PORTFOLIO metrics', () => {
      it('returns success with portfolio metrics', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.success).toBe(true);
        expect(result.entityType).toBe('PORTFOLIO');
        expect(result.metrics).not.toBeNull();
        expect(result.error).toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.total).toBe(2);
      });

      it('returns correct active count', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.active).toBe(1);
      });

      it('returns correct planning count', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.planning).toBe(1);
      });

      it('returns correct average compliance score', () => {
        const result = computeMetrics('PORTFOLIO');
        // (80 + 60) / 2 = 70
        expect(result.metrics.averageComplianceScore).toBe(70);
      });

      it('returns compliance score band', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.complianceScoreBand).toBeDefined();
        expect(result.metrics.complianceScoreBand.key).toBe('good');
      });

      it('returns risk distribution', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.riskDistribution).toBeDefined();
        expect(result.metrics.riskDistribution.medium).toBe(1);
        expect(result.metrics.riskDistribution.high).toBe(1);
      });

      it('returns criticality distribution', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(result.metrics.criticalityDistribution).toBeDefined();
        expect(result.metrics.criticalityDistribution.high).toBe(1);
        expect(result.metrics.criticalityDistribution.critical).toBe(1);
      });

      it('returns apps per portfolio', () => {
        const result = computeMetrics('PORTFOLIO');
        expect(Array.isArray(result.metrics.appsPerPortfolio)).toBe(true);
        expect(result.metrics.appsPerPortfolio.length).toBe(2);
        const pf1 = result.metrics.appsPerPortfolio.find((p) => p.portfolioId === 'PF-001');
        expect(pf1.applicationCount).toBe(2);
        const pf2 = result.metrics.appsPerPortfolio.find((p) => p.portfolioId === 'PF-002');
        expect(pf2.applicationCount).toBe(1);
      });

      it('returns average apps per portfolio', () => {
        const result = computeMetrics('PORTFOLIO');
        // 3 apps / 2 portfolios = 1.5
        expect(result.metrics.averageAppsPerPortfolio).toBe(1.5);
      });
    });

    describe('APPLICATION metrics', () => {
      it('returns success with application metrics', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.success).toBe(true);
        expect(result.entityType).toBe('APPLICATION');
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct status distribution', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.metrics.statusDistribution.active).toBe(2);
        expect(result.metrics.statusDistribution.retiring).toBe(1);
      });

      it('returns correct risk distribution', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.metrics.riskDistribution.low).toBe(1);
        expect(result.metrics.riskDistribution.medium).toBe(1);
        expect(result.metrics.riskDistribution.critical).toBe(1);
      });

      it('returns correct average compliance score', () => {
        const result = computeMetrics('APPLICATION');
        // (85 + 70 + 40) / 3 = 65
        expect(result.metrics.averageComplianceScore).toBe(65);
      });

      it('returns min and max compliance scores', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.metrics.minComplianceScore).toBe(40);
        expect(result.metrics.maxComplianceScore).toBe(85);
      });

      it('returns correct high risk count', () => {
        const result = computeMetrics('APPLICATION');
        // APP-003 has critical risk
        expect(result.metrics.highRiskCount).toBe(1);
      });

      it('returns correct low compliance count', () => {
        const result = computeMetrics('APPLICATION');
        // APP-003 has complianceScore 40, which is not < 40
        expect(result.metrics.lowComplianceCount).toBe(0);
      });

      it('returns deployment model distribution', () => {
        const result = computeMetrics('APPLICATION');
        expect(result.metrics.deploymentModelDistribution.cloud).toBe(1);
        expect(result.metrics.deploymentModelDistribution.on_premise).toBe(1);
        expect(result.metrics.deploymentModelDistribution.hybrid).toBe(1);
      });

      it('returns average team size', () => {
        const result = computeMetrics('APPLICATION');
        // (12 + 8 + 15) / 3 ≈ 11.67
        expect(result.metrics.averageTeamSize).toBeCloseTo(11.67, 1);
      });
    });

    describe('TECH_STANDARD metrics', () => {
      it('returns success with tech standard metrics', () => {
        const result = computeMetrics('TECH_STANDARD');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('TECH_STANDARD');
        expect(result.metrics.total).toBe(4);
      });

      it('returns correct status counts', () => {
        const result = computeMetrics('TECH_STANDARD');
        expect(result.metrics.preferred).toBe(1);
        expect(result.metrics.recommended).toBe(1);
        expect(result.metrics.emerging).toBe(1);
        expect(result.metrics.retiring).toBe(1);
        expect(result.metrics.retired).toBe(0);
        expect(result.metrics.prohibited).toBe(0);
      });

      it('returns correct adoption rate', () => {
        const result = computeMetrics('TECH_STANDARD');
        // (preferred + recommended) / total = (1 + 1) / 4 = 50%
        expect(result.metrics.adoptionRate).toBe(50);
      });

      it('returns correct average adoption', () => {
        const result = computeMetrics('TECH_STANDARD');
        // (75 + 60 + 15 + 10) / 4 = 40
        expect(result.metrics.averageAdoption).toBe(40);
      });
    });

    describe('TECH_DEBT metrics', () => {
      it('returns success with tech debt metrics', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct open count', () => {
        const result = computeMetrics('TECH_DEBT');
        // TD-001 and TD-002 are open (not resolved)
        expect(result.metrics.open).toBe(2);
      });

      it('returns correct resolved count', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.resolved).toBe(1);
      });

      it('returns correct critical count', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.critical).toBe(1);
      });

      it('returns correct high count', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.high).toBe(1);
      });

      it('returns correct total estimated cost for open items', () => {
        const result = computeMetrics('TECH_DEBT');
        // TD-001: 50000, TD-002: 120000 (open items only)
        expect(result.metrics.totalEstimatedCost).toBe(170000);
      });

      it('returns correct resolution rate', () => {
        const result = computeMetrics('TECH_DEBT');
        // 1 resolved / 3 total = 33%
        expect(result.metrics.resolutionRate).toBe(33);
      });

      it('returns priority distribution', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.priorityDistribution.critical).toBe(1);
        expect(result.metrics.priorityDistribution.high).toBe(1);
        expect(result.metrics.priorityDistribution.low).toBe(1);
      });

      it('returns category distribution', () => {
        const result = computeMetrics('TECH_DEBT');
        expect(result.metrics.categoryDistribution.dependency).toBe(1);
        expect(result.metrics.categoryDistribution.infrastructure).toBe(1);
        expect(result.metrics.categoryDistribution.code_quality).toBe(1);
      });
    });

    describe('QUALITY_GATE metrics', () => {
      it('returns success with quality gate metrics', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.total).toBe(4);
      });

      it('returns correct passed count', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.passed).toBe(2);
      });

      it('returns correct failed count', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.failed).toBe(1);
      });

      it('returns correct not evaluated count', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.notEvaluated).toBe(1);
      });

      it('returns correct pass rate', () => {
        const result = computeMetrics('QUALITY_GATE');
        // 2 passed / 4 total = 50%
        expect(result.metrics.passRate).toBe(50);
      });

      it('returns correct average score', () => {
        const result = computeMetrics('QUALITY_GATE');
        // (82 + 45 + 90) / 3 = 72.33 (null score excluded)
        expect(result.metrics.averageScore).toBeCloseTo(72.33, 1);
      });

      it('returns average score band', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.averageScoreBand).toBeDefined();
        expect(result.metrics.averageScoreBand.key).toBe('good');
      });

      it('returns correct blocking gates count', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.blockingGates).toBe(2);
      });

      it('returns correct blocking failed count', () => {
        const result = computeMetrics('QUALITY_GATE');
        // QG-002 is blocking and failed
        expect(result.metrics.blockingFailed).toBe(1);
      });

      it('returns type distribution', () => {
        const result = computeMetrics('QUALITY_GATE');
        expect(result.metrics.typeDistribution.code_quality).toBe(1);
        expect(result.metrics.typeDistribution.security).toBe(1);
        expect(result.metrics.typeDistribution.performance).toBe(1);
        expect(result.metrics.typeDistribution.compliance).toBe(1);
      });
    });

    describe('ENVIRONMENT metrics', () => {
      it('returns success with environment metrics', () => {
        const result = computeMetrics('ENVIRONMENT');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('ENVIRONMENT');
        expect(result.metrics.total).toBe(4);
      });

      it('returns correct healthy count', () => {
        const result = computeMetrics('ENVIRONMENT');
        expect(result.metrics.healthy).toBe(2);
      });

      it('returns correct degraded count', () => {
        const result = computeMetrics('ENVIRONMENT');
        expect(result.metrics.degraded).toBe(1);
      });

      it('returns correct down count', () => {
        const result = computeMetrics('ENVIRONMENT');
        expect(result.metrics.down).toBe(1);
      });

      it('returns correct health rate', () => {
        const result = computeMetrics('ENVIRONMENT');
        // 2 healthy / 4 total = 50%
        expect(result.metrics.healthRate).toBe(50);
      });
    });

    describe('INTEGRATION metrics', () => {
      it('returns success with integration metrics', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.metrics.total).toBe(4);
      });

      it('returns correct active count', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.metrics.active).toBe(2);
      });

      it('returns correct error count', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.metrics.error).toBe(1);
      });

      it('returns correct inactive count', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.metrics.inactive).toBe(1);
      });

      it('returns correct average health score', () => {
        const result = computeMetrics('INTEGRATION');
        // (90 + 85 + 20 + 50) / 4 = 61.25
        expect(result.metrics.averageHealthScore).toBe(61.25);
      });

      it('returns average health score band', () => {
        const result = computeMetrics('INTEGRATION');
        expect(result.metrics.averageHealthScoreBand).toBeDefined();
        expect(result.metrics.averageHealthScoreBand.key).toBe('good');
      });
    });

    describe('NOTIFICATION metrics', () => {
      it('returns success with notification metrics', () => {
        const result = computeMetrics('NOTIFICATION');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('NOTIFICATION');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct read count', () => {
        const result = computeMetrics('NOTIFICATION');
        expect(result.metrics.read).toBe(1);
      });

      it('returns correct unread count', () => {
        const result = computeMetrics('NOTIFICATION');
        expect(result.metrics.unread).toBe(2);
      });

      it('returns type distribution', () => {
        const result = computeMetrics('NOTIFICATION');
        expect(result.metrics.typeDistribution.warning).toBe(1);
        expect(result.metrics.typeDistribution.error).toBe(1);
        expect(result.metrics.typeDistribution.info).toBe(1);
      });
    });

    describe('AI_ANALYSIS metrics', () => {
      it('returns success with AI analysis metrics', () => {
        const result = computeMetrics('AI_ANALYSIS');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('AI_ANALYSIS');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct completed count', () => {
        const result = computeMetrics('AI_ANALYSIS');
        expect(result.metrics.completed).toBe(2);
      });

      it('returns correct failed count', () => {
        const result = computeMetrics('AI_ANALYSIS');
        expect(result.metrics.failed).toBe(1);
      });

      it('returns correct average confidence score', () => {
        const result = computeMetrics('AI_ANALYSIS');
        // (85 + 90) / 2 = 87.5 (null excluded)
        expect(result.metrics.averageConfidenceScore).toBe(87.5);
      });

      it('returns correct total recommendations', () => {
        const result = computeMetrics('AI_ANALYSIS');
        // AI-001: 1, AI-002: 2, AI-003: 0 = 3
        expect(result.metrics.totalRecommendations).toBe(3);
      });

      it('returns feature type distribution', () => {
        const result = computeMetrics('AI_ANALYSIS');
        expect(result.metrics.featureTypeDistribution.risk_assessment).toBe(1);
        expect(result.metrics.featureTypeDistribution.tech_radar_analysis).toBe(1);
        expect(result.metrics.featureTypeDistribution.lifecycle_prediction).toBe(1);
      });
    });

    describe('EVIDENCE metrics', () => {
      it('returns success with evidence metrics', () => {
        const result = computeMetrics('EVIDENCE');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('EVIDENCE');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct valid count', () => {
        const result = computeMetrics('EVIDENCE');
        expect(result.metrics.valid).toBe(2);
      });

      it('returns correct expired count', () => {
        const result = computeMetrics('EVIDENCE');
        expect(result.metrics.expired).toBe(1);
      });
    });

    describe('RELATIONSHIP metrics', () => {
      it('returns success with relationship metrics', () => {
        const result = computeMetrics('RELATIONSHIP');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('RELATIONSHIP');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct active count', () => {
        const result = computeMetrics('RELATIONSHIP');
        expect(result.metrics.active).toBe(2);
      });

      it('returns correct critical count', () => {
        const result = computeMetrics('RELATIONSHIP');
        // REL-001 is high, REL-002 is critical
        expect(result.metrics.critical).toBe(2);
      });
    });

    describe('USE_CASE metrics', () => {
      it('returns success with use case metrics', () => {
        const result = computeMetrics('USE_CASE');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('USE_CASE');
        expect(result.metrics.total).toBe(3);
      });

      it('returns correct completed count', () => {
        const result = computeMetrics('USE_CASE');
        expect(result.metrics.completed).toBe(1);
      });

      it('returns correct completion rate', () => {
        const result = computeMetrics('USE_CASE');
        // 1 completed / 3 total = 33%
        expect(result.metrics.completionRate).toBe(33);
      });

      it('returns correct total executions', () => {
        const result = computeMetrics('USE_CASE');
        // 10 + 5 + 0 = 15
        expect(result.metrics.totalExecutions).toBe(15);
      });

      it('returns correct average executions', () => {
        const result = computeMetrics('USE_CASE');
        // (10 + 5 + 0) / 3 = 5
        expect(result.metrics.averageExecutions).toBe(5);
      });
    });

    describe('TECH_ENTRY metrics', () => {
      it('returns success with tech entry metrics', () => {
        const result = computeMetrics('TECH_ENTRY');
        expect(result.success).toBe(true);
        expect(result.metrics).not.toBeNull();
      });

      it('returns correct total count', () => {
        const result = computeMetrics('TECH_ENTRY');
        expect(result.metrics.total).toBe(4);
      });

      it('returns correct compliant count', () => {
        const result = computeMetrics('TECH_ENTRY');
        expect(result.metrics.compliant).toBe(2);
      });

      it('returns correct non-compliant count', () => {
        const result = computeMetrics('TECH_ENTRY');
        expect(result.metrics.nonCompliant).toBe(1);
      });

      it('returns correct partially compliant count', () => {
        const result = computeMetrics('TECH_ENTRY');
        expect(result.metrics.partiallyCompliant).toBe(1);
      });

      it('returns correct compliance rate', () => {
        const result = computeMetrics('TECH_ENTRY');
        // 2 compliant / 4 total = 50%
        expect(result.metrics.complianceRate).toBe(50);
      });
    });

    describe('scope filtering', () => {
      it('filters applications by portfolioId', () => {
        const result = computeMetrics('APPLICATION', { portfolioId: 'PF-001' });
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(2);
      });

      it('filters applications by applicationId', () => {
        const result = computeMetrics('APPLICATION', { applicationId: 'APP-001' });
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(1);
      });

      it('filters portfolios by portfolioId', () => {
        const result = computeMetrics('PORTFOLIO', { portfolioId: 'PF-001' });
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(1);
      });

      it('filters tech debt by applicationId', () => {
        const result = computeMetrics('TECH_DEBT', { applicationId: 'APP-001' });
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(2);
      });

      it('filters quality gates by applicationId', () => {
        const result = computeMetrics('QUALITY_GATE', { applicationId: 'APP-001' });
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(2);
      });

      it('filters environments by portfolioId', () => {
        const result = computeMetrics('ENVIRONMENT', { portfolioId: 'PF-001' });
        expect(result.success).toBe(true);
        // APP-001 and APP-002 belong to PF-001; ENV-001, ENV-002, ENV-003
        expect(result.metrics.total).toBe(3);
      });
    });

    describe('error handling', () => {
      it('returns error for empty entity type', () => {
        const result = computeMetrics('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
      });

      it('returns error for unknown entity type', () => {
        const result = computeMetrics('UNKNOWN_TYPE');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown entity type');
      });

      it('returns error for null entity type', () => {
        const result = computeMetrics(null);
        expect(result.success).toBe(false);
      });

      it('handles empty data gracefully', () => {
        localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
        const result = computeMetrics('PORTFOLIO');
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(0);
        expect(result.metrics.averageComplianceScore).toBe(0);
      });

      it('handles missing localStorage key gracefully', () => {
        localStorage.removeItem(STORAGE_KEYS.PORTFOLIOS);
        const result = computeMetrics('PORTFOLIO');
        expect(result.success).toBe(true);
        expect(result.metrics.total).toBe(0);
      });

      it('is case-insensitive for entity type', () => {
        const result = computeMetrics('portfolio');
        expect(result.success).toBe(true);
        expect(result.entityType).toBe('PORTFOLIO');
        expect(result.metrics.total).toBe(2);
      });
    });
  });

  describe('computeDashboardMetrics', () => {
    it('returns success with dashboard metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.success).toBe(true);
      expect(result.metrics).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it('returns overall health score', () => {
      const result = computeDashboardMetrics(null);
      expect(typeof result.metrics.overallHealthScore).toBe('number');
      expect(result.metrics.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.overallHealthScore).toBeLessThanOrEqual(100);
    });

    it('returns overall health score band', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.overallHealthScoreBand).toBeDefined();
      expect(typeof result.metrics.overallHealthScoreBand.key).toBe('string');
    });

    it('returns overall compliance score', () => {
      const result = computeDashboardMetrics(null);
      // (85 + 70 + 40) / 3 = 65
      expect(result.metrics.overallComplianceScore).toBe(65);
    });

    it('returns overall compliance score band', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.overallComplianceScoreBand).toBeDefined();
      expect(result.metrics.overallComplianceScoreBand.key).toBe('good');
    });

    it('returns correct entity counts', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalPortfolios).toBe(2);
      expect(result.metrics.totalApplications).toBe(3);
      expect(result.metrics.totalStandards).toBe(4);
      expect(result.metrics.totalTechEntries).toBe(4);
      expect(result.metrics.totalEnvironments).toBe(4);
      expect(result.metrics.totalIntegrations).toBe(4);
    });

    it('returns risk distribution', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.riskDistribution).toBeDefined();
      expect(result.metrics.riskDistribution.low).toBe(1);
      expect(result.metrics.riskDistribution.medium).toBe(1);
      expect(result.metrics.riskDistribution.critical).toBe(1);
    });

    it('returns correct high risk applications count', () => {
      const result = computeDashboardMetrics(null);
      // APP-003 has critical risk
      expect(result.metrics.highRiskApplications).toBe(1);
    });

    it('returns correct tech debt metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.openTechDebt).toBe(2);
      expect(result.metrics.criticalTechDebt).toBe(1);
      expect(result.metrics.totalDebtCost).toBe(170000);
    });

    it('returns correct tech debt resolution rate', () => {
      const result = computeDashboardMetrics(null);
      // 1 resolved / 3 total = 33%
      expect(result.metrics.techDebtResolutionRate).toBe(33);
    });

    it('returns correct quality gate metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.qualityGatePassRate).toBe(50);
      expect(result.metrics.passedGates).toBe(2);
      expect(result.metrics.failedGates).toBe(1);
      expect(result.metrics.totalQualityGates).toBe(4);
    });

    it('returns correct standard metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.preferredStandards).toBe(1);
      expect(result.metrics.recommendedStandards).toBe(1);
      expect(result.metrics.retiringStandards).toBe(1);
      expect(result.metrics.standardAdoptionRate).toBe(50);
    });

    it('returns correct tech entry compliance rate', () => {
      const result = computeDashboardMetrics(null);
      // 2 compliant / 4 total = 50%
      expect(result.metrics.techEntryComplianceRate).toBe(50);
      expect(result.metrics.compliantEntries).toBe(2);
      expect(result.metrics.totalTechEntriesCount).toBe(4);
    });

    it('returns correct approval metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.pendingApprovals).toBe(1);
    });

    it('returns correct waiver metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.activeWaivers).toBe(1);
      expect(result.metrics.expiringWaivers).toBe(1);
    });

    it('returns correct environment health metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.environmentHealthRate).toBe(50);
      expect(result.metrics.healthyEnvironments).toBe(2);
      expect(result.metrics.totalEnvironmentsCount).toBe(4);
    });

    it('returns correct integration health metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.activeIntegrations).toBe(2);
      expect(result.metrics.errorIntegrations).toBe(1);
      expect(result.metrics.averageIntegrationHealth).toBe(61.25);
      expect(result.metrics.averageIntegrationHealthBand).toBeDefined();
    });

    it('returns correct AI analysis metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalAIAnalyses).toBe(3);
      expect(result.metrics.completedAnalyses).toBe(2);
      expect(result.metrics.averageAIConfidence).toBe(87.5);
    });

    it('returns correct evidence metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalEvidence).toBe(3);
      expect(result.metrics.validEvidence).toBe(2);
    });

    it('returns correct relationship metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalRelationships).toBe(3);
      expect(result.metrics.activeRelationships).toBe(2);
      expect(result.metrics.criticalRelationships).toBe(2);
    });

    it('returns correct use case metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalUseCases).toBe(3);
      expect(result.metrics.completedUseCases).toBe(1);
      expect(result.metrics.useCaseCompletionRate).toBe(33);
    });

    it('returns correct governance metrics', () => {
      const result = computeDashboardMetrics(null);
      expect(result.metrics.totalGovernanceRecords).toBe(3);
      expect(result.metrics.approvedGovernanceRecords).toBe(1);
    });

    it('returns notification metrics scoped to active persona', () => {
      const result = computeDashboardMetrics({ id: 'persona-platform-administrator', accessLevel: 'admin' });
      expect(typeof result.metrics.unreadNotifications).toBe('number');
      expect(typeof result.metrics.totalNotifications).toBe('number');
      // Admin has NOT-001 (unread) and NOT-002 (read) = 2 total, 1 unread
      expect(result.metrics.unreadNotifications).toBe(1);
      expect(result.metrics.totalNotifications).toBe(2);
    });

    it('returns different notification counts for different personas', () => {
      const adminResult = computeDashboardMetrics({ id: 'persona-platform-administrator', accessLevel: 'admin' });
      const qeResult = computeDashboardMetrics({ id: 'persona-quality-engineer', accessLevel: 'contributor' });

      expect(adminResult.metrics.totalNotifications).toBe(2);
      expect(qeResult.metrics.totalNotifications).toBe(1);
    });

    it('includes persona context in metrics', () => {
      const result = computeDashboardMetrics({ id: 'persona-platform-administrator', name: 'Platform Administrator', accessLevel: 'admin' });
      expect(result.metrics.personaId).toBe('persona-platform-administrator');
      expect(result.metrics.personaName).toBe('Platform Administrator');
      expect(result.metrics.accessLevel).toBe('admin');
    });

    it('accepts persona ID string', () => {
      const result = computeDashboardMetrics('persona-platform-administrator');
      expect(result.success).toBe(true);
      expect(result.metrics).not.toBeNull();
      expect(result.metrics.personaId).toBe('persona-platform-administrator');
    });

    it('handles null persona gracefully', () => {
      const result = computeDashboardMetrics(null);
      expect(result.success).toBe(true);
      expect(result.metrics).not.toBeNull();
    });

    it('handles empty data gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));

      const result = computeDashboardMetrics(null);
      expect(result.success).toBe(true);
      expect(result.metrics.totalPortfolios).toBe(0);
      expect(result.metrics.totalApplications).toBe(0);
      expect(result.metrics.overallComplianceScore).toBe(0);
      expect(result.metrics.qualityGatePassRate).toBe(0);
      expect(result.metrics.techDebtResolutionRate).toBe(0);
      expect(result.metrics.environmentHealthRate).toBe(0);
      expect(result.metrics.overallHealthScore).toBe(0);
    });
  });

  describe('computeTrends', () => {
    describe('compliance trend', () => {
      it('returns success with compliance trend data', () => {
        const result = computeTrends('compliance');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('compliance');
        expect(result.trendData).not.toBeNull();
        expect(result.error).toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('compliance');
        expect(Array.isArray(result.trendData)).toBe(true);
        expect(result.trendData.length).toBe(12);
      });

      it('returns trend data with month and value fields', () => {
        const result = computeTrends('compliance');
        result.trendData.forEach((point) => {
          expect(typeof point.month).toBe('string');
          expect(point.month).toMatch(/^\d{4}-\d{2}$/);
          expect(typeof point.value).toBe('number');
          expect(Number.isNaN(point.value)).toBe(false);
        });
      });

      it('returns trend data in chronological order', () => {
        const result = computeTrends('compliance');
        for (let i = 1; i < result.trendData.length; i++) {
          expect(result.trendData[i].month >= result.trendData[i - 1].month).toBe(true);
        }
      });

      it('returns values within reasonable bounds', () => {
        const result = computeTrends('compliance');
        result.trendData.forEach((point) => {
          expect(point.value).toBeGreaterThanOrEqual(0);
          expect(point.value).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('qualityGates trend', () => {
      it('returns success with quality gates trend data', () => {
        const result = computeTrends('qualityGates');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('qualitygates');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('qualityGates');
        expect(result.trendData.length).toBe(12);
      });

      it('returns trend data with month and value fields', () => {
        const result = computeTrends('qualityGates');
        result.trendData.forEach((point) => {
          expect(typeof point.month).toBe('string');
          expect(typeof point.value).toBe('number');
        });
      });
    });

    describe('techDebt trend', () => {
      it('returns success with tech debt trend data', () => {
        const result = computeTrends('techDebt');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('techdebt');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('techDebt');
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('standardAdoption trend', () => {
      it('returns success with standard adoption trend data', () => {
        const result = computeTrends('standardAdoption');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('standardadoption');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('standardAdoption');
        expect(result.trendData.length).toBe(12);
      });

      it('extracts trend data from tech standard metadata', () => {
        const result = computeTrends('standardAdoption');
        // TS-001 has trend series in metadata
        expect(result.trendData.length).toBe(12);
        result.trendData.forEach((point) => {
          expect(typeof point.value).toBe('number');
        });
      });
    });

    describe('risk trend', () => {
      it('returns success with risk trend data', () => {
        const result = computeTrends('risk');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('risk');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('risk');
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('integrationHealth trend', () => {
      it('returns success with integration health trend data', () => {
        const result = computeTrends('integrationHealth');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('integrationhealth');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('integrationHealth');
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('environmentHealth trend', () => {
      it('returns success with environment health trend data', () => {
        const result = computeTrends('environmentHealth');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('environmenthealth');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('environmentHealth');
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('techEntryCompliance trend', () => {
      it('returns success with tech entry compliance trend data', () => {
        const result = computeTrends('techEntryCompliance');
        expect(result.success).toBe(true);
        expect(result.metricType).toBe('techentrycompliance');
        expect(result.trendData).not.toBeNull();
      });

      it('returns 12-point trend series', () => {
        const result = computeTrends('techEntryCompliance');
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('custom months parameter', () => {
      it('returns 6-point trend series when months=6', () => {
        const result = computeTrends('compliance', 6);
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBeLessThanOrEqual(12);
      });

      it('caps at 36 months', () => {
        const result = computeTrends('techDebt', 100);
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBeLessThanOrEqual(36);
      });

      it('defaults to 12 months for invalid months', () => {
        const result = computeTrends('compliance', -5);
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('error handling', () => {
      it('returns error for empty metric type', () => {
        const result = computeTrends('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
      });

      it('returns error for null metric type', () => {
        const result = computeTrends(null);
        expect(result.success).toBe(false);
      });

      it('returns error for unknown metric type', () => {
        const result = computeTrends('unknownMetric');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown metric type');
      });

      it('handles empty data gracefully for compliance', () => {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
        const result = computeTrends('compliance');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
        result.trendData.forEach((point) => {
          expect(point.value).toBe(0);
        });
      });

      it('handles empty data gracefully for qualityGates', () => {
        localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
        const result = computeTrends('qualityGates');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
        result.trendData.forEach((point) => {
          expect(point.value).toBe(0);
        });
      });

      it('handles empty data gracefully for techDebt', () => {
        localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
        const result = computeTrends('techDebt');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
      });

      it('handles missing localStorage key gracefully', () => {
        localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
        const result = computeTrends('compliance');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
      });
    });

    describe('trend data from metadata', () => {
      it('extracts and aggregates trend series from application metadata', () => {
        const result = computeTrends('compliance');
        expect(result.success).toBe(true);
        // APP-001 and APP-002 have trend series; APP-003 does not
        // The aggregated values should be averages of the two series
        expect(result.trendData.length).toBe(12);
        // First point: (75 + 60) / 2 = 67.5
        expect(result.trendData[0].value).toBeCloseTo(67.5, 0);
      });

      it('extracts trend series from quality gate results', () => {
        const result = computeTrends('qualityGates');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
        // QG-001 and QG-002 have trend series
        // First point: (70 + 40) / 2 = 55
        expect(result.trendData[0].value).toBeCloseTo(55, 0);
      });

      it('falls back to synthesized trend when no metadata available', () => {
        // Remove all metadata from applications
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        apps.forEach((app) => {
          app.metadata = {};
        });
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

        const result = computeTrends('compliance');
        expect(result.success).toBe(true);
        expect(result.trendData.length).toBe(12);
        // All points should have the same value (current average)
        const firstValue = result.trendData[0].value;
        result.trendData.forEach((point) => {
          expect(point.value).toBe(firstValue);
        });
      });
    });
  });

  describe('cross-cutting concerns', () => {
    it('computeMetrics and computeDashboardMetrics return consistent data', () => {
      const appMetrics = computeMetrics('APPLICATION');
      const dashboardMetrics = computeDashboardMetrics(null);

      expect(appMetrics.metrics.total).toBe(dashboardMetrics.metrics.totalApplications);
      expect(appMetrics.metrics.averageComplianceScore).toBe(dashboardMetrics.metrics.overallComplianceScore);
    });

    it('computeMetrics and computeDashboardMetrics return consistent quality gate data', () => {
      const qgMetrics = computeMetrics('QUALITY_GATE');
      const dashboardMetrics = computeDashboardMetrics(null);

      expect(qgMetrics.metrics.total).toBe(dashboardMetrics.metrics.totalQualityGates);
      expect(qgMetrics.metrics.passed).toBe(dashboardMetrics.metrics.passedGates);
      expect(qgMetrics.metrics.failed).toBe(dashboardMetrics.metrics.failedGates);
      expect(qgMetrics.metrics.passRate).toBe(dashboardMetrics.metrics.qualityGatePassRate);
    });

    it('computeMetrics and computeDashboardMetrics return consistent tech debt data', () => {
      const debtMetrics = computeMetrics('TECH_DEBT');
      const dashboardMetrics = computeDashboardMetrics(null);

      expect(debtMetrics.metrics.open).toBe(dashboardMetrics.metrics.openTechDebt);
      expect(debtMetrics.metrics.critical).toBe(dashboardMetrics.metrics.criticalTechDebt);
      expect(debtMetrics.metrics.totalEstimatedCost).toBe(dashboardMetrics.metrics.totalDebtCost);
      expect(debtMetrics.metrics.resolutionRate).toBe(dashboardMetrics.metrics.techDebtResolutionRate);
    });

    it('all trend types return valid 12-point series', () => {
      const trendTypes = [
        'compliance',
        'risk',
        'techDebt',
        'qualityGates',
        'standardAdoption',
        'integrationHealth',
        'environmentHealth',
        'techEntryCompliance',
      ];

      trendTypes.forEach((trendType) => {
        const result = computeTrends(trendType);
        expect(result.success).toBe(true);
        expect(Array.isArray(result.trendData)).toBe(true);
        expect(result.trendData.length).toBe(12);
        result.trendData.forEach((point) => {
          expect(typeof point.month).toBe('string');
          expect(typeof point.value).toBe('number');
          expect(Number.isNaN(point.value)).toBe(false);
        });
      });
    });
  });
});