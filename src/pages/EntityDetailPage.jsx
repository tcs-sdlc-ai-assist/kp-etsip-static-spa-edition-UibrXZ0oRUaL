import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { read, update, remove, getDeleteImpact, list } from '../services/entityRepository';
import { getEntitySchema, getEnumFields, getForeignKeys, getReferencingEntities } from '../constants/entitySchemas';
import { ENTITY_NAMES } from '../constants/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionGate from '../components/common/PermissionGate';
import PermissionDenied from '../components/common/PermissionDenied';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import { getScoreBand } from '../constants/constants';

/**
 * Maps route path segments to entity type keys.
 * @type {Object<string, string>}
 */
const ROUTE_TO_ENTITY_TYPE = {
  portfolios: 'PORTFOLIO',
  applications: 'APPLICATION',
  'technology-standards': 'TECH_STANDARD',
  'tech-radar': 'TECH_STANDARD',
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
 * Maps entity type keys to their route path segments.
 * @type {Object<string, string>}
 */
const ENTITY_TYPE_TO_ROUTE = {};
Object.entries(ROUTE_TO_ENTITY_TYPE).forEach(([route, type]) => {
  if (!ENTITY_TYPE_TO_ROUTE[type]) {
    ENTITY_TYPE_TO_ROUTE[type] = route;
  }
});

/**
 * Resolves the entity type from a route path segment.
 * @param {string} routeSegment - The route path segment.
 * @returns {string|null}
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
  const route = ENTITY_TYPE_TO_ROUTE[entityType];
  return route ? `/${route}` : '/';
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
  if (['info', 'emerging', 'recommended', 'preferred', 'acceptable', 'running'].includes(lower)) {
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
 * Fields to skip in the detail view.
 * @type {Set<string>}
 */
const SKIP_DISPLAY_FIELDS = new Set(['version', 'createdBy', 'updatedBy', 'metadata']);

/**
 * Fields that should not be editable.
 * @type {Set<string>}
 */
const NON_EDITABLE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'version']);

/**
 * Formats a field name into a human-readable label.
 * @param {string} fieldName - The field name.
 * @returns {string}
 */
const formatFieldLabel = (fieldName) => {
  if (typeof fieldName !== 'string') {
    return '';
  }
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
};

/**
 * Formats a timestamp for display.
 * @param {string} value - ISO 8601 timestamp.
 * @returns {string}
 */
const formatTimestamp = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '—';
  }
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return value;
  }
};

/**
 * Determines the input type for a field based on its schema definition.
 * @param {Object} fieldDef - The field definition from the schema.
 * @param {string} fieldName - The field name.
 * @returns {{ inputType: string, options: Array|null }}
 */
const getFieldInputConfig = (fieldDef, fieldName) => {
  let inputType = 'text';
  let options = null;

  if (!fieldDef) {
    return { inputType, options };
  }

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

  return { inputType, options };
};

/**
 * Renders a field value for display (non-edit mode).
 * @param {string} fieldName - The field name.
 * @param {*} value - The field value.
 * @param {Object} fieldDef - The field definition from the schema.
 * @returns {React.ReactElement}
 */
