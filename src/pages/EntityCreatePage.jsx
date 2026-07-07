import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { create } from '../services/entityRepository';
import { getEntitySchema, getEnumFields } from '../constants/entitySchemas';
import { ENTITY_NAMES } from '../constants/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import FormField from '../components/common/FormField';

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
 * Fields to skip in the create form.
 * @type {Set<string>}
 */
const SKIP_CREATE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'version',
  'metadata',
]);

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
 * Generic entity creation page.
 * Renders form fields based on entity schema. Validates input, creates entity
 * via entityRepository, and navigates to detail page on success. Permission-gated.
 *
 * @returns {React.ReactElement}
 */
const EntityCreatePage = () => {
  const { entityType: routeEntityType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { persona, canCreate: personaCanCreate, canView } = usePersona();

  // Resolve entity type from route
  const entityType = useMemo(() => {
    if (routeEntityType) {
      return resolveEntityType(routeEntityType);
    }
    // Fall back to current path
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

  const hasCreatePermission = useMemo(() => {
    if (!entityType) {
      return false;
    }
    return personaCanCreate(entityType);
  }, [entityType, personaCanCreate]);

  // Form state
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  // Simulated loading
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [entityType]);

  /**
   * Builds the list of form fields from the entity schema.
   */
  const formFields = useMemo(() => {
    if (!schema || !entityType) {
      return [];
    }

    const enumFieldMap = getEnumFields(entityType);
    const fields = [];
    const requiredFields = schema.requiredFields || [];

    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (SKIP_CREATE_FIELDS.has(fieldName)) {
        return;
      }

      // Skip complex fields that are hard to edit in a simple form
      if (fieldDef.type === 'json' || fieldDef.type === 'object' || fieldDef.type === 'array') {
        return;
      }

      // Skip foreign key fields for the create form (too complex for a simple form)
      if (fieldDef.type === 'foreign_key') {
        return;
      }

      const isRequired = requiredFields.includes(fieldName);
      const { inputType, options } = getFieldInputConfig(fieldDef, fieldName);

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
        description: fieldDef.description || null,
      });
    });

    return fields;
  }, [schema, entityType]);

  // Initialize form data with defaults when form fields change
  useEffect(() => {
    if (formFields.length > 0) {
      const defaults = {};
      formFields.forEach((field) => {
        if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else if (field.type === 'number') {
          defaults[field.name] = '';
        } else {
          defaults[field.name] = '';
        }
      });
      setFormData(defaults);
      setFormErrors({});
    }
  }, [formFields]);

  /**
   * Handles form field change.
   */
  const handleFieldChange = useCallback((name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /**
   * Validates the form data.
   * @returns {{ valid: boolean, errors: Object<string, string> }}
   */
  const validateForm = useCallback(() => {
    const errors = {};

    formFields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name];
        if (value === null || value === undefined || value === '') {
          errors[field.name] = `${field.label} is required`;
        }
      }

      // Validate number ranges
      if (field.type === 'number' && formData[field.name] !== '' && formData[field.name] !== null && formData[field.name] !== undefined) {
        const numVal = typeof formData[field.name] === 'number' ? formData[field.name] : parseFloat(formData[field.name]);
        if (!Number.isNaN(numVal)) {
          if (field.min !== null && field.min !== undefined && numVal < field.min) {
            errors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== null && field.max !== undefined && numVal > field.max) {
            errors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }
      }

      // Validate string lengths
      if ((field.type === 'text' || field.type === 'textarea') && typeof formData[field.name] === 'string' && formData[field.name].trim() !== '') {
        const strVal = formData[field.name].trim();
        if (field.minLength !== null && field.minLength !== undefined && strVal.length < field.minLength) {
          errors[field.name] = `${field.label} must be at least ${field.minLength} characters`;
        }
        if (field.maxLength !== null && field.maxLength !== undefined && strVal.length > field.maxLength) {
          errors[field.name] = `${field.label} must be at most ${field.maxLength} characters`;
        }
      }
    });

    return { valid: Object.keys(errors).length === 0, errors };
  }, [formFields, formData]);

  /**
   * Handles form submission.
   */
  const handleSubmit = useCallback(() => {
    if (!entityType) {
      return;
    }

    const validation = validateForm();
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setCreateLoading(true);

    // Build the record data - only include non-empty fields
    const recordData = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        recordData[key] = value;
      }
    });

    const result = create(entityType, recordData);

    setCreateLoading(false);

    if (result.success && result.data) {
      // Navigate to the detail page for the newly created entity
      const basePath = resolveRoutePath(entityType);
      navigate(`${basePath}/${result.data.id}`);
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
          setFormErrors(fieldErrors);
        } else {
          setFormErrors({ _form: result.error || result.errors.join('; ') });
        }
      } else {
        setFormErrors({ _form: result.error || 'Failed to create record' });
      }
    }
  }, [entityType, formData, validateForm, navigate]);

  /**
   * Handles cancel action - navigates back to the entity list.
   */
  const handleCancel = useCallback(() => {
    if (entityType) {
      const basePath = resolveRoutePath(entityType);
      navigate(basePath);
    } else {
      navigate('/dashboard');
    }
  }, [entityType, navigate]);

  /**
   * Handles form submission via keyboard (Enter key on non-textarea fields).
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

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
  if (!hasCreatePermission) {
    return (
      <PermissionDenied
        title={`Access Denied — Create ${displayName}`}
        entityType={entityType}
        action="create"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  if (simulatedLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label={`Loading create ${displayName} form`}
      >
        <LoadingSpinner size="lg" label={`Loading create ${displayName} form...`} />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label={`Create ${displayName}`}>
      {/* Page Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={handleCancel}
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
              Create {displayName}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              Fill in the details below to create a new {displayName.toLowerCase()}.
            </p>
          </div>
        </div>
      </header>

      {/* Create Form */}
      <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {displayName} Details
          </h2>
        </div>
        <div className="p-5 space-y-4" onKeyDown={handleKeyDown}>
          {/* Form error */}
          {formErrors._form && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {formErrors._form}
            </div>
          )}

          {/* Form fields */}
          {formFields.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {formFields.map((field) => (
                <FormField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  value={formData[field.name] !== undefined ? formData[field.name] : ''}
                  onChange={handleFieldChange}
                  error={formErrors[field.name] || null}
                  required={field.required}
                  options={field.options || undefined}
                  placeholder={field.placeholder}
                  helpText={field.description}
                  min={field.min}
                  max={field.max}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No form fields available for this entity type.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button
              type="button"
              onClick={handleCancel}
              disabled={createLoading}
              className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createLoading || formFields.length === 0}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Create ${displayName}`}
            >
              {createLoading && (
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {createLoading ? 'Creating...' : `Create ${displayName}`}
            </button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          Fields marked with <span className="text-red-500">*</span> are required.
          {' '}Complex fields (arrays, objects, foreign keys) can be edited after creation on the detail page.
        </p>
      </footer>
    </div>
  );
};

export default EntityCreatePage;