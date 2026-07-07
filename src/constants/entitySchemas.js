import { ID_PREFIXES, ENTITY_NAMES } from './constants';

/**
 * Field type constants used in schema definitions.
 * @enum {string}
 */
export const FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  EMAIL: 'email',
  URL: 'url',
  ENUM: 'enum',
  ARRAY: 'array',
  OBJECT: 'object',
  ID: 'id',
  FOREIGN_KEY: 'foreign_key',
  TEXT: 'text',
  INTEGER: 'integer',
  FLOAT: 'float',
  JSON: 'json',
};

/**
 * Referential integrity action constants.
 * @enum {string}
 */
export const REF_ACTIONS = {
  CASCADE: 'cascade',
  BLOCK: 'block',
  SET_NULL: 'set_null',
  NO_ACTION: 'no_action',
};

/**
 * Lifecycle status values shared across multiple entities.
 * @type {string[]}
 */
export const LIFECYCLE_STATUSES = [
  'planning',
  'active',
  'retiring',
  'retired',
  'archived',
];

/**
 * Standard status values for governance-related entities.
 * @type {string[]}
 */
export const GOVERNANCE_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'expired',
  'revoked',
];

/**
 * Priority levels used across entities.
 * @type {string[]}
 */
export const PRIORITY_LEVELS = [
  'critical',
  'high',
  'medium',
  'low',
];

/**
 * Risk levels used across entities.
 * @type {string[]}
 */
export const RISK_LEVELS = [
  'critical',
  'high',
  'medium',
  'low',
  'none',
];

/**
 * Approval statuses used across entities.
 * @type {string[]}
 */
export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'withdrawn',
];

/**
 * Helper to create a field definition.
 * @param {string} type - One of FIELD_TYPES values.
 * @param {Object} [options] - Additional field options.
 * @param {boolean} [options.required] - Whether the field is required.
 * @param {*} [options.defaultValue] - Default value for the field.
 * @param {number} [options.minLength] - Minimum string length.
 * @param {number} [options.maxLength] - Maximum string length.
 * @param {number} [options.min] - Minimum numeric value.
 * @param {number} [options.max] - Maximum numeric value.
 * @param {string[]} [options.enumValues] - Allowed values for enum fields.
 * @param {string} [options.pattern] - Regex pattern for validation.
 * @param {string} [options.foreignKey] - Entity type key for foreign key references.
 * @param {string} [options.onDelete] - Referential integrity action on delete.
 * @param {string} [options.description] - Field description.
 * @param {boolean} [options.unique] - Whether the field must be unique.
 * @param {boolean} [options.indexed] - Whether the field is indexed for lookups.
 * @param {string} [options.arrayItemType] - Type of items in an array field.
 * @returns {Object} Field definition object.
 */
const field = (type, options = {}) => ({
  type,
  required: options.required || false,
  defaultValue: options.defaultValue !== undefined ? options.defaultValue : null,
  minLength: options.minLength || null,
  maxLength: options.maxLength || null,
  min: options.min !== undefined ? options.min : null,
  max: options.max !== undefined ? options.max : null,
  enumValues: options.enumValues || null,
  pattern: options.pattern || null,
  foreignKey: options.foreignKey || null,
  onDelete: options.onDelete || null,
  description: options.description || null,
  unique: options.unique || false,
  indexed: options.indexed || false,
  arrayItemType: options.arrayItemType || null,
});

/**
 * Common fields shared by all entities.
 * @type {Object}
 */
const COMMON_FIELDS = {
  id: field(FIELD_TYPES.ID, {
    required: true,
    unique: true,
    indexed: true,
    description: 'Unique identifier',
  }),
  createdAt: field(FIELD_TYPES.DATETIME, {
    required: true,
    description: 'Creation timestamp',
  }),
  updatedAt: field(FIELD_TYPES.DATETIME, {
    required: true,
    description: 'Last update timestamp',
  }),
  createdBy: field(FIELD_TYPES.STRING, {
    required: false,
    description: 'User who created the record',
  }),
  updatedBy: field(FIELD_TYPES.STRING, {
    required: false,
    description: 'User who last updated the record',
  }),
  version: field(FIELD_TYPES.INTEGER, {
    required: false,
    defaultValue: 1,
    min: 1,
    description: 'Record version for optimistic locking',
  }),
};

/**
 * @typedef {Object} EntitySchema
 * @property {string} entityType - Entity type key matching ENTITY_NAMES.
 * @property {string} idPrefix - ID prefix from ID_PREFIXES.
 * @property {string} displayName - Human-readable entity name.
 * @property {string} pluralName - Plural form of the entity name.
 * @property {Object} fields - Field definitions keyed by field name.
 * @property {string[]} requiredFields - Array of required field names.
 * @property {string[]} searchableFields - Fields that can be searched/filtered.
 * @property {string} defaultSortField - Default field for sorting.
 * @property {string} defaultSortDirection - Default sort direction ('asc' or 'desc').
 * @property {Array<{field: string, targetEntity: string, targetField: string, onDelete: string}>} foreignKeys - Foreign key constraints.
 */

/**
 * Complete schema definitions for all core entities.
 * @type {Object<string, EntitySchema>}
 */