const renderFieldValue = (fieldName, value, fieldDef) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
  }

  // Status-like fields
  if (fieldName === 'status' || fieldName === 'complianceStatus' || fieldName === 'healthStatus') {
    return <StatusBadge status={String(value)} variant={statusToVariant(String(value))} size="sm" />;
  }

  // Priority and risk fields
  if (fieldName === 'priority' || fieldName === 'riskLevel' || fieldName === 'severity' || fieldName === 'criticality' || fieldName === 'complianceImpact' || fieldName === 'riskAssessment') {
    return <StatusBadge status={String(value)} variant={riskToVariant(String(value))} size="sm" />;
  }

  // Score fields
  if ((fieldName === 'complianceScore' || fieldName === 'healthScore' || fieldName === 'confidenceScore' || fieldName === 'impactScore' || fieldName === 'score') && typeof value === 'number') {
    const band = getScoreBand(value);
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {Math.round(value)}
          {fieldName.includes('Score') || fieldName.includes('Percentage') ? '%' : ''}
        </span>
        {band && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: band.color }}
            aria-hidden="true"
          />
        )}
        {band && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {band.label}
          </span>
        )}
      </div>
    );
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
          value
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  // Array fields
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
    }
    // Simple string arrays
    if (value.every((item) => typeof item === 'string')) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-2xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }
    // Complex arrays
    return (
      <pre className="max-h-40 overflow-auto rounded-lg bg-neutral-50 p-2 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  // Object fields
  if (typeof value === 'object') {
    return (
      <pre className="max-h-40 overflow-auto rounded-lg bg-neutral-50 p-2 text-xs text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  // Timestamp fields
  if (fieldName === 'createdAt' || fieldName === 'updatedAt' || fieldName.endsWith('At') || fieldName.endsWith('Date') || fieldName === 'timestamp') {
    if (typeof value === 'string' && (value.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(value))) {
      return (
        <span className="text-sm text-neutral-700 dark:text-neutral-300" title={value}>
          {formatTimestamp(value)}
        </span>
      );
    }
  }

  // URL fields
  if (fieldDef && (fieldDef.type === 'url' || fieldName.toLowerCase().includes('url'))) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
      >
        {String(value)}
      </a>
    );
  }

  // Enum fields - format nicely
  if (fieldDef && fieldDef.type === 'enum') {
    return (
      <span className="text-sm text-neutral-900 dark:text-neutral-100">
        {String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </span>
    );
  }

  // Number fields
  if (typeof value === 'number') {
    return (
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {value.toLocaleString()}
      </span>
    );
  }

  // Default string display
  return (
    <span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">
      {String(value)}
    </span>
  );
};

/**
 * Generic entity detail/edit page.
 * Displays entity fields in a form layout. Supports view, edit, and delete modes
 * based on permissions. Shows related entities (referential links).
 * Uses entityRepository for CRUD. All actions audit-logged.
 *
 * @returns {React.ReactElement}
 */
const EntityDetailPage = () => {
  const { entityType: routeEntityType, id: entityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { persona, canView, canEdit: personaCanEdit, canDelete: personaCanDelete } = usePersona();

  // Resolve entity type from route
  const entityType = useMemo(() => {
    if (routeEntityType) {
      return resolveEntityType(routeEntityType);
    }
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
      return 'Entity';
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

  const hasEditPermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return personaCanEdit(entityType);
  }, [entityType, personaCanEdit]);

  const hasDeletePermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return personaCanDelete(entityType);
  }, [entityType, personaCanDelete]);

  // Entity data state
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState(null);

  // Related entities state
  const [relatedEntities, setRelatedEntities] = useState({});
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Simulated loading
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [entityType, entityId]);

  /**
   * Loads the entity data from the repository.
   */
  const loadEntity = useCallback(() => {
    if (!entityType || !entityId) {
      setError('Entity type or ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = read(entityType, entityId);

    if (result.success && result.data) {
      setEntity(result.data);
      setError(null);
    } else {
      setEntity(null);
      setError(result.error || `${displayName} with ID '${entityId}' not found`);
    }

    setLoading(false);
  }, [entityType, entityId, displayName]);

  /**
   * Loads related entities based on foreign key references.
   */
  const loadRelatedEntities = useCallback(() => {
    if (!entityType || !entityId || !entity) {
      return;
    }

    setRelatedLoading(true);
    const related = {};

    // Find entities that reference this entity (incoming references)
    try {
      const referencingEntities = getReferencingEntities(entityType);
      referencingEntities.forEach((ref) => {
        try {
          const result = list(ref.entityType, {
            filters: { [ref.field]: entityId },
            page: 1,
            pageSize: 10,
          });

          if (result.success && result.data && result.data.length > 0) {
            const refDisplayName = ENTITY_NAMES[ref.entityType] || ref.entityType;
            const refSchema = getEntitySchema(ref.entityType);
            const refPluralName = refSchema ? refSchema.pluralName : `${refDisplayName}s`;

            related[ref.entityType] = {
              entityType: ref.entityType,
              displayName: refDisplayName,
              pluralName: refPluralName,
              field: ref.field,
              data: result.data,
              total: result.total,
              direction: 'incoming',
            };
          }
        } catch {
          // Skip failed lookups
        }
      });
    } catch {
      // Skip if getReferencingEntities fails
    }

    // Find entities this entity references (outgoing references via foreign keys)
    try {
      const foreignKeys = getForeignKeys(entityType);
      foreignKeys.forEach((fk) => {
        const fkValue = entity[fk.field];
        if (!fkValue || typeof fkValue !== 'string') {
          return;
        }

        try {
          const result = read(fk.targetEntity, fkValue);
          if (result.success && result.data) {
            const refDisplayName = ENTITY_NAMES[fk.targetEntity] || fk.targetEntity;
            const key = `${fk.targetEntity}_${fk.field}`;

            related[key] = {
              entityType: fk.targetEntity,
              displayName: refDisplayName,
              pluralName: refDisplayName,
              field: fk.field,
              data: [result.data],
              total: 1,
              direction: 'outgoing',
              fieldLabel: formatFieldLabel(fk.field),
            };
          }
        } catch {
          // Skip failed lookups
        }
      });
    } catch {
      // Skip if getForeignKeys fails
    }

    setRelatedEntities(related);
    setRelatedLoading(false);
  }, [entityType, entityId, entity]);

  // Load entity on mount and when dependencies change
  useEffect(() => {
    if (entityType && entityId && hasViewPermission) {
      loadEntity();
    }
  }, [entityType, entityId, hasViewPermission, loadEntity]);

  // Load related entities after entity is loaded
  useEffect(() => {
    if (entity) {
      loadRelatedEntities();
    }
  }, [entity, loadRelatedEntities]);

  /**
   * Enters edit mode and populates the form with current entity data.
   */
  const handleEnterEditMode = useCallback(() => {
    if (!entity || !schema) {
      return;
    }

    const formData = {};
    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (NON_EDITABLE_FIELDS.has(fieldName)) {
        return;
      }
      if (SKIP_DISPLAY_FIELDS.has(fieldName)) {
        return;
      }
      // Skip complex fields
      if (fieldDef.type === 'json' || fieldDef.type === 'object' || fieldDef.type === 'array') {
        return;
      }
      // Skip foreign key fields
      if (fieldDef.type === 'foreign_key') {
        return;
      }

      const value = entity[fieldName];
      if (fieldDef.type === 'boolean') {
        formData[fieldName] = !!value;
      } else if (value === null || value === undefined) {
        formData[fieldName] = '';
      } else {
        formData[fieldName] = value;
      }
    });

    setEditFormData(formData);
    setEditFormErrors({});
    setEditMode(true);
  }, [entity, schema]);

  /**
   * Exits edit mode without saving.
   */
  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setEditFormData({});
    setEditFormErrors({});
  }, []);

  /**
   * Handles edit form field change.
   */
  const handleEditFieldChange = useCallback((name, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setEditFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /**
   * Saves the edited entity.
   */
  const handleSaveEdit = useCallback(() => {
    if (!entityType || !entityId || !schema) {
      return;
    }

    // Validate required fields
    const errors = {};
    const requiredFields = schema.requiredFields || [];

    Object.entries(editFormData).forEach(([fieldName, value]) => {
      if (requiredFields.includes(fieldName)) {
        if (value === null || value === undefined || value === '') {
          errors[fieldName] = `${formatFieldLabel(fieldName)} is required`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    setEditLoading(true);

    // Build update data - only include changed fields
    const updateData = {};
    Object.entries(editFormData).forEach(([key, value]) => {
      if (value !== entity[key]) {
        if (value === '' && (entity[key] === null || entity[key] === undefined)) {
          return;
        }
        updateData[key] = value === '' ? null : value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      setEditLoading(false);
      setEditMode(false);
      return;
    }

    const result = update(entityType, entityId, updateData);

    setEditLoading(false);

    if (result.success && result.data) {
      setEntity(result.data);
      setEditMode(false);
      setEditFormData({});
      setEditFormErrors({});
    } else {
      if (result.errors && result.errors.length > 0) {
        const fieldErrors = {};
        result.errors.forEach((err) => {
          const match = err.match(/Field '(\w+)'/);
          if (match) {
            fieldErrors[match[1]] = err;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setEditFormErrors(fieldErrors);
        } else {
          setEditFormErrors({ _form: result.error || result.errors.join('; ') });
        }
      } else {
        setEditFormErrors({ _form: result.error || 'Failed to update record' });
      }
    }
  }, [entityType, entityId, schema, editFormData, entity]);

  /**
   * Opens the delete confirmation dialog.
   */
  const handleOpenDelete = useCallback(() => {
    if (!entityType || !entityId) {
      return;
    }
    const impact = getDeleteImpact(entityType, entityId);
    setDeleteImpact(impact);
    setDeleteDialogOpen(true);
  }, [entityType, entityId]);

  /**
   * Confirms the delete action.
   */
  const handleConfirmDelete = useCallback(() => {
    if (!entityType || !entityId) {
      return;
    }

    setDeleteLoading(true);

    const result = remove(entityType, entityId);

    setDeleteLoading(false);

    if (result.success) {
      setDeleteDialogOpen(false);
      const basePath = resolveRoutePath(entityType);
      navigate(basePath);
    }
  }, [entityType, entityId, navigate]);

  /**
   * Cancels the delete action.
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteImpact(null);
  }, []);

  /**
   * Navigates back to the entity list.
   */
  const handleBackToList = useCallback(() => {
    const basePath = resolveRoutePath(entityType);
    navigate(basePath);
  }, [entityType, navigate]);

  /**
   * Navigates to a related entity detail page.
   */
  const handleNavigateToRelated = useCallback(
    (relatedEntityType, relatedId) => {
      const basePath = resolveRoutePath(relatedEntityType);
      navigate(`${basePath}/${relatedId}`);
    },
    [navigate]
  );

  /**
   * Refreshes the entity data.
   */
  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    loadEntity();
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 300);
  }, [loadEntity]);

  /**
   * Builds the delete confirmation message.
   */
  const deleteMessage = useMemo(() => {
    const entityName = entity
      ? entity.name || entity.title || entity.term || entity.displayName || entity.username || entityId
      : entityId;

    let message = `Are you sure you want to delete "${entityName}"? This action cannot be undone.`;

    if (deleteImpact) {
      if (!deleteImpact.canDelete && deleteImpact.blockingReferences.length > 0) {
        const blockingDetails = deleteImpact.blockingReferences
          .map((ref) => `${ref.count} ${ENTITY_NAMES[ref.entityType] || ref.entityType} record(s)`)
          .join(', ');
        message = `Cannot delete "${entityName}". It is referenced by: ${blockingDetails}. Remove the references first.`;
      } else {
        const cascadeDetails = deleteImpact.cascadeReferences
          .map((ref) => `${ref.count} ${ENTITY_NAMES[ref.entityType] || ref.entityType} record(s)`)
          .join(', ');
        const setNullDetails = deleteImpact.setNullReferences
          .map((ref) => `${ref.count} ${ENTITY_NAMES[ref.entityType] || ref.entityType} record(s)`)
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
  }, [entity, entityId, deleteImpact]);

  /**
   * Builds the list of editable form fields from the schema.
   */
  const editableFields = useMemo(() => {
    if (!schema) {
      return [];
    }

    const enumFieldMap = getEnumFields(entityType);
    const fields = [];
    const requiredFields = schema.requiredFields || [];

    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (NON_EDITABLE_FIELDS.has(fieldName)) {
        return;
      }
      if (SKIP_DISPLAY_FIELDS.has(fieldName)) {
        return;
      }
      // Skip complex fields
      if (fieldDef.type === 'json' || fieldDef.type === 'object' || fieldDef.type === 'array') {
        return;
      }
      // Skip foreign key fields
      if (fieldDef.type === 'foreign_key') {
        return;
      }

      const { inputType, options } = getFieldInputConfig(fieldDef, fieldName);
      const isRequired = requiredFields.includes(fieldName);

      fields.push({
        name: fieldName,
        label: formatFieldLabel(fieldName),
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
  }, [schema, entityType]);

  /**
   * Builds the list of display fields from the schema.
   */
  const displayFields = useMemo(() => {
    if (!schema || !entity) {
      return [];
    }

    const fields = [];

    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (SKIP_DISPLAY_FIELDS.has(fieldName)) {
        return;
      }

      fields.push({
        name: fieldName,
        label: formatFieldLabel(fieldName),
        value: entity[fieldName],
        fieldDef,
        isId: fieldName === 'id',
        isForeignKey: fieldDef.type === 'foreign_key',
        foreignKeyTarget: fieldDef.foreignKey || null,
      });
    });

    return fields;
  }, [schema, entity]);

  /**
   * Gets the primary name/title of the entity for display.
   */
  const entityTitle = useMemo(() => {
    if (!entity) {
      return entityId || 'Unknown';
    }
    return entity.name || entity.title || entity.term || entity.displayName || entity.username || entity.id;
  }, [entity, entityId]);

  // Handle unknown entity type
  if (!entityType) {
    return (
      <EmptyState
        title="Unknown Entity Type"
        message="The requested entity type could not be determined from the current route."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
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
        title={`Access Denied — ${displayName}`}
        entityType={entityType}
        action="view"
        resourceId={entityId}
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading || loading;

  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label={`Loading ${displayName}`}
      >
        <LoadingSpinner size="lg" label={`Loading ${displayName}...`} />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <EmptyState
        title={`${displayName} Not Found`}
        message={error || `The requested ${displayName.toLowerCase()} could not be found.`}
        actionLabel={`Back to ${pluralName}`}
        onAction={handleBackToList}
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

  return (
    <div className="space-y-6" role="region" aria-label={`${displayName} detail`}>
      {/* Page Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBackToList}
            className="btn-outline flex h-9 w-9 items-center justify-center rounded-lg p-0"
            aria-label={`Back to ${pluralName}`}
            title={`Back to ${pluralName}`}
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
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {entityTitle}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {displayName}
              <span className="mx-1.5">·</span>
              <span className="font-mono text-xs">{entityId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
            aria-label="Refresh"
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

          {/* Edit button (permission-gated) */}
          {!editMode && (
            <PermissionGate entityType={entityType} action="edit">
              <button
                type="button"
                onClick={handleEnterEditMode}
                className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
                aria-label={`Edit ${displayName}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Edit</span>
              </button>
            </PermissionGate>
          )}

          {/* Delete button (permission-gated) */}
          {!editMode && (
            <PermissionGate entityType={entityType} action="delete">
              <button
                type="button"
                onClick={handleOpenDelete}
                className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                aria-label={`Delete ${displayName}`}
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
                <span className="hidden sm:inline">Delete</span>
              </button>
            </PermissionGate>
          )}
        </div>
      </header>

      {/* Edit Mode Form */}
      {editMode && (
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Edit {displayName}
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Form error */}
            {editFormErrors._form && (
              <div
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
                role="alert"
              >
                {editFormErrors._form}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {editableFields.map((field) => (
                <FormField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  value={editFormData[field.name] !== undefined ? editFormData[field.name] : ''}
                  onChange={handleEditFieldChange}
                  error={editFormErrors[field.name] || null}
                  required={field.required}
                  options={field.options || undefined}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                />
              ))}
            </div>

            {editableFields.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No editable fields available for this entity type.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={editLoading}
                className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editLoading || editableFields.length === 0}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save changes"
              >
                {editLoading && (
                  <div
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode - Entity Details */}
      {!editMode && (
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {displayName} Details
            </h2>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {displayFields.map((field) => {
                // Skip fields with no value and that are not important
                const hasValue = field.value !== null && field.value !== undefined && field.value !== '';

                return (
                  <div
                    key={field.name}
                    className={`${
                      field.fieldDef.type === 'text' || field.fieldDef.type === 'json' || field.fieldDef.type === 'array'
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {field.label}
                    </dt>
                    <dd className="mt-1">
                      {field.isForeignKey && hasValue ? (
                        <button
                          type="button"
                          onClick={() => handleNavigateToRelated(field.foreignKeyTarget, field.value)}
                          className="text-sm text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline font-mono"
                          aria-label={`View ${field.foreignKeyTarget} ${field.value}`}
                        >
                          {field.value}
                        </button>
                      ) : (
                        renderFieldValue(field.name, field.value, field.fieldDef)
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      )}

      {/* Related Entities */}
      {!editMode && Object.keys(relatedEntities).length > 0 && (
        <section aria-label="Related entities" className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Related Entities
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Object.entries(relatedEntities).map(([key, related]) => (
              <div
                key={key}
                className="rounded-xl bg-white shadow-card dark:bg-neutral-800"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {related.direction === 'outgoing' ? related.fieldLabel || related.displayName : related.pluralName}
                    </h3>
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-100 px-1.5 text-2xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      {related.total}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
                      related.direction === 'outgoing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {related.direction === 'outgoing' ? 'References' : 'Referenced by'}
                  </span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {related.data.slice(0, 5).map((record) => {
                    if (!record || !record.id) {
                      return null;
                    }
                    const recordName = record.name || record.title || record.term || record.displayName || record.username || record.id;
                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => handleNavigateToRelated(related.entityType, record.id)}
                        className="flex w-full items-center justify-between px-5 py-2.5 text-left transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                        aria-label={`View ${related.displayName} ${recordName}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {recordName}
                          </p>
                          <p className="truncate text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                            {record.id}
                          </p>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          {record.status && (
                            <StatusBadge
                              status={record.status}
                              variant={statusToVariant(record.status)}
                              size="sm"
                            />
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 flex-shrink-0 text-neutral-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                  {related.total > 5 && (
                    <div className="px-5 py-2 text-center">
                      <span className="text-2xs text-neutral-400 dark:text-neutral-500">
                        Showing 5 of {related.total} records
                      </span>
                    </div>
                  )}
                  {related.data.length === 0 && (
                    <div className="px-5 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      No related records found.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related entities loading */}
      {!editMode && relatedLoading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" label="Loading related entities..." />
        </div>
      )}

      {/* Timestamps footer */}
      {!editMode && entity && (
        <footer className="text-center">
          <p className="text-2xs text-neutral-400 dark:text-neutral-500">
            Created: {formatTimestamp(entity.createdAt)}
            {entity.createdBy && (
              <span> by {entity.createdBy}</span>
            )}
            <span className="mx-2">·</span>
            Updated: {formatTimestamp(entity.updatedAt)}
            {entity.updatedBy && (
              <span> by {entity.updatedBy}</span>
            )}
            {entity.version && (
              <>
                <span className="mx-2">·</span>
                Version: {entity.version}
              </>
            )}
          </p>
        </footer>
      )}

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

export default EntityDetailPage;