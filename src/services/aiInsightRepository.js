import { STORAGE_KEYS, ID_PREFIXES } from '../constants/constants';
import { getItem, setItem } from '../storage/storageAdapter';
import { generateId } from '../utils/idGenerator';

/**
 * @typedef {Object} AIInsight
 * @property {string} id - Unique AI analysis ID (AI- prefix).
 * @property {string} title - Analysis title.
 * @property {string} description - Analysis description.
 * @property {string} featureType - AI feature type (one of 13 types).
 * @property {string} status - Analysis status: 'pending', 'running', 'completed', 'failed', 'cancelled'.
 * @property {string|null} applicationId - Related application ID.
 * @property {string|null} portfolioId - Related portfolio ID.
 * @property {string|null} requestedById - User who requested the analysis.
 * @property {string|null} startedAt - Analysis start timestamp (ISO 8601).
 * @property {string|null} completedAt - Analysis completion timestamp (ISO 8601).
 * @property {Object} inputData - Input data for the analysis.
 * @property {Object} results - Analysis results.
 * @property {Array<Object>} recommendations - Generated recommendations.
 * @property {number|null} confidenceScore - Confidence score (0-100).
 * @property {string|null} errorMessage - Error message if failed.
 * @property {string} createdAt - ISO 8601 creation timestamp.
 * @property {string} updatedAt - ISO 8601 last update timestamp.
 * @property {string} createdBy - User who created the record.
 * @property {string} updatedBy - User who last updated the record.
 * @property {number} version - Record version for optimistic locking.
 */

/**
 * @typedef {Object} AIInsightFilters
 * @property {string} [featureType] - Filter by AI feature type.
 * @property {string} [status] - Filter by analysis status.
 * @property {string} [applicationId] - Filter by related application ID.
 * @property {string} [portfolioId] - Filter by related portfolio ID.
 * @property {string} [requestedById] - Filter by requesting user ID.
 * @property {string} [search] - Free-text search across title, description, featureType.
 * @property {string} [sortField] - Field to sort by (default: 'createdAt').
 * @property {string} [sortDirection] - Sort direction: 'asc' or 'desc' (default: 'desc').
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of entries per page (default: 20).
 */

/**
 * @typedef {Object} PaginatedAIInsightResult
 * @property {AIInsight[]} data - The AI insights for the current page.
 * @property {number} total - Total number of matching insights.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of entries per page.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Retrieves all AI insight records from localStorage.
 * @returns {AIInsight[]}
 */
