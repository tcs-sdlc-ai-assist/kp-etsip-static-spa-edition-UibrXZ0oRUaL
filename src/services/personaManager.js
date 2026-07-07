import { STORAGE_KEYS } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { getPersonaById, getAllPersonas, PERSONAS } from '../constants/personas';
import { logAction } from './auditLogService';

/**
 * localStorage key used to persist the active persona ID.
 * @type {string}
 */
const ACTIVE_PERSONA_KEY = 'kp_etsip_active_persona';

/**
 * The default persona used when no persona has been selected or the stored persona is invalid.
 * Defaults to the Platform Administrator persona.
 * @type {string}
 */
const DEFAULT_PERSONA_ID = PERSONAS.PLATFORM_ADMINISTRATOR.id;

/**
 * Returns the default persona definition.
 * The default persona is the Platform Administrator.
 *
 * @returns {{ id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string }}
 */
export const getDefaultPersona = () => {
  return { ...PERSONAS.PLATFORM_ADMINISTRATOR };
};

/**
 * Retrieves the currently active persona from localStorage.
 * If no persona is stored or the stored persona ID is invalid,
 * returns the default persona (Platform Administrator).
 *
 * @returns {{ id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string }}
 */
export const getActivePersona = () => {
  try {
    const storedId = getItem(ACTIVE_PERSONA_KEY);

    if (typeof storedId !== 'string' || storedId.trim() === '') {
      return getDefaultPersona();
    }

    const persona = getPersonaById(storedId);

    if (!persona) {
      return getDefaultPersona();
    }

    return { ...persona };
  } catch {
    return getDefaultPersona();
  }
};

/**
 * Switches the active persona to the specified persona ID.
 * Persists the new persona ID to localStorage and creates an audit log entry
 * recording the persona switch action.
 *
 * @param {string} personaId - The ID of the persona to switch to. Must be a valid persona ID.
 * @returns {{ success: boolean, persona: { id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string } | null, error: string | null }}
 */
export const switchPersona = (personaId) => {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return { success: false, persona: null, error: 'Persona ID must be a non-empty string' };
  }

  const targetPersona = getPersonaById(personaId.trim());

  if (!targetPersona) {
    return { success: false, persona: null, error: `Unknown persona ID: ${personaId}` };
  }

  const previousPersona = getActivePersona();

  const writeResult = setItem(ACTIVE_PERSONA_KEY, targetPersona.id);

  if (!writeResult.success) {
    return { success: false, persona: null, error: writeResult.error || 'Failed to persist persona selection' };
  }

  try {
    logAction({
      action: 'persona_switch',
      userId: targetPersona.id,
      userName: targetPersona.name,
      entityType: 'PERSONA',
      entityId: targetPersona.id,
      entityName: targetPersona.name,
      status: 'success',
      previousValues: {
        personaId: previousPersona.id,
        personaName: previousPersona.name,
        accessLevel: previousPersona.accessLevel,
      },
      newValues: {
        personaId: targetPersona.id,
        personaName: targetPersona.name,
        accessLevel: targetPersona.accessLevel,
      },
      details: `Switched persona from '${previousPersona.name}' to '${targetPersona.name}'`,
    });
  } catch {
    // Audit log failure should not block persona switch
  }

  return { success: true, persona: { ...targetPersona }, error: null };
};

/**
 * Returns the active persona ID string from localStorage, or null if none is set.
 *
 * @returns {string | null}
 */
export const getActivePersonaId = () => {
  try {
    const storedId = getItem(ACTIVE_PERSONA_KEY);
    if (typeof storedId !== 'string' || storedId.trim() === '') {
      return null;
    }
    const persona = getPersonaById(storedId);
    return persona ? persona.id : null;
  } catch {
    return null;
  }
};

/**
 * Checks whether a persona ID is valid (exists in the persona definitions).
 *
 * @param {string} personaId - The persona ID to validate.
 * @returns {boolean} True if the persona ID is valid, false otherwise.
 */
export const isValidPersonaId = (personaId) => {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return false;
  }
  return getPersonaById(personaId.trim()) !== undefined;
};

/**
 * Resets the active persona to the default persona (Platform Administrator).
 * Persists the change and logs the action.
 *
 * @returns {{ success: boolean, persona: { id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string } | null, error: string | null }}
 */
export const resetToDefaultPersona = () => {
  return switchPersona(DEFAULT_PERSONA_ID);
};