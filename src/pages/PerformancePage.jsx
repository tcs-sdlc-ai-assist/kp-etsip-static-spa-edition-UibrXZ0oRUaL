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
 * Performance Dashboard Page.
 * Displays response times, throughput, quality gates, and allows running load testing simulations.
 */
const PerformancePage = () => {
  const navigate = useNavigate();
  const { hasNavAccess } = usePersona();

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Performance page is gated by PERFORMANCE nav permission
  const hasAccess = useMemo(() => {
    return hasNavAccess('performance');
  }, [hasNavAccess]);

  // Load tech debt list (filtered by category performance)
  const {
    data: techDebts,
    loading: loadingTechDebts,
    refresh: refreshTechDebts,
  } = useEntityList('TECH_DEBT', {
    filters: { category: 'performance' },
    pageSize: 100,
  });

  // Load quality gates list (filtered by type performance)
  const {
    data: qualityGates,
    loading: loadingGates,
    refresh: refreshGates,
  } = useEntityList('QUALITY_GATE', {
    filters: { type: 'performance' },
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

  // Performance score calculation
  const performanceScore = useMemo(() => {
    if (qualityGates.length === 0) return 89; // Standard target score
    const passed = qualityGates.filter((q) => q.status === 'passed').length;
    const baseScore = (passed / qualityGates.length) * 100;
    
    const countIssues = techDebts.length;
    const finalScore = Math.max(40, Math.round(baseScore - (countIssues * 4)));
    return finalScore;
  }, [qualityGates, techDebts]);

  const scoreBand = useMemo(() => {
    return getScoreBand(performanceScore);
  }, [performanceScore]);

  // Mock response time data for chart
  const responseTimeData = useMemo(() => {
    return [
      { name: 'App-Portal', p95: 180, p99: 340, avg: 120 },
      { name: 'Claims-Engine', p95: 420, p99: 890, avg: 210 },
      { name: 'Billing-Service', p95: 290, p99: 580, avg: 150 },
      { name: 'Member-Database', p95: 110, p99: 220, avg: 75 },
      { name: 'Notification-Router', p95: 950, p99: 1450, avg: 430 },
    ];
  }, []);

  const runLoadTest = useCallback(() => {
    setTestLoading(true);
    setTestResult(null);
    
    setTimeout(() => {
      setTestLoading(false);
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setTestResult({
          status: 'success',
          message: 'Load test completed successfully. Throughput: 1,450 req/sec. Average Latency: 142ms. 0% error rate.',
          timestamp: new Date().toISOString(),
        });
        
        // Log audit trail
        create('AUDIT_LOG', {
          action: 'performance_load_test',
          entityType: 'PERFORMANCE',
          entityId: 'TST-PER-' + Date.now().toString().slice(-4),
          entityName: 'On-Demand Load Test',
          details: 'Simulated on-demand performance load test completed successfully with 1.4k req/sec peak.',
          status: 'success',
        });
      } else {
        setTestResult({
          status: 'warning',
          message: 'Load test completed with high latency. Average Latency: 480ms (exceeded 300ms SLA). 1.8% timeout rate.',
          timestamp: new Date().toISOString(),
        });
        
        // Create new simulated performance issue
        create('TECH_DEBT', {
          title: 'Claims Query API DB Connection Leak',
          description: 'High response times observed under load on Claims Query API due to DB pool exhaustion connection leak.',
          priority: 'high',
          severity: 'high',
          status: 'identified',
          category: 'performance',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          impactScore: 80,
          estimatedEffort: '2 sprints',
        });
        
        refreshTechDebts();
      }
    }, 1500);
  }, [refreshTechDebts]);

  // Access check
  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied — Performance"
        entityType="PERFORMANCE"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading || loadingTechDebts || loadingGates) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading performance metrics..." />
      </div>
    );
  }

  // Column definitions for performance tech debts
  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: '90px' },
    { key: 'title', label: 'Performance Issue / Bottleneck', sortable: true, cellClassName: 'font-medium' },
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
    { key: 'dueDate', label: 'Remediation SLA', sortable: true },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Performance Management">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Performance & Load Testing Analytics
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Monitor API latencies, throughput percentiles, database query metrics, and scalability constraints.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runLoadTest}
            disabled={testLoading}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50"
          >
            {testLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            )}
            <span>{testLoading ? 'Running Load Test...' : 'Run Load Test'}</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-label="Performance KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="Performance Index"
          value={performanceScore}
          suffix="%"
          scoreBand={scoreBand}
          description="Average performance compliance score"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Average Response Time"
          value={196}
          suffix=" ms"
          description="Across all standard APIs"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Active Bottlenecks"
          value={techDebts.length}
          trend={techDebts.length > 2 ? 'down' : 'stable'}
          description="Identified latency issues"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="SLA Compliance"
          value={94.2}
          suffix="%"
          description="APIs satisfying < 500ms SLA"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
      </section>

      {/* test alert result */}
      {testResult && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            testResult.status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300'
              : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-300'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{testResult.status === 'success' ? '✅' : '⚠️'}</span>
            <div className="flex-1">
              <p className="font-semibold">{testResult.message}</p>
              <p className="text-2xs opacity-80">Completed at {new Date(testResult.timestamp).toLocaleTimeString()}</p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Open Bottlenecks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
            <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50 mb-4">
              Performance Technical Debt & DB Bottlenecks
            </h2>
            <DataTable
              columns={columns}
              data={techDebts}
              totalCount={techDebts.length}
              pageSize={10}
              loading={loadingTechDebts}
              entityType="TECH_DEBT"
            />
          </div>
        </div>

        {/* Right 1 col: Chart */}
        <div>
          <ChartWrapper
            type="bar"
            title="API Latency Comparison (ms)"
            data={responseTimeData}
            config={{
              xAxisKey: 'name',
              series: [
                { dataKey: 'avg', label: 'Average (ms)', color: '#3b82f6' },
                { dataKey: 'p95', label: 'p95 Latency', color: '#f59e0b' },
                { dataKey: 'p99', label: 'p99 Latency', color: '#ef4444' },
              ],
              height: 300,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