export const ENTITY_SCHEMAS = {
  PORTFOLIO: {
    entityType: 'PORTFOLIO',
    idPrefix: ID_PREFIXES.PORTFOLIO,
    displayName: ENTITY_NAMES.PORTFOLIO,
    pluralName: 'Portfolios',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Portfolio name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Portfolio description',
      }),
      owner: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Portfolio owner name',
      }),
      ownerId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Reference to the owning user',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: LIFECYCLE_STATUSES,
        defaultValue: 'active',
        indexed: true,
        description: 'Portfolio lifecycle status',
      }),
      businessUnit: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Associated business unit',
      }),
      criticality: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        description: 'Business criticality level',
      }),
      applicationCount: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Number of applications in portfolio',
      }),
      complianceScore: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Overall compliance score (0-100)',
      }),
      riskLevel: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        defaultValue: 'medium',
        description: 'Overall risk level',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
      metadata: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Additional metadata',
      }),
    },
    requiredFields: ['id', 'name', 'owner', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'owner', 'businessUnit', 'status'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'ownerId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  APPLICATION: {
    entityType: 'APPLICATION',
    idPrefix: ID_PREFIXES.APPLICATION,
    displayName: ENTITY_NAMES.APPLICATION,
    pluralName: 'Applications',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Application name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Application description',
      }),
      portfolioId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'PORTFOLIO',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Parent portfolio reference',
      }),
      owner: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Application owner name',
      }),
      ownerId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Reference to the owning user',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: LIFECYCLE_STATUSES,
        defaultValue: 'active',
        indexed: true,
        description: 'Application lifecycle status',
      }),
      criticality: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        description: 'Business criticality level',
      }),
      technologyStack: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Technology stack components',
      }),
      complianceScore: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Compliance score (0-100)',
      }),
      riskLevel: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        defaultValue: 'medium',
        description: 'Risk level',
      }),
      deploymentModel: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['on_premise', 'cloud', 'hybrid', 'saas'],
        defaultValue: 'cloud',
        description: 'Deployment model',
      }),
      businessDomain: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Business domain',
      }),
      teamSize: field(FIELD_TYPES.INTEGER, {
        required: false,
        min: 0,
        description: 'Team size',
      }),
      lastAssessmentDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Date of last assessment',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
      metadata: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Additional metadata',
      }),
    },
    requiredFields: ['id', 'name', 'portfolioId', 'owner', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'owner', 'businessDomain', 'status', 'portfolioId'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'portfolioId',
        targetEntity: 'PORTFOLIO',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'ownerId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  RELATIONSHIP: {
    entityType: 'RELATIONSHIP',
    idPrefix: ID_PREFIXES.RELATIONSHIP,
    displayName: ENTITY_NAMES.RELATIONSHIP,
    pluralName: 'Relationships',
    fields: {
      ...COMMON_FIELDS,
      sourceApplicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Source application reference',
      }),
      targetApplicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Target application reference',
      }),
      relationshipType: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['depends_on', 'integrates_with', 'replaces', 'extends', 'consumes', 'provides'],
        description: 'Type of relationship',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Relationship description',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'deprecated'],
        defaultValue: 'active',
        indexed: true,
        description: 'Relationship status',
      }),
      dataFlow: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['unidirectional', 'bidirectional', 'none'],
        defaultValue: 'unidirectional',
        description: 'Data flow direction',
      }),
      criticality: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        description: 'Relationship criticality',
      }),
    },
    requiredFields: ['id', 'sourceApplicationId', 'targetApplicationId', 'relationshipType', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['relationshipType', 'status', 'sourceApplicationId', 'targetApplicationId'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'sourceApplicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'targetApplicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
    ],
  },

  TECH_CATEGORY: {
    entityType: 'TECH_CATEGORY',
    idPrefix: ID_PREFIXES.TECH_CATEGORY,
    displayName: ENTITY_NAMES.TECH_CATEGORY,
    pluralName: 'Technology Categories',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Category name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Category description',
      }),
      parentCategoryId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'TECH_CATEGORY',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Parent category for hierarchy',
      }),
      order: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Display order',
      }),
      icon: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Icon identifier',
      }),
      color: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 20,
        pattern: '^#[0-9a-fA-F]{6}$',
        description: 'Display color (hex)',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'archived'],
        defaultValue: 'active',
        indexed: true,
        description: 'Category status',
      }),
    },
    requiredFields: ['id', 'name', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'status'],
    defaultSortField: 'order',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'parentCategoryId',
        targetEntity: 'TECH_CATEGORY',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  TECH_STANDARD: {
    entityType: 'TECH_STANDARD',
    idPrefix: ID_PREFIXES.TECH_STANDARD,
    displayName: ENTITY_NAMES.TECH_STANDARD,
    pluralName: 'Technology Standards',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        unique: true,
        indexed: true,
        description: 'Standard name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Standard description',
      }),
      categoryId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'TECH_CATEGORY',
        onDelete: REF_ACTIONS.BLOCK,
        indexed: true,
        description: 'Technology category reference',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['emerging', 'recommended', 'preferred', 'acceptable', 'retiring', 'retired', 'prohibited'],
        defaultValue: 'recommended',
        indexed: true,
        description: 'Standard lifecycle status',
      }),
      effectiveDate: field(FIELD_TYPES.DATE, {
        required: true,
        description: 'Date the standard becomes effective',
      }),
      expirationDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Date the standard expires',
      }),
      owner: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Standard owner',
      }),
      ownerId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Reference to the owning user',
      }),
      version: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 50,
        description: 'Standard version string',
      }),
      complianceLevel: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['mandatory', 'recommended', 'optional', 'informational'],
        defaultValue: 'recommended',
        description: 'Compliance requirement level',
      }),
      riskLevel: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        defaultValue: 'low',
        description: 'Risk level if non-compliant',
      }),
      adoptionPercentage: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Adoption percentage across applications',
      }),
      documentUrl: field(FIELD_TYPES.URL, {
        required: false,
        description: 'Link to standard documentation',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
      metadata: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Additional metadata',
      }),
    },
    requiredFields: ['id', 'name', 'categoryId', 'status', 'effectiveDate', 'owner', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'owner', 'status', 'categoryId', 'complianceLevel'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'categoryId',
        targetEntity: 'TECH_CATEGORY',
        targetField: 'id',
        onDelete: REF_ACTIONS.BLOCK,
      },
      {
        field: 'ownerId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  TECH_ENTRY: {
    entityType: 'TECH_ENTRY',
    idPrefix: ID_PREFIXES.TECH_ENTRY,
    displayName: ENTITY_NAMES.TECH_ENTRY,
    pluralName: 'Technology Entries',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 300,
        indexed: true,
        description: 'Technology entry name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Technology entry description',
      }),
      standardId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'TECH_STANDARD',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Parent technology standard reference',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Application using this technology',
      }),
      currentVersion: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Current version in use',
      }),
      targetVersion: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Target version for migration',
      }),
      complianceStatus: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['compliant', 'non_compliant', 'partially_compliant', 'waived', 'not_assessed'],
        defaultValue: 'not_assessed',
        indexed: true,
        description: 'Compliance status',
      }),
      migrationDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Planned migration date',
      }),
      notes: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Additional notes',
      }),
    },
    requiredFields: ['id', 'name', 'standardId', 'applicationId', 'complianceStatus', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'complianceStatus', 'standardId', 'applicationId'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'standardId',
        targetEntity: 'TECH_STANDARD',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
    ],
  },

  DEFINITION: {
    entityType: 'DEFINITION',
    idPrefix: ID_PREFIXES.DEFINITION,
    displayName: ENTITY_NAMES.DEFINITION,
    pluralName: 'Definitions',
    fields: {
      ...COMMON_FIELDS,
      term: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Term being defined',
      }),
      definition: field(FIELD_TYPES.TEXT, {
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: 'Definition text',
      }),
      category: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        indexed: true,
        description: 'Definition category',
      }),
      source: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 500,
        description: 'Source of the definition',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'draft', 'deprecated'],
        defaultValue: 'active',
        indexed: true,
        description: 'Definition status',
      }),
      aliases: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Alternative terms or aliases',
      }),
    },
    requiredFields: ['id', 'term', 'definition', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['term', 'definition', 'category', 'status'],
    defaultSortField: 'term',
    defaultSortDirection: 'asc',
    foreignKeys: [],
  },

  ENVIRONMENT: {
    entityType: 'ENVIRONMENT',
    idPrefix: ID_PREFIXES.ENVIRONMENT,
    displayName: ENTITY_NAMES.ENVIRONMENT,
    pluralName: 'Environments',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Environment name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Environment description',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['development', 'testing', 'staging', 'uat', 'pre_production', 'production', 'dr'],
        indexed: true,
        description: 'Environment type',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated application',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'provisioning', 'decommissioning', 'maintenance'],
        defaultValue: 'active',
        indexed: true,
        description: 'Environment status',
      }),
      url: field(FIELD_TYPES.URL, {
        required: false,
        description: 'Environment URL',
      }),
      region: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Deployment region',
      }),
      provider: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Infrastructure provider',
      }),
      healthStatus: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['healthy', 'degraded', 'down', 'unknown'],
        defaultValue: 'unknown',
        description: 'Current health status',
      }),
      lastDeploymentDate: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last deployment timestamp',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'name', 'type', 'applicationId', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'type', 'status', 'applicationId', 'region'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
    ],
  },

  TECH_DEBT: {
    entityType: 'TECH_DEBT',
    idPrefix: ID_PREFIXES.TECH_DEBT,
    displayName: ENTITY_NAMES.TECH_DEBT,
    pluralName: 'Technical Debts',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Tech debt title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Detailed description',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Affected application',
      }),
      standardId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'TECH_STANDARD',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related technology standard',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['identified', 'assessed', 'planned', 'in_progress', 'resolved', 'accepted', 'deferred'],
        defaultValue: 'identified',
        indexed: true,
        description: 'Tech debt status',
      }),
      priority: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        indexed: true,
        description: 'Priority level',
      }),
      severity: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        defaultValue: 'medium',
        description: 'Severity level',
      }),
      category: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['architecture', 'code_quality', 'dependency', 'infrastructure', 'security', 'performance', 'testing', 'documentation', 'process'],
        description: 'Tech debt category',
      }),
      estimatedEffort: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Estimated effort to resolve',
      }),
      estimatedCost: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        description: 'Estimated cost to resolve',
      }),
      assignee: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Assigned person or team',
      }),
      assigneeId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Reference to assigned user',
      }),
      dueDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Target resolution date',
      }),
      resolvedDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Actual resolution date',
      }),
      impactScore: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Impact score (0-100)',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'title', 'description', 'applicationId', 'status', 'priority', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'status', 'priority', 'applicationId', 'category', 'assignee'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'standardId',
        targetEntity: 'TECH_STANDARD',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'assigneeId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  QUALITY_GATE: {
    entityType: 'QUALITY_GATE',
    idPrefix: ID_PREFIXES.QUALITY_GATE,
    displayName: ENTITY_NAMES.QUALITY_GATE,
    pluralName: 'Quality Gates',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Quality gate name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Quality gate description',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated application',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['code_quality', 'security', 'performance', 'accessibility', 'compliance', 'testing', 'deployment'],
        indexed: true,
        description: 'Quality gate type',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['passed', 'failed', 'warning', 'not_evaluated', 'in_progress'],
        defaultValue: 'not_evaluated',
        indexed: true,
        description: 'Quality gate result status',
      }),
      score: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Quality gate score (0-100)',
      }),
      threshold: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Passing threshold (0-100)',
      }),
      evaluatedAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last evaluation timestamp',
      }),
      evaluatedBy: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Evaluator name or system',
      }),
      criteria: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Evaluation criteria details',
      }),
      results: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Evaluation results details',
      }),
      isBlocking: field(FIELD_TYPES.BOOLEAN, {
        required: false,
        defaultValue: true,
        description: 'Whether this gate blocks deployment',
      }),
    },
    requiredFields: ['id', 'name', 'applicationId', 'type', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'type', 'status', 'applicationId'],
    defaultSortField: 'evaluatedAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
    ],
  },

  GOVERNANCE_RECORD: {
    entityType: 'GOVERNANCE_RECORD',
    idPrefix: ID_PREFIXES.GOVERNANCE_RECORD,
    displayName: ENTITY_NAMES.GOVERNANCE_RECORD,
    pluralName: 'Governance Records',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Governance record title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Detailed description',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['policy', 'standard', 'guideline', 'procedure', 'exception', 'decision', 'review'],
        indexed: true,
        description: 'Governance record type',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: GOVERNANCE_STATUSES,
        defaultValue: 'draft',
        indexed: true,
        description: 'Record status',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related application',
      }),
      portfolioId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'PORTFOLIO',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related portfolio',
      }),
      owner: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Record owner',
      }),
      ownerId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Reference to the owning user',
      }),
      effectiveDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Effective date',
      }),
      reviewDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Next review date',
      }),
      complianceImpact: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        defaultValue: 'medium',
        description: 'Compliance impact level',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'title', 'description', 'type', 'status', 'owner', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'type', 'status', 'owner'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'portfolioId',
        targetEntity: 'PORTFOLIO',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'ownerId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  APPROVAL_REQUEST: {
    entityType: 'APPROVAL_REQUEST',
    idPrefix: ID_PREFIXES.APPROVAL_REQUEST,
    displayName: ENTITY_NAMES.APPROVAL_REQUEST,
    pluralName: 'Approval Requests',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Request title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Request description',
      }),
      requestType: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['new_technology', 'exception', 'waiver', 'change', 'decommission', 'upgrade'],
        indexed: true,
        description: 'Type of approval request',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: APPROVAL_STATUSES,
        defaultValue: 'pending',
        indexed: true,
        description: 'Approval status',
      }),
      requesterId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.BLOCK,
        indexed: true,
        description: 'User who submitted the request',
      }),
      requesterName: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Requester display name',
      }),
      approverId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'User who approved/rejected',
      }),
      approverName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Approver display name',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related application',
      }),
      standardId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'TECH_STANDARD',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related technology standard',
      }),
      priority: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        indexed: true,
        description: 'Request priority',
      }),
      submittedAt: field(FIELD_TYPES.DATETIME, {
        required: true,
        description: 'Submission timestamp',
      }),
      decidedAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Decision timestamp',
      }),
      decisionNotes: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Notes from the approver',
      }),
      justification: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Business justification',
      }),
      riskAssessment: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: RISK_LEVELS,
        description: 'Risk assessment level',
      }),
    },
    requiredFields: ['id', 'title', 'description', 'requestType', 'status', 'requesterId', 'requesterName', 'priority', 'submittedAt', 'justification', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'requestType', 'status', 'requesterName', 'priority'],
    defaultSortField: 'submittedAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'requesterId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.BLOCK,
      },
      {
        field: 'approverId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'standardId',
        targetEntity: 'TECH_STANDARD',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  WAIVER: {
    entityType: 'WAIVER',
    idPrefix: ID_PREFIXES.WAIVER,
    displayName: ENTITY_NAMES.WAIVER,
    pluralName: 'Waivers',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Waiver title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Waiver description',
      }),
      standardId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'TECH_STANDARD',
        onDelete: REF_ACTIONS.BLOCK,
        indexed: true,
        description: 'Standard being waived',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Application requesting waiver',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: GOVERNANCE_STATUSES,
        defaultValue: 'draft',
        indexed: true,
        description: 'Waiver status',
      }),
      requesterId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.BLOCK,
        indexed: true,
        description: 'User who requested the waiver',
      }),
      requesterName: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'Requester display name',
      }),
      approverId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'User who approved the waiver',
      }),
      approverName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Approver display name',
      }),
      justification: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Business justification for waiver',
      }),
      riskLevel: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: RISK_LEVELS,
        defaultValue: 'medium',
        description: 'Risk level of the waiver',
      }),
      mitigationPlan: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 5000,
        description: 'Risk mitigation plan',
      }),
      effectiveDate: field(FIELD_TYPES.DATE, {
        required: true,
        description: 'Waiver effective date',
      }),
      expirationDate: field(FIELD_TYPES.DATE, {
        required: true,
        description: 'Waiver expiration date',
      }),
      conditions: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Conditions attached to the waiver',
      }),
    },
    requiredFields: ['id', 'title', 'description', 'standardId', 'applicationId', 'status', 'requesterId', 'requesterName', 'justification', 'riskLevel', 'effectiveDate', 'expirationDate', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'status', 'requesterName', 'riskLevel'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'standardId',
        targetEntity: 'TECH_STANDARD',
        targetField: 'id',
        onDelete: REF_ACTIONS.BLOCK,
      },
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'requesterId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.BLOCK,
      },
      {
        field: 'approverId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  EVIDENCE: {
    entityType: 'EVIDENCE',
    idPrefix: ID_PREFIXES.EVIDENCE,
    displayName: ENTITY_NAMES.EVIDENCE,
    pluralName: 'Evidence',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Evidence title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Evidence description',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['test_result', 'scan_report', 'audit_report', 'screenshot', 'document', 'log', 'metric', 'certification', 'other'],
        indexed: true,
        description: 'Evidence type',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated application',
      }),
      qualityGateId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'QUALITY_GATE',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related quality gate',
      }),
      standardId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'TECH_STANDARD',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Related technology standard',
      }),
      source: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Evidence source system',
      }),
      collectedAt: field(FIELD_TYPES.DATETIME, {
        required: true,
        description: 'When the evidence was collected',
      }),
      collectedBy: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Who collected the evidence',
      }),
      fileUrl: field(FIELD_TYPES.URL, {
        required: false,
        description: 'URL to evidence file',
      }),
      fileSize: field(FIELD_TYPES.INTEGER, {
        required: false,
        min: 0,
        description: 'File size in bytes',
      }),
      mimeType: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'MIME type of the evidence file',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['valid', 'invalid', 'expired', 'pending_review'],
        defaultValue: 'pending_review',
        indexed: true,
        description: 'Evidence validity status',
      }),
      data: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Structured evidence data',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'title', 'type', 'applicationId', 'collectedAt', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'type', 'status', 'applicationId', 'source'],
    defaultSortField: 'collectedAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'qualityGateId',
        targetEntity: 'QUALITY_GATE',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'standardId',
        targetEntity: 'TECH_STANDARD',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  USER: {
    entityType: 'USER',
    idPrefix: ID_PREFIXES.USER,
    displayName: ENTITY_NAMES.USER,
    pluralName: 'Users',
    fields: {
      ...COMMON_FIELDS,
      username: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 3,
        maxLength: 100,
        unique: true,
        indexed: true,
        description: 'Username',
      }),
      email: field(FIELD_TYPES.EMAIL, {
        required: true,
        unique: true,
        indexed: true,
        description: 'Email address',
      }),
      firstName: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 100,
        description: 'First name',
      }),
      lastName: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 100,
        description: 'Last name',
      }),
      displayName: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 200,
        indexed: true,
        description: 'Display name',
      }),
      roleId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'ROLE',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Assigned role',
      }),
      personaId: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        indexed: true,
        description: 'Associated persona identifier',
      }),
      accessLevel: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor', 'read_only', 'external'],
        defaultValue: 'read_only',
        indexed: true,
        description: 'Access level',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'locked', 'pending'],
        defaultValue: 'active',
        indexed: true,
        description: 'User account status',
      }),
      department: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Department',
      }),
      title: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Job title',
      }),
      lastLoginAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last login timestamp',
      }),
      avatarUrl: field(FIELD_TYPES.URL, {
        required: false,
        description: 'Avatar image URL',
      }),
      preferences: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'User preferences',
      }),
    },
    requiredFields: ['id', 'username', 'email', 'firstName', 'lastName', 'displayName', 'accessLevel', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['username', 'email', 'displayName', 'firstName', 'lastName', 'accessLevel', 'status', 'department'],
    defaultSortField: 'displayName',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'roleId',
        targetEntity: 'ROLE',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  ROLE: {
    entityType: 'ROLE',
    idPrefix: ID_PREFIXES.ROLE,
    displayName: ENTITY_NAMES.ROLE,
    pluralName: 'Roles',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Role name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Role description',
      }),
      accessLevel: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['admin', 'executive', 'strategic', 'management', 'operational', 'contributor', 'read_only', 'external'],
        indexed: true,
        description: 'Access level granted by this role',
      }),
      permissions: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Custom permission overrides',
      }),
      isSystem: field(FIELD_TYPES.BOOLEAN, {
        required: false,
        defaultValue: false,
        description: 'Whether this is a system-defined role',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive'],
        defaultValue: 'active',
        indexed: true,
        description: 'Role status',
      }),
      userCount: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Number of users assigned this role',
      }),
    },
    requiredFields: ['id', 'name', 'accessLevel', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'accessLevel', 'status'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [],
  },

  INTEGRATION: {
    entityType: 'INTEGRATION',
    idPrefix: ID_PREFIXES.INTEGRATION,
    displayName: ENTITY_NAMES.INTEGRATION,
    pluralName: 'Integrations',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Integration name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Integration description',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['rest_api', 'graphql', 'webhook', 'ldap', 'saml', 'oauth2', 'oidc', 'jira', 'servicenow', 'confluence', 'github', 'gitlab', 'azure_devops', 'jenkins', 'sonarqube', 'snyk', 'splunk', 'datadog', 'elastic', 'slack', 'teams', 'email'],
        indexed: true,
        description: 'Integration type',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'error', 'configuring', 'deprecated'],
        defaultValue: 'configuring',
        indexed: true,
        description: 'Integration status',
      }),
      direction: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['inbound', 'outbound', 'bidirectional'],
        defaultValue: 'bidirectional',
        description: 'Data flow direction',
      }),
      endpoint: field(FIELD_TYPES.URL, {
        required: false,
        description: 'Integration endpoint URL',
      }),
      authType: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['none', 'api_key', 'basic', 'bearer', 'oauth2', 'certificate'],
        defaultValue: 'none',
        description: 'Authentication type',
      }),
      lastSyncAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last synchronization timestamp',
      }),
      syncFrequency: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Sync frequency (e.g., "every 15 minutes")',
      }),
      errorMessage: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Last error message',
      }),
      config: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Integration configuration',
      }),
      healthScore: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Integration health score (0-100)',
      }),
    },
    requiredFields: ['id', 'name', 'type', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'type', 'status'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [],
  },

  NOTIFICATION: {
    entityType: 'NOTIFICATION',
    idPrefix: ID_PREFIXES.NOTIFICATION,
    displayName: ENTITY_NAMES.NOTIFICATION,
    pluralName: 'Notifications',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 1,
        maxLength: 300,
        indexed: true,
        description: 'Notification title',
      }),
      message: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 2000,
        description: 'Notification message',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['info', 'warning', 'error', 'success', 'action_required'],
        defaultValue: 'info',
        indexed: true,
        description: 'Notification type',
      }),
      trigger: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        indexed: true,
        description: 'Trigger event identifier',
      }),
      recipientId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Recipient user',
      }),
      isRead: field(FIELD_TYPES.BOOLEAN, {
        required: false,
        defaultValue: false,
        indexed: true,
        description: 'Whether the notification has been read',
      }),
      readAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'When the notification was read',
      }),
      actionUrl: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 500,
        description: 'URL for the notification action',
      }),
      relatedEntityType: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        description: 'Related entity type',
      }),
      relatedEntityId: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        indexed: true,
        description: 'Related entity ID',
      }),
      priority: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'low',
        description: 'Notification priority',
      }),
      expiresAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Notification expiration timestamp',
      }),
    },
    requiredFields: ['id', 'title', 'message', 'type', 'recipientId', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'message', 'type', 'trigger', 'recipientId'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'recipientId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
    ],
  },

  AI_ANALYSIS: {
    entityType: 'AI_ANALYSIS',
    idPrefix: ID_PREFIXES.AI_ANALYSIS,
    displayName: ENTITY_NAMES.AI_ANALYSIS,
    pluralName: 'AI Analyses',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Analysis title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Analysis description',
      }),
      featureType: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['tech_radar_analysis', 'lifecycle_prediction', 'risk_assessment', 'dependency_analysis', 'migration_planning', 'cost_optimization', 'compliance_check', 'anomaly_detection', 'trend_forecasting', 'portfolio_optimization', 'standard_recommendation', 'debt_prioritization', 'impact_analysis'],
        indexed: true,
        description: 'AI feature type',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['pending', 'running', 'completed', 'failed', 'cancelled'],
        defaultValue: 'pending',
        indexed: true,
        description: 'Analysis status',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related application',
      }),
      portfolioId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'PORTFOLIO',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related portfolio',
      }),
      requestedById: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'User who requested the analysis',
      }),
      startedAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Analysis start timestamp',
      }),
      completedAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Analysis completion timestamp',
      }),
      inputData: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Input data for the analysis',
      }),
      results: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Analysis results',
      }),
      recommendations: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.OBJECT,
        description: 'Generated recommendations',
      }),
      confidenceScore: field(FIELD_TYPES.FLOAT, {
        required: false,
        min: 0,
        max: 100,
        description: 'Confidence score (0-100)',
      }),
      errorMessage: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Error message if failed',
      }),
    },
    requiredFields: ['id', 'title', 'featureType', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'featureType', 'status'],
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'portfolioId',
        targetEntity: 'PORTFOLIO',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'requestedById',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  PDE_CONFIG: {
    entityType: 'PDE_CONFIG',
    idPrefix: ID_PREFIXES.PDE_CONFIG,
    displayName: ENTITY_NAMES.PDE_CONFIG,
    pluralName: 'PDE Configurations',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Configuration name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Configuration description',
      }),
      category: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        indexed: true,
        description: 'Configuration category',
      }),
      config: field(FIELD_TYPES.JSON, {
        required: true,
        defaultValue: {},
        description: 'Configuration data',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'draft'],
        defaultValue: 'draft',
        indexed: true,
        description: 'Configuration status',
      }),
      isDefault: field(FIELD_TYPES.BOOLEAN, {
        required: false,
        defaultValue: false,
        description: 'Whether this is the default configuration',
      }),
    },
    requiredFields: ['id', 'name', 'config', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'category', 'status'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [],
  },

  DEMO_SCENARIO: {
    entityType: 'DEMO_SCENARIO',
    idPrefix: ID_PREFIXES.DEMO_SCENARIO,
    displayName: ENTITY_NAMES.DEMO_SCENARIO,
    pluralName: 'Demo Scenarios',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        unique: true,
        indexed: true,
        description: 'Scenario name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Scenario description',
      }),
      personaId: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        indexed: true,
        description: 'Target persona for the scenario',
      }),
      steps: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.OBJECT,
        description: 'Scenario steps',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'inactive', 'draft'],
        defaultValue: 'draft',
        indexed: true,
        description: 'Scenario status',
      }),
      category: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Scenario category',
      }),
      estimatedDuration: field(FIELD_TYPES.INTEGER, {
        required: false,
        min: 0,
        description: 'Estimated duration in minutes',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'name', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'status', 'category', 'personaId'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [],
  },

  SCHEDULE: {
    entityType: 'SCHEDULE',
    idPrefix: ID_PREFIXES.SCHEDULE,
    displayName: ENTITY_NAMES.SCHEDULE,
    pluralName: 'Schedules',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 200,
        indexed: true,
        description: 'Schedule name',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 1000,
        description: 'Schedule description',
      }),
      type: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['review', 'assessment', 'sync', 'report', 'maintenance', 'audit'],
        indexed: true,
        description: 'Schedule type',
      }),
      frequency: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'],
        description: 'Schedule frequency',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['active', 'paused', 'completed', 'cancelled'],
        defaultValue: 'active',
        indexed: true,
        description: 'Schedule status',
      }),
      startDate: field(FIELD_TYPES.DATE, {
        required: true,
        description: 'Schedule start date',
      }),
      endDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Schedule end date',
      }),
      nextRunDate: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Next scheduled run',
      }),
      lastRunDate: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last run timestamp',
      }),
      assigneeId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Assigned user',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.SET_NULL,
        indexed: true,
        description: 'Related application',
      }),
      config: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: {},
        description: 'Schedule configuration',
      }),
    },
    requiredFields: ['id', 'name', 'type', 'frequency', 'status', 'startDate', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'description', 'type', 'frequency', 'status'],
    defaultSortField: 'nextRunDate',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'assigneeId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  AUDIT_LOG: {
    entityType: 'AUDIT_LOG',
    idPrefix: ID_PREFIXES.AUDIT_LOG,
    displayName: ENTITY_NAMES.AUDIT_LOG,
    pluralName: 'Audit Logs',
    fields: {
      ...COMMON_FIELDS,
      action: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'execute', 'configure'],
        indexed: true,
        description: 'Action performed',
      }),
      entityType: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 100,
        indexed: true,
        description: 'Type of entity affected',
      }),
      entityId: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 100,
        indexed: true,
        description: 'ID of the entity affected',
      }),
      entityName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 300,
        description: 'Name of the entity affected',
      }),
      userId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.NO_ACTION,
        indexed: true,
        description: 'User who performed the action',
      }),
      userName: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 200,
        description: 'User display name at time of action',
      }),
      ipAddress: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 45,
        description: 'IP address of the user',
      }),
      userAgent: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 500,
        description: 'User agent string',
      }),
      previousValues: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: null,
        description: 'Previous field values (for updates)',
      }),
      newValues: field(FIELD_TYPES.JSON, {
        required: false,
        defaultValue: null,
        description: 'New field values (for creates/updates)',
      }),
      details: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 5000,
        description: 'Additional details about the action',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['success', 'failure', 'partial'],
        defaultValue: 'success',
        indexed: true,
        description: 'Action result status',
      }),
      timestamp: field(FIELD_TYPES.DATETIME, {
        required: true,
        indexed: true,
        description: 'When the action occurred',
      }),
    },
    requiredFields: ['id', 'action', 'entityType', 'userId', 'userName', 'status', 'timestamp', 'createdAt', 'updatedAt'],
    searchableFields: ['action', 'entityType', 'entityId', 'userName', 'status', 'timestamp'],
    defaultSortField: 'timestamp',
    defaultSortDirection: 'desc',
    foreignKeys: [
      {
        field: 'userId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.NO_ACTION,
      },
    ],
  },

  USE_CASE: {
    entityType: 'USE_CASE',
    idPrefix: ID_PREFIXES.USE_CASE,
    displayName: ENTITY_NAMES.USE_CASE,
    pluralName: 'Use Cases',
    fields: {
      ...COMMON_FIELDS,
      title: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Use case title',
      }),
      description: field(FIELD_TYPES.TEXT, {
        required: true,
        maxLength: 5000,
        description: 'Use case description',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated application',
      }),
      status: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['draft', 'active', 'in_progress', 'completed', 'deprecated'],
        defaultValue: 'draft',
        indexed: true,
        description: 'Use case status',
      }),
      priority: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: PRIORITY_LEVELS,
        defaultValue: 'medium',
        indexed: true,
        description: 'Priority level',
      }),
      category: field(FIELD_TYPES.ENUM, {
        required: false,
        enumValues: ['functional', 'non_functional', 'integration', 'security', 'performance', 'accessibility', 'regression', 'smoke', 'end_to_end'],
        description: 'Use case category',
      }),
      preconditions: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Preconditions',
      }),
      steps: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.OBJECT,
        description: 'Use case steps',
      }),
      expectedResult: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Expected result',
      }),
      actualResult: field(FIELD_TYPES.TEXT, {
        required: false,
        maxLength: 2000,
        description: 'Actual result',
      }),
      assigneeId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Assigned user',
      }),
      assigneeName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Assignee display name',
      }),
      lastExecutedAt: field(FIELD_TYPES.DATETIME, {
        required: false,
        description: 'Last execution timestamp',
      }),
      executionCount: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Number of times executed',
      }),
      tags: field(FIELD_TYPES.ARRAY, {
        required: false,
        defaultValue: [],
        arrayItemType: FIELD_TYPES.STRING,
        description: 'Tags for categorization',
      }),
    },
    requiredFields: ['id', 'title', 'description', 'applicationId', 'status', 'createdAt', 'updatedAt'],
    searchableFields: ['title', 'description', 'status', 'priority', 'category', 'applicationId', 'assigneeName'],
    defaultSortField: 'title',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'assigneeId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },

  TEST_DATA: {
    entityType: 'TEST_DATA',
    idPrefix: ID_PREFIXES.TEST_DATA,
    displayName: ENTITY_NAMES.TEST_DATA,
    pluralName: 'Test Data Sets',
    fields: {
      ...COMMON_FIELDS,
      name: field(FIELD_TYPES.STRING, {
        required: true,
        minLength: 2,
        maxLength: 300,
        indexed: true,
        description: 'Dataset name',
      }),
      applicationId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'APPLICATION',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated application',
      }),
      applicationName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Application display name',
      }),
      portfolioId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'PORTFOLIO',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated portfolio',
      }),
      environmentId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: true,
        foreignKey: 'ENVIRONMENT',
        onDelete: REF_ACTIONS.CASCADE,
        indexed: true,
        description: 'Associated environment',
      }),
      environmentName: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Environment display name',
      }),
      dataType: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 100,
        description: 'Data type classification',
      }),
      sourceSystem: field(FIELD_TYPES.STRING, {
        required: true,
        maxLength: 100,
        description: 'Source system',
      }),
      sensitivityClassification: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['Confidential', 'Restricted', 'Internal', 'Public'],
        defaultValue: 'Internal',
        indexed: true,
        description: 'Sensitivity classification',
      }),
      maskingStatus: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['fully_masked', 'partially_masked', 'unmasked', 'not_applicable'],
        defaultValue: 'unmasked',
        description: 'Masking status',
      }),
      syntheticIndicator: field(FIELD_TYPES.BOOLEAN, {
        required: true,
        defaultValue: false,
        description: 'Whether it is synthetic data',
      }),
      refreshDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Last refresh date',
      }),
      expirationDate: field(FIELD_TYPES.DATE, {
        required: false,
        description: 'Expiration date',
      }),
      owner: field(FIELD_TYPES.STRING, {
        required: false,
        maxLength: 200,
        description: 'Owner name',
      }),
      ownerId: field(FIELD_TYPES.FOREIGN_KEY, {
        required: false,
        foreignKey: 'USER',
        onDelete: REF_ACTIONS.SET_NULL,
        description: 'Owner user ID',
      }),
      usageHistory: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Number of times used',
      }),
      linkedTestSuites: field(FIELD_TYPES.INTEGER, {
        required: false,
        defaultValue: 0,
        min: 0,
        description: 'Number of linked test suites',
      }),
      provisioningStatus: field(FIELD_TYPES.ENUM, {
        required: true,
        enumValues: ['available', 'pending', 'provisioning', 'expired', 'retired'],
        defaultValue: 'available',
        indexed: true,
        description: 'Provisioning status',
      }),
    },
    requiredFields: ['id', 'name', 'applicationId', 'environmentId', 'dataType', 'sourceSystem', 'sensitivityClassification', 'maskingStatus', 'syntheticIndicator', 'provisioningStatus', 'createdAt', 'updatedAt'],
    searchableFields: ['name', 'dataType', 'sourceSystem', 'sensitivityClassification', 'maskingStatus', 'provisioningStatus', 'applicationName', 'owner'],
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    foreignKeys: [
      {
        field: 'applicationId',
        targetEntity: 'APPLICATION',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'portfolioId',
        targetEntity: 'PORTFOLIO',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'environmentId',
        targetEntity: 'ENVIRONMENT',
        targetField: 'id',
        onDelete: REF_ACTIONS.CASCADE,
      },
      {
        field: 'ownerId',
        targetEntity: 'USER',
        targetField: 'id',
        onDelete: REF_ACTIONS.SET_NULL,
      },
    ],
  },
};

