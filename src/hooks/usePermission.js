import { useCallback, useMemo } from 'react';
import { usePersona } from '../contexts/PersonaContext';

/**
 * Custom hook that checks whether the current persona has a specific permission
 * for a given entity type and action.
 *
 * Uses PersonaContext internally to resolve the active persona and its permissions.
 *
 * @param {string} entityType - One of ENTITY_TYPES keys (e.g., 'PORTFOLIO', 'APPLICATION').
 * @param {string} action - One of ACTIONS values (e.g., 'view', 'create', 'edit', 'delete').
 * @returns {boolean} True if the current persona has the specified permission, false otherwise.
 *
 * @example
 * const canEditPortfolio = usePermission('PORTFOLIO', 'edit');
 * if (canEditPortfolio) {
 *   // show edit button
 * }
 */
const usePermission = (entityType, action) => {
  const { hasPermission } = usePersona();

  const allowed = useMemo(() => {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return false;
    }

    if (typeof action !== 'string' || action.trim() === '') {
      return false;
    }

    return hasPermission(entityType, action);
  }, [entityType, action, hasPermission]);

  return allowed;
};

export default usePermission;