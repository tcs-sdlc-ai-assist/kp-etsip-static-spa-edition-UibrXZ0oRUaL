import { STORAGE_KEYS, ID_PREFIXES, DEFAULT_PAGE_SIZE } from '../constants/constants';
import {
  getEntitySchema,
  getForeignKeys,
  getReferencingEntities,
  FIELD_TYPES,
  REF_ACTIONS,
} from '../constants/entitySchemas';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';
import { logAction } from './auditLogService';
import { getActivePersona } from './personaManager';

/**
 * Maps entity type keys to their corresponding localStorage storage keys.
 * @type {Object<string, string>}
 */
const ENTITY_TYPE_TO_STORAGE_KEY = {
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
  TEST_DATA: STORAGE_KEYS.TEST_DATA,
  RELEASE: STORAGE_KEYS.RELEASES,
};

/**
 * Maps entity type keys to their corresponding ID prefixes.
 * @type {Object<string, string>}
 */
const ENTITY_TYPE_TO_ID_PREFIX = {
  PORTFOLIO: ID_PREFIXES.PORTFOLIO,
  APPLICATION: ID_PREFIXES.APPLICATION,
  RELATIONSHIP: ID_PREFIXES.RELATIONSHIP,
  TECH_CATEGORY: ID_PREFIXES.TECH_CATEGORY,
  TECH_STANDARD: ID_PREFIXES.TECH_STANDARD,
  TECH_ENTRY: ID_PREFIXES.TECH_ENTRY,
  DEFINITION: ID_PREFIXES.DEFINITION,
  ENVIRONMENT: ID_PREFIXES.ENVIRONMENT,
  TECH_DEBT: ID_PREFIXES.TECH_DEBT,
  QUALITY_GATE: ID_PREFIXES.QUALITY_GATE,
  GOVERNANCE_RECORD: ID_PREFIXES.GOVERNANCE_RECORD,
  APPROVAL_REQUEST: ID_PREFIXES.APPROVAL_REQUEST,
  WAIVER: ID_PREFIXES.WAIVER,
  EVIDENCE: ID_PREFIXES.EVIDENCE,
  USER: ID_PREFIXES.USER,
  ROLE: ID_PREFIXES.ROLE,
  INTEGRATION: ID_PREFIXES.INTEGRATION,
  NOTIFICATION: ID_PREFIXES.NOTIFICATION,
  AI_ANALYSIS: ID_PREFIXES.AI_ANALYSIS,
  PDE_CONFIG: ID_PREFIXES.PDE_CONFIG,
  DEMO_SCENARIO: ID_PREFIXES.DEMO_SCENARIO,
  SCHEDULE: ID_PREFIXES.SCHEDULE,
  AUDIT_LOG: ID_PREFIXES.AUDIT_LOG,
  USE_CASE: ID_PREFIXES.USE_CASE,
  TEST_DATA: ID_PREFIXES.TEST_DATA,
  RELEASE: ID_PREFIXES.RELEASE,
};

/**
 * Resolves the localStorage storage key for a given entity type.
 * @param {string} entityType - The entity type key.
 * @returns {string|null} The storage key, or null if unknown.
 */
const getStorageKey = (entityType) => {
  if (typeof entityType !== 'string') {
    return null;
  }
  return ENTITY_TYPE_TO_STORAGE_KEY[entityType] || null;
};

/**
 * Retrieves all records for a given entity type from localStorage.
 * @param {string} entityType - The entity type key.
 * @returns {Array<Object>}
 */
