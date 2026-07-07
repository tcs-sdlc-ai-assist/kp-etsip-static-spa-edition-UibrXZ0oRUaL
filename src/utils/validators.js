import { SCHEMA_VERSION, STORAGE_KEYS } from '../constants/constants';
import {
  ENTITY_SCHEMAS,
  FIELD_TYPES,
  REF_ACTIONS,
  getEntitySchema,
  getForeignKeys,
  validateFieldValue,
  validateEntity as schemaValidateEntity,
  getRequiredFields,
} from '../constants/entitySchemas';

/**
 * Validates a single entity record against its schema definition.
 * Checks required fields, types, enum values, min/max constraints, and patterns.
 *
 * @param {Object} entity - The entity record to validate.
 * @param {string} entityType - The entity type key (e.g., 'PORTFOLIO', 'APPLICATION').
 * @returns {{ valid: boolean, errors: Object<string, string[]>, warnings: string[] }}
 */
export const validateEntity = (entity, entityType) => {
  const result = {
    valid: true,
    errors: {},
    warnings: [],
  };

  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    result.valid = false;
    result.errors._entity = ['Entity must be a non-null object'];
    return result;
  }

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    result.valid = false;
    result.errors._entity = ['Entity type must be a non-empty string'];
    return result;
  }

  const schema = getEntitySchema(entityType);
  if (!schema) {
    result.valid = false;
    result.errors._entity = [`Unknown entity type: ${entityType}`];
    return result;
  }

  const requiredFields = getRequiredFields(entityType);

  // Check required fields are present
  requiredFields.forEach((fieldName) => {
    const value = entity[fieldName];
    if (value === null || value === undefined || value === '') {
      if (!result.errors[fieldName]) {
        result.errors[fieldName] = [];
      }
      result.errors[fieldName].push(`Field '${fieldName}' is required`);
      result.valid = false;
    }
  });

  // Validate each field that has a value
  Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
    const value = entity[fieldName];

    // Skip fields that are not present and not required (already checked above)
    if ((value === null || value === undefined || value === '') && !fieldDef.required) {
      return;
    }

    // Skip required fields that are missing (already reported above)
    if ((value === null || value === undefined || value === '') && fieldDef.required) {
      return;
    }

    const { valid: fieldValid, errors: fieldErrors } = validateFieldValue(value, fieldDef);
    if (!fieldValid) {
      if (!result.errors[fieldName]) {
        result.errors[fieldName] = [];
      }
      result.errors[fieldName].push(...fieldErrors);
      result.valid = false;
    }
  });

  // Warn about unknown fields
  const knownFields = new Set(Object.keys(schema.fields));
  Object.keys(entity).forEach((key) => {
    if (!knownFields.has(key)) {
      result.warnings.push(`Unknown field '${key}' is not defined in the ${entityType} schema`);
    }
  });

  return result;
};

/**
 * Validates import data structure and schema version.
 * Checks that the data has the expected structure for importing into the system.
 *
 * @param {*} data - The data to validate for import.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], entityCounts: Object<string, number> }}
 */
