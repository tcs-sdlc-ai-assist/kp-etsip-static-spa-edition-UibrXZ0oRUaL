import { getItem } from '../storage/storageAdapter';
import { STORAGE_KEYS, SCORE_BANDS, getScoreBand as getScoreBandFromConstants } from '../constants/constants';
import { getPersonaById } from '../constants/personas';
import { getActivePersona } from './personaManager';

/**
 * Re-export getScoreBand from constants for convenience.
 * Returns the score band object for a given numeric score.
 * @param {number} score - A score between 0 and 100.
 * @returns {{ key: string, label: string, min: number, max: number, color: string, bgColor: string, textColor: string } | undefined}
 */
export const getScoreBand = (score) => {
  return getScoreBandFromConstants(score);
};

/**
 * Loads an entity array from localStorage by storage key.
 * @param {string} storageKey - The STORAGE_KEYS value.
 * @returns {Array<Object>}
 */
const loadData = (storageKey) => {
  const data = getItem(storageKey);
  return Array.isArray(data) ? data : [];
};

/**
 * Safely computes the average of an array of numbers.
 * @param {number[]} values - Array of numeric values.
 * @returns {number} The average, or 0 if the array is empty.
 */
const safeAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  const validValues = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (validValues.length === 0) {
    return 0;
  }
  return Math.round((validValues.reduce((sum, v) => sum + v, 0) / validValues.length) * 100) / 100;
};

/**
 * Counts records matching a field value.
 * @param {Array<Object>} records - The records to search.
 * @param {string} field - The field name.
 * @param {*} value - The value to match.
 * @returns {number}
 */
const countByField = (records, field, value) => {
  return records.filter((r) => r && r[field] === value).length;
};

/**
 * Groups records by a field value and returns counts.
 * @param {Array<Object>} records - The records to group.
 * @param {string} field - The field name to group by.
 * @returns {Object<string, number>}
 */
const groupByField = (records, field) => {
  const groups = {};
  records.forEach((r) => {
    if (r && r[field] !== null && r[field] !== undefined) {
      const key = String(r[field]);
      groups[key] = (groups[key] || 0) + 1;
    }
  });
  return groups;
};

/**
 * Computes portfolio-level metrics.
 * @param {Array<Object>} portfolios - Portfolio records.
 * @param {Array<Object>} applications - Application records.
 * @returns {Object}
 */
const computePortfolioMetrics = (portfolios, applications) => {
  const total = portfolios.length;
  const active = countByField(portfolios, 'status', 'active');
  const planning = countByField(portfolios, 'status', 'planning');
  const retiring = countByField(portfolios, 'status', 'retiring');
  const retired = countByField(portfolios, 'status', 'retired');

  const complianceScores = portfolios
    .filter((p) => typeof p.complianceScore === 'number')
    .map((p) => p.complianceScore);
  const averageComplianceScore = safeAverage(complianceScores);

  const riskDistribution = groupByField(portfolios, 'riskLevel');
  const criticalityDistribution = groupByField(portfolios, 'criticality');

  const appsPerPortfolio = portfolios.map((p) => {
    const appCount = applications.filter((a) => a.portfolioId === p.id).length;
    return { portfolioId: p.id, portfolioName: p.name, applicationCount: appCount };
  });

  const averageAppsPerPortfolio = total > 0
    ? Math.round((applications.length / total) * 100) / 100
    : 0;

  return {
    total,
    active,
    planning,
    retiring,
    retired,
    averageComplianceScore,
    complianceScoreBand: getScoreBand(averageComplianceScore),
    riskDistribution,
    criticalityDistribution,
    appsPerPortfolio,
    averageAppsPerPortfolio,
  };
};

/**
 * Computes application-level metrics.
 * @param {Array<Object>} applications - Application records.
 * @returns {Object}
 */
const computeApplicationMetrics = (applications) => {
  const total = applications.length;
  const statusDistribution = groupByField(applications, 'status');
  const riskDistribution = groupByField(applications, 'riskLevel');
  const criticalityDistribution = groupByField(applications, 'criticality');
  const deploymentModelDistribution = groupByField(applications, 'deploymentModel');

  const complianceScores = applications
    .filter((a) => typeof a.complianceScore === 'number')
    .map((a) => a.complianceScore);
  const averageComplianceScore = safeAverage(complianceScores);
  const minComplianceScore = complianceScores.length > 0 ? Math.min(...complianceScores) : 0;
  const maxComplianceScore = complianceScores.length > 0 ? Math.max(...complianceScores) : 0;

  const teamSizes = applications
    .filter((a) => typeof a.teamSize === 'number')
    .map((a) => a.teamSize);
  const averageTeamSize = safeAverage(teamSizes);

  const highRiskCount = applications.filter(
    (a) => a.riskLevel === 'critical' || a.riskLevel === 'high'
  ).length;

  const lowComplianceCount = applications.filter(
    (a) => typeof a.complianceScore === 'number' && a.complianceScore < 40
  ).length;

  return {
    total,
    statusDistribution,
    riskDistribution,
    criticalityDistribution,
    deploymentModelDistribution,
    averageComplianceScore,
    complianceScoreBand: getScoreBand(averageComplianceScore),
    minComplianceScore,
    maxComplianceScore,
    averageTeamSize,
    highRiskCount,
    lowComplianceCount,
  };
};

