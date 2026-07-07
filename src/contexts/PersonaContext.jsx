import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getActivePersona,
  switchPersona as managerSwitchPersona,
  getDefaultPersona,
} from '../services/personaManager';
import {
  hasPermission,
  getPermissions,
  canExport,
  canAdminister,
  canWrite,
  canApprove,
  canView,
  canCreate,
  canEdit,
  canDelete,
  getEntityActions,
  getAccessibleEntities,
  checkAccess,
} from '../services/permissionService';
import {
  getNavigation,
  getNavigationItems,
  getLandingPage,
  hasNavSectionAccess,
  getAccessibleNavSections,
  getBadgeableNavItems,
  getNavigationGroupCount,
  getNavigationItemCount,
} from '../services/navigationService';
import { getUnreadCount } from '../services/notificationService';

/**
 * @typedef {Object} PersonaContextValue
 * @property {{ id: string, name: string, title: string, accessLevel: string, landingPage: string, allowedNavSections: string[], dataScope: string }} persona - The currently active persona.
 * @property {function(string): { success: boolean, persona: Object|null, error: string|null }} switchPersona - Switches the active persona by ID.
 * @property {function(string, string): boolean} hasPermission - Checks if the active persona has permission for an action on an entity type.
 * @property {function(): Array<{ entityType: string, actions: string[] }>} getPermissions - Returns all permissions for the active persona.
 * @property {function(): Array<{group: Object, items: Array<Object>}>} navigation - Grouped navigation items for the active persona.
 * @property {function(): Array<Object>} navigationItems - Flat navigation items for the active persona.
 * @property {function(): string} landingPage - The landing page path for the active persona.
 * @property {function(string): boolean} hasNavAccess - Checks if the active persona has access to a navigation section.
 * @property {function(): string[]} accessibleNavSections - Returns all accessible navigation section keys.
 * @property {function(): boolean} canExport - Checks if the active persona can export any entity.
 * @property {function(): boolean} canAdminister - Checks if the active persona can administer any entity.
 * @property {function(): boolean} canWrite - Checks if the active persona has any write permissions.
 * @property {function(): boolean} canApprove - Checks if the active persona can approve any entity.
 * @property {function(string): boolean} canView - Checks if the active persona can view a specific entity type.
 * @property {function(string): boolean} canCreate - Checks if the active persona can create a specific entity type.
 * @property {function(string): boolean} canEdit - Checks if the active persona can edit a specific entity type.
 * @property {function(string): boolean} canDelete - Checks if the active persona can delete a specific entity type.
 * @property {function(string): string[]} getEntityActions - Returns allowed actions for the active persona on an entity type.
 * @property {function(string): string[]} getAccessibleEntities - Returns entity types accessible for a given action.
 * @property {function(string, string): { allowed: boolean, reason: string|null }} checkAccess - Checks access with reason.
 * @property {number} unreadNotificationCount - Count of unread notifications for the active persona.
 * @property {function(): Array<Object>} badgeableNavItems - Navigation items that can display badges.
 */

const PersonaContext = createContext(null);

/**
 * PersonaProvider wraps the application and provides persona state, permissions,
 * and navigation context to all child components.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement}
 */