const getAllRecords = () => {
  const data = getItem(STORAGE_KEYS.AI_ANALYSES);
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

/**
 * Persists the full AI insights array to localStorage.
 * @param {AIInsight[]} records - The records to persist.
 * @returns {{ success: boolean, error: string|null }}
 */
const saveAllRecords = (records) => {
  return setItem(STORAGE_KEYS.AI_ANALYSES, records);
};

/**
 * Lists AI insight records with support for filtering, sorting, and pagination.
 *
 * @param {AIInsightFilters} [filters={}] - Optional filters, sorting, and pagination options.
 * @returns {PaginatedAIInsightResult}
 */
export const listInsights = (filters = {}) => {
  try {
    let records = getAllRecords();

    const {
      featureType,
      status,
      applicationId,
      portfolioId,
      requestedById,
      search,
      sortField = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    // Apply featureType filter
    if (typeof featureType === 'string' && featureType.trim() !== '') {
      const featureTypeLower = featureType.trim().toLowerCase();
      records = records.filter(
        (r) => r.featureType && r.featureType.toLowerCase() === featureTypeLower
      );
    }

    // Apply status filter
    if (typeof status === 'string' && status.trim() !== '') {
      const statusLower = status.trim().toLowerCase();
      records = records.filter(
        (r) => r.status && r.status.toLowerCase() === statusLower
      );
    }

    // Apply applicationId filter
    if (typeof applicationId === 'string' && applicationId.trim() !== '') {
      const applicationIdTrimmed = applicationId.trim();
      records = records.filter(
        (r) => r.applicationId === applicationIdTrimmed
      );
    }

    // Apply portfolioId filter
    if (typeof portfolioId === 'string' && portfolioId.trim() !== '') {
      const portfolioIdTrimmed = portfolioId.trim();
      records = records.filter(
        (r) => r.portfolioId === portfolioIdTrimmed
      );
    }

    // Apply requestedById filter
    if (typeof requestedById === 'string' && requestedById.trim() !== '') {
      const requestedByIdTrimmed = requestedById.trim();
      records = records.filter(
        (r) => r.requestedById === requestedByIdTrimmed
      );
    }

    // Apply free-text search
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.trim().toLowerCase();
      records = records.filter((r) => {
        const searchableFields = [r.title, r.description, r.featureType, r.status];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    const validSortFields = [
      'title',
      'featureType',
      'status',
      'confidenceScore',
      'startedAt',
      'completedAt',
      'createdAt',
      'updatedAt',
    ];
    const effectiveSortField = validSortFields.includes(sortField)
      ? sortField
      : 'createdAt';
    const effectiveSortDirection =
      sortDirection === 'asc' ? 'asc' : 'desc';

    records.sort((a, b) => {
      if (!a || !b) {
        return 0;
      }

      const valA = a[effectiveSortField];
      const valB = b[effectiveSortField];

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
    const effectivePageSize = Math.max(1, Math.floor(pageSize) || 20);
    const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
    const startIndex = (effectivePage - 1) * effectivePageSize;
    const paginatedData = records.slice(
      startIndex,
      startIndex + effectivePageSize
    );

    return {
      data: paginatedData.map((r) => ({ ...r })),
      total,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages,
    };
  } catch {
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
};

/**
 * Retrieves a single AI insight record by its ID.
 *
 * @param {string} id - The AI insight ID.
 * @returns {{ success: boolean, data: AIInsight|null, error: string|null }}
 */
export const getInsight = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const record = records.find((r) => r && r.id === id);

    if (!record) {
      return { success: false, data: null, error: `AI insight with ID '${id}' not found` };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to retrieve AI insight',
    };
  }
};

/**
 * Creates a new AI insight record.
 * Generates an ID, sets timestamps, and persists the record.
 *
 * @param {Object} data - The AI insight data (without id, createdAt, updatedAt).
 * @returns {{ success: boolean, data: AIInsight|null, error: string|null }}
 */
export const createInsight = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return { success: false, data: null, error: 'AI insight title is required' };
  }

  if (typeof data.featureType !== 'string' || data.featureType.trim() === '') {
    return { success: false, data: null, error: 'AI insight featureType is required' };
  }

  try {
    const records = getAllRecords();
    const now = new Date().toISOString();

    const record = {
      id: data.id || generateId(ID_PREFIXES.AI_ANALYSIS),
      title: data.title.trim(),
      description: data.description || '',
      featureType: data.featureType.trim(),
      status: data.status || 'pending',
      applicationId: data.applicationId || null,
      portfolioId: data.portfolioId || null,
      requestedById: data.requestedById || null,
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      inputData: data.inputData || {},
      results: data.results || {},
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : null,
      errorMessage: data.errorMessage || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      createdBy: data.createdBy || 'system',
      updatedBy: data.updatedBy || 'system',
      version: data.version || 1,
    };

    records.push(record);

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    return { success: true, data: { ...record }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to create AI insight',
    };
  }
};

/**
 * Updates an existing AI insight record by ID.
 * Merges the provided data with the existing record and persists the changes.
 *
 * @param {string} id - The AI insight ID to update.
 * @param {Object} data - The fields to update.
 * @returns {{ success: boolean, data: AIInsight|null, error: string|null }}
 */
export const updateInsight = (id, data) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, data: null, error: 'ID must be a non-empty string' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, data: null, error: 'Data must be a non-null object' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, data: null, error: `AI insight with ID '${id}' not found` };
    }

    const existingRecord = records[existingIndex];
    const now = new Date().toISOString();

    const updatedRecord = {
      ...existingRecord,
      ...data,
      id: existingRecord.id,
      createdAt: existingRecord.createdAt,
      createdBy: existingRecord.createdBy,
      updatedAt: now,
      version: (existingRecord.version || 0) + 1,
    };

    records[existingIndex] = updatedRecord;

    const writeResult = saveAllRecords(records);
    if (!writeResult.success) {
      return { success: false, data: null, error: writeResult.error };
    }

    return { success: true, data: { ...updatedRecord }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err && err.message ? err.message : 'Failed to update AI insight',
    };
  }
};

/**
 * Deletes an AI insight record by ID.
 *
 * @param {string} id - The AI insight ID to delete.
 * @returns {{ success: boolean, error: string|null }}
 */
export const deleteInsight = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'ID must be a non-empty string' };
  }

  try {
    const records = getAllRecords();
    const existingIndex = records.findIndex((r) => r && r.id === id);

    if (existingIndex === -1) {
      return { success: false, error: `AI insight with ID '${id}' not found` };
    }

    const updatedRecords = records.filter((r) => r && r.id !== id);

    const writeResult = saveAllRecords(updatedRecords);
    if (!writeResult.success) {
      return { success: false, error: writeResult.error };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : 'Failed to delete AI insight',
    };
  }
};

/**
 * Returns the total count of AI insight records, optionally filtered by status.
 *
 * @param {string} [status] - Optional status to filter by.
 * @returns {number}
 */