/**
 * Computes technology standard metrics.
 * @param {Array<Object>} standards - Tech standard records.
 * @returns {Object}
 */
const computeStandardMetrics = (standards) => {
  const total = standards.length;
  const statusDistribution = groupByField(standards, 'status');
  const complianceLevelDistribution = groupByField(standards, 'complianceLevel');
  const riskDistribution = groupByField(standards, 'riskLevel');

  const adoptionPercentages = standards
    .filter((s) => typeof s.adoptionPercentage === 'number')
    .map((s) => s.adoptionPercentage);
  const averageAdoption = safeAverage(adoptionPercentages);

  const preferred = countByField(standards, 'status', 'preferred');
  const recommended = countByField(standards, 'status', 'recommended');
  const emerging = countByField(standards, 'status', 'emerging');
  const retiring = countByField(standards, 'status', 'retiring');
  const retired = countByField(standards, 'status', 'retired');
  const prohibited = countByField(standards, 'status', 'prohibited');

  const adoptionRate = total > 0
    ? Math.round(((preferred + recommended) / total) * 100)
    : 0;

  return {
    total,
    statusDistribution,
    complianceLevelDistribution,
    riskDistribution,
    averageAdoption,
    adoptionRate,
    preferred,
    recommended,
    emerging,
    retiring,
    retired,
    prohibited,
  };
};

/**
 * Computes tech debt metrics.
 * @param {Array<Object>} techDebts - Tech debt records.
 * @returns {Object}
 */
const computeTechDebtMetrics = (techDebts) => {
  const total = techDebts.length;
  const statusDistribution = groupByField(techDebts, 'status');
  const priorityDistribution = groupByField(techDebts, 'priority');
  const categoryDistribution = groupByField(techDebts, 'category');
  const severityDistribution = groupByField(techDebts, 'severity');

  const open = techDebts.filter((d) => d.status !== 'resolved').length;
  const resolved = countByField(techDebts, 'status', 'resolved');
  const critical = countByField(techDebts, 'priority', 'critical');
  const high = countByField(techDebts, 'priority', 'high');

  const estimatedCosts = techDebts
    .filter((d) => typeof d.estimatedCost === 'number' && d.status !== 'resolved')
    .map((d) => d.estimatedCost);
  const totalEstimatedCost = estimatedCosts.reduce((sum, c) => sum + c, 0);
  const averageEstimatedCost = safeAverage(estimatedCosts);

  const impactScores = techDebts
    .filter((d) => typeof d.impactScore === 'number')
    .map((d) => d.impactScore);
  const averageImpactScore = safeAverage(impactScores);

  const resolutionRate = total > 0
    ? Math.round((resolved / total) * 100)
    : 0;

  return {
    total,
    open,
    resolved,
    critical,
    high,
    statusDistribution,
    priorityDistribution,
    categoryDistribution,
    severityDistribution,
    totalEstimatedCost,
    averageEstimatedCost,
    averageImpactScore,
    resolutionRate,
  };
};

/**
 * Computes quality gate metrics.
 * @param {Array<Object>} qualityGates - Quality gate records.
 * @returns {Object}
 */
const computeQualityGateMetrics = (qualityGates) => {
  const total = qualityGates.length;
  const statusDistribution = groupByField(qualityGates, 'status');
  const typeDistribution = groupByField(qualityGates, 'type');

  const passed = countByField(qualityGates, 'status', 'passed');
  const failed = countByField(qualityGates, 'status', 'failed');
  const warning = countByField(qualityGates, 'status', 'warning');
  const notEvaluated = countByField(qualityGates, 'status', 'not_evaluated');

  const scores = qualityGates
    .filter((q) => typeof q.score === 'number')
    .map((q) => q.score);
  const averageScore = safeAverage(scores);

  const passRate = total > 0
    ? Math.round((passed / total) * 100)
    : 0;

  const blockingGates = qualityGates.filter((q) => q.isBlocking === true).length;
  const blockingFailed = qualityGates.filter(
    (q) => q.isBlocking === true && q.status === 'failed'
  ).length;

  return {
    total,
    passed,
    failed,
    warning,
    notEvaluated,
    statusDistribution,
    typeDistribution,
    averageScore,
    averageScoreBand: getScoreBand(averageScore),
    passRate,
    blockingGates,
    blockingFailed,
  };
};

/**
 * Computes governance record metrics.
 * @param {Array<Object>} governanceRecords - Governance record records.
 * @returns {Object}
 */
const computeGovernanceMetrics = (governanceRecords) => {
  const total = governanceRecords.length;
  const statusDistribution = groupByField(governanceRecords, 'status');
  const typeDistribution = groupByField(governanceRecords, 'type');
  const complianceImpactDistribution = groupByField(governanceRecords, 'complianceImpact');

  const approved = countByField(governanceRecords, 'status', 'approved');
  const pending = countByField(governanceRecords, 'status', 'pending_review');
  const draft = countByField(governanceRecords, 'status', 'draft');

  return {
    total,
    approved,
    pending,
    draft,
    statusDistribution,
    typeDistribution,
    complianceImpactDistribution,
  };
};

