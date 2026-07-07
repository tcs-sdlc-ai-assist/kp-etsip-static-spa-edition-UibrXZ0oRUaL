import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  seedDatabase,
  isDatabaseSeeded,
  getCurrentSeedSize,
  reseedDatabase,
} from './seedEngine';
import { STORAGE_KEYS, ID_PREFIXES, SEED_SIZES, SCHEMA_VERSION } from '../constants/constants';

describe('seedEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('seedDatabase', () => {
    describe('deterministic seeding', () => {
      it('produces identical data for the same seed and size', () => {
        const result1 = seedDatabase('standard', 'test-seed-123');
        const portfolios1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const applications1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));

        localStorage.clear();

        const result2 = seedDatabase('standard', 'test-seed-123');
        const portfolios2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const applications2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        expect(result1.counts).toEqual(result2.counts);

        expect(portfolios1.length).toBe(portfolios2.length);
        expect(applications1.length).toBe(applications2.length);

        portfolios1.forEach((p, i) => {
          expect(p.id).toBe(portfolios2[i].id);
          expect(p.name).toBe(portfolios2[i].name);
          expect(p.owner).toBe(portfolios2[i].owner);
        });

        applications1.forEach((a, i) => {
          expect(a.id).toBe(applications2[i].id);
          expect(a.name).toBe(applications2[i].name);
          expect(a.portfolioId).toBe(applications2[i].portfolioId);
        });
      });

      it('produces different data for different seeds', () => {
        const result1 = seedDatabase('standard', 'seed-alpha');
        const portfolios1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

        localStorage.clear();

        const result2 = seedDatabase('standard', 'seed-beta');
        const portfolios2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        // Same count (same size) but different data
        expect(portfolios1.length).toBe(portfolios2.length);

        // At least some fields should differ due to different PRNG seed
        let hasDifference = false;
        for (let i = 0; i < portfolios1.length; i++) {
          if (portfolios1[i].complianceScore !== portfolios2[i].complianceScore) {
            hasDifference = true;
            break;
          }
        }
        expect(hasDifference).toBe(true);
      });
    });

    describe('seed sizes', () => {
      it('seeds with small size and produces fewer records', () => {
        const result = seedDatabase('small', 'small-seed');
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();

        const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
        expect(totalEntities).toBeGreaterThan(0);

        // Small should produce fewer records than standard
        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        expect(portfolios.length).toBeGreaterThanOrEqual(3);
        expect(applications.length).toBeGreaterThanOrEqual(5);
      });

      it('seeds with standard size and produces moderate records', () => {
        const result = seedDatabase('standard', 'standard-seed');
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();

        const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
        expect(totalEntities).toBeGreaterThan(0);

        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        expect(portfolios.length).toBeGreaterThanOrEqual(3);
        expect(applications.length).toBeGreaterThanOrEqual(5);
      });

      it('seeds with large size and produces more records', () => {
        const result = seedDatabase('large', 'large-seed');
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();

        const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
        expect(totalEntities).toBeGreaterThan(0);

        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        expect(portfolios.length).toBeGreaterThanOrEqual(3);
        expect(applications.length).toBeGreaterThanOrEqual(5);
      });

      it('large produces more records than standard', () => {
        const resultStandard = seedDatabase('standard', 'compare-seed');
        const standardTotal = Object.values(resultStandard.counts).reduce((s, c) => s + c, 0);

        localStorage.clear();

        const resultLarge = seedDatabase('large', 'compare-seed');
        const largeTotal = Object.values(resultLarge.counts).reduce((s, c) => s + c, 0);

        expect(largeTotal).toBeGreaterThan(standardTotal);
      });

      it('small produces fewer records than standard', () => {
        const resultStandard = seedDatabase('standard', 'compare-seed-2');
        const standardTotal = Object.values(resultStandard.counts).reduce((s, c) => s + c, 0);

        localStorage.clear();

        const resultSmall = seedDatabase('small', 'compare-seed-2');
        const smallTotal = Object.values(resultSmall.counts).reduce((s, c) => s + c, 0);

        expect(smallTotal).toBeLessThan(standardTotal);
      });

      it('defaults to standard size for unknown size string', () => {
        const resultDefault = seedDatabase('unknown_size', 'default-seed');
        expect(resultDefault.success).toBe(true);

        localStorage.clear();

        const resultStandard = seedDatabase('standard', 'default-seed');
        expect(resultStandard.success).toBe(true);

        expect(resultDefault.counts).toEqual(resultStandard.counts);
      });

      it('defaults to standard size for non-string input', () => {
        const result = seedDatabase(null, 'null-seed');
        expect(result.success).toBe(true);

        const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
        expect(totalEntities).toBeGreaterThan(0);
      });
    });

    describe('all entity types populated', () => {
      let result;

      beforeEach(() => {
        result = seedDatabase('standard', 'entity-types-seed');
      });

      it('returns success', () => {
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();
      });

      it('populates PORTFOLIO records', () => {
        expect(result.counts.PORTFOLIO).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.PORTFOLIO);
      });

      it('populates APPLICATION records', () => {
        expect(result.counts.APPLICATION).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.APPLICATION);
      });

      it('populates RELATIONSHIP records', () => {
        expect(result.counts.RELATIONSHIP).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.RELATIONSHIP);
      });

      it('populates TECH_CATEGORY records', () => {
        expect(result.counts.TECH_CATEGORY).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_CATEGORIES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.TECH_CATEGORY);
      });

      it('populates TECH_STANDARD records', () => {
        expect(result.counts.TECH_STANDARD).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_STANDARDS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.TECH_STANDARD);
      });

      it('populates TECH_ENTRY records', () => {
        expect(result.counts.TECH_ENTRY).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_ENTRIES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.TECH_ENTRY);
      });

      it('populates DEFINITION records', () => {
        expect(result.counts.DEFINITION).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEFINITIONS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.DEFINITION);
      });

      it('populates ENVIRONMENT records', () => {
        expect(result.counts.ENVIRONMENT).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.ENVIRONMENT);
      });

      it('populates TECH_DEBT records', () => {
        expect(result.counts.TECH_DEBT).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_DEBT));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.TECH_DEBT);
      });

      it('populates QUALITY_GATE records', () => {
        expect(result.counts.QUALITY_GATE).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_GATES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.QUALITY_GATE);
      });

      it('populates GOVERNANCE_RECORD records', () => {
        expect(result.counts.GOVERNANCE_RECORD).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOVERNANCE_RECORDS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.GOVERNANCE_RECORD);
      });

      it('populates APPROVAL_REQUEST records', () => {
        expect(result.counts.APPROVAL_REQUEST).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPROVAL_REQUESTS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.APPROVAL_REQUEST);
      });

      it('populates WAIVER records', () => {
        expect(result.counts.WAIVER).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.WAIVERS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.WAIVER);
      });

      it('populates EVIDENCE records', () => {
        expect(result.counts.EVIDENCE).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVIDENCE));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.EVIDENCE);
      });

      it('populates USER records', () => {
        expect(result.counts.USER).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.USER);
      });

      it('populates ROLE records', () => {
        expect(result.counts.ROLE).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.ROLE);
      });

      it('populates INTEGRATION records', () => {
        expect(result.counts.INTEGRATION).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.INTEGRATION);
      });

      it('populates NOTIFICATION records', () => {
        expect(result.counts.NOTIFICATION).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.NOTIFICATION);
      });

      it('populates AI_ANALYSIS records', () => {
        expect(result.counts.AI_ANALYSIS).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.AI_ANALYSIS);
      });

      it('populates USE_CASE records', () => {
        expect(result.counts.USE_CASE).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USE_CASES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.USE_CASE);
      });

      it('populates SCHEDULE records', () => {
        expect(result.counts.SCHEDULE).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.SCHEDULE);
      });

      it('populates DEMO_SCENARIO records', () => {
        expect(result.counts.DEMO_SCENARIO).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_SCENARIOS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.DEMO_SCENARIO);
      });

      it('populates PDE_CONFIG records', () => {
        expect(result.counts.PDE_CONFIG).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PDE_CONFIGS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.PDE_CONFIG);
      });

      it('populates AUDIT_LOG records', () => {
        expect(result.counts.AUDIT_LOG).toBeGreaterThan(0);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(result.counts.AUDIT_LOG);
      });
    });

    describe('human-readable IDs', () => {
      beforeEach(() => {
        seedDatabase('standard', 'id-test-seed');
      });

      it('generates portfolio IDs with PF- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.PORTFOLIO)).toBe(true);
        });
      });

      it('generates application IDs with APP- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.APPLICATION)).toBe(true);
        });
      });

      it('generates relationship IDs with REL- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.RELATIONSHIP)).toBe(true);
        });
      });

      it('generates tech category IDs with TC- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_CATEGORIES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.TECH_CATEGORY)).toBe(true);
        });
      });

      it('generates tech standard IDs with TS- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_STANDARDS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.TECH_STANDARD)).toBe(true);
        });
      });

      it('generates tech entry IDs with TE- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_ENTRIES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.TECH_ENTRY)).toBe(true);
        });
      });

      it('generates user IDs with USR- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.USER)).toBe(true);
        });
      });

      it('generates role IDs with ROL- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.ROLE)).toBe(true);
        });
      });

      it('generates integration IDs with INT- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.INTEGRATION)).toBe(true);
        });
      });

      it('generates notification IDs with NOT- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.NOTIFICATION)).toBe(true);
        });
      });

      it('generates AI analysis IDs with AI- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.AI_ANALYSIS)).toBe(true);
        });
      });

      it('generates audit log IDs with AUD- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.AUDIT_LOG)).toBe(true);
        });
      });

      it('generates schedule IDs with SCH- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.SCHEDULE)).toBe(true);
        });
      });

      it('generates use case IDs with USE- prefix', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USE_CASES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(record.id.startsWith(ID_PREFIXES.USE_CASE)).toBe(true);
        });
      });

      it('generates IDs with zero-padded sequence numbers', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        expect(data[0].id).toBe(`${ID_PREFIXES.PORTFOLIO}001`);
        if (data.length > 1) {
          expect(data[1].id).toBe(`${ID_PREFIXES.PORTFOLIO}002`);
        }
      });

      it('generates unique IDs within each entity type', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const ids = data.map((r) => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });

    describe('record structure and fields', () => {
      beforeEach(() => {
        seedDatabase('standard', 'structure-seed');
      });

      it('portfolios have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(record.name.length).toBeGreaterThan(0);
          expect(typeof record.owner).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.createdAt).toBe('string');
          expect(typeof record.updatedAt).toBe('string');
          expect(typeof record.complianceScore).toBe('number');
          expect(record.version).toBe(1);
        });
      });

      it('applications have required fields and valid foreign keys', () => {
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const portfolioIds = new Set(portfolios.map((p) => p.id));

        apps.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(record.name.length).toBeGreaterThan(0);
          expect(typeof record.owner).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.portfolioId).toBe('string');
          expect(portfolioIds.has(record.portfolioId)).toBe(true);
          expect(typeof record.createdAt).toBe('string');
          expect(typeof record.updatedAt).toBe('string');
          expect(Array.isArray(record.technologyStack)).toBe(true);
        });
      });

      it('users have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.username).toBe('string');
          expect(typeof record.email).toBe('string');
          expect(record.email).toContain('@');
          expect(typeof record.firstName).toBe('string');
          expect(typeof record.lastName).toBe('string');
          expect(typeof record.displayName).toBe('string');
          expect(typeof record.accessLevel).toBe('string');
          expect(typeof record.status).toBe('string');
        });
      });

      it('integrations have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(typeof record.type).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.healthScore).toBe('number');
          expect(record.healthScore).toBeGreaterThanOrEqual(0);
          expect(record.healthScore).toBeLessThanOrEqual(100);
        });
      });

      it('notifications have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.title).toBe('string');
          expect(typeof record.message).toBe('string');
          expect(typeof record.type).toBe('string');
          expect(typeof record.recipientId).toBe('string');
          expect(typeof record.isRead).toBe('boolean');
          expect(typeof record.priority).toBe('string');
        });
      });

      it('AI analyses have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.title).toBe('string');
          expect(typeof record.featureType).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(Array.isArray(record.recommendations)).toBe(true);
        });
      });

      it('tech debt records have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_DEBT));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.title).toBe('string');
          expect(typeof record.description).toBe('string');
          expect(typeof record.applicationId).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.priority).toBe('string');
        });
      });

      it('quality gates have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_GATES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(typeof record.applicationId).toBe('string');
          expect(typeof record.type).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.score).toBe('number');
          expect(typeof record.threshold).toBe('number');
        });
      });

      it('environments have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(typeof record.type).toBe('string');
          expect(typeof record.applicationId).toBe('string');
          expect(typeof record.status).toBe('string');
        });
      });

      it('waivers have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.WAIVERS));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.title).toBe('string');
          expect(typeof record.standardId).toBe('string');
          expect(typeof record.applicationId).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.effectiveDate).toBe('string');
          expect(typeof record.expirationDate).toBe('string');
        });
      });

      it('schedules have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES));
        data.forEach((record) => {
          expect(record.id).toBeDefined();
          expect(typeof record.name).toBe('string');
          expect(typeof record.type).toBe('string');
          expect(typeof record.frequency).toBe('string');
          expect(typeof record.status).toBe('string');
          expect(typeof record.startDate).toBe('string');
        });
      });
    });

    describe('trend series generation', () => {
      beforeEach(() => {
        seedDatabase('standard', 'trend-seed');
      });

      it('portfolios contain trend series in metadata', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        data.forEach((record) => {
          expect(record.metadata).toBeDefined();
          expect(record.metadata.trendSeries).toBeDefined();
          expect(Array.isArray(record.metadata.trendSeries)).toBe(true);
          expect(record.metadata.trendSeries.length).toBe(12);
        });
      });

      it('trend series entries have month and value fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const trendSeries = data[0].metadata.trendSeries;
        trendSeries.forEach((point) => {
          expect(typeof point.month).toBe('string');
          expect(point.month).toMatch(/^\d{4}-\d{2}$/);
          expect(typeof point.value).toBe('number');
          expect(Number.isNaN(point.value)).toBe(false);
        });
      });

      it('trend series months are in chronological order', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const trendSeries = data[0].metadata.trendSeries;
        for (let i = 1; i < trendSeries.length; i++) {
          expect(trendSeries[i].month >= trendSeries[i - 1].month).toBe(true);
        }
      });

      it('applications contain trend series in metadata', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        data.forEach((record) => {
          expect(record.metadata).toBeDefined();
          expect(record.metadata.trendSeries).toBeDefined();
          expect(Array.isArray(record.metadata.trendSeries)).toBe(true);
          expect(record.metadata.trendSeries.length).toBe(12);
        });
      });

      it('tech standards contain trend series in metadata', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_STANDARDS));
        data.forEach((record) => {
          expect(record.metadata).toBeDefined();
          expect(record.metadata.trendSeries).toBeDefined();
          expect(Array.isArray(record.metadata.trendSeries)).toBe(true);
          expect(record.metadata.trendSeries.length).toBe(12);
        });
      });

      it('quality gate results contain trend series', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_GATES));
        data.forEach((record) => {
          expect(record.results).toBeDefined();
          expect(record.results.trendSeries).toBeDefined();
          expect(Array.isArray(record.results.trendSeries)).toBe(true);
          expect(record.results.trendSeries.length).toBe(12);
        });
      });

      it('trend series values are within reasonable bounds', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const trendSeries = data[0].metadata.trendSeries;
        trendSeries.forEach((point) => {
          expect(point.value).toBeGreaterThanOrEqual(0);
          expect(point.value).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('referential integrity', () => {
      beforeEach(() => {
        seedDatabase('standard', 'ref-integrity-seed');
      });

      it('application portfolioIds reference existing portfolios', () => {
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const portfolioIds = new Set(portfolios.map((p) => p.id));

        apps.forEach((app) => {
          expect(portfolioIds.has(app.portfolioId)).toBe(true);
        });
      });

      it('user roleIds reference existing roles', () => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES));
        const roleIds = new Set(roles.map((r) => r.id));

        users.forEach((user) => {
          expect(roleIds.has(user.roleId)).toBe(true);
        });
      });

      it('tech standards categoryIds reference existing categories', () => {
        const standards = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_STANDARDS));
        const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_CATEGORIES));
        const categoryIds = new Set(categories.map((c) => c.id));

        standards.forEach((standard) => {
          expect(categoryIds.has(standard.categoryId)).toBe(true);
        });
      });

      it('environments applicationIds reference existing applications', () => {
        const environments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS));
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const appIds = new Set(apps.map((a) => a.id));

        environments.forEach((env) => {
          expect(appIds.has(env.applicationId)).toBe(true);
        });
      });

      it('tech debt applicationIds reference existing applications', () => {
        const debts = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_DEBT));
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const appIds = new Set(apps.map((a) => a.id));

        debts.forEach((debt) => {
          expect(appIds.has(debt.applicationId)).toBe(true);
        });
      });

      it('quality gate applicationIds reference existing applications', () => {
        const gates = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUALITY_GATES));
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
        const appIds = new Set(apps.map((a) => a.id));

        gates.forEach((gate) => {
          expect(appIds.has(gate.applicationId)).toBe(true);
        });
      });

      it('notification recipientIds reference existing users', () => {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        const userIds = new Set(users.map((u) => u.id));

        notifications.forEach((notif) => {
          expect(userIds.has(notif.recipientId)).toBe(true);
        });
      });

      it('portfolio applicationCount matches actual application count', () => {
        const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
        const apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));

        portfolios.forEach((portfolio) => {
          const actualCount = apps.filter((a) => a.portfolioId === portfolio.id).length;
          expect(portfolio.applicationCount).toBe(actualCount);
        });
      });
    });

    describe('schema version and seed size persistence', () => {
      it('sets the schema version in localStorage', () => {
        seedDatabase('standard', 'schema-seed');
        const storedVersion = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION));
        expect(storedVersion).toBe(SCHEMA_VERSION);
      });

      it('sets the seed size in localStorage', () => {
        seedDatabase('small', 'size-seed');
        const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
        expect(storedSize).toBe('small');
      });

      it('sets standard seed size in localStorage', () => {
        seedDatabase('standard', 'size-seed-2');
        const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
        expect(storedSize).toBe('standard');
      });

      it('sets large seed size in localStorage', () => {
        seedDatabase('large', 'size-seed-3');
        const storedSize = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEED_SIZE));
        expect(storedSize).toBe('large');
      });
    });

    describe('AI analysis recommendations', () => {
      beforeEach(() => {
        seedDatabase('standard', 'ai-rec-seed');
      });

      it('completed AI analyses have recommendations', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        const completed = data.filter((a) => a.status === 'completed');

        completed.forEach((analysis) => {
          expect(Array.isArray(analysis.recommendations)).toBe(true);
          expect(analysis.recommendations.length).toBeGreaterThan(0);
        });
      });

      it('AI analysis recommendations have required fields', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        const completed = data.filter((a) => a.status === 'completed');

        completed.forEach((analysis) => {
          analysis.recommendations.forEach((rec) => {
            expect(typeof rec.id).toBe('string');
            expect(typeof rec.title).toBe('string');
            expect(typeof rec.description).toBe('string');
            expect(typeof rec.priority).toBe('string');
            expect(rec.simulated).toBe(true);
          });
        });
      });

      it('completed AI analyses have confidence scores', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
        const completed = data.filter((a) => a.status === 'completed');

        completed.forEach((analysis) => {
          expect(typeof analysis.confidenceScore).toBe('number');
          expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(analysis.confidenceScore).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('relationship records', () => {
      beforeEach(() => {
        seedDatabase('standard', 'relationship-seed');
      });

      it('relationships reference different source and target applications', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS));
        data.forEach((rel) => {
          expect(rel.sourceApplicationId).not.toBe(rel.targetApplicationId);
        });
      });

      it('relationships have valid relationship types', () => {
        const validTypes = ['depends_on', 'integrates_with', 'replaces', 'extends', 'consumes', 'provides'];
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS));
        data.forEach((rel) => {
          expect(validTypes).toContain(rel.relationshipType);
        });
      });
    });

    describe('use case records', () => {
      beforeEach(() => {
        seedDatabase('standard', 'usecase-seed');
      });

      it('use cases have steps array', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USE_CASES));
        data.forEach((uc) => {
          expect(Array.isArray(uc.steps)).toBe(true);
          expect(uc.steps.length).toBeGreaterThan(0);
        });
      });

      it('use case steps have step numbers', () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USE_CASES));
        data.forEach((uc) => {
          uc.steps.forEach((step, idx) => {
            expect(step.stepNumber).toBe(idx + 1);
            expect(typeof step.action).toBe('string');
            expect(typeof step.expectedResult).toBe('string');
          });
        });
      });
    });

    describe('default seed value', () => {
      it('uses default seed value when none provided', () => {
        const result = seedDatabase('standard');
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();

        const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
        expect(totalEntities).toBeGreaterThan(0);
      });
    });
  });

  describe('isDatabaseSeeded', () => {
    it('returns false when no data exists', () => {
      expect(isDatabaseSeeded()).toBe(false);
    });

    it('returns false when portfolios key is empty array', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
      expect(isDatabaseSeeded()).toBe(false);
    });

    it('returns true after seeding', () => {
      seedDatabase('small', 'seeded-check');
      expect(isDatabaseSeeded()).toBe(true);
    });

    it('returns false when portfolios key has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, 'not valid json');
      expect(isDatabaseSeeded()).toBe(false);
    });

    it('returns true when portfolios has at least one record', () => {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([{ id: 'PF-001' }]));
      expect(isDatabaseSeeded()).toBe(true);
    });
  });

  describe('getCurrentSeedSize', () => {
    it('returns null when no seed size is stored', () => {
      expect(getCurrentSeedSize()).toBeNull();
    });

    it('returns the stored seed size after seeding', () => {
      seedDatabase('small', 'size-check');
      expect(getCurrentSeedSize()).toBe('small');
    });

    it('returns standard after seeding with standard', () => {
      seedDatabase('standard', 'size-check-2');
      expect(getCurrentSeedSize()).toBe('standard');
    });

    it('returns large after seeding with large', () => {
      seedDatabase('large', 'size-check-3');
      expect(getCurrentSeedSize()).toBe('large');
    });

    it('returns null when seed size key has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.SEED_SIZE, 'not valid json');
      expect(getCurrentSeedSize()).toBeNull();
    });
  });

  describe('reseedDatabase', () => {
    it('clears existing data and reseeds', () => {
      seedDatabase('small', 'first-seed');
      const firstPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(firstPortfolios.length).toBeGreaterThan(0);

      const result = reseedDatabase('standard', 'second-seed');
      expect(result.success).toBe(true);

      const secondPortfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(secondPortfolios.length).toBeGreaterThan(0);
    });

    it('produces deterministic results on reseed', () => {
      const result1 = reseedDatabase('standard', 'reseed-test');
      const portfolios1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      const result2 = reseedDatabase('standard', 'reseed-test');
      const portfolios2 = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      expect(result1.counts).toEqual(result2.counts);
      expect(portfolios1.length).toBe(portfolios2.length);

      portfolios1.forEach((p, i) => {
        expect(p.id).toBe(portfolios2[i].id);
        expect(p.name).toBe(portfolios2[i].name);
      });
    });

    it('uses default parameters when none provided', () => {
      const result = reseedDatabase();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('updates seed size on reseed', () => {
      seedDatabase('small', 'initial');
      expect(getCurrentSeedSize()).toBe('small');

      reseedDatabase('large', 'reseed-size');
      expect(getCurrentSeedSize()).toBe('large');
    });
  });

  describe('edge cases', () => {
    it('handles numeric seed value', () => {
      const result = seedDatabase('standard', 12345);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const totalEntities = Object.values(result.counts).reduce((s, c) => s + c, 0);
      expect(totalEntities).toBeGreaterThan(0);
    });

    it('handles empty string seed value', () => {
      const result = seedDatabase('standard', '');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('role userCount is correctly computed', () => {
      seedDatabase('standard', 'role-count-seed');
      const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLES));
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

      roles.forEach((role) => {
        const actualCount = users.filter((u) => u.roleId === role.id).length;
        expect(role.userCount).toBe(actualCount);
      });
    });

    it('all timestamps are valid ISO 8601 strings', () => {
      seedDatabase('small', 'timestamp-seed');
      const portfolios = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));

      portfolios.forEach((record) => {
        const createdDate = new Date(record.createdAt);
        expect(Number.isNaN(createdDate.getTime())).toBe(false);

        const updatedDate = new Date(record.updatedAt);
        expect(Number.isNaN(updatedDate.getTime())).toBe(false);
      });
    });

    it('all date fields are valid YYYY-MM-DD format', () => {
      seedDatabase('small', 'date-format-seed');
      const standards = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECH_STANDARDS));

      standards.forEach((record) => {
        expect(record.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('integration types cover multiple categories', () => {
      seedDatabase('standard', 'integration-types-seed');
      const integrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS));
      const types = new Set(integrations.map((i) => i.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('AI analyses cover multiple feature types', () => {
      seedDatabase('standard', 'ai-features-seed');
      const analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_ANALYSES));
      const featureTypes = new Set(analyses.map((a) => a.featureType));
      expect(featureTypes.size).toBeGreaterThan(1);
    });

    it('notifications have diverse types', () => {
      seedDatabase('standard', 'notif-types-seed');
      const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
      const types = new Set(notifications.map((n) => n.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('demo scenarios have steps array', () => {
      seedDatabase('standard', 'demo-steps-seed');
      const scenarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMO_SCENARIOS));
      scenarios.forEach((scenario) => {
        expect(Array.isArray(scenario.steps)).toBe(true);
        expect(scenario.steps.length).toBeGreaterThan(0);
        scenario.steps.forEach((step) => {
          expect(typeof step.stepNumber).toBe('number');
          expect(typeof step.title).toBe('string');
          expect(typeof step.description).toBe('string');
        });
      });
    });
  });
});