/**
 * Returns the schema for a given entity type key.
 * @param {string} entityType - One of the ENTITY_SCHEMAS keys (e.g., 'PORTFOLIO', 'APPLICATION').
 * @returns {EntitySchema | undefined}
 */
export const getEntitySchema = (entityType) => {
  if (typeof entityType !== 'string') {
    return undefined;
  }
  return ENTITY_SCHEMAS[entityType];
};

/**
 * Returns all entity schema keys.
 * @returns {string[]}
 */
export const getAllEntityTypes = () => {
  return Object.keys(ENTITY_SCHEMAS);
};

/**
 * Returns all entity schemas as an array.
 * @returns {EntitySchema[]}
 */
export const getAllEntitySchemas = () => {
  return Object.values(ENTITY_SCHEMAS);
};

/**
 * Returns the field definition for a specific field in an entity schema.
 * @param {string} entityType - Entity type key.
 * @param {string} fieldName - Field name.
 * @returns {Object | undefined}
 */
export const getFieldDefinition = (entityType, fieldName) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return undefined;
  }
  return schema.fields[fieldName];
};

/**
 * Returns all foreign key constraints for a given entity type.
 * @param {string} entityType - Entity type key.
 * @returns {Array<{field: string, targetEntity: string, targetField: string, onDelete: string}>}
 */