/**
 * Computes approval request metrics.
 * @param {Array<Object>} approvalRequests - Approval request records.
 * @returns {Object}
 */
const computeApprovalMetrics = (approvalRequests) => {
  const total = approvalRequests.length;
  const statusDistribution = groupByField(approvalRequests, 'status');
  const typeDistribution = groupByField(approvalRequests, 'requestType');
  const priorityDistribution = groupByField(approvalRequests, 'priority');

  const pending = countByField(approvalRequests, 'status', 'pending');
  const approved = countByField(approvalRequests, 'status', 'approved');
  const rejected = countByField(approvalRequests, 'status', 'rejected');
  const withdrawn = countByField(approvalRequests, 'status', 'withdrawn');

  const approvalRate = (approved + rejected) > 0
    ? Math.round((approved / (approved + rejected)) * 100)
    : 0;

  return {
    total,
    pending,
    approved,
    rejected,
    withdrawn,
    approvalRate,
    statusDistribution,
    typeDistribution,
    priorityDistribution,
  };
};

/**
 * Computes waiver metrics.
 * @param {Array<Object>} waivers - Waiver records.
 * @returns {Object}
 */
const computeWaiverMetrics = (waivers) => {
  const total = waivers.length;
  const statusDistribution = groupByField(waivers, 'status');
  const riskDistribution = groupByField(waivers, 'riskLevel');

  const approved = countByField(waivers, 'status', 'approved');
  const pending = countByField(waivers, 'status', 'pending_review');
  const expired = countByField(waivers, 'status', 'expired');
  const draft = countByField(waivers, 'status', 'draft');

  return {
    total,
    approved,
    pending,
    expired,
    draft,
    statusDistribution,
    riskDistribution,
  };
};

/**
 * Computes integration metrics.
 * @param {Array<Object>} integrations - Integration records.
 * @returns {Object}
 */
const computeIntegrationMetrics = (integrations) => {
  const total = integrations.length;
  const statusDistribution = groupByField(integrations, 'status');
  const typeDistribution = groupByField(integrations, 'type');
  const directionDistribution = groupByField(integrations, 'direction');

  const active = countByField(integrations, 'status', 'active');
  const error = countByField(integrations, 'status', 'error');
  const inactive = countByField(integrations, 'status', 'inactive');

  const healthScores = integrations
    .filter((i) => typeof i.healthScore === 'number')
    .map((i) => i.healthScore);
  const averageHealthScore = safeAverage(healthScores);

  return {
    total,
    active,
    error,
    inactive,
    statusDistribution,
    typeDistribution,
    directionDistribution,
    averageHealthScore,
    averageHealthScoreBand: getScoreBand(averageHealthScore),
  };
};

/**
 * Computes notification metrics.
 * @param {Array<Object>} notifications - Notification records.
 * @returns {Object}
 */
const computeNotificationMetrics = (notifications) => {
  const total = notifications.length;
  const typeDistribution = groupByField(notifications, 'type');
  const priorityDistribution = groupByField(notifications, 'priority');
  const triggerDistribution = groupByField(notifications, 'trigger');

  const read = notifications.filter((n) => n.isRead === true).length;
  const unread = notifications.filter((n) => n.isRead === false).length;

  return {
    total,
    read,
    unread,
    typeDistribution,
    priorityDistribution,
    triggerDistribution,
  };
};

/**
 * Computes AI analysis metrics.
 * @param {Array<Object>} aiAnalyses - AI analysis records.
 * @returns {Object}
 */
const computeAIAnalysisMetrics = (aiAnalyses) => {
  const total = aiAnalyses.length;
  const statusDistribution = groupByField(aiAnalyses, 'status');
  const featureTypeDistribution = groupByField(aiAnalyses, 'featureType');

  const completed = countByField(aiAnalyses, 'status', 'completed');
  const pending = countByField(aiAnalyses, 'status', 'pending');
  const failed = countByField(aiAnalyses, 'status', 'failed');

  const confidenceScores = aiAnalyses
    .filter((a) => typeof a.confidenceScore === 'number')
    .map((a) => a.confidenceScore);
  const averageConfidenceScore = safeAverage(confidenceScores);

  const totalRecommendations = aiAnalyses.reduce((sum, a) => {
    return sum + (Array.isArray(a.recommendations) ? a.recommendations.length : 0);
  }, 0);

  return {
    total,
    completed,
    pending,
    failed,
    statusDistribution,
    featureTypeDistribution,
    averageConfidenceScore,
    totalRecommendations,
  };
};

/**
 * Computes environment metrics.
 * @param {Array<Object>} environments - Environment records.
 * @returns {Object}
 */
