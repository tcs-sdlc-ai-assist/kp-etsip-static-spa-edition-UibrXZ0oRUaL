import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import useEntityList from '../hooks/useEntityList';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionGate from '../components/common/PermissionGate';
import PermissionDenied from '../components/common/PermissionDenied';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import { getEntitySchema, getEnumFields } from '../constants/entitySchemas';
import { ENTITY_NAMES } from '../constants/constants';
import { create, remove, getDeleteImpact } from '../services/entityRepository';
import { getScoreBand } from '../constants/constants';

/**
 * Maps route path segments to entity type keys.
 * @type {Object<string, string>}
 */
const ROUTE_TO_ENTITY_TYPE = {
  portfolios: 'PORTFOLIO',
  applications: 'APPLICATION',
  'technology-standards': 'TECH_STANDARD',
  'tech-radar': 'TECH_ENTRY',
  'tech-debt': 'TECH_DEBT',
  'quality-gates': 'QUALITY_GATE',
  governance: 'GOVERNANCE_RECORD',
  approvals: 'APPROVAL_REQUEST',
  waivers: 'WAIVER',
  environments: 'ENVIRONMENT',
  integrations: 'INTEGRATION',
  evidence: 'EVIDENCE',
  users: 'USER',
  roles: 'ROLE',
  notifications: 'NOTIFICATION',
  'ai-insights': 'AI_ANALYSIS',
  'use-cases': 'USE_CASE',
  'demo-scenarios': 'DEMO_SCENARIO',
  'audit-log': 'AUDIT_LOG',
  schedules: 'SCHEDULE',
  relationships: 'RELATIONSHIP',
  'tech-categories': 'TECH_CATEGORY',
  'tech-entries': 'TECH_ENTRY',
  definitions: 'DEFINITION',
  'pde-configs': 'PDE_CONFIG',
};

/**
 * Maps status values to StatusBadge variants.
 * @param {string} status - The status string.
 * @returns {string}
 */
const statusToVariant = (status) => {
  if (typeof status !== 'string') {
    return 'neutral';
  }
  const lower = status.toLowerCase();
  if (['active', 'approved', 'passed', 'completed', 'compliant', 'valid', 'healthy', 'success', 'resolved'].includes(lower)) {
    return 'success';
  }
  if (['warning', 'expiring', 'partially_compliant', 'degraded', 'fair', 'pending_review', 'in_progress', 'planning', 'draft', 'paused', 'configuring', 'pending'].includes(lower)) {
    return 'warning';
  }
  if (['error', 'failed', 'critical', 'expired', 'rejected', 'non_compliant', 'invalid', 'down', 'retired', 'prohibited', 'cancelled', 'revoked', 'failure'].includes(lower)) {
    return 'danger';
  }
  if (['info', 'emerging', 'recommended', 'preferred', 'acceptable', 'running', 'pending'].includes(lower)) {
    return 'info';
  }
  return 'neutral';
};

/**
 * Maps risk/priority levels to StatusBadge variants.
 * @param {string} level - The risk or priority level.
 * @returns {string}
 */
const riskToVariant = (level) => {
  if (typeof level !== 'string') {
    return 'neutral';
  }
  switch (level.toLowerCase()) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    case 'none':
      return 'neutral';
    default:
      return 'neutral';
  }
};

/**
 * Builds column definitions for a given entity type based on its schema.
 * @param {string} entityType - The entity type key.
 * @returns {Array<Object>}
 */