export const getForeignKeys = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }
  return schema.foreignKeys;
};

/**
 * Returns all entity types that reference a given target entity type via foreign keys.
 * Useful for determining cascade/block delete impacts.
 * @param {string} targetEntityType - The entity type being referenced.
 * @returns {Array<{entityType: string, field: string, onDelete: string}>}
 */
export const getReferencingEntities = (targetEntityType) => {
  if (typeof targetEntityType !== 'string') {
    return [];
  }

  const results = [];

  Object.entries(ENTITY_SCHEMAS).forEach(([entityType, schema]) => {
    schema.foreignKeys.forEach((fk) => {
      if (fk.targetEntity === targetEntityType) {
        results.push({
          entityType,
          field: fk.field,
          onDelete: fk.onDelete,
        });
      }
    });
  });

  return results;
};

/**
 * Returns all entity types that would block deletion of a record in the given entity type.
 * @param {string} entityType - The entity type to check.
 * @returns {Array<{entityType: string, field: string}>}
 */
export const getBlockingReferences = (entityType) => {
  return getReferencingEntities(entityType)
    .filter((ref) => ref.onDelete === REF_ACTIONS.BLOCK)
    .map(({ entityType: refEntityType, field: refField }) => ({
      entityType: refEntityType,
      field: refField,
    }));
};

