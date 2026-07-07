import {
  getAllNavigationItems,
  getNavigationItemsByAccessLevel,
  getNavigationItemsBySections,
  groupNavigationItems,
  getNavigationItemByKey,
  getNavigationItemByPath,
} from '../constants/navigationConfig';
import { getPersonaById, getAllPersonas } from '../constants/personas';
import { checkPermission, ACTIONS, ENTITY_TYPES } from '../constants/permissionMatrix';

/**
 * Resolves a persona definition from a persona ID string, persona object, or access level string.
 * Returns the persona object if found, or constructs a minimal persona-like object from an access level.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {{ id: string, name: string, accessLevel: string, allowedNavSections: string[], landingPage: string } | null}
 */
const resolvePersona = (persona) => {
  if (!persona) {
    return null;
  }

  // If persona is an object with accessLevel and allowedNavSections, use it directly
  if (
    typeof persona === 'object' &&
    persona !== null &&
    typeof persona.accessLevel === 'string' &&
    Array.isArray(persona.allowedNavSections)
  ) {
    return persona;
  }

  if (typeof persona !== 'string' || persona.trim() === '') {
    return null;
  }

  // Try to look up as a persona ID
  const personaDef = getPersonaById(persona.trim());
  if (personaDef) {
    return personaDef;
  }

  // If it's a raw access level string, we can't determine allowedNavSections,
  // so fall back to access-level-based filtering only
  return null;
};

/**
 * Returns filtered and grouped navigation items for a given persona.
 * Filters by both the persona's access level and their allowed navigation sections.
 * Items are grouped by their navigation group and sorted by group order then item order.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel and allowedNavSections, or access level string.
 * @returns {Array<{group: {key: string, label: string, order: number}, items: Array<{key: string, label: string, path: string, icon: string, group: string, order: number, requiredAccessLevels: string[], description?: string, badge?: boolean}>}>}
 */
export const getNavigation = (persona) => {
  const resolvedPersona = resolvePersona(persona);

  if (!resolvedPersona) {
    // If we can't resolve the persona, try treating the input as a raw access level
    if (typeof persona === 'string' && persona.trim() !== '') {
      const accessLevelItems = getNavigationItemsByAccessLevel(persona.trim());
      return groupNavigationItems(accessLevelItems);
    }
    return [];
  }

  const { accessLevel, allowedNavSections } = resolvedPersona;

  // Get items filtered by access level
  const accessLevelItems = getNavigationItemsByAccessLevel(accessLevel);

  // Further filter by allowed navigation sections
  const filteredItems = accessLevelItems.filter((item) =>
    allowedNavSections.includes(item.key)
  );

  // Group and sort the filtered items
  return groupNavigationItems(filteredItems);
};

/**
 * Returns a flat array of navigation items (ungrouped) for a given persona.
 * Filters by both the persona's access level and their allowed navigation sections.
 * Items are sorted by group order then item order.
 *
 * @param {string|Object} persona - Persona ID, persona object with accessLevel and allowedNavSections, or access level string.
 * @returns {Array<{key: string, label: string, path: string, icon: string, group: string, order: number, requiredAccessLevels: string[], description?: string, badge?: boolean}>}
 */
export const getNavigationItems = (persona) => {
  const resolvedPersona = resolvePersona(persona);

  if (!resolvedPersona) {
    if (typeof persona === 'string' && persona.trim() !== '') {
      return getNavigationItemsByAccessLevel(persona.trim());
    }
    return [];
  }

  const { accessLevel, allowedNavSections } = resolvedPersona;

  const accessLevelItems = getNavigationItemsByAccessLevel(accessLevel);

  return accessLevelItems.filter((item) =>
    allowedNavSections.includes(item.key)
  );
};

/**
 * Returns the landing page path for a given persona.
 * Uses the persona's configured landingPage property.
 * Falls back to '/dashboard' if the persona cannot be resolved or has no landing page.
 *
 * @param {string|Object} persona - Persona ID, persona object with landingPage, or access level string.
 * @returns {string} The landing page route path.
 */
export const getLandingPage = (persona) => {
  if (!persona) {
    return '/dashboard';
  }

  // If persona is an object with a landingPage property, use it directly
  if (
    typeof persona === 'object' &&
    persona !== null &&
    typeof persona.landingPage === 'string' &&
    persona.landingPage.trim() !== ''
  ) {
    return persona.landingPage;
  }

  if (typeof persona !== 'string' || persona.trim() === '') {
    return '/dashboard';
  }

  // Try to look up as a persona ID
  const personaDef = getPersonaById(persona.trim());
  if (personaDef && typeof personaDef.landingPage === 'string' && personaDef.landingPage.trim() !== '') {
    return personaDef.landingPage;
  }

  return '/dashboard';
};

/**
 * Checks whether a persona has access to a specific navigation section.
 * Validates both the access level requirement and the persona's allowed sections.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @param {string} navSectionKey - The navigation section key to check.
 * @returns {boolean} True if the persona has access to the navigation section.
 */
export const hasNavSectionAccess = (persona, navSectionKey) => {
  if (typeof navSectionKey !== 'string' || navSectionKey.trim() === '') {
    return false;
  }

  const resolvedPersona = resolvePersona(persona);

  if (!resolvedPersona) {
    return false;
  }

  const { accessLevel, allowedNavSections } = resolvedPersona;

  // Check if the section is in the persona's allowed sections
  if (!allowedNavSections.includes(navSectionKey)) {
    return false;
  }

  // Check if the persona's access level is in the section's required access levels
  const navItem = getNavigationItemByKey(navSectionKey);
  if (!navItem) {
    return false;
  }

  return navItem.requiredAccessLevels.includes(accessLevel);
};

/**
 * Returns the navigation item that matches a given route path, if the persona has access to it.
 * Returns null if the persona does not have access or the path is not found.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @param {string} path - The route path to look up.
 * @returns {{key: string, label: string, path: string, icon: string, group: string, order: number, requiredAccessLevels: string[], description?: string, badge?: boolean} | null}
 */
export const getNavigationItemForPath = (persona, path) => {
  if (typeof path !== 'string' || path.trim() === '') {
    return null;
  }

  const navItem = getNavigationItemByPath(path.trim());
  if (!navItem) {
    return null;
  }

  // Check if the persona has access to this navigation item
  if (!hasNavSectionAccess(persona, navItem.key)) {
    return null;
  }

  return navItem;
};

/**
 * Returns all navigation section keys that a persona has access to.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {string[]} Array of navigation section keys the persona can access.
 */
export const getAccessibleNavSections = (persona) => {
  const items = getNavigationItems(persona);
  return items.map((item) => item.key);
};

/**
 * Returns navigation items that can display badges for a given persona.
 * Only includes badgeable items that the persona has access to.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {Array<{key: string, label: string, path: string, icon: string, group: string, order: number, requiredAccessLevels: string[], description?: string, badge?: boolean}>}
 */
export const getBadgeableNavItems = (persona) => {
  const items = getNavigationItems(persona);
  return items.filter((item) => item.badge === true);
};

/**
 * Returns the count of navigation groups available to a persona.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {number} The number of navigation groups.
 */
export const getNavigationGroupCount = (persona) => {
  const groups = getNavigation(persona);
  return groups.length;
};

/**
 * Returns the total count of navigation items available to a persona.
 *
 * @param {string|Object} persona - Persona ID, persona object, or access level string.
 * @returns {number} The total number of navigation items.
 */
export const getNavigationItemCount = (persona) => {
  const items = getNavigationItems(persona);
  return items.length;
};