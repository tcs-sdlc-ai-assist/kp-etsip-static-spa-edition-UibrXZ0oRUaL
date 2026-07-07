import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { list } from '../services/entityRepository';
import { getEntitySchema } from '../constants/entitySchemas';
import { ENTITY_NAMES } from '../constants/constants';
import ScoreCard from '../components/common/ScoreCard';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PermissionDenied from '../components/common/PermissionDenied';
import { exportToCSV, exportToJSON, exportToXLSX, exportToPDF, generateStubFile } from '../utils/exportUtils';

/**
 * Reports & Analytics Page.
 * Displays standard reports categories and a highly-interactive Self-Service Report Builder.
 */
const ReportsPage = () => {
  const navigate = useNavigate();
  const { hasNavAccess, persona } = usePersona();

  const [activeTab, setActiveTab] = useState('builder'); // 'categories' or 'builder'
  const [selectedEntity, setSelectedEntity] = useState('APPLICATION');
  const [selectedColumns, setSelectedColumns] = useState(['id', 'name', 'criticality', 'complianceScore', 'status']);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Export progress status alert
  const [exportMessage, setExportMessage] = useState(null);

  // Reports page is gated by REPORTS nav permission
  const hasAccess = useMemo(() => {
    return hasNavAccess('reports');
  }, [hasNavAccess]);

  // Standard report templates configuration
  const reportCategories = [
    { id: 'exec', title: 'Executive Reports', desc: 'KPI scorecards, SLA compliance status, and enterprise summaries.', icon: '📊' },
    { id: 'port', title: 'Portfolio Reports', desc: 'Cross-project alignment, compliance trends, and risk distributions.', icon: '📁' },
    { id: 'app', title: 'Application Reports', desc: 'Detailed application lifecycle, technology stack adoption, and standards conformity.', icon: '💻' },
    { id: 'tech', title: 'Tech Debt Reports', desc: 'Remediation tracking, priority debt items, and SLA breach timelines.', icon: '⚠️' },
    { id: 'gate', title: 'Quality Gate Reports', desc: 'Deployability assessments, pipeline status, and code quality compliance.', icon: '🚧' },
    { id: 'gov', title: 'Governance Reports', desc: 'Exception tracking, waiver expirations, and regulatory audit readiness.', icon: '⚖️' },
    { id: 'int', title: 'Integration Reports', desc: 'Tool sync statuses, endpoint latencies, and adapter health logs.', icon: '🔌' },
    { id: 'audit', title: 'Audit Trail Logs', desc: 'Historical change timeline, persona logins, and compliance state edits.', icon: '📝' },
  ];

  // Eligible entities for Self-Service Builder
  const builderEntities = [
    { key: 'APPLICATION', label: 'Applications' },
    { key: 'PORTFOLIO', label: 'Portfolios' },
    { key: 'TECH_DEBT', label: 'Technical Debt' },
    { key: 'QUALITY_GATE', label: 'Quality Gates' },
    { key: 'ENVIRONMENT', label: 'Environments' },
    { key: 'INTEGRATION', label: 'Integrations' },
    { key: 'TEST_DATA', label: 'Test Datasets' },
    { key: 'AUDIT_LOG', label: 'Audit Logs' },
  ];

  // Resolve schema for current selection
  const schema = useMemo(() => {
    return getEntitySchema(selectedEntity);
  }, [selectedEntity]);

  const schemaColumns = useMemo(() => {
    if (!schema || !schema.fields) return [];
    return Object.keys(schema.fields);
  }, [schema]);

  // Reset columns selection when entity type changes
  useEffect(() => {
    if (schemaColumns.length > 0) {
      // Pick first 5 columns as default visible
      setSelectedColumns(schemaColumns.slice(0, 5));
      setFilterField('');
      setFilterValue('');
    }
  }, [schemaColumns]);

  // Run dynamic queries based on builder state
  const loadBuilderPreview = useCallback(() => {
    setLoading(true);
    setPreviewData([]);
    
    // Simulate slight lag for UX
    setTimeout(() => {
      try {
        const queryOptions = { pageSize: 200 };
        if (filterField && filterValue) {
          queryOptions.filters = { [filterField]: filterValue };
        }
        
        const res = list(selectedEntity, queryOptions);
        if (res.success && Array.isArray(res.data)) {
          setPreviewData(res.data);
        }
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [selectedEntity, filterField, filterValue]);

  useEffect(() => {
    if (hasAccess) {
      loadBuilderPreview();
      const timer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSimulatedLoading(false);
    }
  }, [hasAccess, loadBuilderPreview]);

  // Handle column selection checkbox change
  const handleColumnToggle = useCallback((col) => {
    setSelectedColumns((prev) => {
      if (prev.includes(col)) {
        if (prev.length === 1) return prev; // Keep at least one column
        return prev.filter((c) => c !== col);
      }
      return [...prev, col];
    });
  }, []);

  // Columns formatted for the preview DataTable component
  const dataTableColumns = useMemo(() => {
    return selectedColumns.map((colKey) => {
      const fieldDef = schema?.fields[colKey];
      return {
        key: colKey,
        label: fieldDef?.description || colKey.toUpperCase(),
        sortable: true,
      };
    });
  }, [selectedColumns, schema]);

  // Export functions
  const triggerExport = useCallback((format) => {
    if (previewData.length === 0) return;
    
    // Filter data to only contain selected columns
    const filteredExportData = previewData.map((row) => {
      const newRow = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });

    const baseName = `${ENTITY_NAMES[selectedEntity] || selectedEntity}_Report`;

    let success = false;
    if (format === 'csv') {
      success = exportToCSV(filteredExportData, `${baseName}.csv`);
    } else if (format === 'json') {
      success = exportToJSON(filteredExportData, `${baseName}.json`);
    } else if (format === 'xlsx') {
      success = exportToXLSX(filteredExportData, `${baseName}.xlsx`);
    } else if (format === 'pdf') {
      success = exportToPDF();
    } else if (format === 'powerpoint' || format === 'pptx') {
      success = generateStubFile('pptx', {
        title: `${ENTITY_NAMES[selectedEntity]} Report`,
        description: `Exported dataset with ${filteredExportData.length} records.`,
        metadata: { recordCount: filteredExportData.length },
      });
    } else if (format === 'powerbi' || format === 'pbix') {
      success = generateStubFile('pbix', {
        title: `${ENTITY_NAMES[selectedEntity]} Data Model`,
        description: `Self-service model for Power BI dashboard.`,
        metadata: { recordCount: filteredExportData.length },
      });
    }

    if (success) {
      setExportMessage({
        type: 'success',
        text: `Successfully exported report as ${format.toUpperCase()}.`,
      });
      setTimeout(() => setExportMessage(null), 3000);
    }
  }, [previewData, selectedColumns, selectedEntity]);

  // Access check
  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied — Reports & Analytics"
        entityType="REPORTS"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading reports workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Reporting Hub">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Reporting & Analytics Center
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Access pre-built dashboard summaries or build custom ad-hoc datasets with the self-service report model.
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex gap-6" aria-label="Report Views">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === 'builder'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            Self-Service Report Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            Standard Report Catalog
          </button>
        </nav>
      </div>

      {/* Tab: Standard Catalog */}
      {activeTab === 'categories' && (
        <section aria-label="Standard Reports Grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card hover:shadow-soft dark:border-neutral-700 dark:bg-neutral-800 transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl mb-2" aria-hidden="true">
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {cat.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {cat.desc}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    // Navigate builder to that entity
                    let target = 'APPLICATION';
                    if (cat.id === 'tech') target = 'TECH_DEBT';
                    else if (cat.id === 'gate') target = 'QUALITY_GATE';
                    else if (cat.id === 'gov') target = 'GOVERNANCE_RECORD';
                    else if (cat.id === 'int') target = 'INTEGRATION';
                    else if (cat.id === 'audit') target = 'AUDIT_LOG';
                    else if (cat.id === 'port') target = 'PORTFOLIO';
                    setSelectedEntity(target);
                    setActiveTab('builder');
                  }}
                  className="text-xs font-semibold text-primary-500 hover:underline"
                >
                  Generate Report →
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Tab: Self-Service Report Builder */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left panel: Config controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Step 1: Select Entity */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Step 1: Dataset Model
              </h2>
              <div>
                <label htmlFor="builder-entity-select" className="sr-only">
                  Select entity type
                </label>
                <select
                  id="builder-entity-select"
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="input text-sm"
                >
                  {builderEntities.map((ent) => (
                    <option key={ent.key} value={ent.key}>
                      {ent.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Columns Selection */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Step 2: Fields/Columns
              </h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
                {schemaColumns.map((col) => (
                  <label
                    key={col}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={() => handleColumnToggle(col)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Simple Filter */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Step 3: Filter Query
              </h2>
              <div className="space-y-2">
                <div>
                  <label htmlFor="filter-field-select" className="sr-only">
                    Select filter field
                  </label>
                  <select
                    id="filter-field-select"
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">No Filter Field</option>
                    {schemaColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
                {filterField && (
                  <div>
                    <label htmlFor="filter-value-input" className="sr-only">
                      Filter value
                    </label>
                    <input
                      id="filter-value-input"
                      type="text"
                      placeholder="Filter value..."
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={loadBuilderPreview}
                  className="btn-outline w-full py-1.5 text-xs font-semibold"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Preview & Export actions */}
          <div className="lg:col-span-3 space-y-6">
            {exportMessage && (
              <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/30">
                {exportMessage.text}
              </div>
            )}

            {/* Step 4: Preview Data */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50">
                    Step 4: Live Data Preview
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Showing up to 200 records from the selected dataset.
                  </p>
                </div>

                {/* Step 5: Export Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => triggerExport('csv')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Export as CSV"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExport('xlsx')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Export as Excel"
                  >
                    XLSX
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExport('json')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Export as JSON"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExport('pdf')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Print Report as PDF"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExport('pptx')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Download PowerPoint Stub"
                  >
                    PPTX
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExport('pbix')}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    title="Download Power BI Model Stub"
                  >
                    Power BI
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex py-12 justify-center">
                  <LoadingSpinner label="Generating data preview..." />
                </div>
              ) : (
                <DataTable
                  columns={dataTableColumns}
                  data={previewData}
                  totalCount={previewData.length}
                  pageSize={10}
                  entityType={selectedEntity}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