/**
 * Returns all entity types that would cascade delete when a record in the given entity type is deleted.
 * @param {string} entityType - The entity type to check.
 * @returns {Array<{entityType: string, field: string}>}
 */
export const getCascadeReferences = (entityType) => {
  return getReferencingEntities(entityType)
    .filter((ref) => ref.onDelete === REF_ACTIONS.CASCADE)
    .map(({ entityType: refEntityType, field: refField }) => ({
      entityType: refEntityType,
      field: refField,
    }));
};

/**
 * Returns all fields of a given type for an entity.
 * @param {string} entityType - Entity type key.
 * @param {string} fieldType - One of FIELD_TYPES values.
 * @returns {Array<{name: string, definition: Object}>}
 */
export const getFieldsByType = (entityType, fieldType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }

  return Object.entries(schema.fields)
    .filter(([, def]) => def.type === fieldType)
    .map(([name, definition]) => ({ name, definition }));
};

/**
 * Returns all required fields for an entity type.
 * @param {string} entityType - Entity type key.
 * @returns {string[]}
 */
export const getRequiredFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }
  return schema.requiredFields;
};

/**
 * Returns all searchable fields for an entity type.
 * @param {string} entityType - Entity type key.
 * @returns {string[]}
 */
export const getSearchableFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }
  return schema.searchableFields;
};

