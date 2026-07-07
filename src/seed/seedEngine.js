import { createPRNG } from '../utils/prng';
import { STORAGE_KEYS, ID_PREFIXES, SEED_SIZES, ANCHOR_DATE } from '../constants/constants';
import { setItem } from '../storage/storageAdapter';
import { setSchemaVersion } from '../storage/storageAdapter';
import { setCounter, resetAllCounters } from '../utils/idGenerator';
import { formatDate, addDays, addMonths } from '../utils/dateUtils';
import {
  APPLICATION_NAMES,
  PORTFOLIO_NAMES,
  BUSINESS_UNITS,
  TECH_STANDARD_NAMES,
  TECH_CATEGORY_NAMES,
  USE_CASE_TITLES,
  TECH_DEBT_TITLES,
  TECH_DEBT_DESCRIPTIONS,
  GOVERNANCE_TITLES,
  APPROVAL_REQUEST_TITLES,
  WAIVER_TITLES,
  ENVIRONMENT_NAMES,
  FIRST_NAMES,
  LAST_NAMES,
  JOB_TITLES,
  DEPARTMENTS,
  NOTIFICATION_MESSAGES,
  AI_ANALYSIS_TITLES,
  INTEGRATION_NAMES,
  QUALITY_GATE_NAMES,
  EVIDENCE_TITLES,
  DEFINITION_ENTRIES,
  SCHEDULE_NAMES,
  DEMO_SCENARIO_NAMES,
  COMMON_TAGS,
  BUSINESS_DOMAINS,
  JUSTIFICATION_TEXTS,
  MITIGATION_PLANS,
  CLOUD_REGIONS,
  INFRASTRUCTURE_PROVIDERS,
  ROLE_NAMES,
  PDE_CONFIG_NAMES,
  TECHNOLOGY_STACK_COMPONENTS,
} from './templatePools';

/**
 * Resolves the seed size configuration from a key string.
 * @param {string} seedSizeKey - One of 'small', 'standard', 'large'.
 * @returns {{ key: string, label: string, records: number }}
 */
const resolveSeedSize = (seedSizeKey) => {
  if (typeof seedSizeKey !== 'string') {
    return SEED_SIZES.STANDARD;
  }
  const normalized = seedSizeKey.toLowerCase().trim();
  if (normalized === 'small') return SEED_SIZES.SMALL;
  if (normalized === 'large') return SEED_SIZES.LARGE;
  return SEED_SIZES.STANDARD;
};

/**
 * Generates a formatted ISO datetime string from an anchor date and offset days.
 * @param {Object} rng - The PRNG instance.
 * @param {number} offsetDays - Days offset from anchor.
 * @returns {string} ISO datetime string.
 */
const generateDatetime = (rng, offsetDays) => {
  const d = addDays(ANCHOR_DATE, offsetDays);
  if (!d) return new Date().toISOString();
  d.setHours(rng.nextInt(8, 18), rng.nextInt(0, 59), rng.nextInt(0, 59));
  return d.toISOString();
};

/**
 * Generates a formatted date string from anchor and offset.
 * @param {number} offsetDays - Days offset from anchor.
 * @returns {string} YYYY-MM-DD string.
 */
const generateDateString = (offsetDays) => {
  const d = addDays(ANCHOR_DATE, offsetDays);
  return d ? formatDate(d) : '2026-07-01';
};

/**
 * Picks N unique items from an array using the PRNG.
 * @template T
 * @param {Object} rng - The PRNG instance.
 * @param {T[]} array - Source array.
 * @param {number} count - Number of items to pick.
 * @returns {T[]}
 */
