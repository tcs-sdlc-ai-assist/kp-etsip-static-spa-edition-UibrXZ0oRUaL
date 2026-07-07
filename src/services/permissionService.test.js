import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
} from './permissionService';
import { ACCESS_LEVELS, PERSONAS } from '../constants/personas';
import { ACTIONS, ENTITY_TYPES } from '../constants/permissionMatrix';

describe('permissionService', () => {
  describe('hasPermission', () => {
    describe('with persona object', () => {
      it('returns true for admin persona with view permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'PORTFOLIO', 'view')).toBe(true);
      });

      it('returns true for admin persona with delete permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'APPLICATION', 'delete')).toBe(true);
      });

      it('returns true for admin persona with administer permission on USER', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'USER', 'administer')).toBe(true);
      });

      it('returns true for executive persona with view permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
        expect(hasPermission(persona, 'PORTFOLIO', 'view')).toBe(true);
      });

      it('returns true for executive persona with approve permission on APPROVAL_REQUEST', () => {
        const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
        expect(hasPermission(persona, 'APPROVAL_REQUEST', 'approve')).toBe(true);
      });

      it('returns false for executive persona with delete permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
        expect(hasPermission(persona, 'PORTFOLIO', 'delete')).toBe(false);
      });

      it('returns false for executive persona with create permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
        expect(hasPermission(persona, 'PORTFOLIO', 'create')).toBe(false);
      });

      it('returns true for strategic persona with create permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
        expect(hasPermission(persona, 'PORTFOLIO', 'create')).toBe(true);
      });

      it('returns true for strategic persona with approve permission on WAIVER', () => {
        const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
        expect(hasPermission(persona, 'WAIVER', 'approve')).toBe(true);
      });

      it('returns true for management persona with edit permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
        expect(hasPermission(persona, 'APPLICATION', 'edit')).toBe(true);
      });

      it('returns true for management persona with approve permission on APPROVAL_REQUEST', () => {
        const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
        expect(hasPermission(persona, 'APPROVAL_REQUEST', 'approve')).toBe(true);
      });

      it('returns false for management persona with delete permission on PORTFOLIO', () => {
        const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
        expect(hasPermission(persona, 'PORTFOLIO', 'delete')).toBe(false);
      });

      it('returns true for operational persona with create permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
        expect(hasPermission(persona, 'APPLICATION', 'create')).toBe(true);
      });

      it('returns false for operational persona with delete permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
        expect(hasPermission(persona, 'APPLICATION', 'delete')).toBe(false);
      });

      it('returns true for contributor persona with create permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
        expect(hasPermission(persona, 'APPLICATION', 'create')).toBe(true);
      });

      it('returns false for contributor persona with delete permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
        expect(hasPermission(persona, 'APPLICATION', 'delete')).toBe(false);
      });

      it('returns false for contributor persona with export permission on APPLICATION', () => {
        const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
        expect(hasPermission(persona, 'APPLICATION', 'export')).toBe(false);
      });
    });

    describe('with persona ID string', () => {
      it('returns true for Platform Administrator persona ID with configure permission on PDE_CONFIG', () => {
        expect(hasPermission(PERSONAS.PLATFORM_ADMINISTRATOR.id, 'PDE_CONFIG', 'configure')).toBe(true);
      });

      it('returns true for Executive Leadership persona ID with view permission on PORTFOLIO', () => {
        expect(hasPermission(PERSONAS.EXECUTIVE_LEADERSHIP.id, 'PORTFOLIO', 'view')).toBe(true);
      });

      it('returns false for Read Only User persona ID with create permission on APPLICATION', () => {
        expect(hasPermission(PERSONAS.READ_ONLY_USER.id, 'APPLICATION', 'create')).toBe(false);
      });

      it('returns false for Vendor Partner persona ID with view permission on PORTFOLIO', () => {
        expect(hasPermission(PERSONAS.VENDOR_PARTNER.id, 'PORTFOLIO', 'view')).toBe(false);
      });
    });

    describe('Read Only persona restrictions', () => {
      const readOnlyPersona = { accessLevel: ACCESS_LEVELS.READ_ONLY };

      it('allows view on PORTFOLIO', () => {
        expect(hasPermission(readOnlyPersona, 'PORTFOLIO', 'view')).toBe(true);
      });

      it('allows view on APPLICATION', () => {
        expect(hasPermission(readOnlyPersona, 'APPLICATION', 'view')).toBe(true);
      });

      it('allows view on TECH_STANDARD', () => {
        expect(hasPermission(readOnlyPersona, 'TECH_STANDARD', 'view')).toBe(true);
      });

      it('denies create on PORTFOLIO', () => {
        expect(hasPermission(readOnlyPersona, 'PORTFOLIO', 'create')).toBe(false);
      });

      it('denies edit on APPLICATION', () => {
        expect(hasPermission(readOnlyPersona, 'APPLICATION', 'edit')).toBe(false);
      });

      it('denies delete on TECH_STANDARD', () => {
        expect(hasPermission(readOnlyPersona, 'TECH_STANDARD', 'delete')).toBe(false);
      });

      it('denies export on PORTFOLIO', () => {
        expect(hasPermission(readOnlyPersona, 'PORTFOLIO', 'export')).toBe(false);
      });

      it('denies approve on APPROVAL_REQUEST', () => {
        expect(hasPermission(readOnlyPersona, 'APPROVAL_REQUEST', 'approve')).toBe(false);
      });

      it('denies configure on PDE_CONFIG', () => {
        expect(hasPermission(readOnlyPersona, 'PDE_CONFIG', 'configure')).toBe(false);
      });

      it('denies view on PDE_CONFIG', () => {
        expect(hasPermission(readOnlyPersona, 'PDE_CONFIG', 'view')).toBe(false);
      });
    });

    describe('Vendor/External persona restrictions', () => {
      const externalPersona = { accessLevel: ACCESS_LEVELS.EXTERNAL };

      it('allows view on APPLICATION', () => {
        expect(hasPermission(externalPersona, 'APPLICATION', 'view')).toBe(true);
      });

      it('allows view on TECH_STANDARD', () => {
        expect(hasPermission(externalPersona, 'TECH_STANDARD', 'view')).toBe(true);
      });

      it('allows view on TECH_CATEGORY', () => {
        expect(hasPermission(externalPersona, 'TECH_CATEGORY', 'view')).toBe(true);
      });

      it('allows view on DEFINITION', () => {
        expect(hasPermission(externalPersona, 'DEFINITION', 'view')).toBe(true);
      });

      it('allows view on NOTIFICATION', () => {
        expect(hasPermission(externalPersona, 'NOTIFICATION', 'view')).toBe(true);
      });

      it('denies view on PORTFOLIO', () => {
        expect(hasPermission(externalPersona, 'PORTFOLIO', 'view')).toBe(false);
      });

      it('denies view on ENVIRONMENT', () => {
        expect(hasPermission(externalPersona, 'ENVIRONMENT', 'view')).toBe(false);
      });

      it('denies view on TECH_DEBT', () => {
        expect(hasPermission(externalPersona, 'TECH_DEBT', 'view')).toBe(false);
      });

      it('denies view on QUALITY_GATE', () => {
        expect(hasPermission(externalPersona, 'QUALITY_GATE', 'view')).toBe(false);
      });

      it('denies create on APPLICATION', () => {
        expect(hasPermission(externalPersona, 'APPLICATION', 'create')).toBe(false);
      });

      it('denies edit on APPLICATION', () => {
        expect(hasPermission(externalPersona, 'APPLICATION', 'edit')).toBe(false);
      });

      it('denies delete on APPLICATION', () => {
        expect(hasPermission(externalPersona, 'APPLICATION', 'delete')).toBe(false);
      });

      it('denies export on APPLICATION', () => {
        expect(hasPermission(externalPersona, 'APPLICATION', 'export')).toBe(false);
      });

      it('denies view on USER', () => {
        expect(hasPermission(externalPersona, 'USER', 'view')).toBe(false);
      });

      it('denies view on ROLE', () => {
        expect(hasPermission(externalPersona, 'ROLE', 'view')).toBe(false);
      });

      it('denies view on INTEGRATION', () => {
        expect(hasPermission(externalPersona, 'INTEGRATION', 'view')).toBe(false);
      });

      it('denies view on AI_ANALYSIS', () => {
        expect(hasPermission(externalPersona, 'AI_ANALYSIS', 'view')).toBe(false);
      });

      it('denies view on PDE_CONFIG', () => {
        expect(hasPermission(externalPersona, 'PDE_CONFIG', 'view')).toBe(false);
      });

      it('denies view on AUDIT_LOG', () => {
        expect(hasPermission(externalPersona, 'AUDIT_LOG', 'view')).toBe(false);
      });

      it('denies approve on APPROVAL_REQUEST', () => {
        expect(hasPermission(externalPersona, 'APPROVAL_REQUEST', 'approve')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns false for null persona', () => {
        expect(hasPermission(null, 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for undefined persona', () => {
        expect(hasPermission(undefined, 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for empty string persona', () => {
        expect(hasPermission('', 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for null entity type', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, null, 'view')).toBe(false);
      });

      it('returns false for empty string entity type', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, '', 'view')).toBe(false);
      });

      it('returns false for null action', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'PORTFOLIO', null)).toBe(false);
      });

      it('returns false for empty string action', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'PORTFOLIO', '')).toBe(false);
      });

      it('returns false for unknown entity type', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'NONEXISTENT_ENTITY', 'view')).toBe(false);
      });

      it('returns false for unknown action', () => {
        const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
        expect(hasPermission(persona, 'PORTFOLIO', 'nonexistent_action')).toBe(false);
      });

      it('returns false for unknown persona ID string', () => {
        expect(hasPermission('unknown-persona-id', 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for persona object without accessLevel', () => {
        expect(hasPermission({ name: 'Test' }, 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for numeric persona', () => {
        expect(hasPermission(123, 'PORTFOLIO', 'view')).toBe(false);
      });

      it('returns false for boolean persona', () => {
        expect(hasPermission(true, 'PORTFOLIO', 'view')).toBe(false);
      });
    });
  });

  describe('getPermissions', () => {
    it('returns permissions array for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const permissions = getPermissions(persona);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('returns permissions with entityType and actions for each entry', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const permissions = getPermissions(persona);
      permissions.forEach((entry) => {
        expect(typeof entry.entityType).toBe('string');
        expect(Array.isArray(entry.actions)).toBe(true);
        expect(entry.actions.length).toBeGreaterThan(0);
      });
    });

    it('returns all entity types for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const permissions = getPermissions(persona);
      const entityTypes = permissions.map((p) => p.entityType);
      expect(entityTypes).toContain('PORTFOLIO');
      expect(entityTypes).toContain('APPLICATION');
      expect(entityTypes).toContain('USER');
      expect(entityTypes).toContain('ROLE');
      expect(entityTypes).toContain('PDE_CONFIG');
    });

    it('returns all actions for admin persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const permissions = getPermissions(persona);
      const portfolioPerms = permissions.find((p) => p.entityType === 'PORTFOLIO');
      expect(portfolioPerms).toBeDefined();
      expect(portfolioPerms.actions).toContain('view');
      expect(portfolioPerms.actions).toContain('create');
      expect(portfolioPerms.actions).toContain('edit');
      expect(portfolioPerms.actions).toContain('delete');
      expect(portfolioPerms.actions).toContain('export');
      expect(portfolioPerms.actions).toContain('approve');
      expect(portfolioPerms.actions).toContain('configure');
      expect(portfolioPerms.actions).toContain('administer');
    });

    it('returns limited permissions for read_only persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      const permissions = getPermissions(persona);
      permissions.forEach((entry) => {
        entry.actions.forEach((action) => {
          expect(action).toBe('view');
        });
      });
    });

    it('returns very limited permissions for external persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const permissions = getPermissions(persona);
      const entityTypes = permissions.map((p) => p.entityType);
      expect(entityTypes).toContain('APPLICATION');
      expect(entityTypes).toContain('TECH_STANDARD');
      expect(entityTypes).toContain('TECH_CATEGORY');
      expect(entityTypes).toContain('DEFINITION');
      expect(entityTypes).toContain('NOTIFICATION');
      expect(entityTypes).toContain('TECH_ENTRY');
      expect(entityTypes).not.toContain('PORTFOLIO');
      expect(entityTypes).not.toContain('ENVIRONMENT');
      expect(entityTypes).not.toContain('TECH_DEBT');
    });

    it('returns empty array for null persona', () => {
      const permissions = getPermissions(null);
      expect(permissions).toEqual([]);
    });

    it('returns empty array for undefined persona', () => {
      const permissions = getPermissions(undefined);
      expect(permissions).toEqual([]);
    });

    it('returns empty array for empty string persona', () => {
      const permissions = getPermissions('');
      expect(permissions).toEqual([]);
    });

    it('returns permissions for persona ID string', () => {
      const permissions = getPermissions(PERSONAS.PLATFORM_ADMINISTRATOR.id);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });
  });

  describe('canExport', () => {
    it('returns true for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canExport(persona)).toBe(true);
    });

    it('returns true for executive persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(canExport(persona)).toBe(true);
    });

    it('returns true for strategic persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canExport(persona)).toBe(true);
    });

    it('returns true for management persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canExport(persona)).toBe(true);
    });

    it('returns true for operational persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(canExport(persona)).toBe(true);
    });

    it('returns false for contributor persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canExport(persona)).toBe(false);
    });

    it('returns false for read_only persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canExport(persona)).toBe(false);
    });

    it('returns false for external persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canExport(persona)).toBe(false);
    });

    it('returns false for null persona', () => {
      expect(canExport(null)).toBe(false);
    });

    it('returns false for undefined persona', () => {
      expect(canExport(undefined)).toBe(false);
    });
  });

  describe('canAdminister', () => {
    it('returns true for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canAdminister(persona)).toBe(true);
    });

    it('returns false for executive persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for strategic persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for management persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for operational persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for contributor persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for read_only persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for external persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canAdminister(persona)).toBe(false);
    });

    it('returns false for null persona', () => {
      expect(canAdminister(null)).toBe(false);
    });

    it('returns false for undefined persona', () => {
      expect(canAdminister(undefined)).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('returns true for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canWrite(persona)).toBe(true);
    });

    it('returns true for strategic persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canWrite(persona)).toBe(true);
    });

    it('returns true for management persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canWrite(persona)).toBe(true);
    });

    it('returns true for operational persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(canWrite(persona)).toBe(true);
    });

    it('returns true for contributor persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canWrite(persona)).toBe(true);
    });

    it('returns false for read_only persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canWrite(persona)).toBe(false);
    });

    it('returns false for external persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canWrite(persona)).toBe(false);
    });

    it('returns false for null persona', () => {
      expect(canWrite(null)).toBe(false);
    });
  });

  describe('canApprove', () => {
    it('returns true for admin persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canApprove(persona)).toBe(true);
    });

    it('returns true for executive persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(canApprove(persona)).toBe(true);
    });

    it('returns true for strategic persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canApprove(persona)).toBe(true);
    });

    it('returns true for management persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canApprove(persona)).toBe(true);
    });

    it('returns false for operational persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(canApprove(persona)).toBe(false);
    });

    it('returns false for contributor persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canApprove(persona)).toBe(false);
    });

    it('returns false for read_only persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canApprove(persona)).toBe(false);
    });

    it('returns false for external persona', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canApprove(persona)).toBe(false);
    });

    it('returns false for null persona', () => {
      expect(canApprove(null)).toBe(false);
    });
  });

  describe('canView', () => {
    it('returns true for admin persona on any entity', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canView(persona, 'PORTFOLIO')).toBe(true);
      expect(canView(persona, 'APPLICATION')).toBe(true);
      expect(canView(persona, 'USER')).toBe(true);
      expect(canView(persona, 'PDE_CONFIG')).toBe(true);
    });

    it('returns true for read_only persona on most entities', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canView(persona, 'PORTFOLIO')).toBe(true);
      expect(canView(persona, 'APPLICATION')).toBe(true);
      expect(canView(persona, 'TECH_STANDARD')).toBe(true);
    });

    it('returns false for read_only persona on PDE_CONFIG', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canView(persona, 'PDE_CONFIG')).toBe(false);
    });

    it('returns false for external persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canView(persona, 'PORTFOLIO')).toBe(false);
    });

    it('returns true for external persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canView(persona, 'APPLICATION')).toBe(true);
    });

    it('returns false for null persona', () => {
      expect(canView(null, 'PORTFOLIO')).toBe(false);
    });

    it('returns false for empty entity type', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canView(persona, '')).toBe(false);
    });
  });

  describe('canCreate', () => {
    it('returns true for admin persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canCreate(persona, 'PORTFOLIO')).toBe(true);
    });

    it('returns true for strategic persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canCreate(persona, 'PORTFOLIO')).toBe(true);
    });

    it('returns false for executive persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(canCreate(persona, 'PORTFOLIO')).toBe(false);
    });

    it('returns false for read_only persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canCreate(persona, 'APPLICATION')).toBe(false);
    });

    it('returns false for external persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canCreate(persona, 'APPLICATION')).toBe(false);
    });

    it('returns true for contributor persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canCreate(persona, 'APPLICATION')).toBe(true);
    });

    it('returns true for contributor persona on TECH_DEBT', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canCreate(persona, 'TECH_DEBT')).toBe(true);
    });

    it('returns true for contributor persona on APPROVAL_REQUEST', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canCreate(persona, 'APPROVAL_REQUEST')).toBe(true);
    });

    it('returns false for null persona', () => {
      expect(canCreate(null, 'PORTFOLIO')).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('returns true for admin persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canEdit(persona, 'PORTFOLIO')).toBe(true);
    });

    it('returns true for management persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canEdit(persona, 'APPLICATION')).toBe(true);
    });

    it('returns false for read_only persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canEdit(persona, 'APPLICATION')).toBe(false);
    });

    it('returns false for external persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canEdit(persona, 'APPLICATION')).toBe(false);
    });

    it('returns true for contributor persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canEdit(persona, 'APPLICATION')).toBe(true);
    });

    it('returns false for null persona', () => {
      expect(canEdit(null, 'PORTFOLIO')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('returns true for admin persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      expect(canDelete(persona, 'PORTFOLIO')).toBe(true);
    });

    it('returns false for executive persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(canDelete(persona, 'PORTFOLIO')).toBe(false);
    });

    it('returns false for strategic persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(canDelete(persona, 'PORTFOLIO')).toBe(false);
    });

    it('returns false for management persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      expect(canDelete(persona, 'PORTFOLIO')).toBe(false);
    });

    it('returns false for read_only persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      expect(canDelete(persona, 'APPLICATION')).toBe(false);
    });

    it('returns false for external persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      expect(canDelete(persona, 'APPLICATION')).toBe(false);
    });

    it('returns false for contributor persona on APPLICATION', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(canDelete(persona, 'APPLICATION')).toBe(false);
    });

    it('returns false for null persona', () => {
      expect(canDelete(null, 'PORTFOLIO')).toBe(false);
    });
  });

  describe('getEntityActions', () => {
    it('returns all actions for admin persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const actions = getEntityActions(persona, 'PORTFOLIO');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toContain('view');
      expect(actions).toContain('create');
      expect(actions).toContain('edit');
      expect(actions).toContain('delete');
      expect(actions).toContain('export');
      expect(actions).toContain('approve');
      expect(actions).toContain('configure');
      expect(actions).toContain('execute');
      expect(actions).toContain('administer');
      expect(actions).toContain('waive');
    });

    it('returns only view for read_only persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      const actions = getEntityActions(persona, 'PORTFOLIO');
      expect(actions).toEqual(['view']);
    });

    it('returns empty array for external persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const actions = getEntityActions(persona, 'PORTFOLIO');
      expect(actions).toEqual([]);
    });

    it('returns view and export for executive persona on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      const actions = getEntityActions(persona, 'PORTFOLIO');
      expect(actions).toContain('view');
      expect(actions).toContain('export');
      expect(actions).toContain('approve');
      expect(actions).not.toContain('create');
      expect(actions).not.toContain('delete');
    });

    it('returns empty array for null persona', () => {
      const actions = getEntityActions(null, 'PORTFOLIO');
      expect(actions).toEqual([]);
    });

    it('returns empty array for empty entity type', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const actions = getEntityActions(persona, '');
      expect(actions).toEqual([]);
    });
  });

  describe('getAccessibleEntities', () => {
    it('returns all entity types for admin persona with view action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const entities = getAccessibleEntities(persona, 'view');
      expect(Array.isArray(entities)).toBe(true);
      expect(entities).toContain('PORTFOLIO');
      expect(entities).toContain('APPLICATION');
      expect(entities).toContain('USER');
      expect(entities).toContain('ROLE');
      expect(entities).toContain('PDE_CONFIG');
    });

    it('returns limited entity types for external persona with view action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const entities = getAccessibleEntities(persona, 'view');
      expect(entities).toContain('APPLICATION');
      expect(entities).toContain('TECH_STANDARD');
      expect(entities).toContain('TECH_CATEGORY');
      expect(entities).toContain('DEFINITION');
      expect(entities).toContain('NOTIFICATION');
      expect(entities).toContain('TECH_ENTRY');
      expect(entities).not.toContain('PORTFOLIO');
      expect(entities).not.toContain('ENVIRONMENT');
      expect(entities).not.toContain('TECH_DEBT');
    });

    it('returns empty array for external persona with create action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const entities = getAccessibleEntities(persona, 'create');
      expect(entities).toEqual([]);
    });

    it('returns empty array for read_only persona with create action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      const entities = getAccessibleEntities(persona, 'create');
      expect(entities).toEqual([]);
    });

    it('returns empty array for null persona', () => {
      const entities = getAccessibleEntities(null, 'view');
      expect(entities).toEqual([]);
    });

    it('returns empty array for empty action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const entities = getAccessibleEntities(persona, '');
      expect(entities).toEqual([]);
    });
  });

  describe('checkAccess', () => {
    it('returns allowed true for admin persona with view on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const result = checkAccess(persona, 'PORTFOLIO', 'view');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('returns allowed false for read_only persona with create on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      const result = checkAccess(persona, 'PORTFOLIO', 'create');
      expect(result.allowed).toBe(false);
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it('returns allowed false for external persona with view on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const result = checkAccess(persona, 'PORTFOLIO', 'view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have');
    });

    it('returns allowed false with reason for null persona', () => {
      const result = checkAccess(null, 'PORTFOLIO', 'view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unable to resolve');
    });

    it('returns allowed false with reason for empty entity type', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const result = checkAccess(persona, '', 'view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Entity type must be');
    });

    it('returns allowed false with reason for empty action', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const result = checkAccess(persona, 'PORTFOLIO', '');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Action must be');
    });

    it('returns allowed true for management persona with waive on WAIVER', () => {
      const persona = { accessLevel: ACCESS_LEVELS.MANAGEMENT };
      const result = checkAccess(persona, 'WAIVER', 'waive');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('returns allowed false for contributor persona with waive on WAIVER', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      const result = checkAccess(persona, 'WAIVER', 'waive');
      expect(result.allowed).toBe(false);
      expect(result.reason).not.toBeNull();
    });
  });

  describe('cross-cutting permission scenarios', () => {
    it('admin has all permissions on all entity types', () => {
      const persona = { accessLevel: ACCESS_LEVELS.ADMIN };
      const allEntityTypes = Object.values(ENTITY_TYPES);
      const allActions = Object.values(ACTIONS);

      allEntityTypes.forEach((entityType) => {
        allActions.forEach((action) => {
          expect(hasPermission(persona, entityType, action)).toBe(true);
        });
      });
    });

    it('read_only has only view permission on accessible entities', () => {
      const persona = { accessLevel: ACCESS_LEVELS.READ_ONLY };
      const permissions = getPermissions(persona);

      permissions.forEach((entry) => {
        expect(entry.actions).toEqual(['view']);
      });
    });

    it('external has no write permissions on any entity', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXTERNAL };
      const allEntityTypes = Object.values(ENTITY_TYPES);
      const writeActions = ['create', 'edit', 'delete'];

      allEntityTypes.forEach((entityType) => {
        writeActions.forEach((action) => {
          expect(hasPermission(persona, entityType, action)).toBe(false);
        });
      });
    });

    it('executive can approve but not create on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(hasPermission(persona, 'PORTFOLIO', 'approve')).toBe(true);
      expect(hasPermission(persona, 'PORTFOLIO', 'create')).toBe(false);
    });

    it('strategic can approve and create on PORTFOLIO', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(hasPermission(persona, 'PORTFOLIO', 'approve')).toBe(true);
      expect(hasPermission(persona, 'PORTFOLIO', 'create')).toBe(true);
    });

    it('operational can create APPROVAL_REQUEST but not approve', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(hasPermission(persona, 'APPROVAL_REQUEST', 'create')).toBe(true);
      expect(hasPermission(persona, 'APPROVAL_REQUEST', 'approve')).toBe(false);
    });

    it('contributor can create APPROVAL_REQUEST but not approve', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(hasPermission(persona, 'APPROVAL_REQUEST', 'create')).toBe(true);
      expect(hasPermission(persona, 'APPROVAL_REQUEST', 'approve')).toBe(false);
    });

    it('executive can execute AI_ANALYSIS', () => {
      const persona = { accessLevel: ACCESS_LEVELS.EXECUTIVE };
      expect(hasPermission(persona, 'AI_ANALYSIS', 'execute')).toBe(true);
    });

    it('contributor cannot execute AI_ANALYSIS', () => {
      const persona = { accessLevel: ACCESS_LEVELS.CONTRIBUTOR };
      expect(hasPermission(persona, 'AI_ANALYSIS', 'execute')).toBe(false);
    });

    it('strategic can waive on WAIVER', () => {
      const persona = { accessLevel: ACCESS_LEVELS.STRATEGIC };
      expect(hasPermission(persona, 'WAIVER', 'waive')).toBe(true);
    });

    it('operational cannot waive on WAIVER', () => {
      const persona = { accessLevel: ACCESS_LEVELS.OPERATIONAL };
      expect(hasPermission(persona, 'WAIVER', 'waive')).toBe(false);
    });
  });

  describe('persona ID resolution', () => {
    it('resolves Platform Administrator persona ID correctly', () => {
      const permissions = getPermissions(PERSONAS.PLATFORM_ADMINISTRATOR.id);
      expect(permissions.length).toBeGreaterThan(0);
      const portfolioPerms = permissions.find((p) => p.entityType === 'PORTFOLIO');
      expect(portfolioPerms).toBeDefined();
      expect(portfolioPerms.actions).toContain('administer');
    });

    it('resolves Executive Leadership persona ID correctly', () => {
      expect(hasPermission(PERSONAS.EXECUTIVE_LEADERSHIP.id, 'PORTFOLIO', 'view')).toBe(true);
      expect(hasPermission(PERSONAS.EXECUTIVE_LEADERSHIP.id, 'PORTFOLIO', 'approve')).toBe(true);
      expect(hasPermission(PERSONAS.EXECUTIVE_LEADERSHIP.id, 'PORTFOLIO', 'delete')).toBe(false);
    });

    it('resolves Quality Engineer persona ID correctly', () => {
      expect(hasPermission(PERSONAS.QUALITY_ENGINEER.id, 'APPLICATION', 'view')).toBe(true);
      expect(hasPermission(PERSONAS.QUALITY_ENGINEER.id, 'APPLICATION', 'create')).toBe(true);
      expect(hasPermission(PERSONAS.QUALITY_ENGINEER.id, 'APPLICATION', 'edit')).toBe(true);
      expect(hasPermission(PERSONAS.QUALITY_ENGINEER.id, 'APPLICATION', 'delete')).toBe(false);
    });

    it('resolves Vendor Partner persona ID correctly', () => {
      expect(hasPermission(PERSONAS.VENDOR_PARTNER.id, 'APPLICATION', 'view')).toBe(true);
      expect(hasPermission(PERSONAS.VENDOR_PARTNER.id, 'APPLICATION', 'create')).toBe(false);
      expect(hasPermission(PERSONAS.VENDOR_PARTNER.id, 'PORTFOLIO', 'view')).toBe(false);
    });

    it('resolves Production Support Read Only persona ID correctly', () => {
      expect(hasPermission(PERSONAS.PRODUCTION_SUPPORT_READ_ONLY.id, 'APPLICATION', 'view')).toBe(true);
      expect(hasPermission(PERSONAS.PRODUCTION_SUPPORT_READ_ONLY.id, 'APPLICATION', 'create')).toBe(false);
      expect(hasPermission(PERSONAS.PRODUCTION_SUPPORT_READ_ONLY.id, 'APPLICATION', 'edit')).toBe(false);
    });

    it('resolves Read Only User persona ID correctly', () => {
      expect(canWrite(PERSONAS.READ_ONLY_USER.id)).toBe(false);
      expect(canExport(PERSONAS.READ_ONLY_USER.id)).toBe(false);
      expect(canApprove(PERSONAS.READ_ONLY_USER.id)).toBe(false);
      expect(canAdminister(PERSONAS.READ_ONLY_USER.id)).toBe(false);
    });
  });
});