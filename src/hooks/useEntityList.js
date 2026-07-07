import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { list } from '../services/entityRepository';
import { getEntitySchema } from '../constants/entitySchemas';
import { DEFAULT_PAGE_SIZE } from '../constants/constants';

/**
 * @typedef {Object} UseEntityListOptions
 * @property {string} [search] - Initial search term.
 * @property {Object<string, *>} [filters] - Initial field-value filter pairs.
 * @property {string} [sortField] - Initial sort field.
 * @property {string} [sortDirection] - Initial sort direction ('asc' or 'desc').
 * @property {number} [page] - Initial page number (1-based).
 * @property {number} [pageSize] - Initial page size.
 * @property {string[]} [visibleColumns] - Initial visible column keys.
 * @property {boolean} [autoLoad] - Whether to load data on mount (default: true).
 */

/**
 * @typedef {Object} UseEntityListReturn
 * @property {Array<Object>} data - The current page of entity records.
 * @property {number} totalCount - Total number of matching records.
 * @property {number} page - Current page number.
 * @property {number} pageSize - Current page size.
 * @property {number} totalPages - Total number of pages.
 * @property {boolean} loading - Whether data is currently being loaded.
 * @property {string|null} error - Error message if the last operation failed.
 * @property {string} search - Current search term.
 * @property {Object<string, *>} filters - Current active filters.
 * @property {string} sortField - Current sort field.
 * @property {string} sortDirection - Current sort direction.
 * @property {string[]} visibleColumns - Currently visible column keys.
 * @property {function(string): void} setSearch - Updates the search term and resets to page 1.
 * @property {function(Object<string, *>): void} setFilters - Updates filters and resets to page 1.
 * @property {function(string, *): void} setFilter - Sets a single filter field value and resets to page 1.
 * @property {function(string): void} removeFilter - Removes a single filter by field name and resets to page 1.
 * @property {function(): void} clearFilters - Clears all filters and resets to page 1.
 * @property {function(string, string=): void} setSort - Sets the sort field and optional direction.
 * @property {function(number): void} setPage - Sets the current page number.
 * @property {function(number): void} setPageSize - Sets the page size and resets to page 1.
 * @property {function(string[]): void} setVisibleColumns - Sets the visible column keys.
 * @property {function(string): void} toggleColumn - Toggles visibility of a single column.
 * @property {function(): void} refresh - Reloads data with current options.
 * @property {function(): void} resetAll - Resets all options to their initial/default values.
 */

/**
 * Custom hook that manages entity list state including search, filters, sorting,
 * pagination, and column visibility. Calls entityRepository.list() with current options.
 *
 * @param {string} entityType - The entity type key (e.g., 'PORTFOLIO', 'APPLICATION').
 * @param {UseEntityListOptions} [options={}] - Initial configuration options.
 * @returns {UseEntityListReturn}
 */