export const validateImportData = (data) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    entityCounts: {},
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    result.valid = false;
    result.errors.push('Import data must be a non-null object');
    return result;
  }

  // Check schema version
  if (data.schemaVersion) {
    if (typeof data.schemaVersion !== 'string') {
      result.valid = false;
      result.errors.push('Schema version must be a string');
    } else if (data.schemaVersion !== SCHEMA_VERSION) {
      result.warnings.push(
        `Schema version mismatch: expected '${SCHEMA_VERSION}', got '${data.schemaVersion}'. Data may require migration.`
      );
    }
  } else {
    result.warnings.push('No schema version found in import data. Assuming current version.');
  }

  // Map storage keys to entity type keys for validation
  const storageKeyToEntityType = {
    [STORAGE_KEYS.PORTFOLIOS]: 'PORTFOLIO',
    [STORAGE_KEYS.APPLICATIONS]: 'APPLICATION',
    [STORAGE_KEYS.RELATIONSHIPS]: 'RELATIONSHIP',
    [STORAGE_KEYS.TECH_CATEGORIES]: 'TECH_CATEGORY',
    [STORAGE_KEYS.TECH_STANDARDS]: 'TECH_STANDARD',
    [STORAGE_KEYS.TECH_ENTRIES]: 'TECH_ENTRY',
    [STORAGE_KEYS.DEFINITIONS]: 'DEFINITION',
    [STORAGE_KEYS.ENVIRONMENTS]: 'ENVIRONMENT',
    [STORAGE_KEYS.TECH_DEBT]: 'TECH_DEBT',
    [STORAGE_KEYS.QUALITY_GATES]: 'QUALITY_GATE',
    [STORAGE_KEYS.GOVERNANCE_RECORDS]: 'GOVERNANCE_RECORD',
    [STORAGE_KEYS.APPROVAL_REQUESTS]: 'APPROVAL_REQUEST',
    [STORAGE_KEYS.WAIVERS]: 'WAIVER',
    [STORAGE_KEYS.EVIDENCE]: 'EVIDENCE',
    [STORAGE_KEYS.USERS]: 'USER',
    [STORAGE_KEYS.ROLES]: 'ROLE',
    [STORAGE_KEYS.INTEGRATIONS]: 'INTEGRATION',
    [STORAGE_KEYS.NOTIFICATIONS]: 'NOTIFICATION',
    [STORAGE_KEYS.AI_ANALYSES]: 'AI_ANALYSIS',
    [STORAGE_KEYS.PDE_CONFIGS]: 'PDE_CONFIG',
    [STORAGE_KEYS.DEMO_SCENARIOS]: 'DEMO_SCENARIO',
    [STORAGE_KEYS.SCHEDULES]: 'SCHEDULE',
    [STORAGE_KEYS.AUDIT_LOGS]: 'AUDIT_LOG',
    [STORAGE_KEYS.USE_CASES]: 'USE_CASE',
  };

  const validStorageKeys = new Set(Object.keys(storageKeyToEntityType));
  const knownMetaKeys = new Set(['schemaVersion', 'exportedAt', 'exportedBy', 'version', 'metadata']);

  let hasEntityData = false;

  Object.entries(data).forEach(([key, value]) => {
    // Skip known meta keys
    if (knownMetaKeys.has(key)) {
      return;
    }

    if (validStorageKeys.has(key)) {
      if (!Array.isArray(value)) {
        result.valid = false;
        result.errors.push(`Data for '${key}' must be an array, got ${typeof value}`);
        return;
      }

      hasEntityData = true;
      const entityType = storageKeyToEntityType[key];
      result.entityCounts[entityType] = value.length;

      // Validate each record in the array
      value.forEach((record, index) => {
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          result.errors.push(`Record at index ${index} in '${key}' must be a non-null object`);
          result.valid = false;
          return;
        }

        // Check that each record has an id
        if (!record.id || typeof record.id !== 'string' || record.id.trim() === '') {
          result.errors.push(`Record at index ${index} in '${key}' is missing a valid 'id' field`);
          result.valid = false;
        }

        // Check required fields
        const schema = getEntitySchema(entityType);
        if (schema) {
          const requiredFields = schema.requiredFields || [];
          requiredFields.forEach((fieldName) => {
            const fieldValue = record[fieldName];
            if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
              result.warnings.push(
                `Record '${record.id || `index ${index}`}' in '${key}' is missing required field '${fieldName}'`
              );
            }
          });
        }
      });

      // Check for duplicate IDs within the same entity type
      const ids = new Set();
      value.forEach((record) => {
        if (record && record.id) {
          if (ids.has(record.id)) {
            result.errors.push(`Duplicate ID '${record.id}' found in '${key}'`);
            result.valid = false;
          } else {
            ids.add(record.id);
          }
        }
      });
    } else {
      result.warnings.push(`Unknown key '${key}' in import data will be ignored`);
    }
  });

  if (!hasEntityData) {
    result.warnings.push('Import data contains no recognized entity data');
  }

  return result;
};

