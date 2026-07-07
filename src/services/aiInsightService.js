import {
  listInsights,
  getInsight,
  createInsight,
  updateInsight,
  getAllInsights,
  getInsightSummary,
  getInsightsByFeatureType,
  getInsightsByApplicationId,
  getInsightsByPortfolioId,
} from './aiInsightRepository';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';
import { getItem } from '../storage/storageAdapter';
import { STORAGE_KEYS, ID_PREFIXES, AI_FEATURE_TYPES } from '../constants/constants';
import { generateId } from '../utils/idGenerator';

/**
 * Returns the current active persona info for audit logging.
 * @returns {{ id: string, name: string }}
 */
const getAuditActor = () => {
  try {
    const persona = getActivePersona();
    return { id: persona.id, name: persona.name };
  } catch {
    return { id: 'system', name: 'System' };
  }
};

/**
 * Deterministic hash of a string to produce a stable numeric value.
 * @param {string} str - The string to hash.
 * @returns {number} A positive integer hash.
 */
const hashString = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
};

/**
 * Deterministic pseudo-random number from a seed string, in [0, 1).
 * @param {string} seed - The seed string.
 * @returns {number}
 */
const deterministicRandom = (seed) => {
  const h = hashString(seed);
  return (h % 10000) / 10000;
};

/**
 * Deterministic integer in [min, max] from a seed string.
 * @param {string} seed - The seed string.
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (inclusive).
 * @returns {number}
 */
const deterministicInt = (seed, min, max) => {
  const r = deterministicRandom(seed);
  return Math.floor(r * (max - min + 1)) + min;
};

/**
 * Deterministic pick from an array using a seed string.
 * @template T
 * @param {string} seed - The seed string.
 * @param {T[]} array - The array to pick from.
 * @returns {T}
 */
const deterministicPick = (seed, array) => {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  const index = hashString(seed) % array.length;
  return array[index];
};

/**
 * Loads applications from localStorage.
 * @returns {Array<Object>}
 */
