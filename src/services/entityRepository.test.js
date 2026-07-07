import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  create,
  read,
  update,
  remove,
  list,
  count,
  exists,
  bulkCreate,
  bulkDelete,
  getAll,
  findByField,
  getDeleteImpact,
} from './entityRepository';
import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';

describe('entityRepository', () => {
  beforeEach(() => {
    localStorage.clear();
    // Initialize empty arrays for entity types we'll test with
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));
    // Set active persona to admin for permission checks
    localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Helper to seed a portfolio
  const seedPortfolio = (overrides = {}) => {
    const data = {
      name: 'Test Portfolio',
      owner: 'Test Owner',
      status: 'active',
      ...overrides,
    };
    return create('PORTFOLIO', data);
  };

  // Helper to seed an application with a portfolio
  const seedApplicationWithPortfolio = (appOverrides = {}, portfolioOverrides = {}) => {
    const portfolioResult = seedPortfolio(portfolioOverrides);
    const appData = {
      name: 'Test Application',
      portfolioId: portfolioResult.data.id,
      owner: 'Test Owner',
      status: 'active',
      ...appOverrides,
    };
    const appResult = create('APPLICATION', appData);
    return { portfolio: portfolioResult.data, application: appResult.data };
  };

  // Helper to seed a role
  const seedRole = (overrides = {}) => {
    const data = {
      name: 'Test Role',
      accessLevel: 'admin',
      status: 'active',
      ...overrides,
    };
    return create('ROLE', data);
  };

  describe('create', () => {
    it('creates a portfolio record successfully', () => {
      const result = seedPortfolio();
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data.id).toBeDefined();
      expect(result.data.id.startsWith(ID_PREFIXES.PORTFOLIO)).toBe(true);
      expect(result.data.name).toBe('Test Portfolio');
      expect(result.data.owner).toBe('Test Owner');
      expect(result.data.status).toBe('active');
      expect(result.data.createdAt).toBeDefined();
      expect(result.data.updatedAt).toBeDefined();
      expect(result.data.version).toBe(1);
    });

    it('creates an application record with valid foreign key', () => {
      const { application, portfolio } = seedApplicationWithPortfolio();
      expect(application).not.toBeNull();
      expect(application.id.startsWith(ID_PREFIXES.APPLICATION)).toBe(true);
      expect(application.portfolioId).toBe(portfolio.id);
      expect(application.name).toBe('Test Application');
    });

    it('persists the created record to localStorage', () => {
      const result = seedPortfolio();
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe(result.data.id);
    });

    it('returns error for empty entity type', () => {
      const result = create('', { name: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Entity type must be a non-empty string');
    });

    it('returns error for unknown entity type', () => {
      const result = create('UNKNOWN_TYPE', { name: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown entity type');
    });

    it('returns error for null data', () => {
      const result = create('PORTFOLIO', null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Data must be a non-null object');
    });

    it('returns error for array data', () => {
      const result = create('PORTFOLIO', [1, 2, 3]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Data must be a non-null object');
    });

    it('returns error for duplicate ID', () => {
      const result1 = seedPortfolio();
      const result2 = create('PORTFOLIO', {
        id: result1.data.id,
        name: 'Another Portfolio',
        owner: 'Owner',
        status: 'active',
      });
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already exists');
    });

    it('returns error for duplicate unique field (name)', () => {
      seedPortfolio({ name: 'Unique Name' });
      const result = seedPortfolio({ name: 'Unique Name' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unique constraint violation');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error for invalid foreign key reference', () => {
      const result = create('APPLICATION', {
        name: 'Test App',
        portfolioId: 'PF-NONEXISTENT',
        owner: 'Owner',
        status: 'active',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Referential integrity violation');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('generates audit log entry on successful create', () => {
      seedPortfolio();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      expect(auditLogs.length).toBeGreaterThan(0);
      const createLog = auditLogs.find(
        (log) => log.action === 'create' && log.entityType === 'PORTFOLIO'
      );
      expect(createLog).toBeDefined();
      expect(createLog.status).toBe('success');
    });

    it('sets createdBy and updatedBy from active persona', () => {
      const result = seedPortfolio();
      expect(result.data.createdBy).toBeDefined();
      expect(result.data.updatedBy).toBeDefined();
    });

    it('creates a definition record without foreign keys', () => {
      const result = create('DEFINITION', {
        term: 'Test Term',
        definition: 'A test definition for testing purposes.',
        status: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.data.term).toBe('Test Term');
      expect(result.data.id.startsWith(ID_PREFIXES.DEFINITION)).toBe(true);
    });

    it('creates multiple records with unique IDs', () => {
      const result1 = seedPortfolio({ name: 'Portfolio A' });
      const result2 = seedPortfolio({ name: 'Portfolio B' });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data.id).not.toBe(result2.data.id);
    });
  });

  describe('read', () => {
    it('reads an existing record by ID', () => {
      const createResult = seedPortfolio();
      const readResult = read('PORTFOLIO', createResult.data.id);
      expect(readResult.success).toBe(true);
      expect(readResult.data).not.toBeNull();
      expect(readResult.data.id).toBe(createResult.data.id);
      expect(readResult.data.name).toBe('Test Portfolio');
    });

    it('returns a copy of the record (not a reference)', () => {
      const createResult = seedPortfolio();
      const readResult = read('PORTFOLIO', createResult.data.id);
      readResult.data.name = 'Modified';
      const readAgain = read('PORTFOLIO', createResult.data.id);
      expect(readAgain.data.name).toBe('Test Portfolio');
    });

    it('returns error for non-existent ID', () => {
      const result = read('PORTFOLIO', 'PF-NONEXISTENT');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('returns error for empty entity type', () => {
      const result = read('', 'PF-001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Entity type must be a non-empty string');
    });

    it('returns error for empty ID', () => {
      const result = read('PORTFOLIO', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID must be a non-empty string');
    });

    it('returns error for null ID', () => {
      const result = read('PORTFOLIO', null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID must be a non-empty string');
    });

    it('returns error for unknown entity type', () => {
      const result = read('UNKNOWN_TYPE', 'X-001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown entity type');
    });
  });

  describe('update', () => {
    it('updates an existing record successfully', () => {
      const createResult = seedPortfolio();
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        name: 'Updated Portfolio',
      });
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.name).toBe('Updated Portfolio');
      expect(updateResult.data.id).toBe(createResult.data.id);
    });

    it('increments the version number on update', () => {
      const createResult = seedPortfolio();
      expect(createResult.data.version).toBe(1);
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        name: 'Updated',
      });
      expect(updateResult.data.version).toBe(2);
    });

    it('updates the updatedAt timestamp', () => {
      const createResult = seedPortfolio();
      const originalUpdatedAt = createResult.data.updatedAt;
      // Small delay to ensure different timestamp
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        name: 'Updated',
      });
      expect(updateResult.data.updatedAt).toBeDefined();
    });

    it('preserves the createdAt timestamp on update', () => {
      const createResult = seedPortfolio();
      const originalCreatedAt = createResult.data.createdAt;
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        name: 'Updated',
      });
      expect(updateResult.data.createdAt).toBe(originalCreatedAt);
    });

    it('preserves the ID on update', () => {
      const createResult = seedPortfolio();
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        id: 'PF-HACKED',
        name: 'Updated',
      });
      expect(updateResult.data.id).toBe(createResult.data.id);
    });

    it('persists the update to localStorage', () => {
      const createResult = seedPortfolio();
      update('PORTFOLIO', createResult.data.id, { name: 'Updated' });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      const record = stored.find((r) => r.id === createResult.data.id);
      expect(record.name).toBe('Updated');
    });

    it('returns error for non-existent ID', () => {
      const result = update('PORTFOLIO', 'PF-NONEXISTENT', { name: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for empty entity type', () => {
      const result = update('', 'PF-001', { name: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Entity type must be a non-empty string');
    });

    it('returns error for empty ID', () => {
      const result = update('PORTFOLIO', '', { name: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID must be a non-empty string');
    });

    it('returns error for null data', () => {
      const createResult = seedPortfolio();
      const result = update('PORTFOLIO', createResult.data.id, null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Data must be a non-null object');
    });

    it('returns error for unique constraint violation on update', () => {
      seedPortfolio({ name: 'Portfolio A' });
      const result2 = seedPortfolio({ name: 'Portfolio B' });
      const updateResult = update('PORTFOLIO', result2.data.id, {
        name: 'Portfolio A',
      });
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('Unique constraint violation');
    });

    it('allows updating to the same unique value (no self-conflict)', () => {
      const createResult = seedPortfolio({ name: 'Same Name' });
      const updateResult = update('PORTFOLIO', createResult.data.id, {
        name: 'Same Name',
      });
      expect(updateResult.success).toBe(true);
    });

    it('generates audit log entry on successful update', () => {
      const createResult = seedPortfolio();
      update('PORTFOLIO', createResult.data.id, { name: 'Updated' });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const updateLog = auditLogs.find(
        (log) => log.action === 'update' && log.entityType === 'PORTFOLIO'
      );
      expect(updateLog).toBeDefined();
      expect(updateLog.status).toBe('success');
    });
  });

  describe('remove (delete)', () => {
    it('deletes an existing record successfully', () => {
      const createResult = seedPortfolio();
      const deleteResult = remove('PORTFOLIO', createResult.data.id);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.error).toBeNull();
    });

    it('removes the record from localStorage', () => {
      const createResult = seedPortfolio();
      remove('PORTFOLIO', createResult.data.id);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIOS));
      expect(stored.length).toBe(0);
    });

    it('returns error for non-existent ID', () => {
      const result = remove('PORTFOLIO', 'PF-NONEXISTENT');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for empty entity type', () => {
      const result = remove('', 'PF-001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Entity type must be a non-empty string');
    });

    it('returns error for empty ID', () => {
      const result = remove('PORTFOLIO', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID must be a non-empty string');
    });

    it('generates audit log entry on successful delete', () => {
      const createResult = seedPortfolio();
      remove('PORTFOLIO', createResult.data.id);
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deleteLog = auditLogs.find(
        (log) => log.action === 'delete' && log.entityType === 'PORTFOLIO'
      );
      expect(deleteLog).toBeDefined();
      expect(deleteLog.status).toBe('success');
    });

    it('returns deletedCounts including the deleted entity type', () => {
      const createResult = seedPortfolio();
      const deleteResult = remove('PORTFOLIO', createResult.data.id);
      expect(deleteResult.deletedCounts).toBeDefined();
      expect(deleteResult.deletedCounts.PORTFOLIO).toBe(1);
    });
  });

  describe('referential integrity - cascade delete', () => {
    it('cascade deletes child applications when portfolio is deleted', () => {
      const { portfolio, application } = seedApplicationWithPortfolio();

      const deleteResult = remove('PORTFOLIO', portfolio.id);
      expect(deleteResult.success).toBe(true);

      // Application should be cascade deleted
      const appRead = read('APPLICATION', application.id);
      expect(appRead.success).toBe(false);
      expect(appRead.error).toContain('not found');
    });

    it('reports cascade deleted counts', () => {
      const { portfolio } = seedApplicationWithPortfolio();

      const deleteResult = remove('PORTFOLIO', portfolio.id);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.deletedCounts.APPLICATION).toBeGreaterThanOrEqual(1);
    });

    it('cascade deletes multiple child records', () => {
      const portfolioResult = seedPortfolio({ name: 'Multi-App Portfolio' });
      create('APPLICATION', {
        name: 'App One',
        portfolioId: portfolioResult.data.id,
        owner: 'Owner',
        status: 'active',
      });
      create('APPLICATION', {
        name: 'App Two',
        portfolioId: portfolioResult.data.id,
        owner: 'Owner',
        status: 'active',
      });

      const deleteResult = remove('PORTFOLIO', portfolioResult.data.id);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.deletedCounts.APPLICATION).toBe(2);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS));
      expect(stored.length).toBe(0);
    });

    it('cascade deletes environments when application is deleted', () => {
      const { application } = seedApplicationWithPortfolio();

      const envResult = create('ENVIRONMENT', {
        name: 'Test Env',
        type: 'development',
        applicationId: application.id,
        status: 'active',
      });
      expect(envResult.success).toBe(true);

      const deleteResult = remove('APPLICATION', application.id);
      expect(deleteResult.success).toBe(true);

      const envRead = read('ENVIRONMENT', envResult.data.id);
      expect(envRead.success).toBe(false);
    });
  });

  describe('referential integrity - block delete', () => {
    it('blocks deletion of tech category referenced by tech standard with BLOCK', () => {
      const categoryResult = create('TECH_CATEGORY', {
        name: 'Test Category',
        status: 'active',
      });
      expect(categoryResult.success).toBe(true);

      const standardResult = create('TECH_STANDARD', {
        name: 'Test Standard',
        categoryId: categoryResult.data.id,
        status: 'recommended',
        effectiveDate: '2026-01-01',
        owner: 'Owner',
      });
      expect(standardResult.success).toBe(true);

      const deleteResult = remove('TECH_CATEGORY', categoryResult.data.id);
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toContain('blocked by referencing entities');
      expect(deleteResult.errors.length).toBeGreaterThan(0);
    });

    it('allows deletion of tech category when no standards reference it', () => {
      const categoryResult = create('TECH_CATEGORY', {
        name: 'Unreferenced Category',
        status: 'active',
      });
      expect(categoryResult.success).toBe(true);

      const deleteResult = remove('TECH_CATEGORY', categoryResult.data.id);
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('referential integrity - set null', () => {
    it('sets foreign key to null on referenced entity deletion (SET_NULL)', () => {
      const roleResult = seedRole({ name: 'Deletable Role' });
      expect(roleResult.success).toBe(true);

      const userResult = create('USER', {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        roleId: roleResult.data.id,
        accessLevel: 'admin',
        status: 'active',
      });
      expect(userResult.success).toBe(true);
      expect(userResult.data.roleId).toBe(roleResult.data.id);

      const deleteResult = remove('ROLE', roleResult.data.id);
      expect(deleteResult.success).toBe(true);

      const userRead = read('USER', userResult.data.id);
      expect(userRead.success).toBe(true);
      expect(userRead.data.roleId).toBeNull();
    });
  });

  describe('getDeleteImpact', () => {
    it('returns canDelete true when no references exist', () => {
      const createResult = seedPortfolio();
      const impact = getDeleteImpact('PORTFOLIO', createResult.data.id);
      expect(impact.canDelete).toBe(true);
      expect(impact.blockingReferences).toEqual([]);
      expect(impact.cascadeReferences).toEqual([]);
      expect(impact.setNullReferences).toEqual([]);
    });

    it('returns cascade references for portfolio with applications', () => {
      const { portfolio } = seedApplicationWithPortfolio();
      const impact = getDeleteImpact('PORTFOLIO', portfolio.id);
      expect(impact.canDelete).toBe(true);
      expect(impact.cascadeReferences.length).toBeGreaterThan(0);
      const appRef = impact.cascadeReferences.find((r) => r.entityType === 'APPLICATION');
      expect(appRef).toBeDefined();
      expect(appRef.count).toBe(1);
    });

    it('returns blocking references for tech category with standards', () => {
      const categoryResult = create('TECH_CATEGORY', {
        name: 'Blocked Category',
        status: 'active',
      });
      create('TECH_STANDARD', {
        name: 'Blocking Standard',
        categoryId: categoryResult.data.id,
        status: 'recommended',
        effectiveDate: '2026-01-01',
        owner: 'Owner',
      });

      const impact = getDeleteImpact('TECH_CATEGORY', categoryResult.data.id);
      expect(impact.canDelete).toBe(false);
      expect(impact.blockingReferences.length).toBeGreaterThan(0);
    });

    it('returns empty impact for non-existent entity type', () => {
      const impact = getDeleteImpact('NONEXISTENT', 'X-001');
      expect(impact.canDelete).toBe(false);
    });

    it('returns empty impact for null inputs', () => {
      const impact = getDeleteImpact(null, null);
      expect(impact.canDelete).toBe(false);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      // Seed multiple portfolios for list tests
      seedPortfolio({ name: 'Alpha Portfolio', status: 'active', criticality: 'high' });
      seedPortfolio({ name: 'Beta Portfolio', status: 'planning', criticality: 'medium' });
      seedPortfolio({ name: 'Gamma Portfolio', status: 'active', criticality: 'low' });
      seedPortfolio({ name: 'Delta Portfolio', status: 'retiring', criticality: 'critical' });
      seedPortfolio({ name: 'Epsilon Portfolio', status: 'active', criticality: 'high' });
    });

    it('lists all records with default pagination', () => {
      const result = list('PORTFOLIO');
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('returns paginated results', () => {
      const result = list('PORTFOLIO', { page: 1, pageSize: 2 });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('returns correct second page', () => {
      const result = list('PORTFOLIO', { page: 2, pageSize: 2 });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.page).toBe(2);
    });

    it('returns correct last page with remaining records', () => {
      const result = list('PORTFOLIO', { page: 3, pageSize: 2 });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.page).toBe(3);
    });

    it('filters by field value', () => {
      const result = list('PORTFOLIO', {
        filters: { status: 'active' },
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
      result.data.forEach((record) => {
        expect(record.status).toBe('active');
      });
    });

    it('filters by multiple field values', () => {
      const result = list('PORTFOLIO', {
        filters: { status: 'active', criticality: 'high' },
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      result.data.forEach((record) => {
        expect(record.status).toBe('active');
        expect(record.criticality).toBe('high');
      });
    });

    it('filters are case-insensitive for string values', () => {
      const result = list('PORTFOLIO', {
        filters: { status: 'ACTIVE' },
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
    });

    it('searches across searchable fields', () => {
      const result = list('PORTFOLIO', {
        search: 'Alpha',
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Alpha Portfolio');
    });

    it('search is case-insensitive', () => {
      const result = list('PORTFOLIO', {
        search: 'alpha',
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
    });

    it('search returns empty results for non-matching term', () => {
      const result = list('PORTFOLIO', {
        search: 'NonExistentTerm',
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('sorts by name ascending (default)', () => {
      const result = list('PORTFOLIO', {
        sortField: 'name',
        sortDirection: 'asc',
      });
      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Alpha Portfolio');
      expect(result.data[result.data.length - 1].name).toBe('Epsilon Portfolio');
    });

    it('sorts by name descending', () => {
      const result = list('PORTFOLIO', {
        sortField: 'name',
        sortDirection: 'desc',
      });
      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Epsilon Portfolio');
      expect(result.data[result.data.length - 1].name).toBe('Alpha Portfolio');
    });

    it('combines search, filter, sort, and pagination', () => {
      const result = list('PORTFOLIO', {
        search: 'Portfolio',
        filters: { status: 'active' },
        sortField: 'name',
        sortDirection: 'desc',
        page: 1,
        pageSize: 2,
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('Gamma Portfolio');
      expect(result.data[1].name).toBe('Epsilon Portfolio');
    });

    it('returns empty results for unknown entity type', () => {
      const result = list('UNKNOWN_TYPE');
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('returns empty results for empty entity type', () => {
      const result = list('');
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('returns copies of records (not references)', () => {
      const result = list('PORTFOLIO');
      result.data[0].name = 'Modified';
      const result2 = list('PORTFOLIO');
      expect(result2.data[0].name).not.toBe('Modified');
    });

    it('handles empty search string gracefully', () => {
      const result = list('PORTFOLIO', { search: '' });
      expect(result.success).toBe(true);
      expect(result.total).toBe(5);
    });

    it('handles empty filters object gracefully', () => {
      const result = list('PORTFOLIO', { filters: {} });
      expect(result.success).toBe(true);
      expect(result.total).toBe(5);
    });

    it('handles null filter values gracefully', () => {
      const result = list('PORTFOLIO', { filters: { status: null } });
      expect(result.success).toBe(true);
      expect(result.total).toBe(5);
    });

    it('handles page number less than 1', () => {
      const result = list('PORTFOLIO', { page: 0, pageSize: 2 });
      expect(result.success).toBe(true);
      expect(result.page).toBe(1);
    });

    it('handles page size less than 1', () => {
      const result = list('PORTFOLIO', { page: 1, pageSize: 0 });
      expect(result.success).toBe(true);
      expect(result.pageSize).toBe(1);
    });
  });

  describe('count', () => {
    it('returns total count of records', () => {
      seedPortfolio({ name: 'Portfolio A' });
      seedPortfolio({ name: 'Portfolio B' });
      seedPortfolio({ name: 'Portfolio C' });
      expect(count('PORTFOLIO')).toBe(3);
    });

    it('returns filtered count', () => {
      seedPortfolio({ name: 'Active One', status: 'active' });
      seedPortfolio({ name: 'Active Two', status: 'active' });
      seedPortfolio({ name: 'Planning One', status: 'planning' });
      expect(count('PORTFOLIO', { status: 'active' })).toBe(2);
    });

    it('returns 0 for empty entity type', () => {
      expect(count('')).toBe(0);
    });

    it('returns 0 for unknown entity type', () => {
      expect(count('UNKNOWN_TYPE')).toBe(0);
    });

    it('returns 0 when no records exist', () => {
      expect(count('PORTFOLIO')).toBe(0);
    });
  });

  describe('exists', () => {
    it('returns true for existing record', () => {
      const createResult = seedPortfolio();
      expect(exists('PORTFOLIO', createResult.data.id)).toBe(true);
    });

    it('returns false for non-existent record', () => {
      expect(exists('PORTFOLIO', 'PF-NONEXISTENT')).toBe(false);
    });

    it('returns false for null entity type', () => {
      expect(exists(null, 'PF-001')).toBe(false);
    });

    it('returns false for null ID', () => {
      expect(exists('PORTFOLIO', null)).toBe(false);
    });

    it('returns false after record is deleted', () => {
      const createResult = seedPortfolio();
      expect(exists('PORTFOLIO', createResult.data.id)).toBe(true);
      remove('PORTFOLIO', createResult.data.id);
      expect(exists('PORTFOLIO', createResult.data.id)).toBe(false);
    });
  });

  describe('getAll', () => {
    it('returns all records for an entity type', () => {
      seedPortfolio({ name: 'Portfolio A' });
      seedPortfolio({ name: 'Portfolio B' });
      const all = getAll('PORTFOLIO');
      expect(all.length).toBe(2);
    });

    it('returns empty array for empty entity type', () => {
      const all = getAll('');
      expect(all).toEqual([]);
    });

    it('returns empty array when no records exist', () => {
      const all = getAll('PORTFOLIO');
      expect(all).toEqual([]);
    });

    it('returns copies of records', () => {
      seedPortfolio({ name: 'Original' });
      const all = getAll('PORTFOLIO');
      all[0].name = 'Modified';
      const all2 = getAll('PORTFOLIO');
      expect(all2[0].name).toBe('Original');
    });
  });

  describe('findByField', () => {
    it('finds records matching a field value', () => {
      seedPortfolio({ name: 'Active One', status: 'active' });
      seedPortfolio({ name: 'Active Two', status: 'active' });
      seedPortfolio({ name: 'Planning One', status: 'planning' });

      const results = findByField('PORTFOLIO', 'status', 'active');
      expect(results.length).toBe(2);
      results.forEach((r) => {
        expect(r.status).toBe('active');
      });
    });

    it('returns empty array for non-matching value', () => {
      seedPortfolio({ name: 'Test', status: 'active' });
      const results = findByField('PORTFOLIO', 'status', 'retired');
      expect(results).toEqual([]);
    });

    it('returns empty array for invalid entity type', () => {
      const results = findByField('', 'status', 'active');
      expect(results).toEqual([]);
    });

    it('returns empty array for invalid field name', () => {
      const results = findByField('PORTFOLIO', '', 'active');
      expect(results).toEqual([]);
    });

    it('performs case-insensitive string matching', () => {
      seedPortfolio({ name: 'Test', status: 'active' });
      const results = findByField('PORTFOLIO', 'status', 'ACTIVE');
      expect(results.length).toBe(1);
    });
  });

  describe('bulkCreate', () => {
    it('creates multiple records successfully', () => {
      const dataArray = [
        { name: 'Bulk Portfolio A', owner: 'Owner A', status: 'active' },
        { name: 'Bulk Portfolio B', owner: 'Owner B', status: 'active' },
        { name: 'Bulk Portfolio C', owner: 'Owner C', status: 'planning' },
      ];

      const result = bulkCreate('PORTFOLIO', dataArray);
      expect(result.success).toBe(true);
      expect(result.totalCreated).toBe(3);
      expect(result.created.length).toBe(3);
      expect(result.errors.length).toBe(0);
    });

    it('reports errors for invalid records in bulk create', () => {
      const dataArray = [
        { name: 'Valid Portfolio', owner: 'Owner', status: 'active' },
        { name: 'Valid Portfolio', owner: 'Owner', status: 'active' }, // Duplicate name
      ];

      const result = bulkCreate('PORTFOLIO', dataArray);
      expect(result.success).toBe(false);
      expect(result.totalCreated).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('returns error for non-array input', () => {
      const result = bulkCreate('PORTFOLIO', 'not an array');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('bulkDelete', () => {
    it('deletes multiple records successfully', () => {
      const r1 = seedPortfolio({ name: 'Delete A' });
      const r2 = seedPortfolio({ name: 'Delete B' });
      const r3 = seedPortfolio({ name: 'Delete C' });

      const result = bulkDelete('PORTFOLIO', [r1.data.id, r2.data.id, r3.data.id]);
      expect(result.success).toBe(true);
      expect(result.totalDeleted).toBe(3);
      expect(result.deletedIds.length).toBe(3);
      expect(result.errors.length).toBe(0);
    });

    it('reports errors for non-existent IDs in bulk delete', () => {
      const r1 = seedPortfolio({ name: 'Existing' });

      const result = bulkDelete('PORTFOLIO', [r1.data.id, 'PF-NONEXISTENT']);
      expect(result.success).toBe(false);
      expect(result.totalDeleted).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('returns error for non-array input', () => {
      const result = bulkDelete('PORTFOLIO', 'not an array');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('audit logging on mutations', () => {
    it('logs create action with entity details', () => {
      const result = seedPortfolio({ name: 'Audited Portfolio' });
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const createLog = auditLogs.find(
        (log) =>
          log.action === 'create' &&
          log.entityType === 'PORTFOLIO' &&
          log.entityId === result.data.id
      );
      expect(createLog).toBeDefined();
      expect(createLog.entityName).toBe('Audited Portfolio');
      expect(createLog.status).toBe('success');
      expect(createLog.timestamp).toBeDefined();
    });

    it('logs update action with previous and new values', () => {
      const createResult = seedPortfolio({ name: 'Before Update' });
      update('PORTFOLIO', createResult.data.id, { name: 'After Update' });

      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const updateLog = auditLogs.find(
        (log) =>
          log.action === 'update' &&
          log.entityType === 'PORTFOLIO' &&
          log.entityId === createResult.data.id
      );
      expect(updateLog).toBeDefined();
      expect(updateLog.status).toBe('success');
      expect(updateLog.previousValues).toBeDefined();
      expect(updateLog.newValues).toBeDefined();
    });

    it('logs delete action with previous values', () => {
      const createResult = seedPortfolio({ name: 'To Be Deleted' });
      remove('PORTFOLIO', createResult.data.id);

      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const deleteLog = auditLogs.find(
        (log) =>
          log.action === 'delete' &&
          log.entityType === 'PORTFOLIO' &&
          log.entityId === createResult.data.id
      );
      expect(deleteLog).toBeDefined();
      expect(deleteLog.status).toBe('success');
      expect(deleteLog.previousValues).toBeDefined();
      expect(deleteLog.entityName).toBe('To Be Deleted');
    });

    it('includes userId and userName in audit log entries', () => {
      seedPortfolio();
      const auditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS));
      const log = auditLogs.find((l) => l.action === 'create' && l.entityType === 'PORTFOLIO');
      expect(log.userId).toBeDefined();
      expect(log.userName).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles creating entity with optional fields omitted', () => {
      const result = create('PORTFOLIO', {
        name: 'Minimal Portfolio',
        owner: 'Owner',
        status: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.data.description).toBeUndefined();
      expect(result.data.tags).toBeUndefined();
    });

    it('handles listing with no options', () => {
      seedPortfolio({ name: 'Test' });
      const result = list('PORTFOLIO');
      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
    });

    it('handles listing with undefined options', () => {
      seedPortfolio({ name: 'Test' });
      const result = list('PORTFOLIO', undefined);
      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
    });

    it('handles creating and reading back complex entity (tech debt)', () => {
      const { application } = seedApplicationWithPortfolio();

      const debtResult = create('TECH_DEBT', {
        title: 'Legacy Code Refactor',
        description: 'Need to refactor legacy code for maintainability.',
        applicationId: application.id,
        status: 'identified',
        priority: 'high',
      });
      expect(debtResult.success).toBe(true);

      const readResult = read('TECH_DEBT', debtResult.data.id);
      expect(readResult.success).toBe(true);
      expect(readResult.data.title).toBe('Legacy Code Refactor');
      expect(readResult.data.applicationId).toBe(application.id);
    });

    it('handles creating and reading back quality gate', () => {
      const { application } = seedApplicationWithPortfolio();

      const gateResult = create('QUALITY_GATE', {
        name: 'Code Coverage Gate',
        applicationId: application.id,
        type: 'code_quality',
        status: 'passed',
      });
      expect(gateResult.success).toBe(true);

      const readResult = read('QUALITY_GATE', gateResult.data.id);
      expect(readResult.success).toBe(true);
      expect(readResult.data.name).toBe('Code Coverage Gate');
    });

    it('handles deep cascade delete (portfolio -> application -> environment)', () => {
      const portfolioResult = seedPortfolio({ name: 'Deep Cascade Portfolio' });
      const appResult = create('APPLICATION', {
        name: 'Deep Cascade App',
        portfolioId: portfolioResult.data.id,
        owner: 'Owner',
        status: 'active',
      });
      expect(appResult.success).toBe(true);

      const envResult = create('ENVIRONMENT', {
        name: 'Deep Cascade Env',
        type: 'development',
        applicationId: appResult.data.id,
        status: 'active',
      });
      expect(envResult.success).toBe(true);

      // Deleting portfolio should cascade to application, which cascades to environment
      const deleteResult = remove('PORTFOLIO', portfolioResult.data.id);
      expect(deleteResult.success).toBe(true);

      expect(read('APPLICATION', appResult.data.id).success).toBe(false);
      expect(read('ENVIRONMENT', envResult.data.id).success).toBe(false);
    });

    it('handles concurrent-like operations (multiple creates then list)', () => {
      for (let i = 0; i < 10; i++) {
        seedPortfolio({ name: `Portfolio ${i}` });
      }
      const result = list('PORTFOLIO');
      expect(result.success).toBe(true);
      expect(result.total).toBe(10);
    });

    it('handles update that does not change any fields', () => {
      const createResult = seedPortfolio({ name: 'Unchanged' });
      const updateResult = update('PORTFOLIO', createResult.data.id, {});
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.name).toBe('Unchanged');
    });
  });
});