export const PersonaProvider = ({ children }) => {
  const [persona, setPersona] = useState(() => {
    try {
      return getActivePersona();
    } catch {
      return getDefaultPersona();
    }
  });

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Refresh unread notification count when persona changes
  useEffect(() => {
    try {
      const count = getUnreadCount(persona);
      setUnreadNotificationCount(count);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [persona]);

  // Set up a periodic refresh for unread notification count
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const count = getUnreadCount(persona);
        setUnreadNotificationCount(count);
      } catch {
        // Silently ignore errors during periodic refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [persona]);

  const handleSwitchPersona = useCallback((personaId) => {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      return { success: false, persona: null, error: 'Persona ID must be a non-empty string' };
    }

    const result = managerSwitchPersona(personaId);

    if (result.success && result.persona) {
      setPersona({ ...result.persona });

      // Refresh unread count for new persona
      try {
        const count = getUnreadCount(result.persona);
        setUnreadNotificationCount(count);
      } catch {
        setUnreadNotificationCount(0);
      }
    }

    return result;
  }, []);

  const handleHasPermission = useCallback(
    (entityType, action) => {
      return hasPermission(persona, entityType, action);
    },
    [persona]
  );

  const handleGetPermissions = useCallback(() => {
    return getPermissions(persona);
  }, [persona]);

  const navigation = useMemo(() => {
    return getNavigation(persona);
  }, [persona]);

  const navigationItems = useMemo(() => {
    return getNavigationItems(persona);
  }, [persona]);

  const landingPage = useMemo(() => {
    return getLandingPage(persona);
  }, [persona]);

  const handleHasNavAccess = useCallback(
    (navSectionKey) => {
      return hasNavSectionAccess(persona, navSectionKey);
    },
    [persona]
  );

  const accessibleNavSections = useMemo(() => {
    return getAccessibleNavSections(persona);
  }, [persona]);

  const handleCanExport = useCallback(() => {
    return canExport(persona);
  }, [persona]);

  const handleCanAdminister = useCallback(() => {
    return canAdminister(persona);
  }, [persona]);

  const handleCanWrite = useCallback(() => {
    return canWrite(persona);
  }, [persona]);

  const handleCanApprove = useCallback(() => {
    return canApprove(persona);
  }, [persona]);

  const handleCanView = useCallback(
    (entityType) => {
      return canView(persona, entityType);
    },
    [persona]
  );

  const handleCanCreate = useCallback(
    (entityType) => {
      return canCreate(persona, entityType);
    },
    [persona]
  );

  const handleCanEdit = useCallback(
    (entityType) => {
      return canEdit(persona, entityType);
    },
    [persona]
  );

  const handleCanDelete = useCallback(
    (entityType) => {
      return canDelete(persona, entityType);
    },
    [persona]
  );

  const handleGetEntityActions = useCallback(
    (entityType) => {
      return getEntityActions(persona, entityType);
    },
    [persona]
  );

  const handleGetAccessibleEntities = useCallback(
    (action) => {
      return getAccessibleEntities(persona, action);
    },
    [persona]
  );

  const handleCheckAccess = useCallback(
    (entityType, action) => {
      return checkAccess(persona, entityType, action);
    },
    [persona]
  );

  const badgeableNavItems = useMemo(() => {
    return getBadgeableNavItems(persona);
  }, [persona]);

  const refreshUnreadCount = useCallback(() => {
    try {
      const count = getUnreadCount(persona);
      setUnreadNotificationCount(count);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [persona]);

  const contextValue = useMemo(
    () => ({
      persona,
      switchPersona: handleSwitchPersona,
      hasPermission: handleHasPermission,
      getPermissions: handleGetPermissions,
      navigation,
      navigationItems,
      landingPage,
      hasNavAccess: handleHasNavAccess,
      accessibleNavSections,
      canExport: handleCanExport,
      canAdminister: handleCanAdminister,
      canWrite: handleCanWrite,
      canApprove: handleCanApprove,
      canView: handleCanView,
      canCreate: handleCanCreate,
      canEdit: handleCanEdit,
      canDelete: handleCanDelete,
      getEntityActions: handleGetEntityActions,
      getAccessibleEntities: handleGetAccessibleEntities,
      checkAccess: handleCheckAccess,
      unreadNotificationCount,
      badgeableNavItems,
      refreshUnreadCount,
    }),
    [
      persona,
      handleSwitchPersona,
      handleHasPermission,
      handleGetPermissions,
      navigation,
      navigationItems,
      landingPage,
      handleHasNavAccess,
      accessibleNavSections,
      handleCanExport,
      handleCanAdminister,
      handleCanWrite,
      handleCanApprove,
      handleCanView,
      handleCanCreate,
      handleCanEdit,
      handleCanDelete,
      handleGetEntityActions,
      handleGetAccessibleEntities,
      handleCheckAccess,
      unreadNotificationCount,
      badgeableNavItems,
      refreshUnreadCount,
    ]
  );

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
};

PersonaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the persona context.
 * Must be used within a PersonaProvider.
 *
 * @returns {PersonaContextValue} The persona context value.
 * @throws {Error} If used outside of a PersonaProvider.
 */
export const usePersona = () => {
  const context = useContext(PersonaContext);

  if (context === null) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }

  return context;
};

export default PersonaContext;