const loadApplications = () => {
  const data = getItem(STORAGE_KEYS.APPLICATIONS);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads portfolios from localStorage.
 * @returns {Array<Object>}
 */
const loadPortfolios = () => {
  const data = getItem(STORAGE_KEYS.PORTFOLIOS);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads tech standards from localStorage.
 * @returns {Array<Object>}
 */
const loadTechStandards = () => {
  const data = getItem(STORAGE_KEYS.TECH_STANDARDS);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads tech debt from localStorage.
 * @returns {Array<Object>}
 */
const loadTechDebt = () => {
  const data = getItem(STORAGE_KEYS.TECH_DEBT);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads quality gates from localStorage.
 * @returns {Array<Object>}
 */
const loadQualityGates = () => {
  const data = getItem(STORAGE_KEYS.QUALITY_GATES);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads relationships from localStorage.
 * @returns {Array<Object>}
 */
const loadRelationships = () => {
  const data = getItem(STORAGE_KEYS.RELATIONSHIPS);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads tech entries from localStorage.
 * @returns {Array<Object>}
 */
const loadTechEntries = () => {
  const data = getItem(STORAGE_KEYS.TECH_ENTRIES);
  return Array.isArray(data) ? data : [];
};

/**
 * Loads waivers from localStorage.
 * @returns {Array<Object>}
 */
const loadWaivers = () => {
  const data = getItem(STORAGE_KEYS.WAIVERS);
  return Array.isArray(data) ? data : [];
};

/**
 * Generates a simulated Tech Radar Analysis result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateTechRadarAnalysis = (context, seed) => {
  const standards = loadTechStandards();
  const statusCounts = { emerging: 0, recommended: 0, preferred: 0, acceptable: 0, retiring: 0, retired: 0, prohibited: 0 };
  standards.forEach((s) => {
    if (s.status && statusCounts[s.status] !== undefined) {
      statusCounts[s.status] += 1;
    }
  });

  const totalStandards = standards.length;
  const adoptRate = totalStandards > 0
    ? Math.round(((statusCounts.preferred + statusCounts.recommended) / totalStandards) * 100)
    : 0;

  return {
    summary: `Tech Radar analysis completed. ${totalStandards} standards evaluated. Adoption rate of preferred/recommended standards: ${adoptRate}%.`,
    metrics: {
      totalStandards,
      statusDistribution: statusCounts,
      adoptionRate: adoptRate,
      emergingCount: statusCounts.emerging,
      retiringCount: statusCounts.retiring + statusCounts.retired,
    },
    recommendations: [
      {
        id: `rec-radar-${seed}-1`,
        title: 'Accelerate adoption of emerging standards',
        description: `${statusCounts.emerging} emerging standard(s) identified. Consider piloting these in non-critical applications to evaluate readiness.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort1', 2, 8)} weeks`,
        impact: 'medium',
        simulated: true,
      },
      {
        id: `rec-radar-${seed}-2`,
        title: 'Plan retirement of deprecated standards',
        description: `${statusCounts.retiring + statusCounts.retired} standard(s) are retiring or retired. Create migration plans for applications still using these.`,
        priority: 'high',
        effort: `${deterministicInt(seed + '-effort2', 4, 16)} weeks`,
        impact: 'high',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Lifecycle Prediction result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateLifecyclePrediction = (context, seed) => {
  const applications = loadApplications();
  const targetApp = context.applicationId
    ? applications.find((a) => a.id === context.applicationId)
    : deterministicPick(seed, applications);

  const appName = targetApp ? targetApp.name : 'Unknown Application';
  const currentStatus = targetApp ? targetApp.status : 'active';
  const predictedMonths = deterministicInt(seed + '-months', 6, 36);
  const riskScore = deterministicInt(seed + '-risk', 15, 85);

  return {
    summary: `Lifecycle prediction for '${appName}': Current status is '${currentStatus}'. Estimated ${predictedMonths} months until next lifecycle transition.`,
    metrics: {
      applicationName: appName,
      currentStatus,
      predictedTransitionMonths: predictedMonths,
      riskScore,
      confidenceLevel: deterministicInt(seed + '-conf', 60, 95),
    },
    recommendations: [
      {
        id: `rec-lifecycle-${seed}-1`,
        title: `Plan for ${appName} lifecycle transition`,
        description: `Based on current trends, '${appName}' is predicted to transition in approximately ${predictedMonths} months. Begin planning now to ensure smooth migration.`,
        priority: riskScore > 60 ? 'high' : 'medium',
        effort: `${deterministicInt(seed + '-effort', 4, 12)} weeks`,
        impact: riskScore > 60 ? 'high' : 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Risk Assessment result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateRiskAssessment = (context, seed) => {
  const applications = loadApplications();
  const techDebt = loadTechDebt();
  const qualityGates = loadQualityGates();

  const highRiskApps = applications.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high');
  const openDebt = techDebt.filter((d) => d.status !== 'resolved');
  const failedGates = qualityGates.filter((q) => q.status === 'failed');

  const overallRisk = deterministicInt(seed + '-overall', 20, 80);

  return {
    summary: `Risk assessment completed. ${highRiskApps.length} high-risk application(s), ${openDebt.length} open tech debt item(s), ${failedGates.length} failed quality gate(s). Overall risk score: ${overallRisk}/100.`,
    metrics: {
      overallRiskScore: overallRisk,
      highRiskApplications: highRiskApps.length,
      openTechDebtItems: openDebt.length,
      failedQualityGates: failedGates.length,
      totalApplications: applications.length,
    },
    recommendations: [
      {
        id: `rec-risk-${seed}-1`,
        title: 'Address critical risk applications',
        description: `${highRiskApps.length} application(s) are classified as high or critical risk. Prioritize remediation of security vulnerabilities and compliance gaps.`,
        priority: 'critical',
        effort: `${deterministicInt(seed + '-effort1', 6, 20)} weeks`,
        impact: 'high',
        simulated: true,
      },
      {
        id: `rec-risk-${seed}-2`,
        title: 'Resolve failed quality gates',
        description: `${failedGates.length} quality gate(s) are currently failing. Address blocking issues to unblock deployments.`,
        priority: 'high',
        effort: `${deterministicInt(seed + '-effort2', 2, 8)} weeks`,
        impact: 'high',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Dependency Analysis result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateDependencyAnalysis = (context, seed) => {
  const relationships = loadRelationships();
  const applications = loadApplications();

  const activeRelationships = relationships.filter((r) => r.status === 'active');
  const criticalDeps = activeRelationships.filter((r) => r.criticality === 'critical' || r.criticality === 'high');

  const dependencyMap = {};
  activeRelationships.forEach((r) => {
    if (!dependencyMap[r.sourceApplicationId]) {
      dependencyMap[r.sourceApplicationId] = 0;
    }
    dependencyMap[r.sourceApplicationId] += 1;
  });

  const maxDeps = Math.max(0, ...Object.values(dependencyMap));
  const mostConnectedId = Object.entries(dependencyMap).sort((a, b) => b[1] - a[1])[0];
  const mostConnectedApp = mostConnectedId
    ? applications.find((a) => a.id === mostConnectedId[0])
    : null;

  return {
    summary: `Dependency analysis completed. ${activeRelationships.length} active relationship(s), ${criticalDeps.length} critical/high dependency(ies). Most connected application: '${mostConnectedApp ? mostConnectedApp.name : 'N/A'}' with ${maxDeps} connection(s).`,
    metrics: {
      totalRelationships: activeRelationships.length,
      criticalDependencies: criticalDeps.length,
      mostConnectedApplication: mostConnectedApp ? mostConnectedApp.name : 'N/A',
      maxConnections: maxDeps,
      averageConnections: applications.length > 0
        ? Math.round((activeRelationships.length / applications.length) * 100) / 100
        : 0,
    },
    recommendations: [
      {
        id: `rec-dep-${seed}-1`,
        title: 'Reduce single points of failure',
        description: `${mostConnectedApp ? `'${mostConnectedApp.name}'` : 'The most connected application'} has ${maxDeps} dependencies. Consider decoupling or adding redundancy.`,
        priority: maxDeps > 5 ? 'high' : 'medium',
        effort: `${deterministicInt(seed + '-effort', 4, 16)} weeks`,
        impact: 'high',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Migration Planning result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateMigrationPlanning = (context, seed) => {
  const techEntries = loadTechEntries();
  const standards = loadTechStandards();

  const nonCompliant = techEntries.filter((e) => e.complianceStatus === 'non_compliant' || e.complianceStatus === 'partially_compliant');
  const retiringStandards = standards.filter((s) => s.status === 'retiring' || s.status === 'retired');

  const estimatedWeeks = deterministicInt(seed + '-weeks', 8, 52);
  const estimatedCost = deterministicInt(seed + '-cost', 50000, 500000);

  return {
    summary: `Migration planning analysis completed. ${nonCompliant.length} non-compliant technology entries identified across ${retiringStandards.length} retiring/retired standard(s). Estimated migration effort: ${estimatedWeeks} weeks.`,
    metrics: {
      nonCompliantEntries: nonCompliant.length,
      retiringStandards: retiringStandards.length,
      estimatedMigrationWeeks: estimatedWeeks,
      estimatedCost,
      migrationComplexity: estimatedWeeks > 26 ? 'high' : (estimatedWeeks > 12 ? 'medium' : 'low'),
    },
    recommendations: [
      {
        id: `rec-mig-${seed}-1`,
        title: 'Prioritize migration of retiring standards',
        description: `${retiringStandards.length} standard(s) are retiring or retired. Create a phased migration plan starting with the most critical applications.`,
        priority: 'high',
        effort: `${estimatedWeeks} weeks`,
        impact: 'high',
        simulated: true,
      },
      {
        id: `rec-mig-${seed}-2`,
        title: 'Address non-compliant technology entries',
        description: `${nonCompliant.length} technology entries are non-compliant or partially compliant. Upgrade to approved versions to reduce risk.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort2', 4, 16)} weeks`,
        impact: 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Cost Optimization result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateCostOptimization = (context, seed) => {
  const applications = loadApplications();
  const techDebt = loadTechDebt();

  const totalEstimatedCost = techDebt.reduce((sum, d) => sum + (typeof d.estimatedCost === 'number' ? d.estimatedCost : 0), 0);
  const savingsPotential = Math.round(totalEstimatedCost * (deterministicInt(seed + '-savings', 15, 40) / 100));
  const cloudApps = applications.filter((a) => a.deploymentModel === 'cloud' || a.deploymentModel === 'saas');

  return {
    summary: `Cost optimization analysis completed. Total estimated tech debt cost: $${totalEstimatedCost.toLocaleString()}. Potential savings: $${savingsPotential.toLocaleString()} (${Math.round((savingsPotential / Math.max(totalEstimatedCost, 1)) * 100)}%).`,
    metrics: {
      totalTechDebtCost: totalEstimatedCost,
      potentialSavings: savingsPotential,
      savingsPercentage: Math.round((savingsPotential / Math.max(totalEstimatedCost, 1)) * 100),
      cloudApplications: cloudApps.length,
      totalApplications: applications.length,
    },
    recommendations: [
      {
        id: `rec-cost-${seed}-1`,
        title: 'Consolidate redundant technology stacks',
        description: `Consolidating overlapping technology stacks across ${applications.length} applications could save an estimated $${Math.round(savingsPotential * 0.4).toLocaleString()} annually.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort1', 8, 24)} weeks`,
        impact: 'high',
        simulated: true,
      },
      {
        id: `rec-cost-${seed}-2`,
        title: 'Optimize cloud resource utilization',
        description: `${cloudApps.length} cloud-deployed application(s) may benefit from right-sizing and reserved instance pricing.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort2', 2, 8)} weeks`,
        impact: 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Compliance Check result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateComplianceCheck = (context, seed) => {
  const applications = loadApplications();
  const waivers = loadWaivers();
  const techEntries = loadTechEntries();

  const compliantEntries = techEntries.filter((e) => e.complianceStatus === 'compliant');
  const nonCompliantEntries = techEntries.filter((e) => e.complianceStatus === 'non_compliant');
  const activeWaivers = waivers.filter((w) => w.status === 'approved');

  const complianceRate = techEntries.length > 0
    ? Math.round((compliantEntries.length / techEntries.length) * 100)
    : 0;

  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (typeof a.complianceScore === 'number' ? a.complianceScore : 0), 0) / applications.length)
    : 0;

  return {
    summary: `Compliance check completed. Overall compliance rate: ${complianceRate}%. Average application compliance score: ${avgScore}/100. ${nonCompliantEntries.length} non-compliant entries, ${activeWaivers.length} active waiver(s).`,
    metrics: {
      complianceRate,
      averageComplianceScore: avgScore,
      compliantEntries: compliantEntries.length,
      nonCompliantEntries: nonCompliantEntries.length,
      activeWaivers: activeWaivers.length,
      totalTechEntries: techEntries.length,
    },
    recommendations: [
      {
        id: `rec-comp-${seed}-1`,
        title: 'Remediate non-compliant technology entries',
        description: `${nonCompliantEntries.length} technology entries are non-compliant. Prioritize remediation based on risk level and business criticality.`,
        priority: nonCompliantEntries.length > 5 ? 'critical' : 'high',
        effort: `${deterministicInt(seed + '-effort1', 4, 16)} weeks`,
        impact: 'high',
        simulated: true,
      },
      {
        id: `rec-comp-${seed}-2`,
        title: 'Review expiring waivers',
        description: `${activeWaivers.length} active waiver(s) should be reviewed for renewal or remediation before expiration.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort2', 1, 4)} weeks`,
        impact: 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Anomaly Detection result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateAnomalyDetection = (context, seed) => {
  const applications = loadApplications();
  const qualityGates = loadQualityGates();

  const anomalyCount = deterministicInt(seed + '-anomalies', 1, 8);
  const failedGates = qualityGates.filter((q) => q.status === 'failed');
  const lowScoreApps = applications.filter((a) => typeof a.complianceScore === 'number' && a.complianceScore < 40);

  const anomalyTypes = ['Unusual deployment frequency', 'Compliance score drop', 'Quality gate regression', 'Unexpected dependency change', 'Configuration drift detected'];

  const detectedAnomalies = [];
  for (let i = 0; i < Math.min(anomalyCount, anomalyTypes.length); i++) {
    detectedAnomalies.push({
      type: anomalyTypes[i],
      severity: deterministicPick(seed + `-sev-${i}`, ['high', 'medium', 'low']),
      affectedEntity: deterministicPick(seed + `-entity-${i}`, applications.map((a) => a.name)),
      simulated: true,
    });
  }

  return {
    summary: `Anomaly detection completed. ${anomalyCount} anomaly(ies) detected across ${applications.length} applications. ${failedGates.length} failed quality gate(s), ${lowScoreApps.length} low-score application(s).`,
    metrics: {
      anomaliesDetected: anomalyCount,
      failedQualityGates: failedGates.length,
      lowScoreApplications: lowScoreApps.length,
      totalApplications: applications.length,
    },
    anomalies: detectedAnomalies,
    recommendations: [
      {
        id: `rec-anomaly-${seed}-1`,
        title: 'Investigate detected anomalies',
        description: `${anomalyCount} anomaly(ies) require investigation. Review deployment logs, configuration changes, and quality gate results.`,
        priority: anomalyCount > 4 ? 'high' : 'medium',
        effort: `${deterministicInt(seed + '-effort', 1, 4)} weeks`,
        impact: 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Trend Forecasting result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateTrendForecasting = (context, seed) => {
  const applications = loadApplications();
  const techDebt = loadTechDebt();

  const avgCompliance = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (typeof a.complianceScore === 'number' ? a.complianceScore : 0), 0) / applications.length)
    : 0;

  const trendDirection = deterministicPick(seed + '-trend', ['improving', 'stable', 'declining']);
  const forecastedScore = trendDirection === 'improving'
    ? Math.min(100, avgCompliance + deterministicInt(seed + '-delta', 5, 15))
    : trendDirection === 'declining'
      ? Math.max(0, avgCompliance - deterministicInt(seed + '-delta', 5, 15))
      : avgCompliance;

  const openDebt = techDebt.filter((d) => d.status !== 'resolved').length;

  return {
    summary: `Trend forecasting completed. Current average compliance: ${avgCompliance}%. Trend: ${trendDirection}. Forecasted compliance in 6 months: ${forecastedScore}%. Open tech debt: ${openDebt} items.`,
    metrics: {
      currentAverageCompliance: avgCompliance,
      trendDirection,
      forecastedCompliance6Months: forecastedScore,
      openTechDebt: openDebt,
      totalApplications: applications.length,
    },
    recommendations: [
      {
        id: `rec-trend-${seed}-1`,
        title: trendDirection === 'declining' ? 'Reverse declining compliance trend' : 'Maintain compliance trajectory',
        description: trendDirection === 'declining'
          ? `Compliance is trending downward. Focus on resolving the ${openDebt} open tech debt items and addressing non-compliant technology entries.`
          : `Compliance is ${trendDirection}. Continue current practices and monitor for emerging risks.`,
        priority: trendDirection === 'declining' ? 'high' : 'low',
        effort: `${deterministicInt(seed + '-effort', 2, 12)} weeks`,
        impact: trendDirection === 'declining' ? 'high' : 'low',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Portfolio Optimization result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generatePortfolioOptimization = (context, seed) => {
  const portfolios = loadPortfolios();
  const applications = loadApplications();

  const portfolioStats = portfolios.map((p) => {
    const apps = applications.filter((a) => a.portfolioId === p.id);
    const avgScore = apps.length > 0
      ? Math.round(apps.reduce((sum, a) => sum + (typeof a.complianceScore === 'number' ? a.complianceScore : 0), 0) / apps.length)
      : 0;
    return {
      portfolioName: p.name,
      applicationCount: apps.length,
      averageComplianceScore: avgScore,
      riskLevel: p.riskLevel || 'medium',
    };
  });

  const lowestScorePortfolio = portfolioStats.sort((a, b) => a.averageComplianceScore - b.averageComplianceScore)[0];

  return {
    summary: `Portfolio optimization analysis completed. ${portfolios.length} portfolio(s) evaluated with ${applications.length} total application(s). Lowest scoring portfolio: '${lowestScorePortfolio ? lowestScorePortfolio.portfolioName : 'N/A'}'.`,
    metrics: {
      totalPortfolios: portfolios.length,
      totalApplications: applications.length,
      portfolioStats,
      lowestScoringPortfolio: lowestScorePortfolio ? lowestScorePortfolio.portfolioName : 'N/A',
    },
    recommendations: [
      {
        id: `rec-portfolio-${seed}-1`,
        title: `Improve compliance in '${lowestScorePortfolio ? lowestScorePortfolio.portfolioName : 'lowest scoring'}' portfolio`,
        description: `This portfolio has the lowest average compliance score (${lowestScorePortfolio ? lowestScorePortfolio.averageComplianceScore : 0}%). Focus remediation efforts here for maximum impact.`,
        priority: 'high',
        effort: `${deterministicInt(seed + '-effort', 6, 20)} weeks`,
        impact: 'high',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Standard Recommendation result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateStandardRecommendation = (context, seed) => {
  const standards = loadTechStandards();
  const techEntries = loadTechEntries();

  const emergingStandards = standards.filter((s) => s.status === 'emerging');
  const lowAdoption = standards.filter((s) => typeof s.adoptionPercentage === 'number' && s.adoptionPercentage < 30);

  const recommendedForAdoption = emergingStandards.slice(0, 3).map((s, i) => ({
    standardName: s.name,
    currentStatus: s.status,
    adoptionPercentage: s.adoptionPercentage || 0,
    recommendation: 'Consider piloting in non-critical applications',
    simulated: true,
  }));

  return {
    summary: `Standard recommendation analysis completed. ${emergingStandards.length} emerging standard(s) identified. ${lowAdoption.length} standard(s) with low adoption (<30%).`,
    metrics: {
      totalStandards: standards.length,
      emergingStandards: emergingStandards.length,
      lowAdoptionStandards: lowAdoption.length,
      totalTechEntries: techEntries.length,
    },
    standardRecommendations: recommendedForAdoption,
    recommendations: [
      {
        id: `rec-std-${seed}-1`,
        title: 'Evaluate emerging standards for adoption',
        description: `${emergingStandards.length} emerging standard(s) should be evaluated for organizational fit. Create proof-of-concept projects to assess viability.`,
        priority: 'medium',
        effort: `${deterministicInt(seed + '-effort1', 2, 8)} weeks`,
        impact: 'medium',
        simulated: true,
      },
      {
        id: `rec-std-${seed}-2`,
        title: 'Increase adoption of low-adoption standards',
        description: `${lowAdoption.length} standard(s) have adoption below 30%. Investigate barriers to adoption and provide training or tooling support.`,
        priority: 'low',
        effort: `${deterministicInt(seed + '-effort2', 4, 12)} weeks`,
        impact: 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Debt Prioritization result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateDebtPrioritization = (context, seed) => {
  const techDebt = loadTechDebt();
  const openDebt = techDebt.filter((d) => d.status !== 'resolved');

  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedDebt = [...openDebt].sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.priority) === -1 ? 99 : priorityOrder.indexOf(a.priority);
    const bIdx = priorityOrder.indexOf(b.priority) === -1 ? 99 : priorityOrder.indexOf(b.priority);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return (b.impactScore || 0) - (a.impactScore || 0);
  });

  const topItems = sortedDebt.slice(0, 5).map((d) => ({
    id: d.id,
    title: d.title,
    priority: d.priority,
    impactScore: d.impactScore || 0,
    estimatedCost: d.estimatedCost || 0,
    category: d.category || 'unknown',
    simulated: true,
  }));

  const totalCost = openDebt.reduce((sum, d) => sum + (typeof d.estimatedCost === 'number' ? d.estimatedCost : 0), 0);

  return {
    summary: `Debt prioritization completed. ${openDebt.length} open tech debt item(s) analyzed. Total estimated remediation cost: $${totalCost.toLocaleString()}. Top ${topItems.length} items prioritized by impact and severity.`,
    metrics: {
      totalOpenDebt: openDebt.length,
      totalEstimatedCost: totalCost,
      criticalItems: openDebt.filter((d) => d.priority === 'critical').length,
      highItems: openDebt.filter((d) => d.priority === 'high').length,
    },
    prioritizedItems: topItems,
    recommendations: [
      {
        id: `rec-debt-${seed}-1`,
        title: 'Address top-priority tech debt items',
        description: `Focus on the top ${topItems.length} prioritized items to maximize risk reduction and compliance improvement.`,
        priority: 'high',
        effort: `${deterministicInt(seed + '-effort', 4, 16)} weeks`,
        impact: 'high',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Generates a simulated Impact Analysis result.
 * @param {Object} context - Context data.
 * @param {string} seed - Deterministic seed.
 * @returns {Object}
 */
const generateImpactAnalysis = (context, seed) => {
  const applications = loadApplications();
  const relationships = loadRelationships();
  const techEntries = loadTechEntries();

  const targetApp = context.applicationId
    ? applications.find((a) => a.id === context.applicationId)
    : deterministicPick(seed, applications);

  const appName = targetApp ? targetApp.name : 'Unknown Application';
  const appId = targetApp ? targetApp.id : '';

  const directDeps = relationships.filter(
    (r) => r.sourceApplicationId === appId || r.targetApplicationId === appId
  );
  const affectedApps = new Set();
  directDeps.forEach((r) => {
    if (r.sourceApplicationId !== appId) affectedApps.add(r.sourceApplicationId);
    if (r.targetApplicationId !== appId) affectedApps.add(r.targetApplicationId);
  });

  const relatedEntries = techEntries.filter((e) => e.applicationId === appId);
  const impactScore = deterministicInt(seed + '-impact', 20, 90);

  return {
    summary: `Impact analysis for '${appName}' completed. ${directDeps.length} direct dependency(ies), ${affectedApps.size} potentially affected application(s), ${relatedEntries.length} technology entries.`,
    metrics: {
      applicationName: appName,
      directDependencies: directDeps.length,
      affectedApplications: affectedApps.size,
      technologyEntries: relatedEntries.length,
      impactScore,
    },
    recommendations: [
      {
        id: `rec-impact-${seed}-1`,
        title: `Assess downstream impact of changes to '${appName}'`,
        description: `Changes to '${appName}' could affect ${affectedApps.size} downstream application(s). Coordinate with dependent teams before making changes.`,
        priority: affectedApps.size > 3 ? 'high' : 'medium',
        effort: `${deterministicInt(seed + '-effort', 1, 6)} weeks`,
        impact: affectedApps.size > 3 ? 'high' : 'medium',
        simulated: true,
      },
    ],
    simulated: true,
  };
};

/**
 * Maps feature types to their generator functions.
 * @type {Object<string, function>}
 */
const FEATURE_GENERATORS = {
  [AI_FEATURE_TYPES.TECH_RADAR_ANALYSIS]: generateTechRadarAnalysis,
  [AI_FEATURE_TYPES.LIFECYCLE_PREDICTION]: generateLifecyclePrediction,
  [AI_FEATURE_TYPES.RISK_ASSESSMENT]: generateRiskAssessment,
  [AI_FEATURE_TYPES.DEPENDENCY_ANALYSIS]: generateDependencyAnalysis,
  [AI_FEATURE_TYPES.MIGRATION_PLANNING]: generateMigrationPlanning,
  [AI_FEATURE_TYPES.COST_OPTIMIZATION]: generateCostOptimization,
  [AI_FEATURE_TYPES.COMPLIANCE_CHECK]: generateComplianceCheck,
  [AI_FEATURE_TYPES.ANOMALY_DETECTION]: generateAnomalyDetection,
  [AI_FEATURE_TYPES.TREND_FORECASTING]: generateTrendForecasting,
  [AI_FEATURE_TYPES.PORTFOLIO_OPTIMIZATION]: generatePortfolioOptimization,
  [AI_FEATURE_TYPES.STANDARD_RECOMMENDATION]: generateStandardRecommendation,
  [AI_FEATURE_TYPES.DEBT_PRIORITIZATION]: generateDebtPrioritization,
  [AI_FEATURE_TYPES.IMPACT_ANALYSIS]: generateImpactAnalysis,
};

/**
 * Generates a deterministic, data-derived AI insight for one of 13 feature types.
 * All output is generated locally from seeded data and labeled as simulated.
 *
 * @param {string} featureType - One of AI_FEATURE_TYPES values (e.g., 'tech_radar_analysis', 'risk_assessment').
 * @param {Object} [context={}] - Context data for the analysis (e.g., applicationId, portfolioId).
 * @returns {{ success: boolean, data: Object|null, error: string|null, simulated: boolean }}
 */
export const getAIInsight = (featureType, context = {}) => {
  if (typeof featureType !== 'string' || featureType.trim() === '') {
    return {
      success: false,
      data: null,
      error: 'Feature type must be a non-empty string',
      simulated: true,
    };
  }

  try {
    const normalizedFeature = featureType.trim().toLowerCase();
    const generator = FEATURE_GENERATORS[normalizedFeature];
    const actor = getAuditActor();
    const now = new Date().toISOString();
    const seed = `${normalizedFeature}-${JSON.stringify(context)}-${now.slice(0, 10)}`;

    if (!generator) {
      // Graceful degradation for unknown feature types
      const fallbackResult = {
        id: generateId(ID_PREFIXES.AI_ANALYSIS),
        title: `AI Analysis: ${featureType}`,
        description: `AI (simulated) — Unknown feature type '${featureType}'. This is a simulated fallback response.`,
        featureType: normalizedFeature,
        status: 'completed',
        applicationId: context.applicationId || null,
        portfolioId: context.portfolioId || null,
        requestedById: actor.id,
        startedAt: now,
        completedAt: now,
        inputData: { ...context, featureType: normalizedFeature },
        results: {
          summary: `AI (simulated) — The requested feature '${featureType}' is not recognized. No analysis could be performed. This is a simulated fallback.`,
          metrics: {},
          simulated: true,
        },
        recommendations: [],
        confidenceScore: 0,
        errorMessage: null,
        simulated: true,
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
        version: 1,
      };

      // Persist the fallback result
      createInsight(fallbackResult);

      // Log audit action
      try {
        logAction({
          action: 'execute',
          userId: actor.id,
          userName: actor.name,
          entityType: 'AI_ANALYSIS',
          entityId: fallbackResult.id,
          entityName: fallbackResult.title,
          status: 'success',
          newValues: { featureType: normalizedFeature, simulated: true, fallback: true },
          details: `AI (simulated) — Unknown feature '${featureType}'. Fallback response generated.`,
        });
      } catch {
        // Audit log failure should not block the operation
      }

      return {
        success: true,
        data: fallbackResult,
        error: null,
        simulated: true,
      };
    }

    // Generate the insight using the appropriate generator
    const generatedResult = generator(context, seed);
    const confidenceScore = deterministicInt(seed + '-confidence', 60, 98);

    const insightRecord = {
      id: generateId(ID_PREFIXES.AI_ANALYSIS),
      title: `AI Analysis: ${normalizedFeature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      description: `AI (simulated) — ${normalizedFeature.replace(/_/g, ' ')} analysis. All results are generated locally from seeded data.`,
      featureType: normalizedFeature,
      status: 'completed',
      applicationId: context.applicationId || null,
      portfolioId: context.portfolioId || null,
      requestedById: actor.id,
      startedAt: now,
      completedAt: now,
      inputData: { ...context, featureType: normalizedFeature },
      results: {
        ...generatedResult,
        simulated: true,
      },
      recommendations: Array.isArray(generatedResult.recommendations) ? generatedResult.recommendations : [],
      confidenceScore,
      errorMessage: null,
      simulated: true,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.id,
      updatedBy: actor.id,
      version: 1,
    };

    // Persist the insight
    const createResult = createInsight(insightRecord);

    if (!createResult.success) {
      return {
        success: false,
        data: null,
        error: createResult.error || 'Failed to persist AI insight',
        simulated: true,
      };
    }

    // Log audit action
    try {
      logAction({
        action: 'execute',
        userId: actor.id,
        userName: actor.name,
        entityType: 'AI_ANALYSIS',
        entityId: insightRecord.id,
        entityName: insightRecord.title,
        status: 'success',
        newValues: {
          featureType: normalizedFeature,
          confidenceScore,
          recommendationCount: insightRecord.recommendations.length,
          simulated: true,
        },
        details: `AI (simulated) — ${normalizedFeature} analysis completed with ${confidenceScore}% confidence. ${insightRecord.recommendations.length} recommendation(s) generated.`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return {
      success: true,
      data: createResult.data ? { ...createResult.data, simulated: true } : { ...insightRecord },
      error: null,
      simulated: true,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to generate AI insight',
      simulated: true,
    };
  }
};

/**
 * Intent library for the askKpetsip function.
 * Maps query patterns to handler functions that generate specific answers.
 * @type {Array<{ patterns: RegExp[], handler: function }>}
 */
const INTENT_LIBRARY = [
  {
    patterns: [
      /how many (applications|apps)/i,
      /total (applications|apps)/i,
      /application count/i,
      /number of (applications|apps)/i,
    ],
    handler: () => {
      const apps = loadApplications();
      const active = apps.filter((a) => a.status === 'active').length;
      return {
        answer: `There are ${apps.length} applications in the system, of which ${active} are currently active.`,
        data: { total: apps.length, active },
        category: 'applications',
      };
    },
  },
  {
    patterns: [
      /how many portfolios/i,
      /total portfolios/i,
      /portfolio count/i,
      /number of portfolios/i,
    ],
    handler: () => {
      const portfolios = loadPortfolios();
      return {
        answer: `There are ${portfolios.length} portfolios in the system.`,
        data: { total: portfolios.length },
        category: 'portfolios',
      };
    },
  },
  {
    patterns: [
      /compliance (score|rate|status)/i,
      /how compliant/i,
      /overall compliance/i,
      /average compliance/i,
    ],
    handler: () => {
      const apps = loadApplications();
      const scores = apps.filter((a) => typeof a.complianceScore === 'number').map((a) => a.complianceScore);
      const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
      const min = scores.length > 0 ? Math.min(...scores) : 0;
      const max = scores.length > 0 ? Math.max(...scores) : 0;
      return {
        answer: `The average compliance score across ${apps.length} applications is ${avg}/100. Scores range from ${min} to ${max}.`,
        data: { average: avg, min, max, applicationCount: apps.length },
        category: 'compliance',
      };
    },
  },
  {
    patterns: [
      /tech(nical)? debt/i,
      /how much debt/i,
      /debt (summary|overview|status)/i,
    ],
    handler: () => {
      const debt = loadTechDebt();
      const open = debt.filter((d) => d.status !== 'resolved');
      const critical = open.filter((d) => d.priority === 'critical').length;
      const totalCost = open.reduce((s, d) => s + (typeof d.estimatedCost === 'number' ? d.estimatedCost : 0), 0);
      return {
        answer: `There are ${open.length} open tech debt items (${critical} critical). Total estimated remediation cost: $${totalCost.toLocaleString()}.`,
        data: { total: debt.length, open: open.length, critical, totalCost },
        category: 'tech_debt',
      };
    },
  },
  {
    patterns: [
      /quality gate/i,
      /gate (status|results|summary)/i,
      /how many gates/i,
    ],
    handler: () => {
      const gates = loadQualityGates();
      const passed = gates.filter((g) => g.status === 'passed').length;
      const failed = gates.filter((g) => g.status === 'failed').length;
      const warning = gates.filter((g) => g.status === 'warning').length;
      return {
        answer: `There are ${gates.length} quality gates: ${passed} passed, ${failed} failed, ${warning} warning.`,
        data: { total: gates.length, passed, failed, warning },
        category: 'quality_gates',
      };
    },
  },
  {
    patterns: [
      /technology standard/i,
      /tech standard/i,
      /standard (summary|overview|status|count)/i,
      /how many standards/i,
    ],
    handler: () => {
      const standards = loadTechStandards();
      const preferred = standards.filter((s) => s.status === 'preferred').length;
      const recommended = standards.filter((s) => s.status === 'recommended').length;
      const retiring = standards.filter((s) => s.status === 'retiring' || s.status === 'retired').length;
      return {
        answer: `There are ${standards.length} technology standards: ${preferred} preferred, ${recommended} recommended, ${retiring} retiring/retired.`,
        data: { total: standards.length, preferred, recommended, retiring },
        category: 'standards',
      };
    },
  },
  {
    patterns: [
      /risk (summary|overview|assessment|level)/i,
      /high risk/i,
      /critical risk/i,
      /what.*risk/i,
    ],
    handler: () => {
      const apps = loadApplications();
      const critical = apps.filter((a) => a.riskLevel === 'critical').length;
      const high = apps.filter((a) => a.riskLevel === 'high').length;
      const medium = apps.filter((a) => a.riskLevel === 'medium').length;
      const low = apps.filter((a) => a.riskLevel === 'low').length;
      return {
        answer: `Risk distribution across ${apps.length} applications: ${critical} critical, ${high} high, ${medium} medium, ${low} low.`,
        data: { total: apps.length, critical, high, medium, low },
        category: 'risk',
      };
    },
  },
  {
    patterns: [
      /waiver/i,
      /how many waivers/i,
      /waiver (summary|status|count)/i,
    ],
    handler: () => {
      const waivers = loadWaivers();
      const approved = waivers.filter((w) => w.status === 'approved').length;
      const pending = waivers.filter((w) => w.status === 'pending_review').length;
      const expired = waivers.filter((w) => w.status === 'expired').length;
      return {
        answer: `There are ${waivers.length} waivers: ${approved} approved, ${pending} pending review, ${expired} expired.`,
        data: { total: waivers.length, approved, pending, expired },
        category: 'waivers',
      };
    },
  },
  {
    patterns: [
      /dependency|dependencies/i,
      /relationship/i,
      /how.*connected/i,
      /integration map/i,
    ],
    handler: () => {
      const relationships = loadRelationships();
      const active = relationships.filter((r) => r.status === 'active').length;
      const critical = relationships.filter((r) => r.criticality === 'critical' || r.criticality === 'high').length;
      return {
        answer: `There are ${relationships.length} application relationships (${active} active). ${critical} are classified as critical or high criticality.`,
        data: { total: relationships.length, active, critical },
        category: 'dependencies',
      };
    },
  },
  {
    patterns: [
      /recommend/i,
      /what should (i|we) do/i,
      /suggestion/i,
      /next step/i,
      /action item/i,
    ],
    handler: () => {
      const debt = loadTechDebt();
      const gates = loadQualityGates();
      const openDebt = debt.filter((d) => d.status !== 'resolved' && d.priority === 'critical');
      const failedGates = gates.filter((g) => g.status === 'failed');

      const recommendations = [];
      if (openDebt.length > 0) {
        recommendations.push(`Address ${openDebt.length} critical tech debt item(s)`);
      }
      if (failedGates.length > 0) {
        recommendations.push(`Resolve ${failedGates.length} failed quality gate(s)`);
      }
      if (recommendations.length === 0) {
        recommendations.push('Continue monitoring compliance scores and tech debt trends');
      }

      return {
        answer: `Top recommendations: ${recommendations.join('. ')}.`,
        data: { recommendations, criticalDebt: openDebt.length, failedGates: failedGates.length },
        category: 'recommendations',
      };
    },
  },
  {
    patterns: [
      /deployment model/i,
      /cloud (adoption|usage|migration)/i,
      /on.?prem/i,
    ],
    handler: () => {
      const apps = loadApplications();
      const cloud = apps.filter((a) => a.deploymentModel === 'cloud').length;
      const onPrem = apps.filter((a) => a.deploymentModel === 'on_premise').length;
      const hybrid = apps.filter((a) => a.deploymentModel === 'hybrid').length;
      const saas = apps.filter((a) => a.deploymentModel === 'saas').length;
      return {
        answer: `Deployment model distribution: ${cloud} cloud, ${onPrem} on-premise, ${hybrid} hybrid, ${saas} SaaS (out of ${apps.length} applications).`,
        data: { total: apps.length, cloud, onPrem, hybrid, saas },
        category: 'deployment',
      };
    },
  },
  {
    patterns: [
      /help/i,
      /what can you do/i,
      /capabilities/i,
      /features/i,
    ],
    handler: () => {
      return {
        answer: 'I can help with: application counts, portfolio overview, compliance scores, tech debt summary, quality gate status, technology standards, risk assessment, waivers, dependencies, deployment models, and recommendations. Try asking a specific question!',
        data: {
          capabilities: [
            'Application counts and status',
            'Portfolio overview',
            'Compliance scores and trends',
            'Tech debt summary and prioritization',
            'Quality gate status',
            'Technology standards overview',
            'Risk assessment',
            'Waiver status',
            'Dependency analysis',
            'Deployment model distribution',
            'Recommendations and next steps',
          ],
        },
        category: 'help',
      };
    },
  },
];

/**
 * Simulated conversational AI assistant that matches queries against an intent library
 * and returns specific, data-derived answers. Degrades gracefully on unknown queries.
 * All output is generated locally from seeded data and labeled as simulated.
 *
 * @param {string} query - The user's natural language query.
 * @returns {{ success: boolean, data: Object|null, error: string|null, simulated: boolean }}
 */
export const askKpetsip = (query) => {
  if (typeof query !== 'string' || query.trim() === '') {
    return {
      success: false,
      data: null,
      error: 'Query must be a non-empty string',
      simulated: true,
    };
  }

  try {
    const actor = getAuditActor();
    const now = new Date().toISOString();
    const trimmedQuery = query.trim();

    // Match against intent library
    let matchedHandler = null;
    for (const intent of INTENT_LIBRARY) {
      for (const pattern of intent.patterns) {
        if (pattern.test(trimmedQuery)) {
          matchedHandler = intent.handler;
          break;
        }
      }
      if (matchedHandler) break;
    }

    let responseData;

    if (matchedHandler) {
      const handlerResult = matchedHandler();
      responseData = {
        query: trimmedQuery,
        answer: `AI (simulated) — ${handlerResult.answer}`,
        data: handlerResult.data || {},
        category: handlerResult.category || 'general',
        matched: true,
        timestamp: now,
        simulated: true,
      };
    } else {
      // Graceful degradation for unknown queries
      responseData = {
        query: trimmedQuery,
        answer: `AI (simulated) — I don't have a specific answer for "${trimmedQuery}". Try asking about applications, portfolios, compliance, tech debt, quality gates, standards, risk, waivers, dependencies, or recommendations. Type "help" for a list of capabilities.`,
        data: {},
        category: 'unknown',
        matched: false,
        timestamp: now,
        simulated: true,
      };
    }

    // Log audit action
    try {
      logAction({
        action: 'execute',
        userId: actor.id,
        userName: actor.name,
        entityType: 'AI_ANALYSIS',
        entityId: null,
        entityName: `Ask KP ETSIP: ${trimmedQuery.slice(0, 60)}`,
        status: 'success',
        newValues: {
          query: trimmedQuery,
          matched: responseData.matched,
          category: responseData.category,
          simulated: true,
        },
        details: `AI (simulated) — askKpetsip query: "${trimmedQuery}". Matched: ${responseData.matched}. Category: ${responseData.category}.`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return {
      success: true,
      data: responseData,
      error: null,
      simulated: true,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to process query',
      simulated: true,
    };
  }
};

/**
 * Lists AI insight records with optional filters.
 * Delegates to the AI insight repository.
 *
 * @param {Object} [filters={}] - Optional filters for listing insights.
 * @returns {{ data: Array<Object>, total: number, page: number, pageSize: number, totalPages: number }}
 */
export const listAIInsights = (filters = {}) => {
  return listInsights(filters);
};

/**
 * Retrieves a single AI insight by ID.
 *
 * @param {string} id - The AI insight ID.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const getAIInsightById = (id) => {
  return getInsight(id);
};

/**
 * Returns all AI insights without pagination.
 *
 * @returns {Array<Object>}
 */
export const listAllAIInsights = () => {
  return getAllInsights();
};

/**
 * Returns a summary of AI insight statistics.
 *
 * @returns {{ total: number, pending: number, running: number, completed: number, failed: number, cancelled: number, averageConfidenceScore: number, byFeatureType: Object<string, number> }}
 */
export const getAIInsightSummary = () => {
  return getInsightSummary();
};

/**
 * Returns AI insights filtered by feature type.
 *
 * @param {string} featureType - The feature type to filter by.
 * @returns {Array<Object>}
 */
export const getAIInsightsByFeatureType = (featureType) => {
  return getInsightsByFeatureType(featureType);
};

/**
 * Returns AI insights filtered by application ID.
 *
 * @param {string} applicationId - The application ID to filter by.
 * @returns {Array<Object>}
 */
export const getAIInsightsByApplicationId = (applicationId) => {
  return getInsightsByApplicationId(applicationId);
};

/**
 * Returns AI insights filtered by portfolio ID.
 *
 * @param {string} portfolioId - The portfolio ID to filter by.
 * @returns {Array<Object>}
 */
export const getAIInsightsByPortfolioId = (portfolioId) => {
  return getInsightsByPortfolioId(portfolioId);
};

/**
 * Returns all available AI feature types.
 *
 * @returns {Array<{ key: string, label: string }>}
 */
export const getAvailableFeatureTypes = () => {
  return Object.entries(AI_FEATURE_TYPES).map(([key, value]) => ({
    key: value,
    label: value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
};