const pickN = (rng, array, count) => {
  if (!Array.isArray(array) || array.length === 0) return [];
  const shuffled = rng.shuffle(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Generates a 12-point monthly trend series for a metric.
 * @param {Object} rng - The PRNG instance.
 * @param {number} baseValue - Starting value.
 * @param {number} minVal - Minimum value.
 * @param {number} maxVal - Maximum value.
 * @param {string} [trend='stable'] - 'up', 'down', or 'stable'.
 * @returns {Array<{month: string, value: number}>}
 */
const generateTrendSeries = (rng, baseValue, minVal, maxVal, trend = 'stable') => {
  const series = [];
  let current = baseValue;
  for (let i = 11; i >= 0; i--) {
    const d = addMonths(ANCHOR_DATE, -i);
    const monthStr = d ? formatDate(d).slice(0, 7) : `2026-${String(12 - i).padStart(2, '0')}`;
    series.push({ month: monthStr, value: Math.round(current * 100) / 100 });
    let delta = rng.nextFloat() * 5 - 2.5;
    if (trend === 'up') delta += 2;
    if (trend === 'down') delta -= 2;
    current = Math.max(minVal, Math.min(maxVal, current + delta));
  }
  return series;
};

/**
 * Deterministic seed engine: generates all initial mock data using seeded PRNG and template pools.
 * Populates localStorage with all entity types.
 *
 * @param {string} [seedSize='standard'] - One of 'small', 'standard', 'large'.
 * @param {string|number} [seedValue='kp-etsip-default-seed'] - Seed value for deterministic PRNG.
 * @returns {{ success: boolean, counts: Object<string, number>, error: string|null }}
 */
export const seedDatabase = (seedSize = 'standard', seedValue = 'kp-etsip-default-seed') => {
  try {
    const config = resolveSeedSize(seedSize);
    const rng = createPRNG(seedValue);
    const totalTarget = config.records;

    resetAllCounters();

    // Scale factors based on seed size
    const scale = totalTarget / 200;
    const numPortfolios = Math.max(3, Math.round(8 * scale));
    const numApplications = Math.max(5, Math.round(25 * scale));
    const numUsers = Math.max(8, Math.round(22 * scale));
    const numRoles = Math.min(ROLE_NAMES.length, Math.max(5, Math.round(10 * scale)));
    const numCategories = Math.min(TECH_CATEGORY_NAMES.length, Math.max(5, Math.round(12 * scale)));
    const numStandards = Math.max(5, Math.round(20 * scale));
    const numTechEntries = Math.max(5, Math.round(15 * scale));
    const numDefinitions = Math.min(DEFINITION_ENTRIES.length, Math.max(5, Math.round(12 * scale)));
    const numEnvironments = Math.max(5, Math.round(15 * scale));
    const numTechDebt = Math.max(3, Math.round(12 * scale));
    const numQualityGates = Math.max(3, Math.round(10 * scale));
    const numGovernance = Math.max(3, Math.round(8 * scale));
    const numApprovals = Math.max(2, Math.round(8 * scale));
    const numWaivers = Math.max(2, Math.round(6 * scale));
    const numEvidence = Math.max(3, Math.round(10 * scale));
    const numRelationships = Math.max(3, Math.round(10 * scale));
    const numIntegrations = Math.min(INTEGRATION_NAMES.length, Math.max(5, Math.round(12 * scale)));
    const numNotifications = Math.max(5, Math.round(15 * scale));
    const numAIAnalyses = Math.max(3, Math.round(8 * scale));
    const numUseCases = Math.max(5, Math.round(15 * scale));
    const numSchedules = Math.min(SCHEDULE_NAMES.length, Math.max(3, Math.round(8 * scale)));
    const numDemoScenarios = Math.min(DEMO_SCENARIO_NAMES.length, Math.max(3, Math.round(5 * scale)));
    const numPdeConfigs = Math.min(PDE_CONFIG_NAMES.length, Math.max(3, Math.round(5 * scale)));

    const counts = {};

    // ---- ROLES ----
    const roles = [];
    const accessLevels = ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor', 'read_only', 'external'];
    for (let i = 0; i < numRoles; i++) {
      const id = `${ID_PREFIXES.ROLE}${String(i + 1).padStart(3, '0')}`;
      const now = generateDatetime(rng, -rng.nextInt(30, 365));
      roles.push({
        id,
        name: ROLE_NAMES[i % ROLE_NAMES.length],
        description: `Role for ${ROLE_NAMES[i % ROLE_NAMES.length]}`,
        accessLevel: accessLevels[i % accessLevels.length],
        permissions: {},
        isSystem: i < 3,
        status: 'active',
        userCount: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.ROLE = roles.length;

    // ---- USERS ----
    const users = [];
    const personaIds = [
      'persona-platform-administrator',
      'persona-executive-leadership',
      'persona-vp-ets',
      'persona-executive-director-ets',
      'persona-sr-director-ets-portfolio-leader',
      'persona-director-ets-portfolio-leader',
      'persona-quality-engineer',
      'persona-automation-engineer',
      'persona-sdet',
      'persona-developer',
      'persona-product-owner-qe-manager',
      'persona-scrum-master-qe-manager',
      'persona-release-manager',
      'persona-program-manager-portfolio-leader',
      'persona-application-owner-qe-manager',
      'persona-environment-manager',
      'persona-test-data-engineer',
      'persona-performance-engineer',
      'persona-security-engineer',
      'persona-accessibility-engineer',
      'persona-production-support-read-only',
      'persona-vendor-partner',
    ];
    for (let i = 0; i < numUsers; i++) {
      const id = `${ID_PREFIXES.USER}${String(i + 1).padStart(3, '0')}`;
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[i % LAST_NAMES.length];
      const now = generateDatetime(rng, -rng.nextInt(60, 730));
      users.push({
        id,
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/'/g, '')}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/'/g, '')}@kpetsip.example.com`,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        roleId: roles[i % roles.length].id,
        personaId: i < personaIds.length ? personaIds[i] : null,
        accessLevel: accessLevels[i % accessLevels.length],
        status: 'active',
        department: rng.pick(DEPARTMENTS),
        title: JOB_TITLES[i % JOB_TITLES.length],
        lastLoginAt: generateDatetime(rng, -rng.nextInt(0, 14)),
        avatarUrl: null,
        preferences: {},
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    // Update role user counts
    users.forEach((u) => {
      const role = roles.find((r) => r.id === u.roleId);
      if (role) role.userCount += 1;
    });
    counts.USER = users.length;

    // ---- PORTFOLIOS ----
    const portfolios = [];
    for (let i = 0; i < numPortfolios; i++) {
      const id = `${ID_PREFIXES.PORTFOLIO}${String(i + 1).padStart(3, '0')}`;
      const owner = rng.pick(users);
      const now = generateDatetime(rng, -rng.nextInt(90, 730));
      portfolios.push({
        id,
        name: PORTFOLIO_NAMES[i % PORTFOLIO_NAMES.length],
        description: `Portfolio for ${PORTFOLIO_NAMES[i % PORTFOLIO_NAMES.length]} initiatives.`,
        owner: owner.displayName,
        ownerId: owner.id,
        status: rng.pick(['active', 'active', 'active', 'planning']),
        businessUnit: rng.pick(BUSINESS_UNITS),
        criticality: rng.pick(['critical', 'high', 'medium', 'low']),
        applicationCount: 0,
        complianceScore: rng.nextInt(40, 98),
        riskLevel: rng.pick(['low', 'medium', 'high']),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(1, 4)),
        metadata: {
          trendSeries: generateTrendSeries(rng, rng.nextInt(50, 90), 20, 100, rng.pick(['up', 'stable', 'down'])),
        },
        createdAt: now,
        updatedAt: now,
        createdBy: owner.id,
        updatedBy: owner.id,
        version: 1,
      });
    }
    counts.PORTFOLIO = portfolios.length;

    // ---- APPLICATIONS ----
    const applications = [];
    const deploymentModels = ['on_premise', 'cloud', 'hybrid', 'saas'];
    for (let i = 0; i < numApplications; i++) {
      const id = `${ID_PREFIXES.APPLICATION}${String(i + 1).padStart(3, '0')}`;
      const portfolio = portfolios[i % portfolios.length];
      const owner = rng.pick(users);
      const now = generateDatetime(rng, -rng.nextInt(60, 730));
      applications.push({
        id,
        name: APPLICATION_NAMES[i % APPLICATION_NAMES.length],
        description: `Enterprise application: ${APPLICATION_NAMES[i % APPLICATION_NAMES.length]}.`,
        portfolioId: portfolio.id,
        owner: owner.displayName,
        ownerId: owner.id,
        status: rng.pick(['active', 'active', 'active', 'planning', 'retiring']),
        criticality: rng.pick(['critical', 'high', 'medium', 'low']),
        technologyStack: pickN(rng, TECHNOLOGY_STACK_COMPONENTS, rng.nextInt(2, 6)),
        complianceScore: rng.nextInt(30, 100),
        riskLevel: rng.pick(['low', 'medium', 'high', 'critical']),
        deploymentModel: rng.pick(deploymentModels),
        businessDomain: rng.pick(BUSINESS_DOMAINS),
        teamSize: rng.nextInt(3, 30),
        lastAssessmentDate: generateDateString(-rng.nextInt(0, 180)),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(1, 5)),
        metadata: {
          trendSeries: generateTrendSeries(rng, rng.nextInt(40, 95), 10, 100, rng.pick(['up', 'stable', 'down'])),
        },
        createdAt: now,
        updatedAt: now,
        createdBy: owner.id,
        updatedBy: owner.id,
        version: 1,
      });
    }
    // Update portfolio application counts
    applications.forEach((app) => {
      const pf = portfolios.find((p) => p.id === app.portfolioId);
      if (pf) pf.applicationCount += 1;
    });
    counts.APPLICATION = applications.length;

    // ---- RELATIONSHIPS ----
    const relationships = [];
    const relationshipTypes = ['depends_on', 'integrates_with', 'replaces', 'extends', 'consumes', 'provides'];
    for (let i = 0; i < numRelationships; i++) {
      const id = `${ID_PREFIXES.RELATIONSHIP}${String(i + 1).padStart(3, '0')}`;
      const source = applications[i % applications.length];
      let target = applications[(i + 1 + rng.nextInt(0, applications.length - 2)) % applications.length];
      if (target.id === source.id) {
        target = applications[(i + 2) % applications.length];
      }
      const now = generateDatetime(rng, -rng.nextInt(30, 365));
      relationships.push({
        id,
        sourceApplicationId: source.id,
        targetApplicationId: target.id,
        relationshipType: rng.pick(relationshipTypes),
        description: `${source.name} ${rng.pick(relationshipTypes)} ${target.name}`,
        status: rng.pick(['active', 'active', 'inactive']),
        dataFlow: rng.pick(['unidirectional', 'bidirectional', 'none']),
        criticality: rng.pick(['critical', 'high', 'medium', 'low']),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.RELATIONSHIP = relationships.length;

    // ---- TECH CATEGORIES ----
    const techCategories = [];
    const categoryStatuses = ['active', 'active', 'active', 'inactive'];
    const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    for (let i = 0; i < numCategories; i++) {
      const id = `${ID_PREFIXES.TECH_CATEGORY}${String(i + 1).padStart(3, '0')}`;
      const now = generateDatetime(rng, -rng.nextInt(90, 730));
      techCategories.push({
        id,
        name: TECH_CATEGORY_NAMES[i % TECH_CATEGORY_NAMES.length],
        description: `Category for ${TECH_CATEGORY_NAMES[i % TECH_CATEGORY_NAMES.length]}.`,
        parentCategoryId: null,
        order: i,
        icon: null,
        color: categoryColors[i % categoryColors.length],
        status: rng.pick(categoryStatuses),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.TECH_CATEGORY = techCategories.length;

    // ---- TECH STANDARDS ----
    const techStandards = [];
    const standardStatuses = ['emerging', 'recommended', 'preferred', 'acceptable', 'retiring', 'retired', 'prohibited'];
    const complianceLevels = ['mandatory', 'recommended', 'optional', 'informational'];
    for (let i = 0; i < numStandards; i++) {
      const id = `${ID_PREFIXES.TECH_STANDARD}${String(i + 1).padStart(3, '0')}`;
      const category = techCategories[i % techCategories.length];
      const owner = rng.pick(users);
      const effectiveOffset = -rng.nextInt(30, 365);
      const now = generateDatetime(rng, effectiveOffset - rng.nextInt(0, 30));
      techStandards.push({
        id,
        name: TECH_STANDARD_NAMES[i % TECH_STANDARD_NAMES.length],
        description: `Standard for ${TECH_STANDARD_NAMES[i % TECH_STANDARD_NAMES.length]}.`,
        categoryId: category.id,
        status: rng.pick(standardStatuses),
        effectiveDate: generateDateString(effectiveOffset),
        expirationDate: rng.nextFloat() > 0.3 ? generateDateString(rng.nextInt(90, 730)) : null,
        owner: owner.displayName,
        ownerId: owner.id,
        version: `${rng.nextInt(1, 5)}.${rng.nextInt(0, 9)}.${rng.nextInt(0, 9)}`,
        complianceLevel: rng.pick(complianceLevels),
        riskLevel: rng.pick(['low', 'medium', 'high', 'critical']),
        adoptionPercentage: Math.round(rng.nextFloat() * 100 * 10) / 10,
        documentUrl: `https://docs.kpetsip.example.com/standards/${id}`,
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(1, 3)),
        metadata: {
          trendSeries: generateTrendSeries(rng, rng.nextInt(20, 80), 0, 100, rng.pick(['up', 'stable'])),
        },
        createdAt: now,
        updatedAt: now,
        createdBy: owner.id,
        updatedBy: owner.id,
      });
    }
    counts.TECH_STANDARD = techStandards.length;

    // ---- TECH ENTRIES ----
    const techEntries = [];
    const complianceStatuses = ['compliant', 'non_compliant', 'partially_compliant', 'waived', 'not_assessed'];
    for (let i = 0; i < numTechEntries; i++) {
      const id = `${ID_PREFIXES.TECH_ENTRY}${String(i + 1).padStart(3, '0')}`;
      const standard = techStandards[i % techStandards.length];
      const app = applications[i % applications.length];
      const now = generateDatetime(rng, -rng.nextInt(10, 180));
      techEntries.push({
        id,
        name: `${app.name} - ${standard.name}`,
        description: `Technology entry for ${app.name} using ${standard.name}.`,
        standardId: standard.id,
        applicationId: app.id,
        currentVersion: `${rng.nextInt(1, 5)}.${rng.nextInt(0, 9)}`,
        targetVersion: `${rng.nextInt(5, 8)}.${rng.nextInt(0, 9)}`,
        complianceStatus: rng.pick(complianceStatuses),
        migrationDate: rng.nextFloat() > 0.5 ? generateDateString(rng.nextInt(30, 365)) : null,
        notes: rng.nextFloat() > 0.5 ? 'Migration planned for next quarter.' : null,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.TECH_ENTRY = techEntries.length;

    // ---- DEFINITIONS ----
    const definitions = [];
    for (let i = 0; i < numDefinitions; i++) {
      const id = `${ID_PREFIXES.DEFINITION}${String(i + 1).padStart(3, '0')}`;
      const entry = DEFINITION_ENTRIES[i % DEFINITION_ENTRIES.length];
      const now = generateDatetime(rng, -rng.nextInt(60, 365));
      definitions.push({
        id,
        term: entry.term,
        definition: entry.definition,
        category: entry.category,
        source: 'KP ETSIP Glossary',
        status: 'active',
        aliases: [],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.DEFINITION = definitions.length;

    // ---- ENVIRONMENTS ----
    const environments = [];
    const envTypes = ['development', 'testing', 'staging', 'uat', 'pre_production', 'production', 'dr'];
    const envStatuses = ['active', 'active', 'active', 'inactive', 'maintenance'];
    const healthStatuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down', 'unknown'];
    for (let i = 0; i < numEnvironments; i++) {
      const id = `${ID_PREFIXES.ENVIRONMENT}${String(i + 1).padStart(3, '0')}`;
      const app = applications[i % applications.length];
      const now = generateDatetime(rng, -rng.nextInt(30, 365));
      environments.push({
        id,
        name: ENVIRONMENT_NAMES[i % ENVIRONMENT_NAMES.length],
        description: `${ENVIRONMENT_NAMES[i % ENVIRONMENT_NAMES.length]} environment for ${app.name}.`,
        type: envTypes[i % envTypes.length],
        applicationId: app.id,
        status: rng.pick(envStatuses),
        url: `https://${ENVIRONMENT_NAMES[i % ENVIRONMENT_NAMES.length].toLowerCase().replace(/\s+/g, '-')}.kpetsip.example.com`,
        region: rng.pick(CLOUD_REGIONS),
        provider: rng.pick(INFRASTRUCTURE_PROVIDERS),
        healthStatus: rng.pick(healthStatuses),
        lastDeploymentDate: generateDatetime(rng, -rng.nextInt(0, 30)),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(0, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.ENVIRONMENT = environments.length;

    // ---- TECH DEBT ----
    const techDebts = [];
    const debtStatuses = ['identified', 'assessed', 'planned', 'in_progress', 'resolved', 'accepted', 'deferred'];
    const debtCategories = ['architecture', 'code_quality', 'dependency', 'infrastructure', 'security', 'performance', 'testing', 'documentation', 'process'];
    for (let i = 0; i < numTechDebt; i++) {
      const id = `${ID_PREFIXES.TECH_DEBT}${String(i + 1).padStart(3, '0')}`;
      const app = applications[i % applications.length];
      const assignee = rng.pick(users);
      const now = generateDatetime(rng, -rng.nextInt(10, 180));
      techDebts.push({
        id,
        title: TECH_DEBT_TITLES[i % TECH_DEBT_TITLES.length],
        description: TECH_DEBT_DESCRIPTIONS[i % TECH_DEBT_DESCRIPTIONS.length],
        applicationId: app.id,
        standardId: rng.nextFloat() > 0.4 ? techStandards[i % techStandards.length].id : null,
        status: rng.pick(debtStatuses),
        priority: rng.pick(['critical', 'high', 'medium', 'low']),
        severity: rng.pick(['critical', 'high', 'medium', 'low', 'none']),
        category: rng.pick(debtCategories),
        estimatedEffort: `${rng.nextInt(1, 20)} sprints`,
        estimatedCost: rng.nextInt(5000, 500000),
        assignee: assignee.displayName,
        assigneeId: assignee.id,
        dueDate: generateDateString(rng.nextInt(30, 365)),
        resolvedDate: rng.nextFloat() > 0.7 ? generateDateString(-rng.nextInt(0, 60)) : null,
        impactScore: rng.nextInt(10, 100),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(1, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: assignee.id,
        updatedBy: assignee.id,
        version: 1,
      });
    }
    counts.TECH_DEBT = techDebts.length;

    // ---- QUALITY GATES ----
    const qualityGates = [];
    const qgTypes = ['code_quality', 'security', 'performance', 'accessibility', 'compliance', 'testing', 'deployment'];
    const qgStatuses = ['passed', 'failed', 'warning', 'not_evaluated', 'in_progress'];
    for (let i = 0; i < numQualityGates; i++) {
      const id = `${ID_PREFIXES.QUALITY_GATE}${String(i + 1).padStart(3, '0')}`;
      const app = applications[i % applications.length];
      const score = rng.nextInt(20, 100);
      const threshold = rng.nextInt(60, 85);
      const now = generateDatetime(rng, -rng.nextInt(0, 90));
      qualityGates.push({
        id,
        name: QUALITY_GATE_NAMES[i % QUALITY_GATE_NAMES.length],
        description: `Quality gate: ${QUALITY_GATE_NAMES[i % QUALITY_GATE_NAMES.length]}.`,
        applicationId: app.id,
        type: rng.pick(qgTypes),
        status: score >= threshold ? 'passed' : rng.pick(['failed', 'warning']),
        score,
        threshold,
        evaluatedAt: now,
        evaluatedBy: rng.pick(users).displayName,
        criteria: { minScore: threshold, maxViolations: rng.nextInt(0, 5) },
        results: {
          score,
          violations: rng.nextInt(0, 10),
          trendSeries: generateTrendSeries(rng, score, 0, 100, rng.pick(['up', 'stable'])),
        },
        isBlocking: rng.nextFloat() > 0.3,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.QUALITY_GATE = qualityGates.length;

    // ---- GOVERNANCE RECORDS ----
    const governanceRecords = [];
    const govTypes = ['policy', 'standard', 'guideline', 'procedure', 'exception', 'decision', 'review'];
    const govStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'expired', 'revoked'];
    for (let i = 0; i < numGovernance; i++) {
      const id = `${ID_PREFIXES.GOVERNANCE_RECORD}${String(i + 1).padStart(3, '0')}`;
      const owner = rng.pick(users);
      const app = rng.nextFloat() > 0.3 ? rng.pick(applications) : null;
      const portfolio = rng.nextFloat() > 0.5 ? rng.pick(portfolios) : null;
      const now = generateDatetime(rng, -rng.nextInt(10, 365));
      governanceRecords.push({
        id,
        title: GOVERNANCE_TITLES[i % GOVERNANCE_TITLES.length],
        description: `Governance record: ${GOVERNANCE_TITLES[i % GOVERNANCE_TITLES.length]}. Ensures compliance with organizational standards.`,
        type: rng.pick(govTypes),
        status: rng.pick(govStatuses),
        applicationId: app ? app.id : null,
        portfolioId: portfolio ? portfolio.id : null,
        owner: owner.displayName,
        ownerId: owner.id,
        effectiveDate: generateDateString(-rng.nextInt(0, 180)),
        reviewDate: generateDateString(rng.nextInt(30, 365)),
        complianceImpact: rng.pick(['critical', 'high', 'medium', 'low', 'none']),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(1, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: owner.id,
        updatedBy: owner.id,
        version: 1,
      });
    }
    counts.GOVERNANCE_RECORD = governanceRecords.length;

    // ---- APPROVAL REQUESTS ----
    const approvalRequests = [];
    const approvalTypes = ['new_technology', 'exception', 'waiver', 'change', 'decommission', 'upgrade'];
    const approvalStatuses = ['pending', 'approved', 'rejected', 'withdrawn'];
    for (let i = 0; i < numApprovals; i++) {
      const id = `${ID_PREFIXES.APPROVAL_REQUEST}${String(i + 1).padStart(3, '0')}`;
      const requester = rng.pick(users);
      const approver = rng.pick(users);
      const status = rng.pick(approvalStatuses);
      const submittedOffset = -rng.nextInt(5, 120);
      const now = generateDatetime(rng, submittedOffset);
      approvalRequests.push({
        id,
        title: APPROVAL_REQUEST_TITLES[i % APPROVAL_REQUEST_TITLES.length],
        description: `Approval request: ${APPROVAL_REQUEST_TITLES[i % APPROVAL_REQUEST_TITLES.length]}.`,
        requestType: rng.pick(approvalTypes),
        status,
        requesterId: requester.id,
        requesterName: requester.displayName,
        approverId: status !== 'pending' ? approver.id : null,
        approverName: status !== 'pending' ? approver.displayName : null,
        applicationId: rng.nextFloat() > 0.3 ? rng.pick(applications).id : null,
        standardId: rng.nextFloat() > 0.5 ? rng.pick(techStandards).id : null,
        priority: rng.pick(['critical', 'high', 'medium', 'low']),
        submittedAt: now,
        decidedAt: status !== 'pending' ? generateDatetime(rng, submittedOffset + rng.nextInt(1, 14)) : null,
        decisionNotes: status !== 'pending' ? 'Reviewed and processed by governance board.' : null,
        justification: JUSTIFICATION_TEXTS[i % JUSTIFICATION_TEXTS.length],
        riskAssessment: rng.pick(['critical', 'high', 'medium', 'low', 'none']),
        createdAt: now,
        updatedAt: now,
        createdBy: requester.id,
        updatedBy: requester.id,
        version: 1,
      });
    }
    counts.APPROVAL_REQUEST = approvalRequests.length;

    // ---- WAIVERS ----
    const waivers = [];
    for (let i = 0; i < numWaivers; i++) {
      const id = `${ID_PREFIXES.WAIVER}${String(i + 1).padStart(3, '0')}`;
      const requester = rng.pick(users);
      const approver = rng.pick(users);
      const standard = techStandards[i % techStandards.length];
      const app = applications[i % applications.length];
      const status = rng.pick(govStatuses);
      const effectiveOffset = -rng.nextInt(0, 90);
      const now = generateDatetime(rng, effectiveOffset - rng.nextInt(0, 30));
      waivers.push({
        id,
        title: WAIVER_TITLES[i % WAIVER_TITLES.length],
        description: `Waiver: ${WAIVER_TITLES[i % WAIVER_TITLES.length]}. Temporary exception to standard compliance.`,
        standardId: standard.id,
        applicationId: app.id,
        status,
        requesterId: requester.id,
        requesterName: requester.displayName,
        approverId: status === 'approved' ? approver.id : null,
        approverName: status === 'approved' ? approver.displayName : null,
        justification: JUSTIFICATION_TEXTS[i % JUSTIFICATION_TEXTS.length],
        riskLevel: rng.pick(['critical', 'high', 'medium', 'low', 'none']),
        mitigationPlan: MITIGATION_PLANS[i % MITIGATION_PLANS.length],
        effectiveDate: generateDateString(effectiveOffset),
        expirationDate: generateDateString(effectiveOffset + rng.nextInt(90, 365)),
        conditions: pickN(rng, [
          'Monthly security review required',
          'Quarterly compliance check',
          'Migration plan must be submitted within 30 days',
          'Additional monitoring must be implemented',
          'Vendor support contract must be maintained',
        ], rng.nextInt(1, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: requester.id,
        updatedBy: requester.id,
        version: 1,
      });
    }
    counts.WAIVER = waivers.length;

    // ---- EVIDENCE ----
    const evidenceRecords = [];
    const evidenceTypes = ['test_result', 'scan_report', 'audit_report', 'screenshot', 'document', 'log', 'metric', 'certification', 'other'];
    const evidenceStatuses = ['valid', 'invalid', 'expired', 'pending_review'];
    for (let i = 0; i < numEvidence; i++) {
      const id = `${ID_PREFIXES.EVIDENCE}${String(i + 1).padStart(3, '0')}`;
      const app = applications[i % applications.length];
      const collectedOffset = -rng.nextInt(0, 90);
      const now = generateDatetime(rng, collectedOffset);
      evidenceRecords.push({
        id,
        title: EVIDENCE_TITLES[i % EVIDENCE_TITLES.length],
        description: `Evidence: ${EVIDENCE_TITLES[i % EVIDENCE_TITLES.length]}.`,
        type: rng.pick(evidenceTypes),
        applicationId: app.id,
        qualityGateId: rng.nextFloat() > 0.4 ? qualityGates[i % qualityGates.length].id : null,
        standardId: rng.nextFloat() > 0.5 ? techStandards[i % techStandards.length].id : null,
        source: rng.pick(['SonarQube', 'Snyk', 'Selenium', 'Manual Review', 'Datadog', 'Jenkins']),
        collectedAt: now,
        collectedBy: rng.pick(users).displayName,
        fileUrl: `https://evidence.kpetsip.example.com/files/${id}`,
        fileSize: rng.nextInt(1024, 10485760),
        mimeType: rng.pick(['application/pdf', 'text/html', 'application/json', 'image/png']),
        status: rng.pick(evidenceStatuses),
        data: {},
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(0, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.EVIDENCE = evidenceRecords.length;

    // ---- INTEGRATIONS (22 types) ----
    const integrations = [];
    const integrationTypes = [
      'rest_api', 'graphql', 'webhook', 'ldap', 'saml', 'oauth2', 'oidc',
      'jira', 'servicenow', 'confluence', 'github', 'gitlab', 'azure_devops',
      'jenkins', 'sonarqube', 'snyk', 'splunk', 'datadog', 'elastic',
      'slack', 'teams', 'email',
    ];
    const integrationStatuses = ['active', 'active', 'active', 'inactive', 'error', 'configuring'];
    const authTypes = ['none', 'api_key', 'basic', 'bearer', 'oauth2', 'certificate'];
    const syncFrequencies = ['every 5 minutes', 'every 15 minutes', 'every hour', 'every 6 hours', 'daily', 'weekly'];
    for (let i = 0; i < numIntegrations; i++) {
      const id = `${ID_PREFIXES.INTEGRATION}${String(i + 1).padStart(3, '0')}`;
      const intType = integrationTypes[i % integrationTypes.length];
      const status = rng.pick(integrationStatuses);
      const now = generateDatetime(rng, -rng.nextInt(10, 365));
      integrations.push({
        id,
        name: INTEGRATION_NAMES[i % INTEGRATION_NAMES.length],
        description: `Integration with ${INTEGRATION_NAMES[i % INTEGRATION_NAMES.length]}.`,
        type: intType,
        status,
        direction: rng.pick(['inbound', 'outbound', 'bidirectional']),
        endpoint: `https://api.${intType.replace(/_/g, '-')}.kpetsip.example.com/v1`,
        authType: rng.pick(authTypes),
        lastSyncAt: status === 'active' ? generateDatetime(rng, -rng.nextInt(0, 7)) : null,
        syncFrequency: rng.pick(syncFrequencies),
        errorMessage: status === 'error' ? 'Connection timeout after 30s. Check endpoint availability.' : null,
        config: {
          retryCount: rng.nextInt(1, 5),
          timeoutMs: rng.nextInt(5000, 30000),
          batchSize: rng.nextInt(50, 500),
        },
        healthScore: status === 'active' ? rng.nextInt(70, 100) : (status === 'error' ? rng.nextInt(0, 30) : rng.nextInt(30, 70)),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.INTEGRATION = integrations.length;

    // ---- NOTIFICATIONS ----
    const notifications = [];
    const notifTypes = ['info', 'warning', 'error', 'success', 'action_required'];
    const notifTriggers = [
      'standard_expiring', 'standard_expired', 'waiver_expiring', 'waiver_expired',
      'approval_requested', 'approval_granted', 'approval_rejected',
      'tech_debt_created', 'tech_debt_resolved', 'quality_gate_failed',
      'quality_gate_passed', 'governance_violation', 'ai_analysis_complete',
      'integration_sync_failed',
    ];
    for (let i = 0; i < numNotifications; i++) {
      const id = `${ID_PREFIXES.NOTIFICATION}${String(i + 1).padStart(3, '0')}`;
      const recipient = users[i % users.length];
      const now = generateDatetime(rng, -rng.nextInt(0, 30));
      notifications.push({
        id,
        title: `Notification: ${NOTIFICATION_MESSAGES[i % NOTIFICATION_MESSAGES.length].slice(0, 60)}`,
        message: NOTIFICATION_MESSAGES[i % NOTIFICATION_MESSAGES.length],
        type: rng.pick(notifTypes),
        trigger: rng.pick(notifTriggers),
        recipientId: recipient.id,
        isRead: rng.nextFloat() > 0.5,
        readAt: rng.nextFloat() > 0.5 ? generateDatetime(rng, -rng.nextInt(0, 7)) : null,
        actionUrl: rng.nextFloat() > 0.5 ? `/applications/${rng.pick(applications).id}` : null,
        relatedEntityType: rng.pick(['APPLICATION', 'TECH_STANDARD', 'WAIVER', 'APPROVAL_REQUEST', 'QUALITY_GATE']),
        relatedEntityId: rng.pick(applications).id,
        priority: rng.pick(['critical', 'high', 'medium', 'low']),
        expiresAt: rng.nextFloat() > 0.7 ? generateDatetime(rng, rng.nextInt(7, 60)) : null,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.NOTIFICATION = notifications.length;

    // ---- AI ANALYSES ----
    const aiAnalyses = [];
    const aiFeatures = [
      'tech_radar_analysis', 'lifecycle_prediction', 'risk_assessment',
      'dependency_analysis', 'migration_planning', 'cost_optimization',
      'compliance_check', 'anomaly_detection', 'trend_forecasting',
      'portfolio_optimization', 'standard_recommendation', 'debt_prioritization',
      'impact_analysis',
    ];
    const aiStatuses = ['pending', 'running', 'completed', 'completed', 'completed', 'failed', 'cancelled'];
    for (let i = 0; i < numAIAnalyses; i++) {
      const id = `${ID_PREFIXES.AI_ANALYSIS}${String(i + 1).padStart(3, '0')}`;
      const feature = aiFeatures[i % aiFeatures.length];
      const status = rng.pick(aiStatuses);
      const app = rng.nextFloat() > 0.3 ? rng.pick(applications) : null;
      const portfolio = rng.nextFloat() > 0.5 ? rng.pick(portfolios) : null;
      const requestedBy = rng.pick(users);
      const startedOffset = -rng.nextInt(1, 30);
      const now = generateDatetime(rng, startedOffset);
      const confidenceScore = rng.nextInt(55, 98);

      const recommendations = [];
      const recCount = rng.nextInt(1, 4);
      for (let r = 0; r < recCount; r++) {
        recommendations.push({
          id: `rec-${id}-${r + 1}`,
          title: `Recommendation ${r + 1} for ${feature.replace(/_/g, ' ')}`,
          description: `Based on analysis, consider ${rng.pick(['upgrading', 'migrating', 'consolidating', 'optimizing', 'replacing'])} the ${rng.pick(['infrastructure', 'framework', 'database', 'service', 'pipeline'])}.`,
          priority: rng.pick(['critical', 'high', 'medium', 'low']),
          effort: `${rng.nextInt(1, 12)} weeks`,
          impact: rng.pick(['high', 'medium', 'low']),
          simulated: true,
        });
      }

      aiAnalyses.push({
        id,
        title: AI_ANALYSIS_TITLES[i % AI_ANALYSIS_TITLES.length],
        description: `AI-powered ${feature.replace(/_/g, ' ')} analysis. All results are simulated.`,
        featureType: feature,
        status,
        applicationId: app ? app.id : null,
        portfolioId: portfolio ? portfolio.id : null,
        requestedById: requestedBy.id,
        startedAt: status !== 'pending' ? now : null,
        completedAt: status === 'completed' ? generateDatetime(rng, startedOffset + rng.nextInt(0, 2)) : null,
        inputData: {
          scope: app ? 'application' : (portfolio ? 'portfolio' : 'global'),
          entityId: app ? app.id : (portfolio ? portfolio.id : null),
          parameters: { depth: rng.pick(['shallow', 'standard', 'deep']) },
        },
        results: status === 'completed' ? {
          summary: `Analysis completed with ${confidenceScore}% confidence. ${recommendations.length} recommendation(s) generated.`,
          metrics: {
            riskScore: rng.nextInt(10, 90),
            complianceGap: rng.nextInt(0, 40),
            costSavingsPotential: rng.nextInt(5000, 200000),
            trendSeries: generateTrendSeries(rng, rng.nextInt(40, 80), 0, 100, rng.pick(['up', 'stable', 'down'])),
          },
          simulated: true,
        } : {},
        recommendations: status === 'completed' ? recommendations : [],
        confidenceScore: status === 'completed' ? confidenceScore : null,
        errorMessage: status === 'failed' ? 'Simulated analysis failure: insufficient data for reliable prediction.' : null,
        createdAt: now,
        updatedAt: now,
        createdBy: requestedBy.id,
        updatedBy: requestedBy.id,
        version: 1,
      });
    }
    counts.AI_ANALYSIS = aiAnalyses.length;

    // ---- USE CASES ----
    const useCases = [];
    const ucStatuses = ['draft', 'active', 'in_progress', 'completed', 'deprecated'];
    const ucCategories = ['functional', 'non_functional', 'integration', 'security', 'performance', 'accessibility', 'regression', 'smoke', 'end_to_end'];
    for (let i = 0; i < numUseCases; i++) {
      const id = `${ID_PREFIXES.USE_CASE}${String(i + 1).padStart(3, '0')}`;
      const app = applications[i % applications.length];
      const assignee = rng.pick(users);
      const now = generateDatetime(rng, -rng.nextInt(5, 180));
      const steps = [];
      const stepCount = rng.nextInt(2, 6);
      for (let s = 0; s < stepCount; s++) {
        steps.push({
          stepNumber: s + 1,
          action: `Step ${s + 1}: ${rng.pick(['Navigate to', 'Click on', 'Enter data in', 'Verify', 'Submit', 'Wait for'])} ${rng.pick(['login page', 'dashboard', 'form field', 'search bar', 'submit button', 'confirmation dialog'])}`,
          expectedResult: `Expected outcome for step ${s + 1}`,
        });
      }
      useCases.push({
        id,
        title: USE_CASE_TITLES[i % USE_CASE_TITLES.length],
        description: `Use case: ${USE_CASE_TITLES[i % USE_CASE_TITLES.length]}. Validates expected behavior.`,
        applicationId: app.id,
        status: rng.pick(ucStatuses),
        priority: rng.pick(['critical', 'high', 'medium', 'low']),
        category: rng.pick(ucCategories),
        preconditions: 'User is authenticated and has appropriate permissions.',
        steps,
        expectedResult: 'All steps complete successfully without errors.',
        actualResult: rng.nextFloat() > 0.3 ? 'All steps passed as expected.' : null,
        assigneeId: assignee.id,
        assigneeName: assignee.displayName,
        lastExecutedAt: rng.nextFloat() > 0.4 ? generateDatetime(rng, -rng.nextInt(0, 30)) : null,
        executionCount: rng.nextInt(0, 50),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(0, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: assignee.id,
        updatedBy: assignee.id,
        version: 1,
      });
    }
    counts.USE_CASE = useCases.length;

    // ---- SCHEDULES ----
    const schedules = [];
    const scheduleTypes = ['review', 'assessment', 'sync', 'report', 'maintenance', 'audit'];
    const scheduleFrequencies = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
    const scheduleStatuses = ['active', 'active', 'paused', 'completed', 'cancelled'];
    for (let i = 0; i < numSchedules; i++) {
      const id = `${ID_PREFIXES.SCHEDULE}${String(i + 1).padStart(3, '0')}`;
      const assignee = rng.pick(users);
      const app = rng.nextFloat() > 0.4 ? rng.pick(applications) : null;
      const startOffset = -rng.nextInt(30, 365);
      const now = generateDatetime(rng, startOffset);
      schedules.push({
        id,
        name: SCHEDULE_NAMES[i % SCHEDULE_NAMES.length],
        description: `Scheduled activity: ${SCHEDULE_NAMES[i % SCHEDULE_NAMES.length]}.`,
        type: rng.pick(scheduleTypes),
        frequency: rng.pick(scheduleFrequencies),
        status: rng.pick(scheduleStatuses),
        startDate: generateDateString(startOffset),
        endDate: rng.nextFloat() > 0.5 ? generateDateString(startOffset + rng.nextInt(90, 730)) : null,
        nextRunDate: generateDatetime(rng, rng.nextInt(1, 30)),
        lastRunDate: rng.nextFloat() > 0.3 ? generateDatetime(rng, -rng.nextInt(0, 14)) : null,
        assigneeId: assignee.id,
        applicationId: app ? app.id : null,
        config: {
          reminderDays: rng.nextInt(1, 7),
          autoExecute: rng.nextFloat() > 0.5,
        },
        createdAt: now,
        updatedAt: now,
        createdBy: assignee.id,
        updatedBy: assignee.id,
        version: 1,
      });
    }
    counts.SCHEDULE = schedules.length;

    // ---- DEMO SCENARIOS ----
    const demoScenarios = [];
    for (let i = 0; i < numDemoScenarios; i++) {
      const id = `${ID_PREFIXES.DEMO_SCENARIO}${String(i + 1).padStart(3, '0')}`;
      const now = generateDatetime(rng, -rng.nextInt(10, 180));
      const steps = [];
      const stepCount = rng.nextInt(3, 8);
      for (let s = 0; s < stepCount; s++) {
        steps.push({
          stepNumber: s + 1,
          title: `Step ${s + 1}`,
          description: `Navigate to the ${rng.pick(['dashboard', 'portfolio view', 'application detail', 'standards page', 'governance section', 'AI insights panel'])} and ${rng.pick(['review metrics', 'approve request', 'run analysis', 'export report', 'configure settings'])}`,
          expectedDuration: rng.nextInt(1, 5),
        });
      }
      demoScenarios.push({
        id,
        name: DEMO_SCENARIO_NAMES[i % DEMO_SCENARIO_NAMES.length],
        description: `Demo scenario: ${DEMO_SCENARIO_NAMES[i % DEMO_SCENARIO_NAMES.length]}. Guided walkthrough for stakeholders.`,
        personaId: rng.pick(personaIds),
        steps,
        status: rng.pick(['active', 'active', 'draft']),
        category: rng.pick(['executive', 'technical', 'governance', 'operations']),
        estimatedDuration: rng.nextInt(5, 30),
        tags: pickN(rng, COMMON_TAGS, rng.nextInt(0, 3)),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.DEMO_SCENARIO = demoScenarios.length;

    // ---- PDE CONFIGS ----
    const pdeConfigs = [];
    for (let i = 0; i < numPdeConfigs; i++) {
      const id = `${ID_PREFIXES.PDE_CONFIG}${String(i + 1).padStart(3, '0')}`;
      const now = generateDatetime(rng, -rng.nextInt(30, 365));
      pdeConfigs.push({
        id,
        name: PDE_CONFIG_NAMES[i % PDE_CONFIG_NAMES.length],
        description: `Configuration: ${PDE_CONFIG_NAMES[i % PDE_CONFIG_NAMES.length]}.`,
        category: rng.pick(['display', 'notification', 'data', 'security', 'integration']),
        config: {
          enabled: rng.nextFloat() > 0.3,
          value: rng.nextInt(1, 100),
          options: pickN(rng, ['option_a', 'option_b', 'option_c', 'option_d'], rng.nextInt(1, 3)),
        },
        status: rng.pick(['active', 'active', 'inactive', 'draft']),
        isDefault: i === 0,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        version: 1,
      });
    }
    counts.PDE_CONFIG = pdeConfigs.length;

    // ---- AUDIT LOGS (seed a small set) ----
    const auditLogs = [];
    const auditActions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'execute', 'configure'];
    const auditEntityTypes = ['PORTFOLIO', 'APPLICATION', 'TECH_STANDARD', 'QUALITY_GATE', 'APPROVAL_REQUEST', 'WAIVER', 'USER', 'INTEGRATION'];
    const numAuditLogs = Math.max(5, Math.round(10 * scale));
    for (let i = 0; i < numAuditLogs; i++) {
      const id = `${ID_PREFIXES.AUDIT_LOG}${String(i + 1).padStart(3, '0')}`;
      const user = rng.pick(users);
      const action = rng.pick(auditActions);
      const entityType = rng.pick(auditEntityTypes);
      const now = generateDatetime(rng, -rng.nextInt(0, 90));
      auditLogs.push({
        id,
        action,
        entityType,
        entityId: rng.pick(applications).id,
        entityName: rng.pick(APPLICATION_NAMES),
        userId: user.id,
        userName: user.displayName,
        ipAddress: `192.168.${rng.nextInt(1, 254)}.${rng.nextInt(1, 254)}`,
        userAgent: 'Mozilla/5.0 (KP ETSIP SPA)',
        previousValues: null,
        newValues: null,
        details: `${action} action on ${entityType} by ${user.displayName}`,
        status: rng.pick(['success', 'success', 'success', 'failure']),
        timestamp: now,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        updatedBy: user.id,
        version: 1,
      });
    }
    counts.AUDIT_LOG = auditLogs.length;

    // ---- PERSIST TO LOCALSTORAGE ----
    const storageMap = [
      [STORAGE_KEYS.ROLES, roles],
      [STORAGE_KEYS.USERS, users],
      [STORAGE_KEYS.PORTFOLIOS, portfolios],
      [STORAGE_KEYS.APPLICATIONS, applications],
      [STORAGE_KEYS.RELATIONSHIPS, relationships],
      [STORAGE_KEYS.TECH_CATEGORIES, techCategories],
      [STORAGE_KEYS.TECH_STANDARDS, techStandards],
      [STORAGE_KEYS.TECH_ENTRIES, techEntries],
      [STORAGE_KEYS.DEFINITIONS, definitions],
      [STORAGE_KEYS.ENVIRONMENTS, environments],
      [STORAGE_KEYS.TECH_DEBT, techDebts],
      [STORAGE_KEYS.QUALITY_GATES, qualityGates],
      [STORAGE_KEYS.GOVERNANCE_RECORDS, governanceRecords],
      [STORAGE_KEYS.APPROVAL_REQUESTS, approvalRequests],
      [STORAGE_KEYS.WAIVERS, waivers],
      [STORAGE_KEYS.EVIDENCE, evidenceRecords],
      [STORAGE_KEYS.INTEGRATIONS, integrations],
      [STORAGE_KEYS.NOTIFICATIONS, notifications],
      [STORAGE_KEYS.AI_ANALYSES, aiAnalyses],
      [STORAGE_KEYS.USE_CASES, useCases],
      [STORAGE_KEYS.SCHEDULES, schedules],
      [STORAGE_KEYS.DEMO_SCENARIOS, demoScenarios],
      [STORAGE_KEYS.PDE_CONFIGS, pdeConfigs],
      [STORAGE_KEYS.AUDIT_LOGS, auditLogs],
    ];

    for (const [key, data] of storageMap) {
      const result = setItem(key, data);
      if (!result.success) {
        return { success: false, counts, error: `Failed to persist ${key}: ${result.error}` };
      }
    }

    // ---- SYNC ID COUNTERS ----
    const counterMap = [
      [ID_PREFIXES.ROLE, roles.length],
      [ID_PREFIXES.USER, users.length],
      [ID_PREFIXES.PORTFOLIO, portfolios.length],
      [ID_PREFIXES.APPLICATION, applications.length],
      [ID_PREFIXES.RELATIONSHIP, relationships.length],
      [ID_PREFIXES.TECH_CATEGORY, techCategories.length],
      [ID_PREFIXES.TECH_STANDARD, techStandards.length],
      [ID_PREFIXES.TECH_ENTRY, techEntries.length],
      [ID_PREFIXES.DEFINITION, definitions.length],
      [ID_PREFIXES.ENVIRONMENT, environments.length],
      [ID_PREFIXES.TECH_DEBT, techDebts.length],
      [ID_PREFIXES.QUALITY_GATE, qualityGates.length],
      [ID_PREFIXES.GOVERNANCE_RECORD, governanceRecords.length],
      [ID_PREFIXES.APPROVAL_REQUEST, approvalRequests.length],
      [ID_PREFIXES.WAIVER, waivers.length],
      [ID_PREFIXES.EVIDENCE, evidenceRecords.length],
      [ID_PREFIXES.INTEGRATION, integrations.length],
      [ID_PREFIXES.NOTIFICATION, notifications.length],
      [ID_PREFIXES.AI_ANALYSIS, aiAnalyses.length],
      [ID_PREFIXES.USE_CASE, useCases.length],
      [ID_PREFIXES.SCHEDULE, schedules.length],
      [ID_PREFIXES.DEMO_SCENARIO, demoScenarios.length],
      [ID_PREFIXES.PDE_CONFIG, pdeConfigs.length],
      [ID_PREFIXES.AUDIT_LOG, auditLogs.length],
    ];

    for (const [prefix, count] of counterMap) {
      setCounter(prefix, count + 1);
    }

    // ---- SET SCHEMA VERSION AND SEED SIZE ----
    setSchemaVersion();
    setItem(STORAGE_KEYS.SEED_SIZE, config.key);

    return { success: true, counts, error: null };
  } catch (err) {
    return {
      success: false,
      counts: {},
      error: err && err.message ? err.message : 'Failed to seed database',
    };
  }
};

/**
 * Checks whether the database has been seeded by looking for existing data.
 * @returns {boolean} True if seed data exists.
 */
export const isDatabaseSeeded = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

/**
 * Returns the current seed size from localStorage.
 * @returns {string|null} The seed size key, or null if not set.
 */
export const getCurrentSeedSize = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEED_SIZE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Clears all seeded data and reseeds with the specified configuration.
 * @param {string} [seedSize='standard'] - One of 'small', 'standard', 'large'.
 * @param {string|number} [seedValue='kp-etsip-default-seed'] - Seed value for deterministic PRNG.
 * @returns {{ success: boolean, counts: Object<string, number>, error: string|null }}
 */
export const reseedDatabase = (seedSize = 'standard', seedValue = 'kp-etsip-default-seed') => {
  try {
    const { clear } = require('../storage/storageAdapter');
    clear();
  } catch {
    // If clear fails, proceed with overwrite
    const allKeys = Object.values(STORAGE_KEYS);
    allKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Continue
      }
    });
  }
  return seedDatabase(seedSize, seedValue);
};