const computeEnvironmentMetrics = (environments) => {
  const total = environments.length;
  const statusDistribution = groupByField(environments, 'status');
  const typeDistribution = groupByField(environments, 'type');
  const healthDistribution = groupByField(environments, 'healthStatus');
  const providerDistribution = groupByField(environments, 'provider');

  const healthy = countByField(environments, 'healthStatus', 'healthy');
  const degraded = countByField(environments, 'healthStatus', 'degraded');
  const down = countByField(environments, 'healthStatus', 'down');

  const healthRate = total > 0
    ? Math.round((healthy / total) * 100)
    : 0;

  return {
    total,
    healthy,
    degraded,
    down,
    healthRate,
    statusDistribution,
    typeDistribution,
    healthDistribution,
    providerDistribution,
  };
};

/**
 * Computes tech entry metrics.
 * @param {Array<Object>} techEntries - Tech entry records.
 * @returns {Object}
 */
const computeTechEntryMetrics = (techEntries) => {
  const total = techEntries.length;
  const complianceDistribution = groupByField(techEntries, 'complianceStatus');

  const compliant = countByField(techEntries, 'complianceStatus', 'compliant');
  const nonCompliant = countByField(techEntries, 'complianceStatus', 'non_compliant');
  const partiallyCompliant = countByField(techEntries, 'complianceStatus', 'partially_compliant');
  const waived = countByField(techEntries, 'complianceStatus', 'waived');
  const notAssessed = countByField(techEntries, 'complianceStatus', 'not_assessed');

  const complianceRate = total > 0
    ? Math.round((compliant / total) * 100)
    : 0;

  return {
    total,
    compliant,
    nonCompliant,
    partiallyCompliant,
    waived,
    notAssessed,
    complianceRate,
    complianceDistribution,
  };
};

/**
 * Computes evidence metrics.
 * @param {Array<Object>} evidence - Evidence records.
 * @returns {Object}
 */
const computeEvidenceMetrics = (evidence) => {
  const total = evidence.length;
  const statusDistribution = groupByField(evidence, 'status');
  const typeDistribution = groupByField(evidence, 'type');

  const valid = countByField(evidence, 'status', 'valid');
  const invalid = countByField(evidence, 'status', 'invalid');
  const expired = countByField(evidence, 'status', 'expired');
  const pendingReview = countByField(evidence, 'status', 'pending_review');

  return {
    total,
    valid,
    invalid,
    expired,
    pendingReview,
    statusDistribution,
    typeDistribution,
  };
};

/**
 * Computes relationship metrics.
 * @param {Array<Object>} relationships - Relationship records.
 * @returns {Object}
 */
const computeRelationshipMetrics = (relationships) => {
  const total = relationships.length;
  const statusDistribution = groupByField(relationships, 'status');
  const typeDistribution = groupByField(relationships, 'relationshipType');
  const criticalityDistribution = groupByField(relationships, 'criticality');
  const dataFlowDistribution = groupByField(relationships, 'dataFlow');

  const active = countByField(relationships, 'status', 'active');
  const critical = relationships.filter(
    (r) => r.criticality === 'critical' || r.criticality === 'high'
  ).length;

  return {
    total,
    active,
    critical,
    statusDistribution,
    typeDistribution,
    criticalityDistribution,
    dataFlowDistribution,
  };
};

/**
 * Computes use case metrics.
 * @param {Array<Object>} useCases - Use case records.
 * @returns {Object}
 */
const computeUseCaseMetrics = (useCases) => {
  const total = useCases.length;
  const statusDistribution = groupByField(useCases, 'status');
  const priorityDistribution = groupByField(useCases, 'priority');
  const categoryDistribution = groupByField(useCases, 'category');

  const completed = countByField(useCases, 'status', 'completed');
  const active = countByField(useCases, 'status', 'active');
  const inProgress = countByField(useCases, 'status', 'in_progress');

  const executionCounts = useCases
    .filter((u) => typeof u.executionCount === 'number')
    .map((u) => u.executionCount);
  const totalExecutions = executionCounts.reduce((sum, c) => sum + c, 0);
  const averageExecutions = safeAverage(executionCounts);

  const completionRate = total > 0
    ? Math.round((completed / total) * 100)
    : 0;

  return {
    total,
    completed,
    active,
    inProgress,
    completionRate,
    totalExecutions,
    averageExecutions,
    statusDistribution,
    priorityDistribution,
    categoryDistribution,
  };
};

/**
 * Maps entity type keys to their storage keys and compute functions.
 * @type {Object<string, { storageKey: string, compute: function }>}
 */
