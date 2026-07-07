import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAIInsight,
  askKpetsip,
  listAIInsights,
  listAllAIInsights,
  getAIInsightById,
  getAIInsightSummary,
  getAIInsightsByFeatureType,
  getAIInsightsByApplicationId,
  getAIInsightsByPortfolioId,
  getAvailableFeatureTypes,
} from './aiInsightService';
import { STORAGE_KEYS, AI_FEATURE_TYPES } from '../constants/constants';

describe('aiInsightService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set active persona to admin for permission checks
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));

    // Seed applications for AI insight context
    const applications = [
      {
        id: 'APP-001',
        name: 'Customer Portal',
        description: 'Enterprise customer portal.',
        portfolioId: 'PF-001',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        criticality: 'high',
        technologyStack: ['React', 'Node.js', 'PostgreSQL'],
        complianceScore: 72,
        riskLevel: 'medium',
        deploymentModel: 'cloud',
        businessDomain: 'Retail Banking',
        teamSize: 12,
        tags: ['critical', 'cloud-native'],
        metadata: {},
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'APP-002',
        name: 'Order Management System',
        description: 'Order management application.',
        portfolioId: 'PF-001',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        criticality: 'medium',
        technologyStack: ['Angular', 'Java', 'Oracle'],
        complianceScore: 85,
        riskLevel: 'low',
        deploymentModel: 'on_premise',
        businessDomain: 'Commercial Lending',
        teamSize: 8,
        tags: ['legacy'],
        metadata: {},
        createdAt: '2025-03-15T08:00:00.000Z',
        updatedAt: '2026-06-20T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'APP-003',
        name: 'Payment Gateway',
        description: 'Payment processing gateway.',
        portfolioId: 'PF-002',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        criticality: 'critical',
        technologyStack: ['Java', 'Kafka', 'PostgreSQL'],
        complianceScore: 35,
        riskLevel: 'critical',
        deploymentModel: 'hybrid',
        businessDomain: 'Payment Processing',
        teamSize: 15,
        tags: ['security', 'compliance'],
        metadata: {},
        createdAt: '2024-11-01T08:00:00.000Z',
        updatedAt: '2026-06-25T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

    // Seed portfolios
    const portfolios = [
      {
        id: 'PF-001',
        name: 'Digital Banking',
        description: 'Digital banking portfolio.',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        businessUnit: 'Retail Banking',
        criticality: 'high',
        applicationCount: 2,
        complianceScore: 78,
        riskLevel: 'medium',
        tags: ['critical'],
        metadata: {},
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'PF-002',
        name: 'Financial Operations',
        description: 'Financial operations portfolio.',
        owner: 'Admin User',
        ownerId: 'USR-001',
        status: 'active',
        businessUnit: 'Corporate Finance',
        criticality: 'critical',
        applicationCount: 1,
        complianceScore: 55,
        riskLevel: 'high',
        tags: ['compliance'],
        metadata: {},
        createdAt: '2025-02-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));

    // Seed tech standards
    const techStandards = [
      {
        id: 'TS-001',
        name: 'React 18.x Frontend Framework',
        categoryId: 'TC-001',
        status: 'preferred',
        effectiveDate: '2025-01-01',
        owner: 'Admin User',
        adoptionPercentage: 75,
        complianceLevel: 'mandatory',
        riskLevel: 'low',
        tags: [],
        metadata: {},
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-002',
        name: 'Node.js 20 LTS Runtime',
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
        tags: ['legacy'],
        metadata: {},
        createdAt: '2020-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-004',
        name: 'Deprecated SOAP',
        categoryId: 'TC-003',
        status: 'retired',
        effectiveDate: '2018-01-01',
        owner: 'Admin User',
        adoptionPercentage: 5,
        complianceLevel: 'informational',
        riskLevel: 'critical',
        tags: ['deprecated'],
        metadata: {},
        createdAt: '2018-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'TS-005',
        name: 'GraphQL API Standard',
        categoryId: 'TC-003',
        status: 'emerging',
        effectiveDate: '2026-01-01',
        owner: 'Admin User',
        adoptionPercentage: 10,
        complianceLevel: 'optional',
        riskLevel: 'low',
        tags: ['api'],
        metadata: {},
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify(techStandards));

    // Seed tech debt
    const techDebt = [
      {
        id: 'TD-001',
        title: 'Upgrade legacy jQuery',
        description: 'Need to upgrade legacy jQuery.',
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
        title: 'Migrate from Oracle 12c',
        description: 'Database migration needed.',
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
        title: 'Resolved debt item',
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
        results: {},
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
        results: {},
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
        results: {},
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify(qualityGates));

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
    ];
    localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify(techEntries));

    // Seed waivers
    const waivers = [
      {
        id: 'WAV-001',
        title: 'Legacy jQuery Waiver',
        standardId: 'TS-003',
        applicationId: 'APP-002',
        status: 'approved',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        riskLevel: 'medium',
        justification: 'Migration planned for next quarter.',
        effectiveDate: '2026-01-01',
        expirationDate: '2026-12-31',
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
        version: 1,
      },
      {
        id: 'WAV-002',
        title: 'Expired Waiver',
        standardId: 'TS-004',
        applicationId: 'APP-003',
        status: 'expired',
        requesterId: 'USR-001',
        requesterName: 'Admin User',
        riskLevel: 'high',
        justification: 'Temporary exception.',
        effectiveDate: '2025-01-01',
        expirationDate: '2025-12-31',
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
        version: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify(waivers));

    // Seed tech categories
    localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([
      { id: 'TC-001', name: 'Frontend Frameworks', status: 'active', createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2026-06-28T10:00:00.000Z', version: 1 },
      { id: 'TC-002', name: 'Backend Runtimes', status: 'active', createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2026-06-28T10:00:00.000Z', version: 1 },
      { id: 'TC-003', name: 'API Standards', status: 'active', createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2026-06-28T10:00:00.000Z', version: 1 },
    ]));

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

    // Seed empty arrays for other entity types referenced by AI insight generators
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getAvailableFeatureTypes', () => {
    it('returns all 13 AI feature types', () => {
      const featureTypes = getAvailableFeatureTypes();
      expect(Array.isArray(featureTypes)).toBe(true);
      expect(featureTypes.length).toBe(13);
    });

    it('returns feature types with key and label properties', () => {
      const featureTypes = getAvailableFeatureTypes();
      featureTypes.forEach((ft) => {
        expect(typeof ft.key).toBe('string');
        expect(ft.key.length).toBeGreaterThan(0);
        expect(typeof ft.label).toBe('string');
        expect(ft.label.length).toBeGreaterThan(0);
      });
    });

    it('includes all expected feature type keys', () => {
      const featureTypes = getAvailableFeatureTypes();
      const keys = featureTypes.map((ft) => ft.key);
      const expectedKeys = Object.values(AI_FEATURE_TYPES);
      expectedKeys.forEach((key) => {
        expect(keys).toContain(key);
      });
    });
  });

  describe('getAIInsight', () => {
    describe('all 13 feature types', () => {
      const allFeatureTypes = Object.values(AI_FEATURE_TYPES);

      allFeatureTypes.forEach((featureType) => {
        it(`generates a simulated insight for feature type: ${featureType}`, () => {
          const result = getAIInsight(featureType, {});
          expect(result.success).toBe(true);
          expect(result.simulated).toBe(true);
          expect(result.data).not.toBeNull();
          expect(result.data.featureType).toBe(featureType);
          expect(result.data.status).toBe('completed');
          expect(result.data.simulated).toBe(true);
          expect(typeof result.data.id).toBe('string');
          expect(result.data.id.startsWith('AI-')).toBe(true);
          expect(typeof result.data.title).toBe('string');
          expect(result.data.title.length).toBeGreaterThan(0);
          expect(typeof result.data.description).toBe('string');
          expect(result.data.description.length).toBeGreaterThan(0);
          expect(result.data.results).toBeDefined();
          expect(result.data.results.simulated).toBe(true);
        });
      });

      allFeatureTypes.forEach((featureType) => {
        it(`generates recommendations for feature type: ${featureType}`, () => {
          const result = getAIInsight(featureType, {});
          expect(result.success).toBe(true);
          expect(Array.isArray(result.data.recommendations)).toBe(true);
          expect(result.data.recommendations.length).toBeGreaterThan(0);
          result.data.recommendations.forEach((rec) => {
            expect(typeof rec.id).toBe('string');
            expect(typeof rec.title).toBe('string');
            expect(typeof rec.description).toBe('string');
            expect(typeof rec.priority).toBe('string');
            expect(rec.simulated).toBe(true);
          });
        });
      });

      allFeatureTypes.forEach((featureType) => {
        it(`generates a confidence score for feature type: ${featureType}`, () => {
          const result = getAIInsight(featureType, {});
          expect(result.success).toBe(true);
          expect(typeof result.data.confidenceScore).toBe('number');
          expect(result.data.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(result.data.confidenceScore).toBeLessThanOrEqual(100);
        });
      });

      allFeatureTypes.forEach((featureType) => {
        it(`persists the insight to localStorage for feature type: ${featureType}`, () => {
          const beforeCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES)).length;
          getAIInsight(featureType, {});
          const afterCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES)).length;
          expect(afterCount).toBe(beforeCount + 1);
        });
      });

      allFeatureTypes.forEach((featureType) => {
        it(`creates an audit log entry for feature type: ${featureType}`, () => {
          getAIInsight(featureType, {});
          const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
          const aiLog = auditLogs.find(
            (log) => log.action === 'execute' && log.entityType === 'AI_ANALYSIS'
          );
          expect(aiLog).toBeDefined();
          expect(aiLog.status).toBe('success');
          expect(aiLog.details).toContain('simulated');
        });
      });
    });

    describe('tech_radar_analysis', () => {
      it('returns summary with standard counts', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
        expect(result.success).toBe(true);
        expect(result.data.results.summary).toBeDefined();
        expect(typeof result.data.results.summary).toBe('string');
        expect(result.data.results.summary.length).toBeGreaterThan(0);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalStandards).toBe('number');
        expect(result.data.results.metrics.totalStandards).toBe(5);
      });

      it('includes status distribution in metrics', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
        expect(result.data.results.metrics.statusDistribution).toBeDefined();
        expect(typeof result.data.results.metrics.statusDistribution).toBe('object');
      });

      it('includes adoption rate in metrics', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
        expect(typeof result.data.results.metrics.adoptionRate).toBe('number');
        expect(result.data.results.metrics.adoptionRate).toBeGreaterThanOrEqual(0);
        expect(result.data.results.metrics.adoptionRate).toBeLessThanOrEqual(100);
      });
    });

    describe('risk_assessment', () => {
      it('returns risk metrics from seeded data', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.overallRiskScore).toBe('number');
        expect(typeof result.data.results.metrics.highRiskApplications).toBe('number');
        expect(typeof result.data.results.metrics.openTechDebtItems).toBe('number');
        expect(typeof result.data.results.metrics.failedQualityGates).toBe('number');
        expect(typeof result.data.results.metrics.totalApplications).toBe('number');
      });

      it('correctly counts high risk applications', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        // APP-003 has riskLevel 'critical'
        expect(result.data.results.metrics.highRiskApplications).toBeGreaterThanOrEqual(1);
      });

      it('correctly counts open tech debt items', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        // TD-001 and TD-002 are open (not resolved)
        expect(result.data.results.metrics.openTechDebtItems).toBe(2);
      });

      it('correctly counts failed quality gates', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        // QG-002 is failed
        expect(result.data.results.metrics.failedQualityGates).toBe(1);
      });
    });

    describe('lifecycle_prediction', () => {
      it('returns lifecycle prediction with application context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.LIFECYCLE_PREDICTION, {
          applicationId: 'APP-001',
        });
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(result.data.results.metrics.applicationName).toBe('Customer Portal');
        expect(result.data.results.metrics.currentStatus).toBe('active');
        expect(typeof result.data.results.metrics.predictedTransitionMonths).toBe('number');
        expect(typeof result.data.results.metrics.riskScore).toBe('number');
      });

      it('works without applicationId context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.LIFECYCLE_PREDICTION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.applicationName).toBe('string');
      });
    });

    describe('dependency_analysis', () => {
      it('returns dependency metrics from seeded relationships', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEPENDENCY_ANALYSIS, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalRelationships).toBe('number');
        expect(typeof result.data.results.metrics.criticalDependencies).toBe('number');
        expect(typeof result.data.results.metrics.maxConnections).toBe('number');
      });

      it('correctly counts active relationships', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEPENDENCY_ANALYSIS, {});
        // REL-001 and REL-002 are active
        expect(result.data.results.metrics.totalRelationships).toBe(2);
      });

      it('correctly counts critical dependencies', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEPENDENCY_ANALYSIS, {});
        // REL-001 is high, REL-002 is critical
        expect(result.data.results.metrics.criticalDependencies).toBe(2);
      });
    });

    describe('migration_planning', () => {
      it('returns migration metrics from seeded data', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.MIGRATION_PLANNING, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.nonCompliantEntries).toBe('number');
        expect(typeof result.data.results.metrics.retiringStandards).toBe('number');
        expect(typeof result.data.results.metrics.estimatedMigrationWeeks).toBe('number');
        expect(typeof result.data.results.metrics.estimatedCost).toBe('number');
      });

      it('correctly counts non-compliant entries', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.MIGRATION_PLANNING, {});
        // TE-002 is non_compliant, TE-003 is partially_compliant
        expect(result.data.results.metrics.nonCompliantEntries).toBe(2);
      });

      it('correctly counts retiring standards', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.MIGRATION_PLANNING, {});
        // TS-003 is retiring, TS-004 is retired
        expect(result.data.results.metrics.retiringStandards).toBe(2);
      });
    });

    describe('cost_optimization', () => {
      it('returns cost metrics from seeded tech debt', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COST_OPTIMIZATION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalTechDebtCost).toBe('number');
        expect(typeof result.data.results.metrics.potentialSavings).toBe('number');
        expect(typeof result.data.results.metrics.savingsPercentage).toBe('number');
        expect(typeof result.data.results.metrics.cloudApplications).toBe('number');
        expect(typeof result.data.results.metrics.totalApplications).toBe('number');
      });

      it('calculates total tech debt cost from open items', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COST_OPTIMIZATION, {});
        // TD-001: 50000, TD-002: 120000 (open), TD-003: 5000 (resolved, excluded from open cost)
        // The service sums all estimatedCost from techDebts (not just open), but the summary says "open"
        // Actually looking at the code: it sums ALL techDebts' estimatedCost where status !== 'resolved'
        expect(result.data.results.metrics.totalTechDebtCost).toBe(170000);
      });
    });

    describe('compliance_check', () => {
      it('returns compliance metrics from seeded data', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.complianceRate).toBe('number');
        expect(typeof result.data.results.metrics.averageComplianceScore).toBe('number');
        expect(typeof result.data.results.metrics.compliantEntries).toBe('number');
        expect(typeof result.data.results.metrics.nonCompliantEntries).toBe('number');
        expect(typeof result.data.results.metrics.activeWaivers).toBe('number');
        expect(typeof result.data.results.metrics.totalTechEntries).toBe('number');
      });

      it('correctly counts compliant entries', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
        // TE-001 is compliant
        expect(result.data.results.metrics.compliantEntries).toBe(1);
      });

      it('correctly counts non-compliant entries', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
        // TE-002 is non_compliant
        expect(result.data.results.metrics.nonCompliantEntries).toBe(1);
      });

      it('correctly counts active waivers', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
        // WAV-001 is approved
        expect(result.data.results.metrics.activeWaivers).toBe(1);
      });
    });

    describe('anomaly_detection', () => {
      it('returns anomaly detection results', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.ANOMALY_DETECTION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.anomaliesDetected).toBe('number');
        expect(result.data.results.metrics.anomaliesDetected).toBeGreaterThan(0);
        expect(typeof result.data.results.metrics.failedQualityGates).toBe('number');
        expect(typeof result.data.results.metrics.lowScoreApplications).toBe('number');
      });

      it('includes detected anomalies array', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.ANOMALY_DETECTION, {});
        expect(Array.isArray(result.data.results.anomalies)).toBe(true);
        result.data.results.anomalies.forEach((anomaly) => {
          expect(typeof anomaly.type).toBe('string');
          expect(typeof anomaly.severity).toBe('string');
          expect(anomaly.simulated).toBe(true);
        });
      });
    });

    describe('trend_forecasting', () => {
      it('returns trend forecasting results', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.TREND_FORECASTING, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.currentAverageCompliance).toBe('number');
        expect(typeof result.data.results.metrics.trendDirection).toBe('string');
        expect(['improving', 'stable', 'declining']).toContain(result.data.results.metrics.trendDirection);
        expect(typeof result.data.results.metrics.forecastedCompliance6Months).toBe('number');
        expect(typeof result.data.results.metrics.openTechDebt).toBe('number');
      });
    });

    describe('portfolio_optimization', () => {
      it('returns portfolio optimization results', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalPortfolios).toBe('number');
        expect(result.data.results.metrics.totalPortfolios).toBe(2);
        expect(typeof result.data.results.metrics.totalApplications).toBe('number');
        expect(result.data.results.metrics.totalApplications).toBe(3);
        expect(Array.isArray(result.data.results.metrics.portfolioStats)).toBe(true);
      });

      it('includes portfolio stats with compliance scores', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION, {});
        const stats = result.data.results.metrics.portfolioStats;
        expect(stats.length).toBe(2);
        stats.forEach((stat) => {
          expect(typeof stat.portfolioName).toBe('string');
          expect(typeof stat.applicationCount).toBe('number');
          expect(typeof stat.averageComplianceScore).toBe('number');
        });
      });
    });

    describe('standard_recommendation', () => {
      it('returns standard recommendation results', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.STANDARD_RECOMMENDATION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalStandards).toBe('number');
        expect(typeof result.data.results.metrics.emergingStandards).toBe('number');
        expect(typeof result.data.results.metrics.lowAdoptionStandards).toBe('number');
      });

      it('correctly counts emerging standards', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.STANDARD_RECOMMENDATION, {});
        // TS-005 is emerging
        expect(result.data.results.metrics.emergingStandards).toBe(1);
      });

      it('correctly counts low adoption standards', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.STANDARD_RECOMMENDATION, {});
        // TS-003 (15%), TS-004 (5%), TS-005 (10%) are all < 30%
        expect(result.data.results.metrics.lowAdoptionStandards).toBe(3);
      });
    });

    describe('debt_prioritization', () => {
      it('returns debt prioritization results', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEBT_PRIORITIZATION, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.totalOpenDebt).toBe('number');
        expect(typeof result.data.results.metrics.totalEstimatedCost).toBe('number');
        expect(typeof result.data.results.metrics.criticalItems).toBe('number');
        expect(typeof result.data.results.metrics.highItems).toBe('number');
      });

      it('correctly counts open debt items', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEBT_PRIORITIZATION, {});
        // TD-001 and TD-002 are open
        expect(result.data.results.metrics.totalOpenDebt).toBe(2);
      });

      it('correctly counts critical items', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEBT_PRIORITIZATION, {});
        // TD-001 is critical
        expect(result.data.results.metrics.criticalItems).toBe(1);
      });

      it('includes prioritized items list', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.DEBT_PRIORITIZATION, {});
        expect(Array.isArray(result.data.results.prioritizedItems)).toBe(true);
        expect(result.data.results.prioritizedItems.length).toBeGreaterThan(0);
        result.data.results.prioritizedItems.forEach((item) => {
          expect(typeof item.id).toBe('string');
          expect(typeof item.title).toBe('string');
          expect(typeof item.priority).toBe('string');
          expect(item.simulated).toBe(true);
        });
      });
    });

    describe('impact_analysis', () => {
      it('returns impact analysis results with application context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.IMPACT_ANALYSIS, {
          applicationId: 'APP-001',
        });
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(result.data.results.metrics.applicationName).toBe('Customer Portal');
        expect(typeof result.data.results.metrics.directDependencies).toBe('number');
        expect(typeof result.data.results.metrics.affectedApplications).toBe('number');
        expect(typeof result.data.results.metrics.technologyEntries).toBe('number');
        expect(typeof result.data.results.metrics.impactScore).toBe('number');
      });

      it('works without applicationId context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.IMPACT_ANALYSIS, {});
        expect(result.success).toBe(true);
        expect(result.data.results.metrics).toBeDefined();
        expect(typeof result.data.results.metrics.applicationName).toBe('string');
      });
    });

    describe('context handling', () => {
      it('accepts applicationId in context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.LIFECYCLE_PREDICTION, {
          applicationId: 'APP-002',
        });
        expect(result.success).toBe(true);
        expect(result.data.applicationId).toBe('APP-002');
      });

      it('accepts portfolioId in context', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION, {
          portfolioId: 'PF-001',
        });
        expect(result.success).toBe(true);
        expect(result.data.portfolioId).toBe('PF-001');
      });

      it('stores context in inputData', () => {
        const context = { applicationId: 'APP-001', portfolioId: 'PF-001' };
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, context);
        expect(result.success).toBe(true);
        expect(result.data.inputData).toBeDefined();
        expect(result.data.inputData.applicationId).toBe('APP-001');
        expect(result.data.inputData.portfolioId).toBe('PF-001');
      });
    });

    describe('graceful degradation for unknown feature types', () => {
      it('returns a simulated fallback for unknown feature type', () => {
        const result = getAIInsight('unknown_feature_xyz', {});
        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);
        expect(result.data).not.toBeNull();
        expect(result.data.featureType).toBe('unknown_feature_xyz');
        expect(result.data.status).toBe('completed');
        expect(result.data.simulated).toBe(true);
        expect(result.data.confidenceScore).toBe(0);
        expect(result.data.results.simulated).toBe(true);
        expect(result.data.results.summary).toContain('not recognized');
      });

      it('persists the fallback insight to localStorage', () => {
        const beforeCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES)).length;
        getAIInsight('unknown_feature_abc', {});
        const afterCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES)).length;
        expect(afterCount).toBe(beforeCount + 1);
      });

      it('creates an audit log entry for unknown feature type', () => {
        getAIInsight('unknown_feature_def', {});
        const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        const aiLog = auditLogs.find(
          (log) => log.action === 'execute' && log.entityType === 'AI_ANALYSIS'
        );
        expect(aiLog).toBeDefined();
        expect(aiLog.newValues.fallback).toBe(true);
      });
    });

    describe('error handling', () => {
      it('returns error for empty feature type', () => {
        const result = getAIInsight('', {});
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
        expect(result.simulated).toBe(true);
      });

      it('returns error for null feature type', () => {
        const result = getAIInsight(null, {});
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
        expect(result.simulated).toBe(true);
      });

      it('returns error for undefined feature type', () => {
        const result = getAIInsight(undefined, {});
        expect(result.success).toBe(false);
        expect(result.simulated).toBe(true);
      });
    });

    describe('unique IDs', () => {
      it('generates unique IDs for each insight', () => {
        const ids = new Set();
        const allFeatureTypes = Object.values(AI_FEATURE_TYPES);
        allFeatureTypes.forEach((featureType) => {
          const result = getAIInsight(featureType, {});
          expect(ids.has(result.data.id)).toBe(false);
          ids.add(result.data.id);
        });
        expect(ids.size).toBe(allFeatureTypes.length);
      });
    });

    describe('timestamps', () => {
      it('sets startedAt and completedAt timestamps', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        expect(result.data.startedAt).toBeDefined();
        expect(result.data.completedAt).toBeDefined();
        const startedAt = new Date(result.data.startedAt);
        const completedAt = new Date(result.data.completedAt);
        expect(Number.isNaN(startedAt.getTime())).toBe(false);
        expect(Number.isNaN(completedAt.getTime())).toBe(false);
      });

      it('sets createdAt and updatedAt timestamps', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      });
    });

    describe('requestedById', () => {
      it('sets requestedById from active persona', () => {
        const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
        expect(result.data.requestedById).toBeDefined();
        expect(typeof result.data.requestedById).toBe('string');
        expect(result.data.requestedById.length).toBeGreaterThan(0);
      });
    });
  });

  describe('askKpetsip', () => {
    describe('intent matching', () => {
      it('matches application count queries', () => {
        const result = askKpetsip('How many applications are there?');
        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);
        expect(result.data).not.toBeNull();
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('applications');
        expect(result.data.data.total).toBe(3);
        expect(typeof result.data.data.active).toBe('number');
      });

      it('matches portfolio count queries', () => {
        const result = askKpetsip('How many portfolios?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('portfolios');
        expect(result.data.data.total).toBe(2);
      });

      it('matches compliance score queries', () => {
        const result = askKpetsip('What is the compliance score?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('compliance');
        expect(typeof result.data.data.average).toBe('number');
        expect(typeof result.data.data.min).toBe('number');
        expect(typeof result.data.data.max).toBe('number');
      });

      it('matches tech debt queries', () => {
        const result = askKpetsip('Tell me about technical debt');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('tech_debt');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.open).toBe('number');
        expect(typeof result.data.data.critical).toBe('number');
        expect(typeof result.data.data.totalCost).toBe('number');
      });

      it('matches quality gate queries', () => {
        const result = askKpetsip('quality gate status');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('quality_gates');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.passed).toBe('number');
        expect(typeof result.data.data.failed).toBe('number');
      });

      it('matches technology standard queries', () => {
        const result = askKpetsip('How many technology standards?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('standards');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.preferred).toBe('number');
        expect(typeof result.data.data.recommended).toBe('number');
        expect(typeof result.data.data.retiring).toBe('number');
      });

      it('matches risk queries', () => {
        const result = askKpetsip('What is the risk summary?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('risk');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.critical).toBe('number');
        expect(typeof result.data.data.high).toBe('number');
        expect(typeof result.data.data.medium).toBe('number');
        expect(typeof result.data.data.low).toBe('number');
      });

      it('matches waiver queries', () => {
        const result = askKpetsip('How many waivers?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('waivers');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.approved).toBe('number');
        expect(typeof result.data.data.expired).toBe('number');
      });

      it('matches dependency queries', () => {
        const result = askKpetsip('Show me dependencies');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('dependencies');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.active).toBe('number');
        expect(typeof result.data.data.critical).toBe('number');
      });

      it('matches recommendation queries', () => {
        const result = askKpetsip('What should we do next?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('recommendations');
        expect(Array.isArray(result.data.data.recommendations)).toBe(true);
        expect(result.data.data.recommendations.length).toBeGreaterThan(0);
      });

      it('matches deployment model queries', () => {
        const result = askKpetsip('What is the cloud adoption?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('deployment');
        expect(typeof result.data.data.total).toBe('number');
        expect(typeof result.data.data.cloud).toBe('number');
        expect(typeof result.data.data.onPrem).toBe('number');
        expect(typeof result.data.data.hybrid).toBe('number');
        expect(typeof result.data.data.saas).toBe('number');
      });

      it('matches help queries', () => {
        const result = askKpetsip('help');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('help');
        expect(Array.isArray(result.data.data.capabilities)).toBe(true);
        expect(result.data.data.capabilities.length).toBeGreaterThan(0);
      });

      it('matches "what can you do" queries', () => {
        const result = askKpetsip('What can you do?');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.category).toBe('help');
      });
    });

    describe('case insensitivity', () => {
      it('matches queries regardless of case', () => {
        const result1 = askKpetsip('HOW MANY APPLICATIONS?');
        expect(result1.success).toBe(true);
        expect(result1.data.matched).toBe(true);
        expect(result1.data.category).toBe('applications');

        const result2 = askKpetsip('how many applications?');
        expect(result2.success).toBe(true);
        expect(result2.data.matched).toBe(true);
        expect(result2.data.category).toBe('applications');
      });
    });

    describe('data accuracy', () => {
      it('returns accurate application count from seeded data', () => {
        const result = askKpetsip('total applications');
        expect(result.data.data.total).toBe(3);
      });

      it('returns accurate active application count', () => {
        const result = askKpetsip('how many apps');
        // All 3 apps are active
        expect(result.data.data.active).toBe(3);
      });

      it('returns accurate compliance score average', () => {
        const result = askKpetsip('average compliance');
        // (72 + 85 + 35) / 3 = 64
        expect(result.data.data.average).toBe(64);
        expect(result.data.data.min).toBe(35);
        expect(result.data.data.max).toBe(85);
      });

      it('returns accurate tech debt counts', () => {
        const result = askKpetsip('tech debt summary');
        expect(result.data.data.total).toBe(3);
        expect(result.data.data.open).toBe(2);
        expect(result.data.data.critical).toBe(1);
        // Open cost: 50000 + 120000 = 170000
        expect(result.data.data.totalCost).toBe(170000);
      });

      it('returns accurate quality gate counts', () => {
        const result = askKpetsip('quality gate results');
        expect(result.data.data.total).toBe(3);
        expect(result.data.data.passed).toBe(2);
        expect(result.data.data.failed).toBe(1);
      });

      it('returns accurate standard counts', () => {
        const result = askKpetsip('standard count');
        expect(result.data.data.total).toBe(5);
        expect(result.data.data.preferred).toBe(1);
        expect(result.data.data.recommended).toBe(1);
        // retiring (1) + retired (1) = 2
        expect(result.data.data.retiring).toBe(2);
      });

      it('returns accurate risk distribution', () => {
        const result = askKpetsip('risk level');
        expect(result.data.data.total).toBe(3);
        expect(result.data.data.critical).toBe(1);
        expect(result.data.data.medium).toBe(1);
        expect(result.data.data.low).toBe(1);
      });

      it('returns accurate waiver counts', () => {
        const result = askKpetsip('waiver status');
        expect(result.data.data.total).toBe(2);
        expect(result.data.data.approved).toBe(1);
        expect(result.data.data.expired).toBe(1);
      });

      it('returns accurate deployment model distribution', () => {
        const result = askKpetsip('deployment model');
        expect(result.data.data.total).toBe(3);
        expect(result.data.data.cloud).toBe(1);
        expect(result.data.data.onPrem).toBe(1);
        expect(result.data.data.hybrid).toBe(1);
        expect(result.data.data.saas).toBe(0);
      });
    });

    describe('graceful degradation on unknown queries', () => {
      it('returns a simulated fallback for unknown queries', () => {
        const result = askKpetsip('What is the meaning of life?');
        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);
        expect(result.data).not.toBeNull();
        expect(result.data.matched).toBe(false);
        expect(result.data.category).toBe('unknown');
        expect(result.data.answer).toContain('simulated');
        expect(result.data.answer).toContain("don't have a specific answer");
      });

      it('suggests help for unknown queries', () => {
        const result = askKpetsip('random gibberish xyz abc 123');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(false);
        expect(result.data.answer).toContain('help');
      });

      it('returns the original query in the response', () => {
        const query = 'Some unknown question about nothing';
        const result = askKpetsip(query);
        expect(result.data.query).toBe(query);
      });
    });

    describe('response structure', () => {
      it('includes simulated flag in all responses', () => {
        const result = askKpetsip('How many applications?');
        expect(result.simulated).toBe(true);
        expect(result.data.simulated).toBe(true);
      });

      it('includes timestamp in all responses', () => {
        const result = askKpetsip('How many portfolios?');
        expect(result.data.timestamp).toBeDefined();
        const ts = new Date(result.data.timestamp);
        expect(Number.isNaN(ts.getTime())).toBe(false);
      });

      it('includes query in all responses', () => {
        const query = 'How many applications?';
        const result = askKpetsip(query);
        expect(result.data.query).toBe(query);
      });

      it('includes answer prefixed with AI (simulated)', () => {
        const result = askKpetsip('How many applications?');
        expect(result.data.answer).toContain('AI (simulated)');
      });

      it('includes category in all responses', () => {
        const result = askKpetsip('How many applications?');
        expect(typeof result.data.category).toBe('string');
        expect(result.data.category.length).toBeGreaterThan(0);
      });
    });

    describe('error handling', () => {
      it('returns error for empty query', () => {
        const result = askKpetsip('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
        expect(result.simulated).toBe(true);
      });

      it('returns error for null query', () => {
        const result = askKpetsip(null);
        expect(result.success).toBe(false);
        expect(result.error).toContain('non-empty string');
        expect(result.simulated).toBe(true);
      });

      it('returns error for undefined query', () => {
        const result = askKpetsip(undefined);
        expect(result.success).toBe(false);
        expect(result.simulated).toBe(true);
      });

      it('returns error for whitespace-only query', () => {
        const result = askKpetsip('   ');
        expect(result.success).toBe(false);
        expect(result.simulated).toBe(true);
      });
    });

    describe('audit logging', () => {
      it('creates an audit log entry for matched queries', () => {
        askKpetsip('How many applications?');
        const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        const askLog = auditLogs.find(
          (log) => log.action === 'execute' && log.entityType === 'AI_ANALYSIS' && log.details.includes('askKpetsip')
        );
        expect(askLog).toBeDefined();
        expect(askLog.status).toBe('success');
        expect(askLog.newValues.matched).toBe(true);
        expect(askLog.newValues.simulated).toBe(true);
      });

      it('creates an audit log entry for unmatched queries', () => {
        askKpetsip('random unknown query xyz');
        const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        const askLog = auditLogs.find(
          (log) => log.action === 'execute' && log.entityType === 'AI_ANALYSIS' && log.details.includes('askKpetsip')
        );
        expect(askLog).toBeDefined();
        expect(askLog.status).toBe('success');
        expect(askLog.newValues.matched).toBe(false);
      });

      it('includes the query in the audit log', () => {
        const query = 'How many portfolios?';
        askKpetsip(query);
        const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        const askLog = auditLogs.find(
          (log) => log.action === 'execute' && log.entityType === 'AI_ANALYSIS' && log.details.includes('askKpetsip')
        );
        expect(askLog).toBeDefined();
        expect(askLog.newValues.query).toBe(query);
      });
    });

    describe('query trimming', () => {
      it('trims whitespace from queries', () => {
        const result = askKpetsip('  How many applications?  ');
        expect(result.success).toBe(true);
        expect(result.data.matched).toBe(true);
        expect(result.data.query).toBe('How many applications?');
      });
    });
  });

  describe('listAIInsights', () => {
    it('returns empty results when no insights exist', () => {
      const result = listAIInsights();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns insights after generating them', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      const result = listAIInsights();
      expect(result.total).toBe(2);
      expect(result.data.length).toBe(2);
    });

    it('supports filtering by featureType', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      const result = listAIInsights({ featureType: AI_FEATURE_TYPES.RISK_ASSESSMENT });
      expect(result.total).toBe(1);
      expect(result.data[0].featureType).toBe(AI_FEATURE_TYPES.RISK_ASSESSMENT);
    });

    it('supports filtering by status', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      const result = listAIInsights({ status: 'completed' });
      expect(result.total).toBe(1);
      expect(result.data[0].status).toBe('completed');
    });

    it('supports pagination', () => {
      for (let i = 0; i < 5; i++) {
        getAIInsight(Object.values(AI_FEATURE_TYPES)[i], {});
      }
      const result = listAIInsights({ page: 1, pageSize: 2 });
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('listAllAIInsights', () => {
    it('returns empty array when no insights exist', () => {
      const result = listAllAIInsights();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('returns all insights without pagination', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
      const result = listAllAIInsights();
      expect(result.length).toBe(3);
    });
  });

  describe('getAIInsightById', () => {
    it('retrieves a generated insight by ID', () => {
      const generated = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      const result = getAIInsightById(generated.data.id);
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBe(generated.data.id);
      expect(result.data.featureType).toBe(AI_FEATURE_TYPES.RISK_ASSESSMENT);
    });

    it('returns error for non-existent ID', () => {
      const result = getAIInsightById('AI-999');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('returns error for empty ID', () => {
      const result = getAIInsightById('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });
  });

  describe('getAIInsightSummary', () => {
    it('returns empty summary when no insights exist', () => {
      const summary = getAIInsightSummary();
      expect(summary.total).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.averageConfidenceScore).toBe(0);
    });

    it('returns accurate summary after generating insights', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
      const summary = getAIInsightSummary();
      expect(summary.total).toBe(3);
      expect(summary.completed).toBe(3);
      expect(summary.pending).toBe(0);
      expect(summary.failed).toBe(0);
      expect(typeof summary.averageConfidenceScore).toBe('number');
      expect(summary.averageConfidenceScore).toBeGreaterThan(0);
    });

    it('includes byFeatureType breakdown', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      const summary = getAIInsightSummary();
      expect(summary.byFeatureType[AI_FEATURE_TYPES.RISK_ASSESSMENT]).toBe(2);
      expect(summary.byFeatureType[AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS]).toBe(1);
    });
  });

  describe('getAIInsightsByFeatureType', () => {
    it('returns insights filtered by feature type', () => {
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      const result = getAIInsightsByFeatureType(AI_FEATURE_TYPES.RISK_ASSESSMENT);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((insight) => {
        expect(insight.featureType).toBe(AI_FEATURE_TYPES.RISK_ASSESSMENT);
      });
    });

    it('returns empty array for non-existent feature type', () => {
      const result = getAIInsightsByFeatureType('nonexistent_feature');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = getAIInsightsByFeatureType('');
      expect(result).toEqual([]);
    });
  });

  describe('getAIInsightsByApplicationId', () => {
    it('returns insights filtered by application ID', () => {
      getAIInsight(AI_FEATURE_TYPES.LIFECYCLE_PREDICTION, { applicationId: 'APP-001' });
      getAIInsight(AI_FEATURE_TYPES.IMPACT_ANALYSIS, { applicationId: 'APP-001' });
      getAIInsight(AI_FEATURE_TYPES.LIFECYCLE_PREDICTION, { applicationId: 'APP-002' });
      const result = getAIInsightsByApplicationId('APP-001');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((insight) => {
        expect(insight.applicationId).toBe('APP-001');
      });
    });

    it('returns empty array for non-existent application ID', () => {
      const result = getAIInsightsByApplicationId('APP-999');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = getAIInsightsByApplicationId('');
      expect(result).toEqual([]);
    });
  });

  describe('getAIInsightsByPortfolioId', () => {
    it('returns insights filtered by portfolio ID', () => {
      getAIInsight(AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION, { portfolioId: 'PF-001' });
      getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, { portfolioId: 'PF-001' });
      getAIInsight(AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION, { portfolioId: 'PF-002' });
      const result = getAIInsightsByPortfolioId('PF-001');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((insight) => {
        expect(insight.portfolioId).toBe('PF-001');
      });
    });

    it('returns empty array for non-existent portfolio ID', () => {
      const result = getAIInsightsByPortfolioId('PF-999');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = getAIInsightsByPortfolioId('');
      expect(result).toEqual([]);
    });
  });

  describe('simulated label consistency', () => {
    it('all getAIInsight results are labeled as simulated', () => {
      const allFeatureTypes = Object.values(AI_FEATURE_TYPES);
      allFeatureTypes.forEach((featureType) => {
        const result = getAIInsight(featureType, {});
        expect(result.simulated).toBe(true);
        expect(result.data.simulated).toBe(true);
        expect(result.data.results.simulated).toBe(true);
      });
    });

    it('all askKpetsip results are labeled as simulated', () => {
      const queries = [
        'How many applications?',
        'compliance score',
        'tech debt',
        'quality gates',
        'unknown query xyz',
      ];
      queries.forEach((query) => {
        const result = askKpetsip(query);
        expect(result.simulated).toBe(true);
        expect(result.data.simulated).toBe(true);
      });
    });

    it('all recommendation items are labeled as simulated', () => {
      const allFeatureTypes = Object.values(AI_FEATURE_TYPES);
      allFeatureTypes.forEach((featureType) => {
        const result = getAIInsight(featureType, {});
        if (Array.isArray(result.data.recommendations)) {
          result.data.recommendations.forEach((rec) => {
            expect(rec.simulated).toBe(true);
          });
        }
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty applications array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.totalApplications).toBe(0);
    });

    it('handles empty tech standards array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.totalStandards).toBe(0);
    });

    it('handles empty tech debt array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.DEBT_PRIORITIZATION, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.totalOpenDebt).toBe(0);
    });

    it('handles empty relationships array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.DEPENDENCY_ANALYSIS, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.totalRelationships).toBe(0);
    });

    it('handles empty quality gates array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.RISK_ASSESSMENT, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.failedQualityGates).toBe(0);
    });

    it('handles empty waivers array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.COMPLIANCE_CHECK, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.activeWaivers).toBe(0);
    });

    it('handles empty tech entries array gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
      const result = getAIInsight(AI_FEATURE_TYPES.MIGRATION_PLANNING, {});
      expect(result.success).toBe(true);
      expect(result.data.results.metrics.nonCompliantEntries).toBe(0);
    });

    it('handles missing localStorage keys gracefully for askKpetsip', () => {
      localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
      const result = askKpetsip('How many applications?');
      expect(result.success).toBe(true);
      expect(result.data.data.total).toBe(0);
    });

    it('handles invalid JSON in localStorage gracefully for askKpetsip', () => {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, 'not valid json');
      const result = askKpetsip('How many applications?');
      expect(result.success).toBe(true);
      expect(result.data.data.total).toBe(0);
    });

    it('generates multiple insights without ID collision', () => {
      const ids = new Set();
      for (let i = 0; i < 20; i++) {
        const featureType = Object.values(AI_FEATURE_TYPES)[i % 13];
        const result = getAIInsight(featureType, {});
        expect(ids.has(result.data.id)).toBe(false);
        ids.add(result.data.id);
      }
      expect(ids.size).toBe(20);
    });

    it('askKpetsip handles very long queries', () => {
      const longQuery = 'How many applications are there in the system? '.repeat(50);
      const result = askKpetsip(longQuery);
      expect(result.success).toBe(true);
      expect(result.data.matched).toBe(true);
      expect(result.data.category).toBe('applications');
    });

    it('askKpetsip handles special characters in queries', () => {
      const result = askKpetsip('How many applications? @#$%^&*()');
      expect(result.success).toBe(true);
      expect(result.data.matched).toBe(true);
    });

    it('getAIInsight with non-existent applicationId in context still succeeds', () => {
      const result = getAIInsight(AI_FEATURE_TYPES.IMPACT_ANALYSIS, {
        applicationId: 'APP-NONEXISTENT',
      });
      expect(result.success).toBe(true);
      expect(result.data.applicationId).toBe('APP-NONEXISTENT');
    });
  });
});