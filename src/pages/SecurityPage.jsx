import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import useEntityList from '../hooks/useEntityList';
import { list, create } from '../services/entityRepository';
import ScoreCard from '../components/common/ScoreCard';
import ChartWrapper from '../components/common/ChartWrapper';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PermissionDenied from '../components/common/PermissionDenied';
import { getScoreBand } from '../constants/constants';

/**
 * Security dashboard page.
 * Displays vulnerability metrics, security quality gates status, open security tech debts,
 * active security integrations, and allows running simulated scans.
 */
const SecurityPage = () => {
  const navigate = useNavigate();
  const { hasNavAccess, canView } = usePersona();

  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Security page is gated by SECURITY nav permission
  const hasAccess = useMemo(() => {
    return hasNavAccess('security');
  }, [hasNavAccess]);

  // Load tech debt list (filtered by category security)
  const {
    data: techDebts,
    loading: loadingTechDebts,
    refresh: refreshTechDebts,
  } = useEntityList('TECH_DEBT', {
    filters: { category: 'security' },
    pageSize: 100,
  });

  // Load quality gates list (filtered by type security)
  const {
    data: qualityGates,
    loading: loadingGates,
    refresh: refreshGates,
  } = useEntityList('QUALITY_GATE', {
    filters: { type: 'security' },
    pageSize: 100,
  });

  // Load integrations (filtered by snyk, sonarqube, webhooks)
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const loadIntegrations = useCallback(() => {
    setLoadingIntegrations(true);
    try {
      const res = list('INTEGRATION', { pageSize: 100 });
      if (res.success && Array.isArray(res.data)) {
        // Filter security integrations
        const securityInts = res.data.filter(
          (item) =>
            item &&
            (item.type === 'sonarqube' ||
              item.type === 'snyk' ||
              (item.name && item.name.toLowerCase().includes('security')))
        );
        setIntegrations(securityInts);
      }
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadIntegrations();
      const timer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSimulatedLoading(false);
    }
  }, [hasAccess, loadIntegrations]);

  // Security score calculation (based on Quality Gates and Tech Debt)
  const securityScore = useMemo(() => {
    if (qualityGates.length === 0) return 92; // Default premium starting score
    const passed = qualityGates.filter((q) => q.status === 'passed').length;
    const baseScore = (passed / qualityGates.length) * 100;
    
    // Deduct for open critical tech debt
    const criticalDebt = techDebts.filter((d) => d.priority === 'critical' && d.status !== 'resolved').length;
    const highDebt = techDebts.filter((d) => d.priority === 'high' && d.status !== 'resolved').length;
    
    const finalScore = Math.max(30, Math.round(baseScore - (criticalDebt * 10) - (highDebt * 3)));
    return finalScore;
  }, [qualityGates, techDebts]);

  const scoreBand = useMemo(() => {
    return getScoreBand(securityScore);
  }, [securityScore]);

  // Tech Debt summary counts
  const vulnerabilityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    techDebts.forEach((debt) => {
      if (debt.status !== 'resolved') {
        counts.total += 1;
        if (debt.priority === 'critical') counts.critical += 1;
        else if (debt.priority === 'high') counts.high += 1;
        else if (debt.priority === 'medium') counts.medium += 1;
        else counts.low += 1;
      }
    });
    return counts;
  }, [techDebts]);

  // Chart data for vulnerability distribution
  const chartData = useMemo(() => {
    return [
      { name: 'Critical', value: vulnerabilityCounts.critical, fill: '#ef4444' },
      { name: 'High', value: vulnerabilityCounts.high, fill: '#f97316' },
      { name: 'Medium', value: vulnerabilityCounts.medium, fill: '#f59e0b' },
      { name: 'Low', value: vulnerabilityCounts.low, fill: '#3b82f6' },
    ];
  }, [vulnerabilityCounts]);

  const runSecurityScan = useCallback(() => {
    setScanLoading(true);
    setScanResult(null);
    
    setTimeout(() => {
      setScanLoading(false);
      const isSuccess = Math.random() > 0.15;
      
      if (isSuccess) {
        setScanResult({
          status: 'success',
          message: 'Security scan completed successfully. 0 new vulnerabilities found.',
          timestamp: new Date().toISOString(),
        });
        
        // Log audit trail
        create('AUDIT_LOG', {
          action: 'security_scan',
          entityType: 'SECURITY',
          entityId: 'SCAN-SEC-' + Date.now().toString().slice(-4),
          entityName: 'On-Demand Security Scan',
          details: 'Simulated on-demand security vulnerability scan completed successfully.',
          status: 'success',
        });
      } else {
        setScanResult({
          status: 'warning',
          message: 'Security scan found 1 new Medium vulnerability in OAuth configurations.',
          timestamp: new Date().toISOString(),
        });
        
        // Create a new simulated Tech Debt item
        create('TECH_DEBT', {
          title: 'OAuth Access Token Short Expiration Violation',
          description: 'Access tokens generated by identity providers do not expire quickly enough, posing security risks.',
          priority: 'medium',
          severity: 'medium',
          status: 'identified',
          category: 'security',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          impactScore: 60,
          estimatedEffort: '1 sprint',
        });
        
        refreshTechDebts();
      }
    }, 1500);
  }, [refreshTechDebts]);

  // Access check
  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied — Security"
        entityType="SECURITY"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading || loadingTechDebts || loadingGates) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading security metrics..." />
      </div>
    );
  }

  // Column definitions for Tech Debt list
  const techDebtColumns = [
    { key: 'id', label: 'ID', sortable: true, width: '90px' },
    { key: 'title', label: 'Vulnerability / Issue', sortable: true, cellClassName: 'font-medium' },
    {
      key: 'priority',
      label: 'Severity',
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
    { key: 'dueDate', label: 'Remediation Due', sortable: true },
  ];

  // Column definitions for Integrations
  const integrationColumns = [
    { key: 'name', label: 'Integration Partner', sortable: true, cellClassName: 'font-medium' },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Connection Status',
      sortable: true,
      render: (val) => {
        let variant = 'success';
        if (val === 'error') variant = 'danger';
        else if (val === 'configuring') variant = 'warning';
        return <StatusBadge variant={variant} label={val ? val.toUpperCase() : 'ACTIVE'} />;
      },
    },
    { key: 'syncFrequency', label: 'Frequency', sortable: true },
    {
      key: 'healthScore',
      label: 'Health',
      sortable: true,
      render: (val) => (
        <span className={`font-semibold ${val < 70 ? 'text-red-500' : 'text-green-500'}`}>
          {val}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Security Management">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Security Vulnerability & Compliance
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Comprehensive security scans, static code assessments, and penetration test governance.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runSecurityScan}
            disabled={scanLoading}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50"
          >
            {scanLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 5c-.056.649-.166 1.35-.166 2 0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.65-.11-1.351-.166-2H2.166zM10 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            )}
            <span>{scanLoading ? 'Scanning...' : 'Trigger Security Scan'}</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-label="Security KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="Security Compliance"
          value={securityScore}
          suffix="%"
          scoreBand={scoreBand}
          description="Quality gate standards compliance"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Open Vulnerabilities"
          value={vulnerabilityCounts.total}
          trend={vulnerabilityCounts.total > 2 ? 'down' : 'stable'}
          description="Unresolved security issues"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Critical / High Issues"
          value={vulnerabilityCounts.critical + vulnerabilityCounts.high}
          description="Immediate attention required"
          scoreBand={vulnerabilityCounts.critical > 0 ? { key: 'critical', label: 'CRITICAL' } : { key: 'good', label: 'HEALED' }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.629 3.588c-.019.242-.025.49-.004.74a1 1 0 01-.677.996C5.005 12.3 5 12.99 5 13c0 .538.115 1.05.322 1.512a3 3 0 00.722 1.018l.006.008a3 3 0 002.246.962h3.408a3 3 0 002.246-.962l.006-.008a3 3 0 00.722-1.018A4.978 4.978 0 0015 13c0-.01-.005-.7-.202-1.404A1 1 0 0114.12 10.6a31.36 31.36 0 00-.629-3.588 23.36 23.36 0 00-.84-2.734c-.167-.403-.356-.787-.57-1.116-.208-.322-.477-.65-.822-.88a1 1 0 00-.064-.047z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Active Security Gates"
          value={qualityGates.length}
          description={`${qualityGates.filter((q) => q.status === 'passed').length} passing gates`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
      </section>

      {/* scan alert result */}
      {scanResult && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            scanResult.status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300'
              : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-300'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{scanResult.status === 'success' ? '✅' : '⚠️'}</span>
            <div className="flex-1">
              <p className="font-semibold">{scanResult.message}</p>
              <p className="text-2xs opacity-80">Completed at {new Date(scanResult.timestamp).toLocaleTimeString()}</p>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Open Vulnerability Tech Debts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
            <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50 mb-4">
              Open Security Technical Debt & Vulnerabilities
            </h2>
            <DataTable
              columns={techDebtColumns}
              data={techDebts}
              totalCount={techDebts.length}
              pageSize={10}
              loading={loadingTechDebts}
              entityType="TECH_DEBT"
            />
          </div>
        </div>

        {/* Right 1 col: Vulnerability Chart and Security Integrations */}
        <div className="space-y-6">
          <ChartWrapper
            type="pie"
            title="Severity Distribution"
            data={chartData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              colors: ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'],
              height: 220,
            }}
          />

          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
            <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50 mb-4">
              Security Tool Integrations
            </h2>
            <DataTable
              columns={integrationColumns}
              data={integrations}
              totalCount={integrations.length}
              pageSize={5}
              loading={loadingIntegrations}
              entityType="INTEGRATION"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