const ENTITY_METRIC_MAP = {
  PORTFOLIO: {
    storageKey: STORAGE_KEYS.PORTFOLIOS,
    compute: (records) => computePortfolioMetrics(records, loadData(STORAGE_KEYS.APPLICATIONS)),
  },
  APPLICATION: {
    storageKey: STORAGE_KEYS.APPLICATIONS,
    compute: computeApplicationMetrics,
  },
  TECH_STANDARD: {
    storageKey: STORAGE_KEYS.TECH_STANDARDS,
    compute: computeStandardMetrics,
  },
  TECH_ENTRY: {
    storageKey: STORAGE_KEYS.TECH_ENTRIES,
    compute: computeTechEntryMetrics,
  },
  TECH_DEBT: {
    storageKey: STORAGE_KEYS.TECH_DEBT,
    compute: computeTechDebtMetrics,
  },
  QUALITY_GATE: {
    storageKey: STORAGE_KEYS.QUALITY_GATES,
    compute: computeQualityGateMetrics,
  },
  GOVERNANCE_RECORD: {
    storageKey: STORAGE_KEYS.GOVERNANCE_RECORDS,
    compute: computeGovernanceMetrics,
  },
  APPROVAL_REQUEST: {
    storageKey: STORAGE_KEYS.APPROVAL_REQUESTS,
    compute: computeApprovalMetrics,
  },
  WAIVER: {
    storageKey: STORAGE_KEYS.WAIVERS,
    compute: computeWaiverMetrics,
  },
  ENVIRONMENT: {
    storageKey: STORAGE_KEYS.ENVIRONMENTS,
    compute: computeEnvironmentMetrics,
  },
  INTEGRATION: {
    storageKey: STORAGE_KEYS.INTEGRATIONS,
    compute: computeIntegrationMetrics,
  },
  NOTIFICATION: {
    storageKey: STORAGE_KEYS.NOTIFICATIONS,
    compute: computeNotificationMetrics,
  },
  AI_ANALYSIS: {
    storageKey: STORAGE_KEYS.AI_ANALYSES,
    compute: computeAIAnalysisMetrics,
  },
  EVIDENCE: {
    storageKey: STORAGE_KEYS.EVIDENCE,
    compute: computeEvidenceMetrics,
  },
  RELATIONSHIP: {
    storageKey: STORAGE_KEYS.RELATIONSHIPS,
    compute: computeRelationshipMetrics,
  },
  USE_CASE: {
    storageKey: STORAGE_KEYS.USE_CASES,
    compute: computeUseCaseMetrics,
  },
};

/**
 * Computes metrics for a specific entity type, optionally scoped to a portfolio or application.
 * All scores are recalculated on demand from current localStorage data.
 *
 * @param {string} entityType - The entity type key (e.g., 'PORTFOLIO', 'APPLICATION', 'TECH_DEBT').
 * @param {Object} [scope={}] - Optional scope filters.
 * @param {string} [scope.portfolioId] - Filter records by portfolio ID.
 * @param {string} [scope.applicationId] - Filter records by application ID.
 * @returns {{ success: boolean, entityType: string, metrics: Object|null, error: string|null }}
 */
export const computeMetrics = (entityType, scope = {}) => {
  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return { success: false, entityType: '', metrics: null, error: 'Entity type must be a non-empty string' };
  }

  const normalizedType = entityType.trim().toUpperCase();
  const config = ENTITY_METRIC_MAP[normalizedType];

  if (!config) {
    return { success: false, entityType: normalizedType, metrics: null, error: `Unknown entity type: ${normalizedType}` };
  }

  try {
    let records = loadData(config.storageKey);

    // Apply scope filters
    if (scope && typeof scope === 'object') {
      if (typeof scope.portfolioId === 'string' && scope.portfolioId.trim() !== '') {
        const portfolioId = scope.portfolioId.trim();
        if (normalizedType === 'PORTFOLIO') {
          records = records.filter((r) => r && r.id === portfolioId);
        } else if (normalizedType === 'APPLICATION') {
          records = records.filter((r) => r && r.portfolioId === portfolioId);
        } else {
          // For other entity types, filter by applicationId belonging to the portfolio
          const applications = loadData(STORAGE_KEYS.APPLICATIONS);
          const portfolioAppIds = new Set(
            applications
              .filter((a) => a && a.portfolioId === portfolioId)
              .map((a) => a.id)
          );
          if (records.length > 0 && records[0] && 'applicationId' in records[0]) {
            records = records.filter((r) => r && portfolioAppIds.has(r.applicationId));
          }
        }
      }

      if (typeof scope.applicationId === 'string' && scope.applicationId.trim() !== '') {
        const applicationId = scope.applicationId.trim();
        if (normalizedType === 'APPLICATION') {
          records = records.filter((r) => r && r.id === applicationId);
        } else if (records.length > 0 && records[0] && 'applicationId' in records[0]) {
          records = records.filter((r) => r && r.applicationId === applicationId);
        }
      }
    }

    const metrics = config.compute(records);

    return { success: true, entityType: normalizedType, metrics, error: null };
  } catch (err) {
    return {
      success: false,
      entityType: normalizedType,
      metrics: null,
      error: err && err.message ? err.message : 'Failed to compute metrics',
    };
  }
};

/**
 * Computes dashboard-level metrics for a given persona.
 * Aggregates KPIs across all relevant entity types based on the persona's access level
 * and data scope. All scores are recalculated on demand.
 *
 * @param {string|Object} persona - Persona ID string or persona object.
 * @returns {{ success: boolean, metrics: Object|null, error: string|null }}
 */