/**
 * Returns default values for all fields in an entity schema.
 * Only includes fields that have a non-null defaultValue.
 * @param {string} entityType - Entity type key.
 * @returns {Object<string, *>}
 */
export const getDefaultValues = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return {};
  }

  const defaults = {};
  Object.entries(schema.fields).forEach(([fieldName, def]) => {
    if (def.defaultValue !== null && def.defaultValue !== undefined) {
      defaults[fieldName] = def.defaultValue;
    }
  });
  return defaults;
};

/**
 * Validates a single field value against its schema definition.
 * @param {*} value - The value to validate.
 * @param {Object} fieldDef - The field definition object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateFieldValue = (value, fieldDef) => {
  const errors = [];

  if (value === null || value === undefined || value === '') {
    if (fieldDef.required) {
      errors.push('Field is required');
    }
    return { valid: errors.length === 0, errors };
  }

  switch (fieldDef.type) {
    case FIELD_TYPES.STRING:
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.ID:
      if (typeof value !== 'string') {
        errors.push('Value must be a string');
      } else {
        if (fieldDef.minLength !== null && value.length < fieldDef.minLength) {
          errors.push(`Minimum length is ${fieldDef.minLength}`);
        }
        if (fieldDef.maxLength !== null && value.length > fieldDef.maxLength) {
          errors.push(`Maximum length is ${fieldDef.maxLength}`);
        }
        if (fieldDef.pattern !== null) {
          const regex = new RegExp(fieldDef.pattern);
          if (!regex.test(value)) {
            errors.push(`Value does not match pattern ${fieldDef.pattern}`);
          }
        }
      }
      break;

    case FIELD_TYPES.EMAIL:
      if (typeof value !== 'string') {
        errors.push('Value must be a string');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push('Invalid email format');
        }
      }
      break;

    case FIELD_TYPES.URL:
      if (typeof value !== 'string') {
        errors.push('Value must be a string');
      } else {
        try {
          new URL(value);
        } catch {
          errors.push('Invalid URL format');
        }
      }
      break;

    case FIELD_TYPES.NUMBER:
    case FIELD_TYPES.INTEGER:
    case FIELD_TYPES.FLOAT:
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push('Value must be a number');
      } else {
        if (fieldDef.type === FIELD_TYPES.INTEGER && !Number.isInteger(value)) {
          errors.push('Value must be an integer');
        }
        if (fieldDef.min !== null && value < fieldDef.min) {
          errors.push(`Minimum value is ${fieldDef.min}`);
        }
        if (fieldDef.max !== null && value > fieldDef.max) {
          errors.push(`Maximum value is ${fieldDef.max}`);
        }
      }
      break;

    case FIELD_TYPES.BOOLEAN:
      if (typeof value !== 'boolean') {
        errors.push('Value must be a boolean');
      }
      break;

    case FIELD_TYPES.ENUM:
      if (fieldDef.enumValues && !fieldDef.enumValues.includes(value)) {
        errors.push(`Value must be one of: ${fieldDef.enumValues.join(', ')}`);
      }
      break;

    case FIELD_TYPES.ARRAY:
      if (!Array.isArray(value)) {
        errors.push('Value must be an array');
      }
      break;

    case FIELD_TYPES.OBJECT:
    case FIELD_TYPES.JSON:
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push('Value must be an object');
      }
      break;

    case FIELD_TYPES.DATE:
      if (typeof value !== 'string') {
        errors.push('Date must be a string in YYYY-MM-DD format');
      } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          errors.push('Date must be in YYYY-MM-DD format');
        }
      }
      break;

    case FIELD_TYPES.DATETIME:
      if (typeof value !== 'string') {
        errors.push('Datetime must be a string');
      } else {
        const parsed = Date.parse(value);
        if (Number.isNaN(parsed)) {
          errors.push('Invalid datetime format');
        }
      }
      break;

    case FIELD_TYPES.FOREIGN_KEY:
      if (typeof value !== 'string') {
        errors.push('Foreign key must be a string');
      }
      break;

    default:
      break;
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates an entire entity record against its schema.
 * @param {string} entityType - Entity type key.
 * @param {Object} record - The record to validate.
 * @returns {{ valid: boolean, errors: Object<string, string[]> }}
 */