const buildColumns = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }

  const enumFields = getEnumFields(entityType);
  const columns = [];

  // Always include ID column
  columns.push({
    key: 'id',
    label: 'ID',
    sortable: true,
    width: '120px',
  });

  // Determine primary name/title field
  const nameFields = ['name', 'title', 'term', 'displayName', 'username'];
  const primaryNameField = nameFields.find((f) => schema.fields[f]);

  if (primaryNameField) {
    columns.push({
      key: primaryNameField,
      label: primaryNameField === 'term' ? 'Term' : (primaryNameField === 'displayName' ? 'Display Name' : (primaryNameField === 'username' ? 'Username' : (primaryNameField === 'title' ? 'Title' : 'Name'))),
      sortable: true,
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return (
          <span className="font-medium text-neutral-900 dark:text-neutral-100" title={String(value)}>
            {String(value)}
          </span>
        );
      },
    });
  }

  // Add status column if present
  if (schema.fields.status) {
    const statusOptions = enumFields.status || [];
    columns.push({
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '140px',
      filterOptions: statusOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <StatusBadge status={value} variant={statusToVariant(value)} size="sm" />;
      },
    });
  }

  // Add complianceStatus for tech entries
  if (schema.fields.complianceStatus && !schema.fields.status) {
    const complianceOptions = enumFields.complianceStatus || [];
    columns.push({
      key: 'complianceStatus',
      label: 'Compliance',
      sortable: true,
      width: '160px',
      filterOptions: complianceOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <StatusBadge status={value} variant={statusToVariant(value)} size="sm" />;
      },
    });
  }

  // Add type/category columns
  if (schema.fields.type && entityType !== 'NOTIFICATION') {
    const typeOptions = enumFields.type || [];
    columns.push({
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '140px',
      filterOptions: typeOptions.length > 0 ? typeOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
    });
  }

  if (schema.fields.featureType) {
    const featureOptions = enumFields.featureType || [];
    columns.push({
      key: 'featureType',
      label: 'Feature Type',
      sortable: true,
      width: '180px',
      filterOptions: featureOptions.length > 0 ? featureOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return (
          <span className="truncate" title={value.replace(/_/g, ' ')}>
            {value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        );
      },
    });
  }

  if (schema.fields.requestType) {
    const requestTypeOptions = enumFields.requestType || [];
    columns.push({
      key: 'requestType',
      label: 'Request Type',
      sortable: true,
      width: '160px',
      filterOptions: requestTypeOptions.length > 0 ? requestTypeOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
    });
  }

  // Add owner/assignee columns
  if (schema.fields.owner) {
    columns.push({
      key: 'owner',
      label: 'Owner',
      sortable: true,
    });
  }

  if (schema.fields.requesterName) {
    columns.push({
      key: 'requesterName',
      label: 'Requester',
      sortable: true,
    });
  }

  if (schema.fields.assigneeName) {
    columns.push({
      key: 'assigneeName',
      label: 'Assignee',
      sortable: true,
    });
  }

  if (schema.fields.assignee && !schema.fields.assigneeName) {
    columns.push({
      key: 'assignee',
      label: 'Assignee',
      sortable: true,
    });
  }

  // Add priority column
  if (schema.fields.priority) {
    const priorityOptions = enumFields.priority || [];
    columns.push({
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: '120px',
      filterOptions: priorityOptions.length > 0 ? priorityOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <StatusBadge status={value} variant={riskToVariant(value)} size="sm" />;
      },
    });
  }

  // Add risk level column
  if (schema.fields.riskLevel) {
    const riskOptions = enumFields.riskLevel || [];
    columns.push({
      key: 'riskLevel',
      label: 'Risk',
      sortable: true,
      width: '120px',
      filterOptions: riskOptions.length > 0 ? riskOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <StatusBadge status={value} variant={riskToVariant(value)} size="sm" />;
      },
    });
  }

  // Add compliance score column
  if (schema.fields.complianceScore) {
    columns.push({
      key: 'complianceScore',
      label: 'Compliance',
      sortable: true,
      width: '120px',
      render: (value) => {
        if (value === null || value === undefined) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        const band = getScoreBand(value);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {Math.round(value)}%
            </span>
            {band && (
              <span
                className={`h-2 w-2 rounded-full`}
                style={{ backgroundColor: band.color }}
                aria-hidden="true"
              />
            )}
          </div>
        );
      },
    });
  }

  // Add score column for quality gates
  if (schema.fields.score && entityType === 'QUALITY_GATE') {
    columns.push({
      key: 'score',
      label: 'Score',
      sortable: true,
      width: '100px',
      render: (value) => {
        if (value === null || value === undefined) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <span className="font-medium">{Math.round(value)}</span>;
      },
    });
  }

  // Add health score for integrations
  if (schema.fields.healthScore) {
    columns.push({
      key: 'healthScore',
      label: 'Health',
      sortable: true,
      width: '100px',
      render: (value) => {
        if (value === null || value === undefined) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        const band = getScoreBand(value);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {Math.round(value)}
            </span>
            {band && (
              <span
                className={`h-2 w-2 rounded-full`}
                style={{ backgroundColor: band.color }}
                aria-hidden="true"
              />
            )}
          </div>
        );
      },
    });
  }

  // Add confidence score for AI analyses
  if (schema.fields.confidenceScore) {
    columns.push({
      key: 'confidenceScore',
      label: 'Confidence',
      sortable: true,
      width: '120px',
      render: (value) => {
        if (value === null || value === undefined) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return <span className="font-medium">{Math.round(value)}%</span>;
      },
    });
  }

  // Add access level for users/roles
  if (schema.fields.accessLevel) {
    const accessOptions = enumFields.accessLevel || [];
    columns.push({
      key: 'accessLevel',
      label: 'Access Level',
      sortable: true,
      width: '140px',
      filterOptions: accessOptions.length > 0 ? accessOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        return (
          <span className="truncate">
            {value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        );
      },
    });
  }

  // Add action column for audit logs
  if (schema.fields.action && entityType === 'AUDIT_LOG') {
    columns.push({
      key: 'action',
      label: 'Action',
      sortable: true,
      width: '120px',
    });
  }

  // Add entity type for audit logs
  if (schema.fields.entityType && entityType === 'AUDIT_LOG') {
    columns.push({
      key: 'entityType',
      label: 'Entity Type',
      sortable: true,
      width: '140px',
    });
  }

  // Add userName for audit logs
  if (schema.fields.userName && entityType === 'AUDIT_LOG') {
    columns.push({
      key: 'userName',
      label: 'User',
      sortable: true,
    });
  }

  // Add frequency for schedules
  if (schema.fields.frequency) {
    const frequencyOptions = enumFields.frequency || [];
    columns.push({
      key: 'frequency',
      label: 'Frequency',
      sortable: true,
      width: '120px',
      filterOptions: frequencyOptions.length > 0 ? frequencyOptions.map((opt) => ({
        value: opt,
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })) : undefined,
    });
  }

  // Add isRead for notifications
  if (schema.fields.isRead) {
    columns.push({
      key: 'isRead',
      label: 'Read',
      sortable: true,
      width: '80px',
      render: (value) => {
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
              value
                ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
            }`}
          >
            {value ? 'Read' : 'Unread'}
          </span>
        );
      },
    });
  }

  // Add createdAt column
  if (schema.fields.createdAt) {
    columns.push({
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: '160px',
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        try {
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) {
            return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
          }
          return (
            <span className="text-xs text-neutral-500 dark:text-neutral-400" title={value}>
              {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        } catch {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
      },
    });
  }

  // Add timestamp for audit logs
  if (schema.fields.timestamp && entityType === 'AUDIT_LOG') {
    columns.push({
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      width: '160px',
      render: (value) => {
        if (!value) {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
        try {
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) {
            return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
          }
          return (
            <span className="text-xs text-neutral-500 dark:text-neutral-400" title={value}>
              {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        } catch {
          return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
        }
      },
    });
  }

  return columns;
};

/**
 * Resolves the entity type from the current route path.
 * @param {string} routeSegment - The route path segment (e.g., 'portfolios', 'applications').
 * @returns {string|null} The entity type key, or null if not found.
 */
const resolveEntityType = (routeSegment) => {
  if (typeof routeSegment !== 'string' || routeSegment.trim() === '') {
    return null;
  }
  return ROUTE_TO_ENTITY_TYPE[routeSegment.trim().toLowerCase()] || null;
};

/**
 * Resolves the route base path for an entity type.
 * @param {string} entityType - The entity type key.
 * @returns {string}
 */
const resolveRoutePath = (entityType) => {
  const entry = Object.entries(ROUTE_TO_ENTITY_TYPE).find(([, type]) => type === entityType);
  return entry ? `/${entry[0]}` : '/';
};

/**
 * Builds the required fields for the create form from the entity schema.
 * @param {string} entityType - The entity type key.
 * @returns {Array<{ name: string, label: string, type: string, required: boolean, options?: Array }>}
 */
const buildCreateFormFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }

  const enumFieldMap = getEnumFields(entityType);
  const skipFields = new Set(['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'version']);
  const fields = [];

  const requiredFields = schema.requiredFields || [];

  Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
    if (skipFields.has(fieldName)) {
      return;
    }

    // Only include required fields and a few common optional ones
    const isRequired = requiredFields.includes(fieldName);
    if (!isRequired && !['description', 'tags'].includes(fieldName)) {
      return;
    }

    // Skip complex fields
    if (fieldDef.type === 'json' || fieldDef.type === 'object' || fieldDef.type === 'array') {
      return;
    }

    // Skip foreign key fields for the create form (too complex for a simple modal)
    if (fieldDef.type === 'foreign_key') {
      return;
    }

    let inputType = 'text';
    let options = null;

    switch (fieldDef.type) {
      case 'text':
        inputType = 'textarea';
        break;
      case 'number':
      case 'integer':
      case 'float':
        inputType = 'number';
        break;
      case 'boolean':
        inputType = 'checkbox';
        break;
      case 'date':
        inputType = 'date';
        break;
      case 'datetime':
        inputType = 'text';
        break;
      case 'email':
        inputType = 'email';
        break;
      case 'url':
        inputType = 'url';
        break;
      case 'enum':
        inputType = 'select';
        options = fieldDef.enumValues
          ? fieldDef.enumValues.map((v) => ({
              value: v,
              label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            }))
          : [];
        break;
      default:
        inputType = 'text';
        break;
    }

    fields.push({
      name: fieldName,
      label: fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim(),
      type: inputType,
      required: isRequired,
      options,
      placeholder: fieldDef.description || '',
      min: fieldDef.min,
      max: fieldDef.max,
      minLength: fieldDef.minLength,
      maxLength: fieldDef.maxLength,
    });
  });

  return fields;
};

/**
 * Generic entity list page that renders DataTable for any entity type.
 * Route param determines entity type. Uses useEntityList hook for state management.
 * Provides create button (permission-gated), row click for detail view, and bulk actions.
 * Accessible with ARIA landmarks.
 *
 * @returns {React.ReactElement}
 */
const EntityListPage = () => {
  const { entityType: routeEntityType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { persona, canView, canCreate: personaCanCreate, canDelete: personaCanDelete } = usePersona();

  // Resolve entity type from route
  const entityType = useMemo(() => {
    // Try route param first
    if (routeEntityType) {
      return resolveEntityType(routeEntityType);
    }
    // Fall back to current path (using location.pathname for reactivity)
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      return resolveEntityType(pathSegments[0]);
    }
    return null;
  }, [routeEntityType, location.pathname]);

  const schema = useMemo(() => {
    if (!entityType) {
      return null;
    }
    return getEntitySchema(entityType);
  }, [entityType]);

  const displayName = useMemo(() => {
    if (!entityType) {
      return 'Entities';
    }
    return ENTITY_NAMES[entityType] || entityType;
  }, [entityType]);

  const pluralName = useMemo(() => {
    if (!schema) {
      return 'Entities';
    }
    return schema.pluralName || `${displayName}s`;
  }, [schema, displayName]);

  const hasViewPermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return canView(entityType);
  }, [entityType, canView]);

  const hasCreatePermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return personaCanCreate(entityType);
  }, [entityType, personaCanCreate]);

  const hasDeletePermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return personaCanDelete(entityType);
  }, [entityType, personaCanDelete]);

  // Entity list hook
  const {
    data,
    totalCount,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    search,
    filters,
    sortField,
    sortDirection,
    visibleColumns,
    setSearch,
    setFilter,
    setSort,
    setPage,
    setPageSize,
    toggleColumn,
    refresh,
  } = useEntityList(entityType || '', {
    autoLoad: !!entityType && hasViewPermission,
  });

  // Column definitions
  const columns = useMemo(() => {
    if (!entityType) {
      return [];
    }
    return buildColumns(entityType);
  }, [entityType]);

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({});
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState(null);

  // Simulated loading state
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [entityType]);

  // Create form fields
  const createFormFields = useMemo(() => {
    if (!entityType) {
      return [];
    }
    return buildCreateFormFields(entityType);
  }, [entityType]);

  // Reset create form when modal opens
  useEffect(() => {
    if (createModalOpen) {
      const defaults = {};
      createFormFields.forEach((field) => {
        if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else if (field.type === 'number') {
          defaults[field.name] = '';
        } else {
          defaults[field.name] = '';
        }
      });
      setCreateFormData(defaults);
      setCreateFormErrors({});
    }
  }, [createModalOpen, createFormFields]);

  /**
   * Handles search input change.
   */
  const handleSearch = useCallback(
    (searchTerm) => {
      setSearch(searchTerm);
    },
    [setSearch]
  );

  /**
   * Handles filter change.
   */
  const handleFilter = useCallback(
    (field, value) => {
      setFilter(field, value);
    },
    [setFilter]
  );

  /**
   * Handles sort change.
   */
  const handleSort = useCallback(
    (field, direction) => {
      setSort(field, direction);
    },
    [setSort]
  );

  /**
   * Handles page change.
   */
  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
    },
    [setPage]
  );

  /**
   * Handles page size change.
   */
  const handlePageSizeChange = useCallback(
    (newSize) => {
      setPageSize(newSize);
    },
    [setPageSize]
  );

  /**
   * Handles column visibility toggle.
   */
  const handleToggleColumn = useCallback(
    (columnKey) => {
      toggleColumn(columnKey);
    },
    [toggleColumn]
  );

  /**
   * Handles row click to navigate to detail view.
   */
  const handleRowClick = useCallback(
    (row) => {
      if (!row || !row.id || !entityType) {
        return;
      }
      const basePath = resolveRoutePath(entityType);
      navigate(`${basePath}/${row.id}`);
    },
    [entityType, navigate]
  );

  /**
   * Handles opening the create modal.
   */
  const handleOpenCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  /**
   * Handles closing the create modal.
   */
  const handleCloseCreate = useCallback(() => {
    setCreateModalOpen(false);
    setCreateFormData({});
    setCreateFormErrors({});
  }, []);

  /**
   * Handles create form field change.
   */
  const handleCreateFieldChange = useCallback((name, value) => {
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setCreateFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /**
   * Handles create form submission.
   */
  const handleCreateSubmit = useCallback(() => {
    if (!entityType) {
      return;
    }

    // Validate required fields
    const errors = {};
    createFormFields.forEach((field) => {
      if (field.required) {
        const value = createFormData[field.name];
        if (value === null || value === undefined || value === '') {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setCreateFormErrors(errors);
      return;
    }

    setCreateLoading(true);

    // Build the record data
    const recordData = {};
    Object.entries(createFormData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        recordData[key] = value;
      }
    });

    const result = create(entityType, recordData);

    setCreateLoading(false);

    if (result.success) {
      setCreateModalOpen(false);
      setCreateFormData({});
      setCreateFormErrors({});
      refresh();
    } else {
      if (result.errors && result.errors.length > 0) {
        const fieldErrors = {};
        result.errors.forEach((err) => {
          // Try to extract field name from error message
          const match = err.match(/Field '(\w+)'/);
          if (match) {
            fieldErrors[match[1]] = err;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setCreateFormErrors(fieldErrors);
        } else {
          setCreateFormErrors({ _form: result.error || result.errors.join('; ') });
        }
      } else {
        setCreateFormErrors({ _form: result.error || 'Failed to create record' });
      }
    }
  }, [entityType, createFormData, createFormFields, refresh]);

  /**
   * Handles opening the delete confirmation dialog.
   */
  const handleOpenDelete = useCallback(
    (id, name) => {
      if (!entityType || !id) {
        return;
      }
      setDeleteTargetId(id);
      setDeleteTargetName(name || id);

      // Check delete impact
      const impact = getDeleteImpact(entityType, id);
      setDeleteImpact(impact);
      setDeleteDialogOpen(true);
    },
    [entityType]
  );

  /**
   * Handles confirming the delete action.
   */
  const handleConfirmDelete = useCallback(() => {
    if (!entityType || !deleteTargetId) {
      return;
    }

    setDeleteLoading(true);

    const result = remove(entityType, deleteTargetId);

    setDeleteLoading(false);

    if (result.success) {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetName('');
      setDeleteImpact(null);
      refresh();
    }
  }, [entityType, deleteTargetId, refresh]);

  /**
   * Handles canceling the delete action.
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
    setDeleteImpact(null);
  }, []);

  /**
   * Builds the delete confirmation message.
   */
  const deleteMessage = useMemo(() => {
    let message = `Are you sure you want to delete "${deleteTargetName}"? This action cannot be undone.`;

    if (deleteImpact) {
      if (!deleteImpact.canDelete && deleteImpact.blockingReferences.length > 0) {
        const blockingDetails = deleteImpact.blockingReferences
          .map((ref) => `${ref.count} ${ref.entityType} record(s)`)
          .join(', ');
        message = `Cannot delete "${deleteTargetName}". It is referenced by: ${blockingDetails}. Remove the references first.`;
      } else {
        const cascadeDetails = deleteImpact.cascadeReferences
          .map((ref) => `${ref.count} ${ref.entityType} record(s)`)
          .join(', ');
        const setNullDetails = deleteImpact.setNullReferences
          .map((ref) => `${ref.count} ${ref.entityType} record(s)`)
          .join(', ');

        if (cascadeDetails) {
          message += ` This will also delete: ${cascadeDetails}.`;
        }
        if (setNullDetails) {
          message += ` References will be cleared in: ${setNullDetails}.`;
        }
      }
    }

    return message;
  }, [deleteTargetName, deleteImpact]);

  /**
   * Adds action column with delete button to columns.
   */
  const columnsWithActions = useMemo(() => {
    if (!hasDeletePermission) {
      return columns;
    }

    return [
      ...columns,
      {
        key: '_actions',
        label: 'Actions',
        sortable: false,
        width: '80px',
        render: (value, row) => {
          if (!row || !row.id) {
            return null;
          }

          const rowName = row.name || row.title || row.term || row.displayName || row.username || row.id;

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDelete(row.id, rowName);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenDelete(row.id, rowName);
                }
              }}
              className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-150"
              aria-label={`Delete ${rowName}`}
              title="Delete"
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
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          );
        },
      },
    ];
  }, [columns, hasDeletePermission, handleOpenDelete]);

  /**
   * Wraps data rows with click handler.
   */
  const dataWithClickHandler = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  }, [data]);

  // Handle unknown entity type
  if (!entityType) {
    return (
      <EmptyState
        title="Unknown Entity Type"
        message="The requested entity type could not be determined from the current route."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        }
      />
    );
  }

  // Handle no schema found
  if (!schema) {
    return (
      <EmptyState
        title="Entity Type Not Configured"
        message={`No schema configuration found for entity type "${entityType}".`}
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title={`Access Denied — ${pluralName}`}
        entityType={entityType}
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading || loading;

  if (isLoading && data.length === 0) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label={`Loading ${pluralName}`}
      >
        <LoadingSpinner size="lg" label={`Loading ${pluralName}...`} />
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <EmptyState
        title={`Unable to Load ${pluralName}`}
        message={error}
        actionLabel="Retry"
        onAction={refresh}
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

  return (
    <div className="space-y-6" role="region" aria-label={`${pluralName} list`}>
      {/* Page Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {pluralName}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {totalCount > 0
              ? `${totalCount} ${totalCount === 1 ? displayName.toLowerCase() : pluralName.toLowerCase()} found`
              : `No ${pluralName.toLowerCase()} found`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh button */}
          <button
            type="button"
            onClick={refresh}
            className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
            aria-label={`Refresh ${pluralName}`}
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Create button (permission-gated) */}
          <PermissionGate entityType={entityType} action="create">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
              aria-label={`Create new ${displayName}`}
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
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Create {displayName}</span>
            </button>
          </PermissionGate>
        </div>
      </header>

      {/* Data Table */}
      <DataTable
        columns={columnsWithActions}
        data={dataWithClickHandler}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSort={handleSort}
        onFilter={handleFilter}
        onSearch={handleSearch}
        entityType={entityType}
        sortField={sortField}
        sortDirection={sortDirection}
        search={search}
        filters={filters}
        loading={loading}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={handleCloseCreate}
        title={`Create ${displayName}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Form error */}
          {createFormErrors._form && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {createFormErrors._form}
            </div>
          )}

          {/* Form fields */}
          {createFormFields.length > 0 ? (
            createFormFields.map((field) => (
              <FormField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={createFormData[field.name] !== undefined ? createFormData[field.name] : ''}
                onChange={handleCreateFieldChange}
                error={createFormErrors[field.name] || null}
                required={field.required}
                options={field.options || undefined}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                minLength={field.minLength}
                maxLength={field.maxLength}
              />
            ))
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No form fields available for this entity type.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button
              type="button"
              onClick={handleCloseCreate}
              disabled={createLoading}
              className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSubmit}
              disabled={createLoading || createFormFields.length === 0}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Create ${displayName}`}
            >
              {createLoading && (
                <div
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              )}
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={`Delete ${displayName}`}
        message={deleteMessage}
        confirmLabel={deleteImpact && !deleteImpact.canDelete ? 'OK' : 'Delete'}
        cancelLabel={deleteImpact && !deleteImpact.canDelete ? 'Close' : 'Cancel'}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default EntityListPage;