export const getInsightCount = (status) => {
  const records = getAllRecords();
  if (typeof status === 'string' && status.trim() !== '') {
    const statusLower = status.trim().toLowerCase();
    return records.filter(
      (r) => r.status && r.status.toLowerCase() === statusLower
    ).length;
  }
  return records.length;
};

/**
 * Returns all distinct feature types present in the AI insight data.
 *
 * @returns {string[]}
 */
export const getDistinctFeatureTypes = () => {
  const records = getAllRecords();
  const types = new Set();
  records.forEach((r) => {
    if (r.featureType) {
      types.add(r.featureType);
    }
  });
  return Array.from(types).sort();
};

/**
 * Returns all distinct statuses present in the AI insight data.
 *
 * @returns {string[]}
 */
export const getDistinctStatuses = () => {
  const records = getAllRecords();
  const statuses = new Set();
  records.forEach((r) => {
    if (r.status) {
      statuses.add(r.status);
    }
  });
  return Array.from(statuses).sort();
};

/**
 * Returns AI insights filtered by feature type.
 *
 * @param {string} featureType - The feature type to filter by.
 * @returns {AIInsight[]}
 */
export const getInsightsByFeatureType = (featureType) => {
  if (typeof featureType !== 'string' || featureType.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const featureTypeLower = featureType.trim().toLowerCase();
  return records
    .filter((r) => r.featureType && r.featureType.toLowerCase() === featureTypeLower)
    .map((r) => ({ ...r }));
};

/**
 * Returns AI insights filtered by status.
 *
 * @param {string} status - The status to filter by.
 * @returns {AIInsight[]}
 */
export const getInsightsByStatus = (status) => {
  if (typeof status !== 'string' || status.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const statusLower = status.trim().toLowerCase();
  return records
    .filter((r) => r.status && r.status.toLowerCase() === statusLower)
    .map((r) => ({ ...r }));
};

/**
 * Returns AI insights filtered by application ID.
 *
 * @param {string} applicationId - The application ID to filter by.
 * @returns {AIInsight[]}
 */
export const getInsightsByApplicationId = (applicationId) => {
  if (typeof applicationId !== 'string' || applicationId.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const applicationIdTrimmed = applicationId.trim();
  return records
    .filter((r) => r.applicationId === applicationIdTrimmed)
    .sort((a, b) => {
      const tsA = a.createdAt || '';
      const tsB = b.createdAt || '';
      return tsB.localeCompare(tsA);
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns AI insights filtered by portfolio ID.
 *
 * @param {string} portfolioId - The portfolio ID to filter by.
 * @returns {AIInsight[]}
 */
export const getInsightsByPortfolioId = (portfolioId) => {
  if (typeof portfolioId !== 'string' || portfolioId.trim() === '') {
    return [];
  }

  const records = getAllRecords();
  const portfolioIdTrimmed = portfolioId.trim();
  return records
    .filter((r) => r.portfolioId === portfolioIdTrimmed)
    .sort((a, b) => {
      const tsA = a.createdAt || '';
      const tsB = b.createdAt || '';
      return tsB.localeCompare(tsA);
    })
    .map((r) => ({ ...r }));
};

/**
 * Returns all AI insight records without pagination.
 *
 * @returns {AIInsight[]}
 */
export const getAllInsights = () => {
  return getAllRecords().map((r) => ({ ...r }));
};

/**
 * Returns a summary of AI insight statistics.
 *
 * @returns {{ total: number, pending: number, running: number, completed: number, failed: number, cancelled: number, averageConfidenceScore: number, byFeatureType: Object<string, number> }}
 */
export const getInsightSummary = () => {
  const records = getAllRecords();
  const summary = {
    total: records.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    averageConfidenceScore: 0,
    byFeatureType: {},
  };

  let confidenceScoreSum = 0;
  let confidenceScoreCount = 0;

  records.forEach((r) => {
    if (!r) {
      return;
    }

    switch (r.status) {
      case 'pending':
        summary.pending += 1;
        break;
      case 'running':
        summary.running += 1;
        break;
      case 'completed':
        summary.completed += 1;
        break;
      case 'failed':
        summary.failed += 1;
        break;
      case 'cancelled':
        summary.cancelled += 1;
        break;
      default:
        break;
    }

    if (typeof r.confidenceScore === 'number' && !Number.isNaN(r.confidenceScore)) {
      confidenceScoreSum += r.confidenceScore;
      confidenceScoreCount += 1;
    }

    if (r.featureType) {
      summary.byFeatureType[r.featureType] = (summary.byFeatureType[r.featureType] || 0) + 1;
    }
  });

  if (confidenceScoreCount > 0) {
    summary.averageConfidenceScore = Math.round((confidenceScoreSum / confidenceScoreCount) * 100) / 100;
  }

  return summary;
};