const useEntityList = (entityType, options = {}) => {
  const schema = useMemo(() => {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      return null;
    }
    return getEntitySchema(entityType);
  }, [entityType]);

  const defaultSortField = schema ? schema.defaultSortField || 'createdAt' : 'createdAt';
  const defaultSortDirection = schema ? schema.defaultSortDirection || 'asc' : 'asc';

  const initialSearch = typeof options.search === 'string' ? options.search : '';
  const initialFilters = options.filters && typeof options.filters === 'object' && !Array.isArray(options.filters)
    ? options.filters
    : {};
  const initialSortField = typeof options.sortField === 'string' && options.sortField.trim() !== ''
    ? options.sortField
    : defaultSortField;
  const initialSortDirection = options.sortDirection === 'asc' || options.sortDirection === 'desc'
    ? options.sortDirection
    : defaultSortDirection;
  const initialPage = typeof options.page === 'number' && options.page >= 1
    ? Math.floor(options.page)
    : 1;
  const initialPageSize = typeof options.pageSize === 'number' && options.pageSize >= 1
    ? Math.floor(options.pageSize)
    : DEFAULT_PAGE_SIZE;
  const initialVisibleColumns = Array.isArray(options.visibleColumns)
    ? options.visibleColumns
    : [];
  const autoLoad = options.autoLoad !== false;

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearchState] = useState(initialSearch);
  const [filters, setFiltersState] = useState(initialFilters);
  const [sortField, setSortFieldState] = useState(initialSortField);
  const [sortDirection, setSortDirectionState] = useState(initialSortDirection);
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumnsState] = useState(initialVisibleColumns);

  const mountedRef = useRef(true);
  const loadCounterRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Loads entity data from the repository with the current state.
   */
  const loadData = useCallback(() => {
    if (typeof entityType !== 'string' || entityType.trim() === '') {
      setData([]);
      setTotalCount(0);
      setTotalPages(0);
      setError('Entity type must be a non-empty string');
      return;
    }

    setLoading(true);
    setError(null);

    loadCounterRef.current += 1;
    const currentLoadId = loadCounterRef.current;

    try {
      const result = list(entityType, {
        search,
        filters,
        sortField,
        sortDirection,
        page,
        pageSize,
      });

      // Only update state if this is still the most recent load and component is mounted
      if (!mountedRef.current || currentLoadId !== loadCounterRef.current) {
        return;
      }

      if (result.success) {
        setData(Array.isArray(result.data) ? result.data : []);
        setTotalCount(result.total || 0);
        setTotalPages(result.totalPages || 0);
        setError(null);
      } else {
        setData([]);
        setTotalCount(0);
        setTotalPages(0);
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      if (mountedRef.current && currentLoadId === loadCounterRef.current) {
        setData([]);
        setTotalCount(0);
        setTotalPages(0);
        setError(err && err.message ? err.message : 'Failed to load data');
      }
    } finally {
      if (mountedRef.current && currentLoadId === loadCounterRef.current) {
        setLoading(false);
      }
    }
  }, [entityType, search, filters, sortField, sortDirection, page, pageSize]);

  // Auto-load data on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, autoLoad]);

  const setSearch = useCallback((newSearch) => {
    if (typeof newSearch !== 'string') {
      return;
    }
    setSearchState(newSearch);
    setPageState(1);
  }, []);

  const setFilters = useCallback((newFilters) => {
    if (!newFilters || typeof newFilters !== 'object' || Array.isArray(newFilters)) {
      return;
    }
    setFiltersState(newFilters);
    setPageState(1);
  }, []);

  const setFilter = useCallback((fieldName, value) => {
    if (typeof fieldName !== 'string' || fieldName.trim() === '') {
      return;
    }
    setFiltersState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setPageState(1);
  }, []);

  const removeFilter = useCallback((fieldName) => {
    if (typeof fieldName !== 'string' || fieldName.trim() === '') {
      return;
    }
    setFiltersState((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setPageState(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPageState(1);
  }, []);

  const setSort = useCallback((field, direction) => {
    if (typeof field !== 'string' || field.trim() === '') {
      return;
    }

    setSortFieldState((prevField) => {
      if (typeof direction === 'string' && (direction === 'asc' || direction === 'desc')) {
        setSortDirectionState(direction);
      } else if (prevField === field) {
        // Toggle direction if same field
        setSortDirectionState((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDirectionState('asc');
      }
      return field;
    });

    setPageState(1);
  }, []);

  const setPage = useCallback((newPage) => {
    if (typeof newPage !== 'number' || newPage < 1) {
      return;
    }
    setPageState(Math.floor(newPage));
  }, []);

  const setPageSize = useCallback((newPageSize) => {
    if (typeof newPageSize !== 'number' || newPageSize < 1) {
      return;
    }
    setPageSizeState(Math.floor(newPageSize));
    setPageState(1);
  }, []);

  const setVisibleColumns = useCallback((columns) => {
    if (!Array.isArray(columns)) {
      return;
    }
    setVisibleColumnsState(columns);
  }, []);

  const toggleColumn = useCallback((columnKey) => {
    if (typeof columnKey !== 'string' || columnKey.trim() === '') {
      return;
    }
    setVisibleColumnsState((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((c) => c !== columnKey);
      }
      return [...prev, columnKey];
    });
  }, []);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const resetAll = useCallback(() => {
    setSearchState(initialSearch);
    setFiltersState(initialFilters);
    setSortFieldState(initialSortField);
    setSortDirectionState(initialSortDirection);
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    setVisibleColumnsState(initialVisibleColumns);
  }, [initialSearch, initialFilters, initialSortField, initialSortDirection, initialPage, initialPageSize, initialVisibleColumns]);

  return {
    data,
    totalCount,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    search,
    filters,
    sortField,
    sortDirection,
    visibleColumns,
    setSearch,
    setFilters,
    setFilter,
    removeFilter,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    setVisibleColumns,
    toggleColumn,
    refresh,
    resetAll,
  };
};

export default useEntityList;