export const validateEntity = (entityType, record) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return { valid: false, errors: { _entity: ['Unknown entity type'] } };
  }

  const allErrors = {};

  Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
    const value = record[fieldName];
    const { valid, errors } = validateFieldValue(value, fieldDef);
    if (!valid) {
      allErrors[fieldName] = errors;
    }
  });

  return {
    valid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
};

/**
 * Returns the ID prefix for a given entity type.
 * @param {string} entityType - Entity type key.
 * @returns {string | undefined}
 */
export const getIdPrefix = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return undefined;
  }
  return schema.idPrefix;
};

/**
 * Returns all unique fields for a given entity type.
 * @param {string} entityType - Entity type key.
 * @returns {string[]}
 */
export const getUniqueFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }

  return Object.entries(schema.fields)
    .filter(([, def]) => def.unique)
    .map(([name]) => name);
};

/**
 * Returns all indexed fields for a given entity type.
 * @param {string} entityType - Entity type key.
 * @returns {string[]}
 */
export const getIndexedFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [];
  }

  return Object.entries(schema.fields)
    .filter(([, def]) => def.indexed)
    .map(([name]) => name);
};

/**
 * Returns all enum fields and their allowed values for a given entity type.
 * @param {string} entityType - Entity type key.
 * @returns {Object<string, string[]>}
 */
export const getEnumFields = (entityType) => {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return {};
  }

  const enums = {};
  Object.entries(schema.fields).forEach(([fieldName, def]) => {
    if (def.type === FIELD_TYPES.ENUM && def.enumValues) {
      enums[fieldName] = def.enumValues;
    }
  });
  return enums;
};