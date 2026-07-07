import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersona } from '../contexts/PersonaContext';
import useMetrics from '../hooks/useMetrics';
import ScoreCard from '../components/common/ScoreCard';
import ChartWrapper from '../components/common/ChartWrapper';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import { getScoreBand } from '../constants/constants';

/**
 * Formats a number as a compact currency string.
 * @param {number} value - The numeric value.
 * @returns {string}
 */
const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0';
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

/**
 * Maps risk level to StatusBadge variant.
 * @param {string} riskLevel - The risk level string.
 * @returns {string}
 */
const riskToVariant = (riskLevel) => {
  switch (riskLevel) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
};

/**
 * Main dashboard page rendering role-specific dashboard view.
 * Displays ScoreCards, ChartWrappers, and summary tables based on persona's data scope.
 * Uses metricsEngine for computed KPIs and trends.
 * Shows simulated loading state. Accessible with ARIA landmarks.
 *
 * @returns {React.ReactElement}
 */
const DashboardPage = () => {
  const { persona } = usePersona();
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  const { metrics: dashboardMetrics, loading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useMetrics('dashboard');
  const { metrics: complianceTrend, loading: complianceTrendLoading } = useMetrics('trend:compliance');
  const { metrics: qualityGateTrend, loading: qgTrendLoading } = useMetrics('trend:qualityGates');
  const { metrics: techDebtTrend, loading: debtTrendLoading } = useMetrics('trend:techDebt');
  const { metrics: standardAdoptionTrend, loading: adoptionTrendLoading } = useMetrics('trend:standardAdoption');

  // Simulate loading state for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = simulatedLoading || metricsLoading;

  /**
   * Determines which dashboard sections to show based on persona access level.
   * @returns {{ showPortfolios: boolean, showTechDebt: boolean, showQualityGates: boolean, showApprovals: boolean, showIntegrations: boolean, showAI: boolean, showGovernance: boolean, showEnvironments: boolean }}
   */
  const visibleSections = useMemo(() => {
    const accessLevel = persona.accessLevel;
    return {
      showPortfolios: ['admin', 'executive', 'strategic', 'management', 'read_only'].includes(accessLevel),
      showTechDebt: ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor', 'read_only'].includes(accessLevel),
      showQualityGates: ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor', 'read_only'].includes(accessLevel),
      showApprovals: ['admin', 'executive', 'strategic', 'management', 'operational'].includes(accessLevel),
      showIntegrations: ['admin', 'strategic', 'management', 'operational', 'contributor'].includes(accessLevel),
      showAI: ['admin', 'executive', 'strategic', 'management'].includes(accessLevel),
      showGovernance: ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor'].includes(accessLevel),
      showEnvironments: ['admin', 'strategic', 'management', 'operational', 'contributor'].includes(accessLevel),
    };
  }, [persona.accessLevel]);

  /**
   * Builds risk distribution chart data from dashboard metrics.
   * @returns {Array<{ name: string, value: number }>}
   */
  const riskDistributionData = useMemo(() => {
    if (!dashboardMetrics || !dashboardMetrics.riskDistribution) {
      return [];
    }
    return Object.entries(dashboardMetrics.riskDistribution).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === 'number' ? value : 0,
    }));
  }, [dashboardMetrics]);

  /**
   * Builds compliance trend chart data.
   * @returns {Array<{ month: string, value: number }>}
   */
  const complianceTrendData = useMemo(() => {
    if (!complianceTrend || !Array.isArray(complianceTrend.trendData)) {
      return [];
    }
    return complianceTrend.trendData.map((point) => ({
      month: point.month || '',
      Compliance: typeof point.value === 'number' ? Math.round(point.value) : 0,
    }));
  }, [complianceTrend]);

  /**
   * Builds quality gate trend chart data.
   * @returns {Array<Object>}
   */
  const qualityGateTrendData = useMemo(() => {
    if (!qualityGateTrend || !Array.isArray(qualityGateTrend.trendData)) {
      return [];
    }
    return qualityGateTrend.trendData.map((point) => ({
      month: point.month || '',
      'Pass Rate': typeof point.value === 'number' ? Math.round(point.value) : 0,
    }));
  }, [qualityGateTrend]);

  /**
   * Builds tech debt trend chart data.
   * @returns {Array<Object>}
   */
  const techDebtTrendData = useMemo(() => {
    if (!techDebtTrend || !Array.isArray(techDebtTrend.trendData)) {
      return [];
    }
    return techDebtTrend.trendData.map((point) => ({
      month: point.month || '',
      'Resolution Rate': typeof point.value === 'number' ? Math.round(point.value) : 0,
    }));
  }, [techDebtTrend]);

  /**
   * Builds standard adoption trend chart data.
   * @returns {Array<Object>}
   */
  const standardAdoptionTrendData = useMemo(() => {
    if (!standardAdoptionTrend || !Array.isArray(standardAdoptionTrend.trendData)) {
      return [];
    }
    return standardAdoptionTrend.trendData.map((point) => ({
      month: point.month || '',
      Adoption: typeof point.value === 'number' ? Math.round(point.value) : 0,
    }));
  }, [standardAdoptionTrend]);

  /**
   * Determines trend direction from a trend data array.
   * @param {Array<{ value: number }>} trendData - The trend data.
   * @returns {'up' | 'down' | 'stable'}
   */
  const getTrendDirection = useCallback((trendData) => {
    if (!Array.isArray(trendData) || trendData.length < 2) {
      return 'stable';
    }
    const recent = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    if (!recent || !previous || typeof recent.value !== 'number' || typeof previous.value !== 'number') {
      return 'stable';
    }
    const diff = recent.value - previous.value;
    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
  }, []);

  /**
   * Computes trend value (delta) from trend data.
   * @param {Array<{ value: number }>} trendData - The trend data.
   * @returns {number|null}
   */
  const getTrendValue = useCallback((trendData) => {
    if (!Array.isArray(trendData) || trendData.length < 2) {
      return null;
    }
    const recent = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    if (!recent || !previous || typeof recent.value !== 'number' || typeof previous.value !== 'number') {
      return null;
    }
    return Math.round((recent.value - previous.value) * 100) / 100;
  }, []);

  const complianceTrendDirection = useMemo(() => {
    if (!complianceTrend || !Array.isArray(complianceTrend.trendData)) return 'stable';
    return getTrendDirection(complianceTrend.trendData);
  }, [complianceTrend, getTrendDirection]);

  const complianceTrendValue = useMemo(() => {
    if (!complianceTrend || !Array.isArray(complianceTrend.trendData)) return null;
    return getTrendValue(complianceTrend.trendData);
  }, [complianceTrend, getTrendValue]);

  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    refreshMetrics();
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
  }, [refreshMetrics]);

  /**
   * Formats the access level for display.
   * @param {string} accessLevel - The raw access level string.
   * @returns {string}
   */
  const formatAccessLevel = (accessLevel) => {
    if (typeof accessLevel !== 'string') {
      return '';
    }
    return accessLevel
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading dashboard"
      >
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (metricsError) {
    return (
      <EmptyState
        title="Unable to Load Dashboard"
        message={metricsError}
        actionLabel="Retry"
        onAction={handleRefresh}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-300 dark:text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        }
      />
    );
  }

  if (!dashboardMetrics) {
    return (
      <EmptyState
        title="No Dashboard Data"
        message="Dashboard metrics are not available. Please ensure the database has been seeded."
        actionLabel="Refresh"
        onAction={handleRefresh}
      />
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Dashboard">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Welcome, {persona.name}
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs self-start sm:self-auto"
          aria-label="Refresh dashboard data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </header>

      {/* Primary KPI Score Cards */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Overall Health Score */}
          <ScoreCard
            label="Overall Health"
            value={dashboardMetrics.overallHealthScore}
            suffix="%"
            scoreBand={dashboardMetrics.overallHealthScoreBand}
            trend={complianceTrendDirection}
            trendValue={complianceTrendValue}
            description="Weighted platform health"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            }
          />

          {/* Compliance Score */}
          <ScoreCard
            label="Compliance Score"
            value={dashboardMetrics.overallComplianceScore}
            suffix="%"
            scoreBand={dashboardMetrics.overallComplianceScoreBand}
            trend={complianceTrendDirection}
            trendValue={complianceTrendValue}
            description={`${dashboardMetrics.totalApplications} applications`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            }
          />

          {/* Quality Gate Pass Rate */}
          {visibleSections.showQualityGates && (
            <ScoreCard
              label="Quality Gate Pass Rate"
              value={dashboardMetrics.qualityGatePassRate}
              suffix="%"
              scoreBand={getScoreBand(dashboardMetrics.qualityGatePassRate)}
              trend={
                qualityGateTrend && Array.isArray(qualityGateTrend.trendData)
                  ? getTrendDirection(qualityGateTrend.trendData)
                  : 'stable'
              }
              trendValue={
                qualityGateTrend && Array.isArray(qualityGateTrend.trendData)
                  ? getTrendValue(qualityGateTrend.trendData)
                  : null
              }
              description={`${dashboardMetrics.passedGates} of ${dashboardMetrics.totalQualityGates} passed`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            />
          )}

          {/* Open Tech Debt */}
          {visibleSections.showTechDebt && (
            <ScoreCard
              label="Open Tech Debt"
              value={dashboardMetrics.openTechDebt}
              suffix=" items"
              trend={
                techDebtTrend && Array.isArray(techDebtTrend.trendData)
                  ? getTrendDirection(techDebtTrend.trendData)
                  : 'stable'
              }
              trendValue={
                techDebtTrend && Array.isArray(techDebtTrend.trendData)
                  ? getTrendValue(techDebtTrend.trendData)
                  : null
              }
              description={`${dashboardMetrics.criticalTechDebt} critical · ${formatCurrency(dashboardMetrics.totalDebtCost)} est. cost`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              }
            />
          )}
        </div>
      </section>

      {/* Secondary KPI Score Cards */}
      <section aria-label="Secondary metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Applications */}
          <ScoreCard
            label="Applications"
            value={dashboardMetrics.totalApplications}
            description={`${dashboardMetrics.highRiskApplications} high risk`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            }
          />

          {/* Standards */}
          <ScoreCard
            label="Technology Standards"
            value={dashboardMetrics.totalStandards}
            description={`${dashboardMetrics.standardAdoptionRate}% adoption rate`}
            trend={
              standardAdoptionTrend && Array.isArray(standardAdoptionTrend.trendData)
                ? getTrendDirection(standardAdoptionTrend.trendData)
                : 'stable'
            }
            trendValue={
              standardAdoptionTrend && Array.isArray(standardAdoptionTrend.trendData)
                ? getTrendValue(standardAdoptionTrend.trendData)
                : null
            }
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            }
          />

          {/* Pending Approvals */}
          {visibleSections.showApprovals && (
            <ScoreCard
              label="Pending Approvals"
              value={dashboardMetrics.pendingApprovals}
              description={`${dashboardMetrics.activeWaivers} active waivers`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              }
            />
          )}

          {/* Unread Notifications */}
          <ScoreCard
            label="Unread Notifications"
            value={dashboardMetrics.unreadNotifications}
            description={`${dashboardMetrics.totalNotifications} total`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Charts Row 1: Compliance Trend + Risk Distribution */}
      <section aria-label="Compliance and risk charts" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Compliance Trend */}
        {complianceTrendData.length > 0 && (
          <ChartWrapper
            type="area"
            data={complianceTrendData}
            config={{
              xAxisKey: 'month',
              series: [
                { dataKey: 'Compliance', label: 'Compliance Score', color: '#1a56db' },
              ],
              height: 280,
              showGrid: true,
              showLegend: true,
              showTooltip: true,
            }}
            title="Compliance Score Trend"
          />
        )}

        {/* Risk Distribution */}
        {riskDistributionData.length > 0 && (
          <ChartWrapper
            type="pie"
            data={riskDistributionData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              height: 280,
              showLegend: true,
              showTooltip: true,
              colors: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#6b7280'],
            }}
            title="Application Risk Distribution"
          />
        )}
      </section>

      {/* Charts Row 2: Quality Gates + Tech Debt */}
      {(visibleSections.showQualityGates || visibleSections.showTechDebt) && (
        <section aria-label="Quality and debt charts" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Quality Gate Trend */}
          {visibleSections.showQualityGates && qualityGateTrendData.length > 0 && (
            <ChartWrapper
              type="line"
              data={qualityGateTrendData}
              config={{
                xAxisKey: 'month',
                series: [
                  { dataKey: 'Pass Rate', label: 'Pass Rate %', color: '#16a34a' },
                ],
                height: 280,
                showGrid: true,
                showLegend: true,
                showTooltip: true,
              }}
              title="Quality Gate Pass Rate Trend"
            />
          )}

          {/* Tech Debt Resolution Trend */}
          {visibleSections.showTechDebt && techDebtTrendData.length > 0 && (
            <ChartWrapper
              type="bar"
              data={techDebtTrendData}
              config={{
                xAxisKey: 'month',
                series: [
                  { dataKey: 'Resolution Rate', label: 'Resolution Rate %', color: '#f59e0b' },
                ],
                height: 280,
                showGrid: true,
                showLegend: true,
                showTooltip: true,
              }}
              title="Tech Debt Resolution Rate Trend"
            />
          )}
        </section>
      )}

      {/* Standard Adoption Trend */}
      {standardAdoptionTrendData.length > 0 && (
        <section aria-label="Standard adoption chart">
          <ChartWrapper
            type="area"
            data={standardAdoptionTrendData}
            config={{
              xAxisKey: 'month',
              series: [
                { dataKey: 'Adoption', label: 'Adoption %', color: '#8b5cf6' },
              ],
              height: 260,
              showGrid: true,
              showLegend: true,
              showTooltip: true,
            }}
            title="Standard Adoption Trend"
          />
        </section>
      )}

      {/* Summary Tables Section */}
      <section aria-label="Summary tables" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Environment Health Summary */}
        {visibleSections.showEnvironments && (
          <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Environment Health
              </h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table
                  className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
                  role="table"
                  aria-label="Environment health summary"
                >
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr role="row">
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Metric
                      </th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Total Environments
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {dashboardMetrics.totalEnvironmentsCount}
                      </td>
                    </tr>
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Healthy
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">
                        {dashboardMetrics.healthyEnvironments}
                      </td>
                    </tr>
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Health Rate
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {dashboardMetrics.environmentHealthRate}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Integration Health Summary */}
        {visibleSections.showIntegrations && (
          <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Integration Health
              </h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table
                  className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
                  role="table"
                  aria-label="Integration health summary"
                >
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr role="row">
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Metric
                      </th>
                      <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Total Integrations
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {dashboardMetrics.totalIntegrations}
                      </td>
                    </tr>
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Active
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-green-600 dark:text-green-400">
                        {dashboardMetrics.activeIntegrations}
                      </td>
                    </tr>
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        In Error
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">
                        {dashboardMetrics.errorIntegrations}
                      </td>
                    </tr>
                    <tr role="row" className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                        Avg Health Score
                      </td>
                      <td role="cell" className="whitespace-nowrap px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {dashboardMetrics.averageIntegrationHealth}%
                          </span>
                          {dashboardMetrics.averageIntegrationHealthBand && (
                            <StatusBadge
                              status={dashboardMetrics.averageIntegrationHealthBand.label}
                              variant={
                                dashboardMetrics.averageIntegrationHealthBand.key === 'critical' || dashboardMetrics.averageIntegrationHealthBand.key === 'poor'
                                  ? 'danger'
                                  : dashboardMetrics.averageIntegrationHealthBand.key === 'fair'
                                    ? 'warning'
                                    : 'success'
                              }
                              size="sm"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Governance & AI Summary Row */}
      <section aria-label="Governance and AI summary" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Governance Summary */}
        {visibleSections.showGovernance && (
          <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Governance
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Records</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {dashboardMetrics.totalGovernanceRecords}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Approved</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {dashboardMetrics.approvedGovernanceRecords}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Active Waivers</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {dashboardMetrics.activeWaivers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Expiring Waivers</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {dashboardMetrics.expiringWaivers}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Summary */}
        {visibleSections.showAI && (
          <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                AI Insights
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Total Analyses</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {dashboardMetrics.totalAIAnalyses}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Completed</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {dashboardMetrics.completedAnalyses}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Avg Confidence</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {dashboardMetrics.averageAIConfidence}%
                </span>
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  All AI output is simulated
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio & Relationships Summary */}
        {visibleSections.showPortfolios && (
          <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Portfolios & Relationships
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Portfolios</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {dashboardMetrics.totalPortfolios}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Relationships</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {dashboardMetrics.totalRelationships}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Active Relationships</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {dashboardMetrics.activeRelationships}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Critical Dependencies</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {dashboardMetrics.criticalRelationships}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Additional Metrics Row */}
      <section aria-label="Additional metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tech Entry Compliance */}
        <ScoreCard
          label="Tech Entry Compliance"
          value={dashboardMetrics.techEntryComplianceRate}
          suffix="%"
          scoreBand={getScoreBand(dashboardMetrics.techEntryComplianceRate)}
          description={`${dashboardMetrics.compliantEntries} of ${dashboardMetrics.totalTechEntriesCount} compliant`}
        />

        {/* Evidence */}
        <ScoreCard
          label="Evidence Records"
          value={dashboardMetrics.totalEvidence}
          description={`${dashboardMetrics.validEvidence} valid`}
        />

        {/* Use Cases */}
        <ScoreCard
          label="Use Cases"
          value={dashboardMetrics.totalUseCases}
          description={`${dashboardMetrics.useCaseCompletionRate}% completion rate`}
        />

        {/* Tech Debt Resolution */}
        {visibleSections.showTechDebt && (
          <ScoreCard
            label="Debt Resolution Rate"
            value={dashboardMetrics.techDebtResolutionRate}
            suffix="%"
            scoreBand={getScoreBand(dashboardMetrics.techDebtResolutionRate)}
            description="Resolved vs total"
          />
        )}
      </section>

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          Dashboard data is computed on demand from localStorage. All metrics are recalculated in real time.
          {persona.dataScope !== 'all' && (
            <span> Data scope: {persona.dataScope}.</span>
          )}
        </p>
      </footer>
    </div>
  );
};

export default DashboardPage;