/**
 * Validates referential integrity for a specific entity by checking that all
 * foreign key references point to existing records in the provided data.
 *
 * @param {string} entityType - The entity type key (e.g., 'PORTFOLIO', 'APPLICATION').
 * @param {string} id - The ID of the specific entity to validate.
 * @param {Object<string, Array<Object>>} allData - All data keyed by storage key or entity type key.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export const validateReferentialIntegrity = (entityType, id, allData) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    result.valid = false;
    result.errors.push('Entity type must be a non-empty string');
    return result;
  }

  if (typeof id !== 'string' || id.trim() === '') {
    result.valid = false;
    result.errors.push('Entity ID must be a non-empty string');
    return result;
  }

  if (!allData || typeof allData !== 'object' || Array.isArray(allData)) {
    result.valid = false;
    result.errors.push('allData must be a non-null object');
    return result;
  }

  const schema = getEntitySchema(entityType);
  if (!schema) {
    result.valid = false;
    result.errors.push(`Unknown entity type: ${entityType}`);
    return result;
  }

  const foreignKeys = getForeignKeys(entityType);
  if (foreignKeys.length === 0) {
    return result;
  }

  // Build a lookup for entity type to data array
  const entityTypeToStorageKey = {
    PORTFOLIO: STORAGE_KEYS.PORTFOLIOS,
    APPLICATION: STORAGE_KEYS.APPLICATIONS,
    RELATIONSHIP: STORAGE_KEYS.RELATIONSHIPS,
    TECH_CATEGORY: STORAGE_KEYS.TECH_CATEGORIES,
    TECH_STANDARD: STORAGE_KEYS.TECH_STANDARDS,
    TECH_ENTRY: STORAGE_KEYS.TECH_ENTRIES,
    DEFINITION: STORAGE_KEYS.DEFINITIONS,
    ENVIRONMENT: STORAGE_KEYS.ENVIRONMENTS,
    TECH_DEBT: STORAGE_KEYS.TECH_DEBT,
    QUALITY_GATE: STORAGE_KEYS.QUALITY_GATES,
    GOVERNANCE_RECORD: STORAGE_KEYS.GOVERNANCE_RECORDS,
    APPROVAL_REQUEST: STORAGE_KEYS.APPROVAL_REQUESTS,
    WAIVER: STORAGE_KEYS.WAIVERS,
    EVIDENCE: STORAGE_KEYS.EVIDENCE,
    USER: STORAGE_KEYS.USERS,
    ROLE: STORAGE_KEYS.ROLES,
    INTEGRATION: STORAGE_KEYS.INTEGRATIONS,
    NOTIFICATION: STORAGE_KEYS.NOTIFICATIONS,
    AI_ANALYSIS: STORAGE_KEYS.AI_ANALYSES,
    PDE_CONFIG: STORAGE_KEYS.PDE_CONFIGS,
    DEMO_SCENARIO: STORAGE_KEYS.DEMO_SCENARIOS,
    SCHEDULE: STORAGE_KEYS.SCHEDULES,
    AUDIT_LOG: STORAGE_KEYS.AUDIT_LOGS,
    USE_CASE: STORAGE_KEYS.USE_CASES,
  };

  /**
   * Resolves the data array for a given entity type from allData.
   * Supports both entity type keys and storage keys as data keys.
   * @param {string} targetEntityType - The entity type key.
   * @returns {Array<Object>}
   */
  const resolveDataArray = (targetEntityType) => {
    // Try entity type key directly
    if (Array.isArray(allData[targetEntityType])) {
      return allData[targetEntityType];
    }
    // Try storage key
    const storageKey = entityTypeToStorageKey[targetEntityType];
    if (storageKey && Array.isArray(allData[storageKey])) {
      return allData[storageKey];
    }
    return [];
  };

  // Find the entity record
  const sourceStorageKey = entityTypeToStorageKey[entityType];
  let sourceRecords = [];
  if (Array.isArray(allData[entityType])) {
    sourceRecords = allData[entityType];
  } else if (sourceStorageKey && Array.isArray(allData[sourceStorageKey])) {
    sourceRecords = allData[sourceStorageKey];
  }

  const entity = sourceRecords.find((record) => record && record.id === id);
  if (!entity) {
    result.valid = false;
    result.errors.push(`Entity with ID '${id}' not found in ${entityType} data`);
    return result;
  }

  // Check each foreign key reference
  foreignKeys.forEach((fk) => {
    const fkValue = entity[fk.field];

    // If the foreign key value is null/undefined, it's only an issue if the field is required
    if (fkValue === null || fkValue === undefined || fkValue === '') {
      const fieldDef = schema.fields[fk.field];
      if (fieldDef && fieldDef.required) {
        result.valid = false;
        result.errors.push(
          `Required foreign key '${fk.field}' on entity '${id}' is missing`
        );
      }
      return;
    }

    // Look up the referenced entity
    const targetData = resolveDataArray(fk.targetEntity);

    if (targetData.length === 0) {
      result.warnings.push(
        `No data available for target entity type '${fk.targetEntity}' to validate foreign key '${fk.field}' on entity '${id}'`
      );
      return;
    }

    const targetExists = targetData.some(
      (record) => record && record.id === fkValue
    );

    if (!targetExists) {
      result.valid = false;
      result.errors.push(
        `Foreign key '${fk.field}' on entity '${id}' references '${fkValue}' which does not exist in ${fk.targetEntity}`
      );
    }
  });

  return result;
};

/**
 * Validates referential integrity for all records of a given entity type.
 *
 * @param {string} entityType - The entity type key.
 * @param {Object<string, Array<Object>>} allData - All data keyed by storage key or entity type key.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], recordResults: Object<string, { valid: boolean, errors: string[], warnings: string[] }> }}
 */