const getAllRecords = (entityType) => {
  const storageKey = getStorageKey(entityType);
  if (!storageKey) {
    return [];
  }
  
  if (entityType === 'RELEASE') {
    const data = getItem(storageKey);
    if (!Array.isArray(data) || data.length === 0) {
      const apps = getItem(STORAGE_KEYS.APPLICATIONS) || [];
      const users = getItem(STORAGE_KEYS.USERS) || [];
      const newReleases = [];
      const numReleases = 15;
      for (let i = 0; i < numReleases; i++) {
        const id = `RL-${String(i + 1).padStart(3, '0')}`;
        const app = apps[i % apps.length] || { id: 'APP-001', name: 'Demonstrator App' };
        const user = users[i % users.length] || { id: 'USR-001', displayName: 'QE Manager' };
        newReleases.push({
          id,
          name: `Release ${app.name} v${1 + (i % 3)}.${i % 9}.${i % 5}`,
          version: `${1 + (i % 3)}.${i % 9}.${i % 5}`,
          applicationId: app.id,
          releaseDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000 * 5).toISOString().slice(0, 10),
          status: i < 5 ? 'completed' : (i < 10 ? 'in_progress' : 'planned'),
          riskLevel: ['low', 'medium', 'high', 'critical'][i % 4],
          branchName: `release/v${1 + (i % 3)}.${i % 9}`,
          commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
          description: `Deployment and release workflow for ${app.name}.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.id,
          updatedBy: user.id,
          version: 1,
        });
      }
      setItem(storageKey, newReleases);
      try {
        setItem('kp_etsip_id_counter_RL-', numReleases + 1);
      } catch {
        // ignore counter set failure
      }
      return newReleases;
    }
    return data;
  }

  const data = getItem(storageKey);
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

/**
 * Persists all records for a given entity type to localStorage.
 * @param {string} entityType - The entity type key.
 * @param {Array<Object>} records - The records to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllRecords = (entityType, records) => {
  const storageKey = getStorageKey(entityType);
  if (!storageKey) {
    return { success: false, error: `Unknown entity type: ${entityType}` };
  }
  return setItem(storageKey, records);
};

/**
 * Returns the current active persona info for audit logging.
 * @returns {{ id: string, name: string }}
 */
const getAuditActor = () => {
  try {
    const persona = getActivePersona();
    return { id: persona.id, name: persona.name };
  } catch {
    return { id: 'system', name: 'System' };
  }
};

/**
 * Extracts a display name from an entity record for audit logging.
 * @param {Object} record - The entity record.
 * @returns {string|null}
 */
const getEntityDisplayName = (record) => {
  if (!record || typeof record !== 'object') {
    return null;
  }
  return record.name || record.title || record.term || record.username || record.displayName || null;
};

/**
 * Validates foreign key references on a record before create or update.
 * @param {string} entityType - The entity type key.
 * @param {Object} record - The record to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateForeignKeys = (entityType, record) => {
  const errors = [];
  const foreignKeys = getForeignKeys(entityType);

  if (foreignKeys.length === 0) {
    return { valid: true, errors };
  }

  foreignKeys.forEach((fk) => {
    const fkValue = record[fk.field];

    // Skip null/undefined foreign keys (they may be optional)
    if (fkValue === null || fkValue === undefined || fkValue === '') {
      const schema = getEntitySchema(entityType);
      if (schema && schema.fields[fk.field] && schema.fields[fk.field].required) {
        errors.push(`Required foreign key '${fk.field}' is missing`);
      }
      return;
    }

    // Look up the referenced entity
    const targetRecords = getAllRecords(fk.targetEntity);
    const targetExists = targetRecords.some((r) => r && r.id === fkValue);

    if (!targetExists) {
      errors.push(
        `Foreign key '${fk.field}' references '${fkValue}' which does not exist in ${fk.targetEntity}`
      );
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validates unique field constraints for a record.
 * @param {string} entityType - The entity type key.
 * @param {Object} record - The record to validate.
 * @param {string|null} [excludeId=null] - ID to exclude from uniqueness check (for updates).
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateUniqueFields = (entityType, record, excludeId = null) => {
  const errors = [];
  const schema = getEntitySchema(entityType);

  if (!schema) {
    return { valid: true, errors };
  }

  const existingRecords = getAllRecords(entityType);

  Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
    if (!fieldDef.unique) {
      return;
    }

    const value = record[fieldName];
    if (value === null || value === undefined || value === '') {
      return;
    }

    const duplicate = existingRecords.find((existing) => {
      if (excludeId && existing.id === excludeId) {
        return false;
      }
      return existing[fieldName] === value;
    });

    if (duplicate) {
      errors.push(
        `Field '${fieldName}' value '${value}' must be unique but already exists on record '${duplicate.id}'`
      );
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Checks whether deleting an entity would be blocked by referential integrity constraints.
 * @param {string} entityType - The entity type of the record to be deleted.
 * @param {string} id - The ID of the record to be deleted.
 * @returns {{ canDelete: boolean, blockingReferences: Array<{ entityType: string, field: string, count: number }>, cascadeReferences: Array<{ entityType: string, field: string, count: number }>, setNullReferences: Array<{ entityType: string, field: string, count: number }> }}
 */
const checkDeleteImpact = (entityType, id) => {
  const result = {
    canDelete: true,
    blockingReferences: [],
    cascadeReferences: [],
    setNullReferences: [],
  };

  const referencingEntities = getReferencingEntities(entityType);

  referencingEntities.forEach((ref) => {
    const refRecords = getAllRecords(ref.entityType);
    const matchingRecords = refRecords.filter(
      (record) => record && record[ref.field] === id
    );

    if (matchingRecords.length === 0) {
      return;
    }

    const refInfo = {
      entityType: ref.entityType,
      field: ref.field,
      count: matchingRecords.length,
    };

    switch (ref.onDelete) {
      case REF_ACTIONS.BLOCK:
        result.canDelete = false;
        result.blockingReferences.push(refInfo);
        break;
      case REF_ACTIONS.CASCADE:
        result.cascadeReferences.push(refInfo);
        break;
      case REF_ACTIONS.SET_NULL:
        result.setNullReferences.push(refInfo);
        break;
      case REF_ACTIONS.NO_ACTION:
      default:
        break;
    }
  });

  return result;
};

/**
 * Applies cascade deletes for all entities referencing the deleted record.
 * @param {string} entityType - The entity type of the deleted record.
 * @param {string} id - The ID of the deleted record.
 * @param {Array<{ entityType: string, field: string, count: number }>} cascadeRefs - Cascade references.
 * @returns {{ success: boolean, deletedCounts: Object<string, number>, errors: string[] }}
 */
const applyCascadeDeletes = (entityType, id, cascadeRefs) => {
  const result = {
    success: true,
    deletedCounts: {},
    errors: [],
  };

  cascadeRefs.forEach((ref) => {
    const records = getAllRecords(ref.entityType);
    const remaining = [];
    let deletedCount = 0;

    records.forEach((record) => {
      if (record && record[ref.field] === id) {
        // Recursively check for cascade deletes on the child entity
        const childImpact = checkDeleteImpact(ref.entityType, record.id);
        if (childImpact.cascadeReferences.length > 0) {
          const childResult = applyCascadeDeletes(ref.entityType, record.id, childImpact.cascadeReferences);
          if (!childResult.success) {
            result.errors.push(...childResult.errors);
          }
          Object.entries(childResult.deletedCounts).forEach(([key, count]) => {
            result.deletedCounts[key] = (result.deletedCounts[key] || 0) + count;
          });
        }
        if (childImpact.setNullReferences.length > 0) {
          applySetNullUpdates(ref.entityType, record.id, childImpact.setNullReferences);
        }
        deletedCount += 1;
      } else {
        remaining.push(record);
      }
    });

    if (deletedCount > 0) {
      const writeResult = saveAllRecords(ref.entityType, remaining);
      if (!writeResult.success) {
        result.success = false;
        result.errors.push(`Failed to save ${ref.entityType} after cascade delete: ${writeResult.error}`);
      } else {
        result.deletedCounts[ref.entityType] = (result.deletedCounts[ref.entityType] || 0) + deletedCount;
      }
    }
  });

  return result;
};

/**
 * Applies SET_NULL updates for all entities referencing the deleted record.
 * @param {string} entityType - The entity type of the deleted record.
 * @param {string} id - The ID of the deleted record.
 * @param {Array<{ entityType: string, field: string, count: number }>} setNullRefs - Set null references.
 * @returns {{ success: boolean, updatedCounts: Object<string, number>, errors: string[] }}
 */
const applySetNullUpdates = (entityType, id, setNullRefs) => {
  const result = {
    success: true,
    updatedCounts: {},
    errors: [],
  };

  setNullRefs.forEach((ref) => {
    const records = getAllRecords(ref.entityType);
    let updatedCount = 0;

    const updatedRecords = records.map((record) => {
      if (record && record[ref.field] === id) {
        updatedCount += 1;
        return { ...record, [ref.field]: null, updatedAt: new Date().toISOString() };
      }
      return record;
    });

    if (updatedCount > 0) {
      const writeResult = saveAllRecords(ref.entityType, updatedRecords);
      if (!writeResult.success) {
        result.success = false;
        result.errors.push(`Failed to save ${ref.entityType} after set null: ${writeResult.error}`);
      } else {
        result.updatedCounts[ref.entityType] = updatedCount;
      }
    }
  });

  return result;
};

/**
 * Creates a new entity record.
 * Generates an ID, sets timestamps, validates foreign keys and unique constraints,
 * persists the record, and logs the action.
 *
 * @param {string} entityType - The entity type key (e.g., 'PORTFOLIO', 'APPLICATION').
 * @param {Object} data - The entity data (without id, createdAt, updatedAt).
 * @returns {{ success: boolean, data: Object|null, error: string|null, errors: string[] }}
 */
export const create = (entityType, data) => {
  try {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, data: null, error: 'Entity type must be a non-empty string', errors: [] };
    }

    const schema = getEntitySchema(entityType);
    if (!schema) {
      return { success: false, data: null, error: `Unknown entity type: ${entityType}`, errors: [] };
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, data: null, error: 'Data must be a non-null object', errors: [] };
    }

    const prefix = ENTITY_TYPE_TO_ID_PREFIX[entityType];
    if (!prefix) {
      return { success: false, data: null, error: `No ID prefix configured for entity type: ${entityType}`, errors: [] };
    }

    const now = new Date().toISOString();
    const actor = getAuditActor();

    const record = {
      ...data,
      id: data.id || generateId(prefix),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      createdBy: data.createdBy || actor.id,
      updatedBy: data.updatedBy || actor.id,
      version: data.version || 1,
    };

    // Validate unique fields
    const uniqueResult = validateUniqueFields(entityType, record);
    if (!uniqueResult.valid) {
      return { success: false, data: null, error: 'Unique constraint violation', errors: uniqueResult.errors };
    }

    // Validate foreign keys
    const fkResult = validateForeignKeys(entityType, record);
    if (!fkResult.valid) {
      return { success: false, data: null, error: 'Referential integrity violation', errors: fkResult.errors };
    }

    // Persist
    const records = getAllRecords(entityType);

    // Check for duplicate ID
    const existingIndex = records.findIndex((r) => r && r.id === record.id);
    if (existingIndex !== -1) {
      return { success: false, data: null, error: `Record with ID '${record.id}' already exists in ${entityType}`, errors: [] };
    }

    records.push(record);

    const writeResult = saveAllRecords(entityType, records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error, errors: [] };
    }

    // Audit log
    try {
      logAction({
        action: 'create',
        userId: actor.id,
        userName: actor.name,
        entityType,
        entityId: record.id,
        entityName: getEntityDisplayName(record),
        status: 'success',
        newValues: record,
        details: `Created ${entityType} record '${record.id}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: record, error: null, errors: [] };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to create entity',
      errors: [],
    };
  }
};

/**
 * Reads a single entity record by ID.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} id - The entity ID.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export const read = (entityType, id) => {
  try {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, data: null, error: 'Entity type must be a non-empty string' };
    }

    const schema = getEntitySchema(entityType);
    if (!schema) {
      return { success: false, data: null, error: `Unknown entity type: ${entityType}` };
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return { success: false, data: null, error: 'ID must be a non-empty string' };
    }

    const records = getAllRecords(entityType);
    const record = records.find((r) => r && r.id === id);

    if (!record) {
      return { success: false, data: null, error: `Record with ID '${id}' not found in ${entityType}` };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to read entity',
    };
  }
};

/**
 * Updates an existing entity record by ID.
 * Merges the provided data with the existing record, validates constraints,
 * persists the changes, and logs the action.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} id - The entity ID to update.
 * @param {Object} data - The fields to update.
 * @returns {{ success: boolean, data: Object|null, error: string|null, errors: string[] }}
 */
export const update = (entityType, id, data) => {
  try {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, data: null, error: 'Entity type must be a non-empty string', errors: [] };
    }

    const schema = getEntitySchema(entityType);
    if (!schema) {
      return { success: false, data: null, error: `Unknown entity type: ${entityType}`, errors: [] };
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return { success: false, data: null, error: 'ID must be a non-empty string', errors: [] };
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, data: null, error: 'Data must be a non-null object', errors: [] };
    }

    const records = getAllRecords(entityType);
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `Record with ID '${id}' not found in ${entityType}`, errors: [] };
    }

    const existingRecord = records[existingIndex];
    const now = new Date().toISOString();
    const actor = getAuditActor();

    const updatedRecord = {
      ...existingRecord,
      ...data,
      id: existingRecord.id, // ID cannot be changed
      createdAt: existingRecord.createdAt, // createdAt cannot be changed
      createdBy: existingRecord.createdBy, // createdBy cannot be changed
      updatedAt: now,
      updatedBy: actor.id,
      version: (existingRecord.version || 0) + 1,
    };

    // Validate unique fields (exclude current record)
    const uniqueResult = validateUniqueFields(entityType, updatedRecord, id);
    if (!uniqueResult.valid) {
      return { success: false, data: null, error: 'Unique constraint violation', errors: uniqueResult.errors };
    }

    // Validate foreign keys
    const fkResult = validateForeignKeys(entityType, updatedRecord);
    if (!fkResult.valid) {
      return { success: false, data: null, error: 'Referential integrity violation', errors: fkResult.errors };
    }

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(entityType, records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error, errors: [] };
    }

    // Audit log
    try {
      logAction({
        action: 'update',
        userId: actor.id,
        userName: actor.name,
        entityType,
        entityId: id,
        entityName: getEntityDisplayName(updatedRecord),
        status: 'success',
        previousValues: existingRecord,
        newValues: data,
        details: `Updated ${entityType} record '${id}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, data: updatedRecord, error: null, errors: [] };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to update entity',
      errors: [],
    };
  }
};

/**
 * Deletes an entity record by ID.
 * Enforces referential integrity: blocks if BLOCK references exist,
 * cascades deletes for CASCADE references, sets null for SET_NULL references.
 * Logs the action.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} id - The entity ID to delete.
 * @returns {{ success: boolean, error: string|null, errors: string[], deletedCounts: Object<string, number> }}
 */
export const remove = (entityType, id) => {
  try {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, error: 'Entity type must be a non-empty string', errors: [], deletedCounts: {} };
    }

    const schema = getEntitySchema(entityType);
    if (!schema) {
      return { success: false, error: `Unknown entity type: ${entityType}`, errors: [], deletedCounts: {} };
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return { success: false, error: 'ID must be a non-empty string', errors: [], deletedCounts: {} };
    }

    const records = getAllRecords(entityType);
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, error: `Record with ID '${id}' not found in ${entityType}`, errors: [], deletedCounts: {} };
    }

    const existingRecord = records[existingIndex];

    // Check referential integrity
    const impact = checkDeleteImpact(entityType, id);

    if (!impact.canDelete) {
      const blockingDetails = impact.blockingReferences
        .map((ref) => `${ref.entityType}.${ref.field} (${ref.count} record(s))`)
        .join(', ');
      return {
        success: false,
        error: `Cannot delete ${entityType} '${id}': blocked by referencing entities: ${blockingDetails}`,
        errors: impact.blockingReferences.map(
          (ref) => `${ref.count} ${ref.entityType} record(s) reference this entity via '${ref.field}' with BLOCK on delete`
        ),
        deletedCounts: {},
      };
    }

    const deletedCounts = {};

    // Apply cascade deletes
    if (impact.cascadeReferences.length > 0) {
      const cascadeResult = applyCascadeDeletes(entityType, id, impact.cascadeReferences);
      if (!cascadeResult.success) {
        return {
          success: false,
          error: 'Failed to apply cascade deletes',
          errors: cascadeResult.errors,
          deletedCounts: cascadeResult.deletedCounts,
        };
      }
      Object.entries(cascadeResult.deletedCounts).forEach(([key, count]) => {
        deletedCounts[key] = (deletedCounts[key] || 0) + count;
      });
    }

    // Apply set null updates
    if (impact.setNullReferences.length > 0) {
      const setNullResult = applySetNullUpdates(entityType, id, impact.setNullReferences);
      if (!setNullResult.success) {
        return {
          success: false,
          error: 'Failed to apply set null updates',
          errors: setNullResult.errors,
          deletedCounts,
        };
      }
    }

    // Remove the record itself
    const updatedRecords = records.filter((r) => r && r.id !== id);
    const writeResult = saveAllRecords(entityType, updatedRecords);

    if (!writeResult.success) {
      return { success: false, error: writeResult.error, errors: [], deletedCounts };
    }

    deletedCounts[entityType] = (deletedCounts[entityType] || 0) + 1;

    // Audit log
    const actor = getAuditActor();
    try {
      logAction({
        action: 'delete',
        userId: actor.id,
        userName: actor.name,
        entityType,
        entityId: id,
        entityName: getEntityDisplayName(existingRecord),
        status: 'success',
        previousValues: existingRecord,
        details: `Deleted ${entityType} record '${id}'`,
      });
    } catch {
      // Audit log failure should not block the operation
    }

    return { success: true, error: null, errors: [], deletedCounts };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : 'Failed to delete entity',
      errors: [],
      deletedCounts: {},
    };
  }
};

/**
 * @typedef {Object} ListFilters
 * @property {string} [search] - Free-text search across searchable fields.
 * @property {Object<string, *>} [filters] - Field-value filter pairs for exact matching.
 * @property {string} [sortField] - Field to sort by.
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc'.
 * @property {number} [page] - Page number (1-based).
 * @property {number} [pageSize] - Number of records per page.
 */

/**
 * @typedef {Object} PaginatedResult
 * @property {Array<Object>} data - The records for the current page.
 * @property {number} total - Total number of matching records.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of records per page.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Lists entity records with support for search, filtering, sorting, and pagination.
 *
 * @param {string} entityType - The entity type key.
 * @param {ListFilters} [options={}] - Optional filters, sorting, and pagination options.
 * @returns {{ success: boolean, data: Array<Object>, total: number, page: number, pageSize: number, totalPages: number, error: string|null }}
 */
export const list = (entityType, options = {}) => {
  try {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return { success: false, data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0, error: 'Entity type must be a non-empty string' };
    }

    const schema = getEntitySchema(entityType);
    if (!schema) {
      return { success: false, data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0, error: `Unknown entity type: ${entityType}` };
    }

    let records = getAllRecords(entityType);

    const {
      search,
      filters,
      sortField,
      sortDirection,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = options;

    // Apply field-value filters
    if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
      Object.entries(filters).forEach(([filterField, filterValue]) => {
        if (filterValue === null || filterValue === undefined || filterValue === '') {
          return;
        }

        records = records.filter((record) => {
          if (!record) {
            return false;
          }

          const recordValue = record[filterField];

          if (recordValue === null || recordValue === undefined) {
            return false;
          }

          // Array contains check
          if (Array.isArray(filterValue)) {
            return filterValue.includes(recordValue);
          }

          // String case-insensitive match
          if (typeof recordValue === 'string' && typeof filterValue === 'string') {
            return recordValue.toLowerCase() === filterValue.toLowerCase();
          }

          return recordValue === filterValue;
        });
      });
    }

    // Apply free-text search
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      const searchableFields = schema.searchableFields || [];

      records = records.filter((record) => {
        if (!record) {
          return false;
        }

        return searchableFields.some((fieldName) => {
          const value = record[fieldName];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (Array.isArray(value)) {
            return value.some(
              (item) => typeof item === 'string' && item.toLowerCase().includes(searchLower)
            );
          }
          return false;
        });
      });
    }

    // Apply sorting
    const effectiveSortField = sortField || schema.defaultSortField || 'createdAt';
    const effectiveSortDirection = sortDirection === 'asc' ? 'asc' : (sortDirection === 'desc' ? 'desc' : (schema.defaultSortDirection || 'asc'));

    records.sort((a, b) => {
      if (!a || !b) {
        return 0;
      }

      const valA = a[effectiveSortField];
      const valB = b[effectiveSortField];

      // Handle null/undefined
      if (valA === null || valA === undefined) {
        return effectiveSortDirection === 'asc' ? 1 : -1;
      }
      if (valB === null || valB === undefined) {
        return effectiveSortDirection === 'asc' ? -1 : 1;
      }

      let comparison = 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
      } else {
        const strA = String(valA);
        const strB = String(valB);
        comparison = strA.localeCompare(strB);
      }

      return effectiveSortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = records.length;
    const effectivePage = Math.max(1, Math.floor(page) || 1);
    const effectivePageSize = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
    const startIndex = (effectivePage - 1) * effectivePageSize;
    const paginatedData = records.slice(startIndex, startIndex + effectivePageSize);

    return {
      success: true,
      data: paginatedData.map((r) => ({ ...r })),
      total,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: 0,
      error: err && err.message ? err.message : 'Failed to list entities',
    };
  }
};

/**
 * Returns the total count of records for a given entity type, optionally filtered.
 *
 * @param {string} entityType - The entity type key.
 * @param {Object<string, *>} [filters] - Optional field-value filter pairs.
 * @returns {number}
 */
export const count = (entityType, filters) => {
  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return 0;
  }

  let records = getAllRecords(entityType);

  if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
    Object.entries(filters).forEach(([filterField, filterValue]) => {
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        return;
      }
      records = records.filter((record) => {
        if (!record) {
          return false;
        }
        const recordValue = record[filterField];
        if (typeof recordValue === 'string' && typeof filterValue === 'string') {
          return recordValue.toLowerCase() === filterValue.toLowerCase();
        }
        return recordValue === filterValue;
      });
    });
  }

  return records.length;
};

/**
 * Checks whether a record with the given ID exists for the specified entity type.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} id - The entity ID.
 * @returns {boolean}
 */
export const exists = (entityType, id) => {
  if (typeof entityType !== 'string' || typeof id !== 'string') {
    return false;
  }
  const records = getAllRecords(entityType);
  return records.some((r) => r && r.id === id);
};

/**
 * Bulk creates multiple entity records.
 * Each record is validated and persisted individually.
 *
 * @param {string} entityType - The entity type key.
 * @param {Array<Object>} dataArray - Array of entity data objects.
 * @returns {{ success: boolean, created: Array<Object>, errors: Array<{ index: number, error: string }>, totalCreated: number }}
 */
export const bulkCreate = (entityType, dataArray) => {
  const result = {
    success: true,
    created: [],
    errors: [],
    totalCreated: 0,
  };

  if (!Array.isArray(dataArray)) {
    result.success = false;
    result.errors.push({ index: -1, error: 'Data must be an array' });
    return result;
  }

  dataArray.forEach((data, index) => {
    const createResult = create(entityType, data);
    if (createResult.success) {
      result.created.push(createResult.data);
      result.totalCreated += 1;
    } else {
      result.success = false;
      result.errors.push({
        index,
        error: createResult.error || createResult.errors.join('; '),
      });
    }
  });

  return result;
};

/**
 * Bulk deletes multiple entity records by ID.
 *
 * @param {string} entityType - The entity type key.
 * @param {string[]} ids - Array of entity IDs to delete.
 * @returns {{ success: boolean, deletedIds: string[], errors: Array<{ id: string, error: string }>, totalDeleted: number }}
 */
export const bulkDelete = (entityType, ids) => {
  const result = {
    success: true,
    deletedIds: [],
    errors: [],
    totalDeleted: 0,
  };

  if (!Array.isArray(ids)) {
    result.success = false;
    result.errors.push({ id: '', error: 'IDs must be an array' });
    return result;
  }

  ids.forEach((id) => {
    const deleteResult = remove(entityType, id);
    if (deleteResult.success) {
      result.deletedIds.push(id);
      result.totalDeleted += 1;
    } else {
      result.success = false;
      result.errors.push({
        id,
        error: deleteResult.error || deleteResult.errors.join('; '),
      });
    }
  });

  return result;
};

/**
 * Returns all records for a given entity type without pagination.
 * Use with caution for large datasets.
 *
 * @param {string} entityType - The entity type key.
 * @returns {Array<Object>}
 */
export const getAll = (entityType) => {
  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return [];
  }
  return getAllRecords(entityType).map((r) => ({ ...r }));
};

/**
 * Finds records matching a specific field value.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} fieldName - The field to search.
 * @param {*} fieldValue - The value to match.
 * @returns {Array<Object>}
 */
export const findByField = (entityType, fieldName, fieldValue) => {
  if (typeof entityType !== 'string' || typeof fieldName !== 'string') {
    return [];
  }

  const records = getAllRecords(entityType);

  return records
    .filter((record) => {
      if (!record) {
        return false;
      }
      const value = record[fieldName];
      if (typeof value === 'string' && typeof fieldValue === 'string') {
        return value.toLowerCase() === fieldValue.toLowerCase();
      }
      return value === fieldValue;
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns the delete impact analysis for a record without actually deleting it.
 * Useful for showing confirmation dialogs with cascade/block information.
 *
 * @param {string} entityType - The entity type key.
 * @param {string} id - The entity ID.
 * @returns {{ canDelete: boolean, blockingReferences: Array<{ entityType: string, field: string, count: number }>, cascadeReferences: Array<{ entityType: string, field: string, count: number }>, setNullReferences: Array<{ entityType: string, field: string, count: number }> }}
 */
export const getDeleteImpact = (entityType, id) => {
  if (typeof entityType !== 'string' || typeof id !== 'string') {
    return { canDelete: false, blockingReferences: [], cascadeReferences: [], setNullReferences: [] };
  }
  return checkDeleteImpact(entityType, id);
};