import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import useEntityList from '../hooks/useEntityList';
import { list, create, update, remove } from '../services/entityRepository';
import { STORAGE_KEYS } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import ScoreCard from '../components/common/ScoreCard';
import ChartWrapper from '../components/common/ChartWrapper';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PermissionDenied from '../components/common/PermissionDenied';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import ConfirmDialog from '../components/common/ConfirmDialog';

/**
 * Test Data Sets Management Page.
 * Displays sensitivity classifications, masking indicators, and allows creating,
 * provisioning, and managing synthetic test datasets.
 */
const TestDataPage = () => {
  const navigate = useNavigate();
  const { hasNavAccess, canCreate, canDelete } = usePersona();

  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    applicationId: '',
    environmentId: '',
    dataType: '',
    sourceSystem: '',
    sensitivityClassification: 'Internal',
    maskingStatus: 'unmasked',
    syntheticIndicator: false,
    expirationDate: '',
    provisioningStatus: 'available',
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Dropdown reference lists
  const [applications, setApplications] = useState([]);
  const [environments, setEnvironments] = useState([]);

  // Test Data page is gated by TEST_DATA nav permission
  const hasAccess = useMemo(() => {
    return hasNavAccess('test_data');
  }, [hasNavAccess]);

  const canCreateTestData = useMemo(() => {
    return canCreate('TEST_DATA');
  }, [canCreate]);

  const canDeleteTestData = useMemo(() => {
    return canDelete('TEST_DATA');
  }, [canDelete]);

  // Self-healing / Lazy-seeding helper
  const ensureTestDataSeeded = useCallback(() => {
    const rawData = getItem(STORAGE_KEYS.TEST_DATA);
    if (!Array.isArray(rawData) || rawData.length === 0) {
      // Seed some test data sets on the fly if none exist
      const mockData = [
        {
          id: 'TDS-001',
          name: 'Gold Customer Profile Dataset',
          applicationId: 'APP-001',
          applicationName: 'Portal App',
          portfolioId: 'PF-001',
          environmentId: 'ENV-001',
          environmentName: 'Testing Env 1',
          dataType: 'Customer PII',
          sourceSystem: 'Salesforce CRM',
          sensitivityClassification: 'Confidential',
          maskingStatus: 'fully_masked',
          syntheticIndicator: true,
          refreshDate: '2026-06-25',
          expirationDate: '2026-12-15',
          owner: 'Test Data Eng Team',
          usageHistory: 45,
          linkedTestSuites: 4,
          provisioningStatus: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
        {
          id: 'TDS-002',
          name: 'EU Transaction Ledger 2026',
          applicationId: 'APP-002',
          applicationName: 'Billing Service',
          portfolioId: 'PF-001',
          environmentId: 'ENV-002',
          environmentName: 'Staging Env 2',
          dataType: 'Financial Transactions',
          sourceSystem: 'SAP ERP',
          sensitivityClassification: 'Restricted',
          maskingStatus: 'partially_masked',
          syntheticIndicator: false,
          refreshDate: '2026-07-02',
          expirationDate: '2026-10-30',
          owner: 'Finance QA Team',
          usageHistory: 22,
          linkedTestSuites: 3,
          provisioningStatus: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
        {
          id: 'TDS-003',
          name: 'HIPAA Compliant Patient Cohort',
          applicationId: 'APP-003',
          applicationName: 'Core Claims Engine',
          portfolioId: 'PF-002',
          environmentId: 'ENV-001',
          environmentName: 'Testing Env 1',
          dataType: 'Healthcare Records',
          sourceSystem: 'Epic EHR',
          sensitivityClassification: 'Confidential',
          maskingStatus: 'fully_masked',
          syntheticIndicator: true,
          refreshDate: '2026-06-18',
          expirationDate: '2026-09-15',
          owner: 'Clinical QA Lead',
          usageHistory: 78,
          linkedTestSuites: 6,
          provisioningStatus: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
        {
          id: 'TDS-004',
          name: 'Global Product SKUs Catalog',
          applicationId: 'APP-001',
          applicationName: 'Portal App',
          portfolioId: 'PF-001',
          environmentId: 'ENV-003',
          environmentName: 'UAT Env 3',
          dataType: 'Product Catalog',
          sourceSystem: 'Oracle Commerce',
          sensitivityClassification: 'Public',
          maskingStatus: 'not_applicable',
          syntheticIndicator: false,
          refreshDate: '2026-05-10',
          expirationDate: '2027-05-10',
          owner: 'Catalog Ops',
          usageHistory: 112,
          linkedTestSuites: 1,
          provisioningStatus: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
        {
          id: 'TDS-005',
          name: 'Premium Subscriptions Cohort',
          applicationId: 'APP-002',
          applicationName: 'Billing Service',
          portfolioId: 'PF-001',
          environmentId: 'ENV-001',
          environmentName: 'Testing Env 1',
          dataType: 'Customer PII',
          sourceSystem: 'Stripe API',
          sensitivityClassification: 'Confidential',
          maskingStatus: 'unmasked',
          syntheticIndicator: false,
          refreshDate: '2026-07-05',
          expirationDate: '2026-08-05',
          owner: 'Marketing Dev Team',
          usageHistory: 14,
          linkedTestSuites: 2,
          provisioningStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
      ];
      setItem(STORAGE_KEYS.TEST_DATA, mockData);
    }
  }, []);

  // Set up useEntityList hook for TEST_DATA
  const {
    data: testDataSets,
    loading: loadingTestData,
    refresh: refreshTestData,
    search,
    setSearch,
    filters,
    setFilter,
    sortField,
    sortDirection,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
  } = useEntityList('TEST_DATA', {
    pageSize: 10,
  });

  // Load dropdown references
  const loadReferences = useCallback(() => {
    try {
      const appsRes = list('APPLICATION', { pageSize: 100 });
      if (appsRes.success && Array.isArray(appsRes.data)) {
        setApplications(appsRes.data);
      }
      const envsRes = list('ENVIRONMENT', { pageSize: 100 });
      if (envsRes.success && Array.isArray(envsRes.data)) {
        setEnvironments(envsRes.data);
      }
    } catch (err) {
      console.error('Failed to load references', err);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      ensureTestDataSeeded();
      loadReferences();
      refreshTestData();
      const timer = setTimeout(() => {
        setSimulatedLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSimulatedLoading(false);
    }
  }, [hasAccess, ensureTestDataSeeded, loadReferences, refreshTestData]);

  // Sensitivity distribution chart
  const sensitivityChartData = useMemo(() => {
    const rawData = getItem(STORAGE_KEYS.TEST_DATA) || [];
    const counts = { Confidential: 0, Restricted: 0, Internal: 0, Public: 0 };
    rawData.forEach((item) => {
      if (item && item.sensitivityClassification) {
        counts[item.sensitivityClassification] = (counts[item.sensitivityClassification] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [testDataSets]);

  // Masking status chart
  const maskingChartData = useMemo(() => {
    const rawData = getItem(STORAGE_KEYS.TEST_DATA) || [];
    const counts = { fully_masked: 0, partially_masked: 0, unmasked: 0, not_applicable: 0 };
    rawData.forEach((item) => {
      if (item && item.maskingStatus) {
        counts[item.maskingStatus] = (counts[item.maskingStatus] || 0) + 1;
      }
    });
    return [
      { name: 'Fully Masked', value: counts.fully_masked, fill: '#16a34a' },
      { name: 'Partially Masked', value: counts.partially_masked, fill: '#f59e0b' },
      { name: 'Unmasked (PII Risk)', value: counts.unmasked, fill: '#ef4444' },
      { name: 'Not Applicable', value: counts.not_applicable, fill: '#9ca3af' },
    ];
  }, [testDataSets]);

  // Synthetic vs Production ratios
  const totalSets = useMemo(() => testDataSets.length, [testDataSets]);
  const syntheticCount = useMemo(() => {
    return testDataSets.filter((d) => d.syntheticIndicator).length;
  }, [testDataSets]);

  const handleInputChange = useCallback((nameOrEvent, valueOrUndefined) => {
    if (nameOrEvent && nameOrEvent.target) {
      const { name, value, type, checked } = nameOrEvent.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [nameOrEvent]: valueOrUndefined,
      }));
    }
  }, []);

  // Form validator
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Dataset name is required';
    if (!formData.applicationId) errors.applicationId = 'Application is required';
    if (!formData.environmentId) errors.environmentId = 'Environment is required';
    if (!formData.dataType.trim()) errors.dataType = 'Data Type is required';
    if (!formData.sourceSystem.trim()) errors.sourceSystem = 'Source System is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCreateLoading(true);

    const appObj = applications.find((a) => a.id === formData.applicationId);
    const envObj = environments.find((e) => e.id === formData.environmentId);

    const newRecord = {
      ...formData,
      applicationName: appObj ? appObj.name : 'Unknown Application',
      portfolioId: appObj ? appObj.portfolioId : null,
      environmentName: envObj ? envObj.name : 'Unknown Environment',
      refreshDate: new Date().toISOString().split('T')[0],
      owner: 'Test Data Eng Team',
      usageHistory: 0,
      linkedTestSuites: 0,
    };

    setTimeout(() => {
      const res = create('TEST_DATA', newRecord);
      setCreateLoading(false);
      
      if (res.success) {
        setCreateModalOpen(false);
        // Clear form
        setFormData({
          name: '',
          applicationId: '',
          environmentId: '',
          dataType: '',
          sourceSystem: '',
          sensitivityClassification: 'Internal',
          maskingStatus: 'unmasked',
          syntheticIndicator: false,
          expirationDate: '',
          provisioningStatus: 'available',
        });
        refreshTestData();
      } else {
        setFormErrors({ _form: res.error || 'Failed to create dataset' });
      }
    }, 600);
  }, [formData, applications, environments, refreshTestData]);

  const triggerDelete = useCallback((id, name) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTargetId) return;

    const res = remove('TEST_DATA', deleteTargetId);
    setDeleteDialogOpen(false);
    
    if (res.success) {
      refreshTestData();
    } else {
      alert(res.error || 'Failed to delete record');
    }
  }, [deleteTargetId, refreshTestData]);

  // Action to refresh provisioning
  const handleRefreshStatus = useCallback((id) => {
    const record = testDataSets.find((d) => d.id === id);
    if (!record) return;

    update('TEST_DATA', id, {
      provisioningStatus: 'available',
      refreshDate: new Date().toISOString().split('T')[0],
    });
    refreshTestData();
  }, [testDataSets, refreshTestData]);

  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied — Test Data"
        entityType="TEST_DATA"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading || loadingTestData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test data sets..." />
      </div>
    );
  }

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: '90px' },
    { key: 'name', label: 'Dataset Name', sortable: true, cellClassName: 'font-medium' },
    { key: 'applicationName', label: 'Application', sortable: true },
    { key: 'dataType', label: 'Data Type', sortable: true },
    {
      key: 'sensitivityClassification',
      label: 'Sensitivity',
      sortable: true,
      render: (val) => {
        let variant = 'info';
        if (val === 'Confidential') variant = 'danger';
        else if (val === 'Restricted') variant = 'warning';
        else if (val === 'Public') variant = 'success';
        return <StatusBadge variant={variant} label={val || 'INTERNAL'} />;
      },
    },
    {
      key: 'maskingStatus',
      label: 'Masking',
      sortable: true,
      render: (val) => {
        let variant = 'neutral';
        let label = 'Unmasked';
        if (val === 'fully_masked') {
          variant = 'success';
          label = 'Fully Masked';
        } else if (val === 'partially_masked') {
          variant = 'warning';
          label = 'Partially Masked';
        } else if (val === 'not_applicable') {
          variant = 'neutral';
          label = 'N/A';
        }
        return <StatusBadge variant={variant} label={label} />;
      },
    },
    {
      key: 'syntheticIndicator',
      label: 'Synthetic',
      sortable: true,
      render: (val) => (
        <StatusBadge variant={val ? 'success' : 'neutral'} label={val ? 'YES' : 'NO'} />
      ),
    },
    {
      key: 'provisioningStatus',
      label: 'Provisioning',
      sortable: true,
      render: (val) => {
        let variant = 'neutral';
        if (val === 'available') variant = 'success';
        else if (val === 'pending') variant = 'warning';
        else if (val === 'provisioning') variant = 'info';
        else if (val === 'expired') variant = 'danger';
        return <StatusBadge variant={variant} label={val ? val.toUpperCase() : 'AVAILABLE'} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.provisioningStatus !== 'available' && (
            <button
              onClick={() => handleRefreshStatus(row.id)}
              className="text-xs text-primary-600 hover:underline dark:text-primary-400"
              title="Reprovision dataset"
            >
              Provision
            </button>
          )}
          {canDeleteTestData && (
            <button
              onClick={() => triggerDelete(row.id, row.name)}
              className="text-xs text-red-600 hover:underline dark:text-red-400"
              title="Delete dataset"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Test Data Management">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Test Data Asset Management
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Provision, mask, and catalog synthetic and production-derived datasets for test environments.
          </p>
        </div>
        {canCreateTestData && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Provision Synthetic Dataset</span>
            </button>
          </div>
        )}
      </header>

      {/* KPI Cards */}
      <section aria-label="Test Data KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="Total Test Datasets"
          value={totalCount}
          description="Cataloged test datasets"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V7zM4 11a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM4 15a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1z" />
            </svg>
          }
        />
        <ScoreCard
          label="Synthetic Datasets"
          value={syntheticCount}
          suffix={` (${totalSets ? Math.round((syntheticCount / totalSets) * 100) : 0}%)`}
          description="Zero production PII exposure"
          scoreBand={{ key: 'excellent', label: 'SECURE' }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.95 3.95 1.323-1.323a1 1 0 011.414 1.414l-2.03 2.03A5.968 5.968 0 0116 11v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5c0-1.127.31-2.181.85-3.082l-2.03-2.03a1 1 0 011.414-1.414l1.323 1.323L9 3.323V3a1 1 0 011-1zm3 10a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Risk Assessment"
          value="LOW"
          description="92% datasets masked or synthetic"
          scoreBand={{ key: 'good', label: 'SAFE' }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
            </svg>
          }
        />
        <ScoreCard
          label="Provisioned Environments"
          value={environments.length}
          description="Active test environments supported"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          }
        />
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Datasets list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
            <h2 className="text-md font-bold text-neutral-900 dark:text-neutral-50 mb-4">
              Test Data Assets Inventory
            </h2>
            <DataTable
              columns={columns}
              data={testDataSets}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onSort={setSort}
              sortField={sortField}
              sortDirection={sortDirection}
              search={search}
              onSearch={setSearch}
              loading={loadingTestData}
              entityType="TEST_DATA"
            />
          </div>
        </div>

        {/* Right 1 col: Charts */}
        <div className="space-y-6">
          <ChartWrapper
            type="pie"
            title="Sensitivity Classification"
            data={sensitivityChartData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              colors: ['#ef4444', '#f59e0b', '#3b82f6', '#16a34a'],
              height: 220,
            }}
          />

          <ChartWrapper
            type="pie"
            title="Masking Status Distribution"
            data={maskingChartData}
            config={{
              dataKey: 'value',
              nameKey: 'name',
              colors: ['#16a34a', '#f59e0b', '#ef4444', '#9ca3af'],
              height: 220,
            }}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        title="Provision Synthetic Dataset"
        onClose={() => setCreateModalOpen(false)}
        ariaLabel="Provision Synthetic Dataset modal"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormField
            id="name"
            name="name"
            label="Dataset Name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="applicationId" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Application *
              </label>
              <select
                id="applicationId"
                name="applicationId"
                value={formData.applicationId}
                onChange={handleInputChange}
                className="input text-sm"
                required
              >
                <option value="">Select App...</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              {formErrors.applicationId && (
                <p className="mt-1 text-xs text-red-500">{formErrors.applicationId}</p>
              )}
            </div>

            <div>
              <label htmlFor="environmentId" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Environment *
              </label>
              <select
                id="environmentId"
                name="environmentId"
                value={formData.environmentId}
                onChange={handleInputChange}
                className="input text-sm"
                required
              >
                <option value="">Select Environment...</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
              {formErrors.environmentId && (
                <p className="mt-1 text-xs text-red-500">{formErrors.environmentId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="dataType"
              name="dataType"
              label="Data Type Class"
              placeholder="e.g. Customer PII, Transactions"
              value={formData.dataType}
              onChange={handleInputChange}
              error={formErrors.dataType}
              required
            />

            <FormField
              id="sourceSystem"
              name="sourceSystem"
              label="Source System"
              placeholder="e.g. Salesforce, SAP"
              value={formData.sourceSystem}
              onChange={handleInputChange}
              error={formErrors.sourceSystem}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sensitivityClassification" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Sensitivity Classification
              </label>
              <select
                id="sensitivityClassification"
                name="sensitivityClassification"
                value={formData.sensitivityClassification}
                onChange={handleInputChange}
                className="input text-sm"
              >
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
              </select>
            </div>

            <div>
              <label htmlFor="maskingStatus" className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Masking Status
              </label>
              <select
                id="maskingStatus"
                name="maskingStatus"
                value={formData.maskingStatus}
                onChange={handleInputChange}
                className="input text-sm"
              >
                <option value="unmasked">Unmasked</option>
                <option value="partially_masked">Partially Masked</option>
                <option value="fully_masked">Fully Masked</option>
                <option value="not_applicable">N/A</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              id="syntheticIndicator"
              name="syntheticIndicator"
              type="checkbox"
              checked={formData.syntheticIndicator}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-neutral-300 text-primary-500"
            />
            <label htmlFor="syntheticIndicator" className="text-sm text-neutral-700 dark:text-neutral-300">
              Generate 100% Synthetic Data (Zero PII Risk)
            </label>
          </div>

          <FormField
            id="expirationDate"
            name="expirationDate"
            label="Expiration Date"
            type="date"
            value={formData.expirationDate}
            onChange={handleInputChange}
          />

          {formErrors._form && (
            <p className="text-sm text-red-500">{formErrors._form}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-outline px-4 py-2"
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={createLoading}
            >
              {createLoading ? 'Provisioning...' : 'Provision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Test Dataset"
        message={`Are you sure you want to permanently delete the test dataset "${deleteTargetName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default TestDataPage;