export const validateAllReferentialIntegrity = (entityType, allData) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    recordResults: {},
  };

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    result.valid = false;
    result.errors.push('Entity type must be a non-empty string');
    return result;
  }

  if (!allData || typeof allData !== 'object' || Array.isArray(allData)) {
    result.valid = false;
    result.errors.push('allData must be a non-null object');
    return result;
  }

  const entityTypeToStorageKey = {
    PORTFOLIO: STORAGE_KEYS.PORTFOLIOS,
    APPLICATION: STORAGE_KEYS.APPLICATIONS,
    RELATIONSHIP: STORAGE_KEYS.RELATIONSHIPS,
    TECH_CATEGORY: STORAGE_KEYS.TECH_CATEGORIES,
    TECH_STANDARD: STORAGE_KEYS.TECH_STANDARDS,
    TECH_ENTRY: STORAGE_KEYS.TECH_ENTRIES,
    DEFINITION: STORAGE_KEYS.DEFINITIONS,
    ENVIRONMENT: STORAGE_KEYS.ENVIRONMENTS,
    TECH_DEBT: STORAGE_KEYS.TECH_DEBT,
    QUALITY_GATE: STORAGE_KEYS.QUALITY_GATES,
    GOVERNANCE_RECORD: STORAGE_KEYS.GOVERNANCE_RECORDS,
    APPROVAL_REQUEST: STORAGE_KEYS.APPROVAL_REQUESTS,
    WAIVER: STORAGE_KEYS.WAIVERS,
    EVIDENCE: STORAGE_KEYS.EVIDENCE,
    USER: STORAGE_KEYS.USERS,
    ROLE: STORAGE_KEYS.ROLES,
    INTEGRATION: STORAGE_KEYS.INTEGRATIONS,
    NOTIFICATION: STORAGE_KEYS.NOTIFICATIONS,
    AI_ANALYSIS: STORAGE_KEYS.AI_ANALYSES,
    PDE_CONFIG: STORAGE_KEYS.PDE_CONFIGS,
    DEMO_SCENARIO: STORAGE_KEYS.DEMO_SCENARIOS,
    SCHEDULE: STORAGE_KEYS.SCHEDULES,
    AUDIT_LOG: STORAGE_KEYS.AUDIT_LOGS,
    USE_CASE: STORAGE_KEYS.USE_CASES,
  };

  let sourceRecords = [];
  if (Array.isArray(allData[entityType])) {
    sourceRecords = allData[entityType];
  } else {
    const storageKey = entityTypeToStorageKey[entityType];
    if (storageKey && Array.isArray(allData[storageKey])) {
      sourceRecords = allData[storageKey];
    }
  }

  if (sourceRecords.length === 0) {
    result.warnings.push(`No records found for entity type '${entityType}'`);
    return result;
  }

  sourceRecords.forEach((record) => {
    if (!record || !record.id) {
      result.errors.push('Found a record without a valid ID');
      result.valid = false;
      return;
    }

    const recordResult = validateReferentialIntegrity(entityType, record.id, allData);
    result.recordResults[record.id] = recordResult;

    if (!recordResult.valid) {
      result.valid = false;
      result.errors.push(...recordResult.errors);
    }
    if (recordResult.warnings.length > 0) {
      result.warnings.push(...recordResult.warnings);
    }
  });

  return result;
};

/**
 * Validates that a value is a non-empty string.
 *
 * @param {*} value - The value to check.
 * @param {string} [fieldName='value'] - The field name for error messages.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateRequiredString = (value, fieldName = 'value') => {
  if (typeof value !== 'string' || value.trim() === '') {
    return { valid: false, error: `${fieldName} must be a non-empty string` };
  }
  return { valid: true, error: null };
};

/**
 * Validates that a value is a valid email address.
 *
 * @param {*} value - The value to check.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateEmail = (value) => {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true, error: null };
};

/**
 * Validates that a value is a valid URL.
 *
 * @param {*} value - The value to check.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateUrl = (value) => {
  if (typeof value !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }
  try {
    new URL(value);
    return { valid: true, error: null };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validates that a value is a valid date string in YYYY-MM-DD format.
 *
 * @param {*} value - The value to check.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateDateString = (value) => {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { valid: false, error: 'Invalid date value' };
  }
  return { valid: true, error: null };
};

/**
 * Validates that a numeric value falls within a specified range.
 *
 * @param {*} value - The value to check.
 * @param {number} [min] - Minimum allowed value (inclusive).
 * @param {number} [max] - Maximum allowed value (inclusive).
 * @param {string} [fieldName='value'] - The field name for error messages.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateNumberRange = (value, min, max, fieldName = 'value') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  if (min !== undefined && min !== null && value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (max !== undefined && max !== null && value > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }
  return { valid: true, error: null };
};

/**
 * Validates that a value is one of the allowed enum values.
 *
 * @param {*} value - The value to check.
 * @param {string[]} allowedValues - Array of allowed values.
 * @param {string} [fieldName='value'] - The field name for error messages.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateEnum = (value, allowedValues, fieldName = 'value') => {
  if (!Array.isArray(allowedValues)) {
    return { valid: false, error: 'Allowed values must be an array' };
  }
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }
  return { valid: true, error: null };
};

/**
 * Checks whether deleting an entity would be blocked by referential integrity constraints.
 * Returns information about which entities reference the target entity with BLOCK on delete.
 *
 * @param {string} entityType - The entity type of the record to be deleted.
 * @param {string} id - The ID of the record to be deleted.
 * @param {Object<string, Array<Object>>} allData - All data keyed by storage key or entity type key.
 * @returns {{ canDelete: boolean, blockingReferences: Array<{ entityType: string, field: string, records: Array<Object> }> }}
 */
