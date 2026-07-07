import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import useEntityList from '../hooks/useEntityList';
import { create } from '../services/entityRepository';
import ScoreCard from '../components/common/ScoreCard';
import ChartWrapper from '../components/common/ChartWrapper';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PermissionDenied from '../components/common/PermissionDenied';
import { getScoreBand } from '../constants/constants';

/**
 * Accessibility Dashboard Page.
 * Displays WCAG compliance score, quality gates status, open accessibility issues,
 * and allows running simulated audits.
 */
const AccessibilityPage = () => {
  const navigate = useNavigate();
  const { hasNavAccess } = usePersona();

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Accessibility page is gated by ACCESSIBILITY nav permission
  const hasAccess = useMemo(() => {
    return hasNavAccess('accessibility');
  }, [hasNavAccess]);

  // Load tech debt list (filtered by category testing/process or custom filter)
  const {
    data: techDebts,
    loading: loadingTechDebts,
    refresh: refreshTechDebts,
  } = useEntityList('TECH_DEBT', {
    filters: { category: 'testing' }, // Since there is no explicit 'accessibility' category in pool, we read category 'testing'
    pageSize: 100,
  });

  // Filter accessibility related tech debts
  const accessibilityDebts = useMemo(() => {
    return techDebts.filter(
      (debt) =>
        debt &&
        (debt.category === 'testing' ||
          (debt.title && debt.title.toLowerCase().includes('access')) ||
          (debt.title && debt.title.toLowerCase().includes('wcag')) ||
          (debt.title && debt.title.toLowerCase().includes('aria')))
    );
  }, [techDebts]);

  // Load quality gates list (filtered by type accessibility)
  const {
    data: qualityGates,
    loading: loadingGates,
    refresh: refreshGates,
  } = useEntityList('QUALITY_GATE', {
    filters: { type: 'accessibility' },
    pageSize: 100,
  });

  useEffect(() => {
    if (hasAccess) {
      const timer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSimulatedLoading(false);
    }
  }, [hasAccess]);

  // Accessibility score calculation
  const accessibilityScore = useMemo(() => {
    if (qualityGates.length === 0) return 96; // Standard target score
    const passed = qualityGates.filter((q) => q.status === 'passed').length;
    const baseScore = (passed / qualityGates.length) * 100;
    
    const countIssues = accessibilityDebts.length;
    const finalScore = Math.max(50, Math.round(baseScore - (countIssues * 2)));
    return finalScore;
  }, [qualityGates, accessibilityDebts]);

  const scoreBand = useMemo(() => {
    return getScoreBand(accessibilityScore);
  }, [accessibilityScore]);

  // Chart data for WCAG Level compliance distribution
  const wcagChartData = useMemo(() => {
    return [
      { name: 'WCAG 2.1 AA Compliant', value: 82, fill: '#16a34a' },
      { name: 'Minor Violations (Level AA)', value: 12, fill: '#f59e0b' },
      { name: 'Critical Violations (Level A)', value: 6, fill: '#ef4444' },
    ];
  }, []);

  const runAccessibilityAudit = useCallback(() => {
    setAuditLoading(true);
    setAuditResult(null);
    
    setTimeout(() => {
      setAuditLoading(false);
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setAuditResult({
          status: 'success',
          message: 'Accessibility audit completed successfully. All pages conform to WCAG 2.1 Level AA standards.',
          timestamp: new Date().toISOString(),
        });
        
        // Log audit trail
        create('AUDIT_LOG', {
          action: 'accessibility_audit',
          entityType: 'ACCESSIBILITY',
          entityId: 'AUD-ACC-' + Date.now().toString().slice(-4),
          entityName: 'On-Demand Accessibility Audit',
          details: 'Simulated on-demand accessibility audit completed with 100% compliance score.',
          status: 'success',
        });
      } else {
        setAuditResult({
          status: 'warning',
          message: 'Accessibility audit completed. Found 1 Level A violation: missing alt text on application logo.',
          timestamp: new Date().toISOString(),
        });
        
        // Create new simulated accessibility issue
        create('TECH_DEBT', {
          title: 'Missing Image Alt Text on Main Application Layout',
          description: 'The main dashboard logo is missing alt attributes, resulting in a WCAG 2.1 Level A compliance violation.',
          priority: 'high',
          severity: 'high',
          status: 'identified',
          category: 'testing',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          impactScore: 70,
          estimatedEffort: '0.5 sprint',
        });
        
        refreshTechDebts();
      }
    }, 1500);
  }, [refreshTechDebts]);

  // Access check
  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied — Accessibility"
        entityType="ACCESSIBILITY"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading || loadingTechDebts || loadingGates) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading accessibility metrics..." />
      </div>
    );
  }

  // Column definitions for accessibility related tech debts
  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: '90px' },
    { key: 'title', label: 'Accessibility Issue / Violation', sortable: true, cellClassName: 'font-medium' },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (val) => {
        let variant = 'info';
        if (val === 'critical') variant = 'danger';
        else if (val === 'high') variant = 'warning';
        else if (val === 'low') variant = 'success';
        return <StatusBadge variant={variant} label={val ? val.toUpperCase() : 'MEDIUM'} />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => {
        let variant = 'neutral';
        if (val === 'resolved') variant = 'success';
        else if (val === 'in_progress') variant = 'info';
        else if (val === 'planned') variant = 'warning';
        return <StatusBadge variant={variant} label={val ? val.replace('_', ' ') : 'identified'} />;
      },
    },
    { key: 'dueDate', label: 'Target Fix Date', sortable: true },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Accessibility Management">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            WCAG 2.1 Accessibility Compliance
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Monitor and govern WCAG 2.1 Level A/AA/AAA compliance across application interfaces.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runAccessibilityAudit}
            disabled={auditLoading}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50"
          >
            {auditLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 10.02 2H10a1 1 0 100-2H10z" clipRule="evenodd" />
              </svg>
            )}
            <span>{auditLoading ? 'Auditing...' : 'Run Accessibility Audit'}</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-label="Accessibility KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="WCAG AA Compliance"
          value={accessibilityScore}
          suffix="%"
          scoreBand={scoreBand}
          description="Conformance to accessibility targets"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Accessibility Defects"
          value={accessibilityDebts.length}
          trend={accessibilityDebts.length > 3 ? 'down' : 'stable'}
          description="Active accessibility violations"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="WCAG level"
          value="Level AA"
          description="Standard compliance tier"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          }
        />
        <ScoreCard
          label="Passing Quality Gates"
          value={qualityGates.filter((q) => q.status === 'passed').length}
          description={`Out of ${qualityGates.length} total accessibility gates`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
      </section>

      {/* audit alert result */}
      {auditResult && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            auditResult.status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300'
              : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-300'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{auditResult.status === 'success' ? '✅' : '⚠️'}</span>
            <div className="flex-1">
              <p className="font-semibold">{auditResult.message}</p>
              <p className="text-2xs opacity-80">Completed at {new Date(auditResult.timestamp).toLocaleTimeString()}</p>
            </div>
            <button
              onClick={() => setAuditResult(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Open Issues */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
            <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50 mb-4">
              Open Accessibility Compliance Issues
            </h2>
            <DataTable
              columns={columns}
              data={accessibilityDebts}
              totalCount={accessibilityDebts.length}
              pageSize={10}
              loading={loadingTechDebts}
              entityType="TECH_DEBT"
            />
          </div>
        </div>

        {/* Right 1 col: WCAG Compliance Chart */}
        <div>
          <ChartWrapper
            type="pie"
            title="WCAG Violation Level Distribution"
            data={wcagChartData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              colors: ['#16a34a', '#f59e0b', '#ef4444'],
              height: 250,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;
