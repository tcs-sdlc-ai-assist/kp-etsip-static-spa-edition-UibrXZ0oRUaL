import {
  checkPermission,
  getAllowedActions,
  getEntitiesForAction,
  hasAnyWritePermission,
  ACTIONS,
  ENTITY_TYPES,
} from '../constants/permissionMatrix';
import { getPersonaById, getAllPersonas } from '../constants/personas';

/**
 * Resolves the access level for a given persona identifier or persona object.
 * Accepts a persona ID string, a persona object with an accessLevel property,
 * or a raw access level string.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {string|null} The resolved access level, or null if unresolvable.
 */
const resolveAccessLevel = (persona) => {
  if (!persona) {
    return null;
  }

  // If persona is an object with accessLevel, use it directly
  if (typeof persona === 'object' && persona !== null && typeof persona.accessLevel === 'string') {
    return persona.accessLevel;
  }

  if (typeof persona !== 'string' || persona.trim() === '') {
    return null;
  }

  // Try to look up as a persona ID
  const personaDef = getPersonaById(persona);
  if (personaDef) {
    return personaDef.accessLevel;
  }

  // Try to use as a raw access level string
  // Check if it matches a known access level by checking the permission matrix
  const trimmed = persona.trim();
  return trimmed;
};

/**
 * Checks whether a persona has permission to perform a specific action on an entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys (e.g., 'PORTFOLIO', 'APPLICATION').
 * @param {string} action - One of ACTIONS values (e.g., 'view', 'create', 'edit', 'delete').
 * @returns {boolean} True if the action is permitted, false otherwise.
 */
export const hasPermission = (persona, entityType, action) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return false;
  }

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return false;
  }

  if (typeof action !== 'string' || action.trim() === '') {
    return false;
  }

  return checkPermission(accessLevel, entityType, action);
};

/**
 * Returns all permissions for a given persona, organized by entity type.
 * Each entry includes the entity type key and an array of allowed action strings.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @returns {Array<{ entityType: string, actions: string[] }>} Array of permission entries.
 */
export const getPermissions = (persona) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return [];
  }

  const entityTypeKeys = Object.values(ENTITY_TYPES);
  const permissions = [];

  entityTypeKeys.forEach((entityType) => {
    const actions = getAllowedActions(accessLevel, entityType);
    if (actions.length > 0) {
      permissions.push({
        entityType,
        actions,
      });
    }
  });

  return permissions;
};

/**
 * Checks whether a persona has export permission on any entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @returns {boolean} True if the persona can export at least one entity type.
 */
export const canExport = (persona) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return false;
  }

  const exportableEntities = getEntitiesForAction(accessLevel, ACTIONS.EXPORT);
  return exportableEntities.length > 0;
};

/**
 * Checks whether a persona has administer permission on any entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @returns {boolean} True if the persona can administer at least one entity type.
 */
export const canAdminister = (persona) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return false;
  }

  const adminEntities = getEntitiesForAction(accessLevel, ACTIONS.ADMINISTER);
  return adminEntities.length > 0;
};

/**
 * Checks whether a persona has any write permissions (create, edit, delete) on any entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @returns {boolean} True if the persona has any write permission.
 */
export const canWrite = (persona) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return false;
  }

  return hasAnyWritePermission(accessLevel);
};

/**
 * Checks whether a persona can perform a specific action on a specific entity type.
 * Convenience alias for hasPermission with additional validation.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @param {string} action - One of ACTIONS values.
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export const checkAccess = (persona, entityType, action) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return { allowed: false, reason: 'Unable to resolve access level for the given persona' };
  }

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return { allowed: false, reason: 'Entity type must be a non-empty string' };
  }

  if (typeof action !== 'string' || action.trim() === '') {
    return { allowed: false, reason: 'Action must be a non-empty string' };
  }

  const allowed = checkPermission(accessLevel, entityType, action);
  if (!allowed) {
    return {
      allowed: false,
      reason: `Access level '${accessLevel}' does not have '${action}' permission on '${entityType}'`,
    };
  }

  return { allowed: true, reason: null };
};

/**
 * Returns all entity types that a persona can perform a specific action on.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} action - One of ACTIONS values.
 * @returns {string[]} Array of entity type keys.
 */
export const getAccessibleEntities = (persona, action) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return [];
  }

  if (typeof action !== 'string' || action.trim() === '') {
    return [];
  }

  return getEntitiesForAction(accessLevel, action);
};

/**
 * Returns all allowed actions for a persona on a specific entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @returns {string[]} Array of allowed action strings.
 */
export const getEntityActions = (persona, entityType) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return [];
  }

  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return [];
  }

  return getAllowedActions(accessLevel, entityType);
};

/**
 * Checks whether a persona can approve requests (has approve action on any entity).
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @returns {boolean} True if the persona can approve at least one entity type.
 */
export const canApprove = (persona) => {
  const accessLevel = resolveAccessLevel(persona);
  if (!accessLevel) {
    return false;
  }

  const approvableEntities = getEntitiesForAction(accessLevel, ACTIONS.APPROVE);
  return approvableEntities.length > 0;
};

/**
 * Checks whether a persona can view a specific entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @returns {boolean} True if the persona can view the entity type.
 */
export const canView = (persona, entityType) => {
  return hasPermission(persona, entityType, ACTIONS.VIEW);
};

/**
 * Checks whether a persona can create a specific entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @returns {boolean} True if the persona can create the entity type.
 */
export const canCreate = (persona, entityType) => {
  return hasPermission(persona, entityType, ACTIONS.CREATE);
};

/**
 * Checks whether a persona can edit a specific entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @returns {boolean} True if the persona can edit the entity type.
 */
export const canEdit = (persona, entityType) => {
  return hasPermission(persona, entityType, ACTIONS.EDIT);
};

/**
 * Checks whether a persona can delete a specific entity type.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel, or access level string.
 * @param {string} entityType - One of ENTITY_TYPES keys.
 * @returns {boolean} True if the persona can delete the entity type.
 */
export const canDelete = (persona, entityType) => {
  return hasPermission(persona, entityType, ACTIONS.DELETE);
};