export const computeDashboardMetrics = (persona) => {
  try {
    let resolvedPersona = null;

    if (typeof persona === 'object' && persona !== null && typeof persona.accessLevel === 'string') {
      resolvedPersona = persona;
    } else if (typeof persona === 'string' && persona.trim() !== '') {
      resolvedPersona = getPersonaById(persona.trim());
    }

    if (!resolvedPersona) {
      try {
        resolvedPersona = getActivePersona();
      } catch {
        resolvedPersona = null;
      }
    }

    // Load all data
    const portfolios = loadData(STORAGE_KEYS.PORTFOLIOS);
    const applications = loadData(STORAGE_KEYS.APPLICATIONS);
    const techStandards = loadData(STORAGE_KEYS.TECH_STANDARDS);
    const techEntries = loadData(STORAGE_KEYS.TECH_ENTRIES);
    const techDebts = loadData(STORAGE_KEYS.TECH_DEBT);
    const qualityGates = loadData(STORAGE_KEYS.QUALITY_GATES);
    const governanceRecords = loadData(STORAGE_KEYS.GOVERNANCE_RECORDS);
    const approvalRequests = loadData(STORAGE_KEYS.APPROVAL_REQUESTS);
    const waivers = loadData(STORAGE_KEYS.WAIVERS);
    const environments = loadData(STORAGE_KEYS.ENVIRONMENTS);
    const integrations = loadData(STORAGE_KEYS.INTEGRATIONS);
    const notifications = loadData(STORAGE_KEYS.NOTIFICATIONS);
    const aiAnalyses = loadData(STORAGE_KEYS.AI_ANALYSES);
    const evidence = loadData(STORAGE_KEYS.EVIDENCE);
    const relationships = loadData(STORAGE_KEYS.RELATIONSHIPS);
    const useCases = loadData(STORAGE_KEYS.USE_CASES);

    // Compute overall compliance score
    const appComplianceScores = applications
      .filter((a) => typeof a.complianceScore === 'number')
      .map((a) => a.complianceScore);
    const overallComplianceScore = safeAverage(appComplianceScores);

    // Compute overall risk distribution
    const riskDistribution = groupByField(applications, 'riskLevel');

    // Tech debt summary
    const openTechDebt = techDebts.filter((d) => d.status !== 'resolved').length;
    const criticalTechDebt = techDebts.filter(
      (d) => d.priority === 'critical' && d.status !== 'resolved'
    ).length;
    const totalDebtCost = techDebts
      .filter((d) => typeof d.estimatedCost === 'number' && d.status !== 'resolved')
      .reduce((sum, d) => sum + d.estimatedCost, 0);

    // Quality gate summary
    const passedGates = countByField(qualityGates, 'status', 'passed');
    const failedGates = countByField(qualityGates, 'status', 'failed');
    const gatePassRate = qualityGates.length > 0
      ? Math.round((passedGates / qualityGates.length) * 100)
      : 0;

    // Standards summary
    const preferredStandards = countByField(techStandards, 'status', 'preferred');
    const recommendedStandards = countByField(techStandards, 'status', 'recommended');
    const retiringStandards = techStandards.filter(
      (s) => s.status === 'retiring' || s.status === 'retired'
    ).length;

    // Tech entry compliance
    const compliantEntries = countByField(techEntries, 'complianceStatus', 'compliant');
    const techEntryComplianceRate = techEntries.length > 0
      ? Math.round((compliantEntries / techEntries.length) * 100)
      : 0;

    // Approval summary
    const pendingApprovals = countByField(approvalRequests, 'status', 'pending');

    // Waiver summary
    const activeWaivers = countByField(waivers, 'status', 'approved');
    const expiringWaivers = countByField(waivers, 'status', 'expired');

    // Environment health
    const healthyEnvironments = countByField(environments, 'healthStatus', 'healthy');
    const environmentHealthRate = environments.length > 0
      ? Math.round((healthyEnvironments / environments.length) * 100)
      : 0;

    // Integration health
    const activeIntegrations = countByField(integrations, 'status', 'active');
    const errorIntegrations = countByField(integrations, 'status', 'error');
    const integrationHealthScores = integrations
      .filter((i) => typeof i.healthScore === 'number')
      .map((i) => i.healthScore);
    const averageIntegrationHealth = safeAverage(integrationHealthScores);

    // Notification summary
    const recipientId = resolvedPersona ? resolvedPersona.id : null;
    const personaNotifications = recipientId
      ? notifications.filter((n) => n.recipientId === recipientId)
      : notifications;
    const unreadNotifications = personaNotifications.filter((n) => n.isRead === false).length;

    // AI analysis summary
    const completedAnalyses = countByField(aiAnalyses, 'status', 'completed');
    const aiConfidenceScores = aiAnalyses
      .filter((a) => typeof a.confidenceScore === 'number')
      .map((a) => a.confidenceScore);
    const averageAIConfidence = safeAverage(aiConfidenceScores);

    // Compute an overall health score (weighted average of key metrics)
    const healthComponents = [];
    if (appComplianceScores.length > 0) {
      healthComponents.push(overallComplianceScore);
    }
    if (qualityGates.length > 0) {
      healthComponents.push(gatePassRate);
    }
    if (techEntries.length > 0) {
      healthComponents.push(techEntryComplianceRate);
    }
    if (environments.length > 0) {
      healthComponents.push(environmentHealthRate);
    }
    if (integrationHealthScores.length > 0) {
      healthComponents.push(averageIntegrationHealth);
    }
    const overallHealthScore = safeAverage(healthComponents);

    const metrics = {
      // Summary KPIs
      overallHealthScore,
      overallHealthScoreBand: getScoreBand(overallHealthScore),
      overallComplianceScore,
      overallComplianceScoreBand: getScoreBand(overallComplianceScore),

      // Entity counts
      totalPortfolios: portfolios.length,
      totalApplications: applications.length,
      totalStandards: techStandards.length,
      totalTechEntries: techEntries.length,
      totalEnvironments: environments.length,
      totalIntegrations: integrations.length,

      // Risk
      riskDistribution,
      highRiskApplications: applications.filter(
        (a) => a.riskLevel === 'critical' || a.riskLevel === 'high'
      ).length,

      // Tech Debt
      openTechDebt,
      criticalTechDebt,
      totalDebtCost,
      techDebtResolutionRate: techDebts.length > 0
        ? Math.round((countByField(techDebts, 'status', 'resolved') / techDebts.length) * 100)
        : 0,

      // Quality Gates
      qualityGatePassRate: gatePassRate,
      passedGates,
      failedGates,
      totalQualityGates: qualityGates.length,

      // Standards
      preferredStandards,
      recommendedStandards,
      retiringStandards,
      standardAdoptionRate: techStandards.length > 0
        ? Math.round(((preferredStandards + recommendedStandards) / techStandards.length) * 100)
        : 0,

      // Tech Entry Compliance
      techEntryComplianceRate,
      compliantEntries,
      totalTechEntriesCount: techEntries.length,

      // Approvals & Waivers
      pendingApprovals,
      activeWaivers,
      expiringWaivers,

      // Environments
      environmentHealthRate,
      healthyEnvironments,
      totalEnvironmentsCount: environments.length,

      // Integrations
      activeIntegrations,
      errorIntegrations,
      averageIntegrationHealth,
      averageIntegrationHealthBand: getScoreBand(averageIntegrationHealth),

      // Notifications
      unreadNotifications,
      totalNotifications: personaNotifications.length,

      // AI
      completedAnalyses,
      averageAIConfidence,
      totalAIAnalyses: aiAnalyses.length,

      // Evidence
      totalEvidence: evidence.length,
      validEvidence: countByField(evidence, 'status', 'valid'),

      // Relationships
      totalRelationships: relationships.length,
      activeRelationships: countByField(relationships, 'status', 'active'),
      criticalRelationships: relationships.filter(
        (r) => r.criticality === 'critical' || r.criticality === 'high'
      ).length,

      // Use Cases
      totalUseCases: useCases.length,
      completedUseCases: countByField(useCases, 'status', 'completed'),
      useCaseCompletionRate: useCases.length > 0
        ? Math.round((countByField(useCases, 'status', 'completed') / useCases.length) * 100)
        : 0,

      // Governance
      totalGovernanceRecords: governanceRecords.length,
      approvedGovernanceRecords: countByField(governanceRecords, 'status', 'approved'),

      // Persona context
      personaId: resolvedPersona ? resolvedPersona.id : null,
      personaName: resolvedPersona ? resolvedPersona.name : null,
      accessLevel: resolvedPersona ? resolvedPersona.accessLevel : null,
    };

    return { success: true, metrics, error: null };
  } catch (err) {
    return {
      success: false,
      metrics: null,
      error: err && err.message ? err.message : 'Failed to compute dashboard metrics',
    };
  }
};