export const checkDeleteConstraints = (entityType, id, allData) => {
  const result = {
    canDelete: true,
    blockingReferences: [],
  };

  if (typeof entityType !== 'string' || typeof id !== 'string') {
    return result;
  }

  if (!allData || typeof allData !== 'object' || Array.isArray(allData)) {
    return result;
  }

  const entityTypeToStorageKey = {
    PORTFOLIO: STORAGE_KEYS.PORTFOLIOS,
    APPLICATION: STORAGE_KEYS.APPLICATIONS,
    RELATIONSHIP: STORAGE_KEYS.RELATIONSHIPS,
    TECH_CATEGORY: STORAGE_KEYS.TECH_CATEGORIES,
    TECH_STANDARD: STORAGE_KEYS.TECH_STANDARDS,
    TECH_ENTRY: STORAGE_KEYS.TECH_ENTRIES,
    DEFINITION: STORAGE_KEYS.DEFINITIONS,
    ENVIRONMENT: STORAGE_KEYS.ENVIRONMENTS,
    TECH_DEBT: STORAGE_KEYS.TECH_DEBT,
    QUALITY_GATE: STORAGE_KEYS.QUALITY_GATES,
    GOVERNANCE_RECORD: STORAGE_KEYS.GOVERNANCE_RECORDS,
    APPROVAL_REQUEST: STORAGE_KEYS.APPROVAL_REQUESTS,
    WAIVER: STORAGE_KEYS.WAIVERS,
    EVIDENCE: STORAGE_KEYS.EVIDENCE,
    USER: STORAGE_KEYS.USERS,
    ROLE: STORAGE_KEYS.ROLES,
    INTEGRATION: STORAGE_KEYS.INTEGRATIONS,
    NOTIFICATION: STORAGE_KEYS.NOTIFICATIONS,
    AI_ANALYSIS: STORAGE_KEYS.AI_ANALYSES,
    PDE_CONFIG: STORAGE_KEYS.PDE_CONFIGS,
    DEMO_SCENARIO: STORAGE_KEYS.DEMO_SCENARIOS,
    SCHEDULE: STORAGE_KEYS.SCHEDULES,
    AUDIT_LOG: STORAGE_KEYS.AUDIT_LOGS,
    USE_CASE: STORAGE_KEYS.USE_CASES,
  };

  /**
   * Resolves the data array for a given entity type from allData.
   * @param {string} targetEntityType - The entity type key.
   * @returns {Array<Object>}
   */
  const resolveDataArray = (targetEntityType) => {
    if (Array.isArray(allData[targetEntityType])) {
      return allData[targetEntityType];
    }
    const storageKey = entityTypeToStorageKey[targetEntityType];
    if (storageKey && Array.isArray(allData[storageKey])) {
      return allData[storageKey];
    }
    return [];
  };

  // Check all entity schemas for foreign keys that reference this entity type
  Object.entries(ENTITY_SCHEMAS).forEach(([refEntityType, refSchema]) => {
    refSchema.foreignKeys.forEach((fk) => {
      if (fk.targetEntity === entityType && fk.onDelete === REF_ACTIONS.BLOCK) {
        const refData = resolveDataArray(refEntityType);
        const referencingRecords = refData.filter(
          (record) => record && record[fk.field] === id
        );

        if (referencingRecords.length > 0) {
          result.canDelete = false;
          result.blockingReferences.push({
            entityType: refEntityType,
            field: fk.field,
            records: referencingRecords,
          });
        }
      }
    });
  });

  return result;
};