/**
 * Computes trend data for a specific metric type over a given number of months.
 * Extracts trend series from entity metadata where available, or computes
 * point-in-time snapshots from current data.
 *
 * @param {string} metricType - The metric type to compute trends for.
 *   Supported values: 'compliance', 'risk', 'techDebt', 'qualityGates',
 *   'standardAdoption', 'integrationHealth', 'environmentHealth', 'techEntryCompliance'.
 * @param {number} [months=12] - Number of months of trend data to return.
 * @returns {{ success: boolean, metricType: string, trendData: Array<{ month: string, value: number }>|null, error: string|null }}
 */
export const computeTrends = (metricType, months = 12) => {
  if (typeof metricType !== 'string' || metricType.trim() === '') {
    return { success: false, metricType: '', trendData: null, error: 'Metric type must be a non-empty string' };
  }

  const effectiveMonths = typeof months === 'number' && months > 0 ? Math.min(months, 36) : 12;

  try {
    const normalizedMetric = metricType.trim().toLowerCase();

    /**
     * Extracts trend series from entity metadata if available.
     * Falls back to generating a synthetic trend from the current value.
     * @param {Array<Object>} records - Records that may contain metadata.trendSeries.
     * @param {function} currentValueFn - Function to compute the current metric value.
     * @returns {Array<{ month: string, value: number }>}
     */
    const extractOrSynthesizeTrend = (records, currentValueFn) => {
      // Try to find trend series in metadata
      const recordsWithTrends = records.filter(
        (r) => r && r.metadata && Array.isArray(r.metadata.trendSeries) && r.metadata.trendSeries.length > 0
      );

      if (recordsWithTrends.length > 0) {
        // Aggregate trend series across records by month
        const monthMap = {};
        recordsWithTrends.forEach((r) => {
          r.metadata.trendSeries.forEach((point) => {
            if (point && point.month && typeof point.value === 'number') {
              if (!monthMap[point.month]) {
                monthMap[point.month] = [];
              }
              monthMap[point.month].push(point.value);
            }
          });
        });

        const aggregated = Object.entries(monthMap)
          .map(([month, values]) => ({
            month,
            value: safeAverage(values),
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-effectiveMonths);

        if (aggregated.length > 0) {
          return aggregated;
        }
      }

      // Fallback: synthesize a flat trend from the current value
      const currentValue = currentValueFn();
      const trendData = [];
      const now = new Date();
      for (let i = effectiveMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trendData.push({ month: monthStr, value: currentValue });
      }
      return trendData;
    };

    let trendData = null;

    switch (normalizedMetric) {
      case 'compliance': {
        const applications = loadData(STORAGE_KEYS.APPLICATIONS);
        trendData = extractOrSynthesizeTrend(applications, () => {
          const scores = applications
            .filter((a) => typeof a.complianceScore === 'number')
            .map((a) => a.complianceScore);
          return safeAverage(scores);
        });
        break;
      }
      case 'risk': {
        const applications = loadData(STORAGE_KEYS.APPLICATIONS);
        trendData = extractOrSynthesizeTrend(applications, () => {
          const highRisk = applications.filter(
            (a) => a.riskLevel === 'critical' || a.riskLevel === 'high'
          ).length;
          return applications.length > 0
            ? Math.round(((applications.length - highRisk) / applications.length) * 100)
            : 100;
        });
        break;
      }
      case 'techdebt': {
        const techDebts = loadData(STORAGE_KEYS.TECH_DEBT);
        trendData = extractOrSynthesizeTrend([], () => {
          const resolved = countByField(techDebts, 'status', 'resolved');
          return techDebts.length > 0
            ? Math.round((resolved / techDebts.length) * 100)
            : 0;
        });
        break;
      }
      case 'qualitygates': {
        const qualityGates = loadData(STORAGE_KEYS.QUALITY_GATES);
        const qgWithTrends = qualityGates.filter(
          (q) => q && q.results && Array.isArray(q.results.trendSeries) && q.results.trendSeries.length > 0
        );

        if (qgWithTrends.length > 0) {
          const monthMap = {};
          qgWithTrends.forEach((q) => {
            q.results.trendSeries.forEach((point) => {
              if (point && point.month && typeof point.value === 'number') {
                if (!monthMap[point.month]) {
                  monthMap[point.month] = [];
                }
                monthMap[point.month].push(point.value);
              }
            });
          });

          trendData = Object.entries(monthMap)
            .map(([month, values]) => ({
              month,
              value: safeAverage(values),
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-effectiveMonths);
        }

        if (!trendData || trendData.length === 0) {
          const passed = countByField(qualityGates, 'status', 'passed');
          const passRate = qualityGates.length > 0
            ? Math.round((passed / qualityGates.length) * 100)
            : 0;
          trendData = [];
          const now = new Date();
          for (let i = effectiveMonths - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            trendData.push({ month: monthStr, value: passRate });
          }
        }
        break;
      }
      case 'standardadoption': {
        const standards = loadData(STORAGE_KEYS.TECH_STANDARDS);
        trendData = extractOrSynthesizeTrend(standards, () => {
          const adoptionValues = standards
            .filter((s) => typeof s.adoptionPercentage === 'number')
            .map((s) => s.adoptionPercentage);
          return safeAverage(adoptionValues);
        });
        break;
      }
      case 'integrationhealth': {
        const integrations = loadData(STORAGE_KEYS.INTEGRATIONS);
        trendData = extractOrSynthesizeTrend([], () => {
          const healthScores = integrations
            .filter((i) => typeof i.healthScore === 'number')
            .map((i) => i.healthScore);
          return safeAverage(healthScores);
        });
        break;
      }
      case 'environmenthealth': {
        const environments = loadData(STORAGE_KEYS.ENVIRONMENTS);
        trendData = extractOrSynthesizeTrend([], () => {
          const healthy = countByField(environments, 'healthStatus', 'healthy');
          return environments.length > 0
            ? Math.round((healthy / environments.length) * 100)
            : 0;
        });
        break;
      }
      case 'techentrycompliance': {
        const techEntries = loadData(STORAGE_KEYS.TECH_ENTRIES);
        trendData = extractOrSynthesizeTrend([], () => {
          const compliant = countByField(techEntries, 'complianceStatus', 'compliant');
          return techEntries.length > 0
            ? Math.round((compliant / techEntries.length) * 100)
            : 0;
        });
        break;
      }
      default: {
        return {
          success: false,
          metricType: normalizedMetric,
          trendData: null,
          error: `Unknown metric type: ${metricType}. Supported types: compliance, risk, techDebt, qualityGates, standardAdoption, integrationHealth, environmentHealth, techEntryCompliance`,
        };
      }
    }

    return {
      success: true,
      metricType: normalizedMetric,
      trendData: trendData || [],
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      metricType: metricType.trim().toLowerCase(),
      trendData: null,
      error: err && err.message ? err.message : 'Failed to compute trends',
    };
  }
};