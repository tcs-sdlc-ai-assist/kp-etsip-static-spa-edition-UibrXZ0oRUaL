import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import PermissionGate from './PermissionGate';
import { exportToCSV, exportToJSON, exportToXLSX, exportToPDF, generateStubFile } from '../../utils/exportUtils';

/**
 * Reusable data table component with search, filter, sort, pagination,
 * column visibility toggle, and export capabilities.
 *
 * @param {Object} props
 * @returns {React.ReactElement}
 */
const DataTable = ({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onSort,
  onFilter,
  onSearch,
  onExport,
  entityType,
  sortField,
  sortDirection,
  search,
  filters,
  loading,
  visibleColumns,
  onToggleColumn,
  onPageSizeChange,
}) => {
  const [localSearch, setLocalSearch] = useState(search || '');
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);
  const exportMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setColumnMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  /**
   * Determines which columns are currently visible.
   */
  const effectiveVisibleColumns = useMemo(() => {
    if (Array.isArray(visibleColumns) && visibleColumns.length > 0) {
      return columns.filter((col) => visibleColumns.includes(col.key));
    }
    return columns;
  }, [columns, visibleColumns]);

  /**
   * Handles search input change with debounce.
   */
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        if (typeof onSearch === 'function') {
          onSearch(value);
        }
      }, 300);
    },
    [onSearch]
  );

  /**
   * Handles search form submission.
   */
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (typeof onSearch === 'function') {
        onSearch(localSearch);
      }
    },
    [onSearch, localSearch]
  );

  /**
   * Handles clearing the search input.
   */
  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (typeof onSearch === 'function') {
      onSearch('');
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onSearch]);

  /**
   * Handles column header click for sorting.
   */
  const handleSortClick = useCallback(
    (columnKey) => {
      if (typeof onSort === 'function') {
        const newDirection =
          sortField === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(columnKey, newDirection);
      }
    },
    [onSort, sortField, sortDirection]
  );

  /**
   * Handles column header keyboard interaction.
   */
  const handleSortKeyDown = useCallback(
    (e, columnKey) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSortClick(columnKey);
      }
    },
    [handleSortClick]
  );

  /**
   * Handles filter change for a specific column.
   */
  const handleFilterChange = useCallback(
    (columnKey, value) => {
      if (typeof onFilter === 'function') {
        onFilter(columnKey, value);
      }
    },
    [onFilter]
  );

  /**
   * Handles page navigation.
   */
  const handlePageChange = useCallback(
    (newPage) => {
      if (typeof onPageChange === 'function') {
        onPageChange(newPage);
      }
    },
    [onPageChange]
  );

  /**
   * Handles page size change.
   */
  const handlePageSizeChange = useCallback(
    (e) => {
      const newSize = parseInt(e.target.value, 10);
      if (!Number.isNaN(newSize) && newSize > 0 && typeof onPageSizeChange === 'function') {
        onPageSizeChange(newSize);
      }
    },
    [onPageSizeChange]
  );

  /**
   * Handles export action.
   */
  const handleExport = useCallback(
    (format) => {
      setExportMenuOpen(false);

      if (typeof onExport === 'function') {
        onExport(format);
        return;
      }

      // Default export behavior
      if (!Array.isArray(data) || data.length === 0) {
        return;
      }

      const exportFilename = entityType
        ? `${entityType.toLowerCase()}_export`
        : 'export';

      switch (format) {
        case 'csv':
          exportToCSV(data, `${exportFilename}.csv`);
          break;
        case 'json':
          exportToJSON(data, `${exportFilename}.json`);
          break;
        case 'xlsx':
          exportToXLSX(data, `${exportFilename}.xlsx`);
          break;
        case 'pdf':
          exportToPDF();
          break;
        case 'powerpoint':
        case 'pptx':
          generateStubFile('pptx', {
            title: `${entityType || 'Data'} Export`,
            description: `PowerPoint export for ${entityType || 'data'}`,
            metadata: { entityType, recordCount: data.length },
          });
          break;
        case 'powerbi':
        case 'pbix':
          generateStubFile('pbix', {
            title: `${entityType || 'Data'} Export`,
            description: `Power BI export for ${entityType || 'data'}`,
            metadata: { entityType, recordCount: data.length },
          });
          break;
        default:
          break;
      }
    },
    [onExport, data, entityType]
  );

  /**
   * Handles column visibility toggle.
   */
  const handleToggleColumn = useCallback(
    (columnKey) => {
      if (typeof onToggleColumn === 'function') {
        onToggleColumn(columnKey);
      }
    },
    [onToggleColumn]
  );

  /**
   * Renders the sort indicator for a column header.
   */
  const renderSortIndicator = (columnKey) => {
    if (sortField !== columnKey) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="ml-1 h-3 w-3 text-neutral-300 dark:text-neutral-600"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="ml-1 h-3 w-3 text-primary-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="ml-1 h-3 w-3 text-primary-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  /**
   * Renders cell content, using a custom render function if provided.
   */
  const renderCellContent = (column, row) => {
    if (typeof column.render === 'function') {
      return column.render(row[column.key], row);
    }

    const value = row[column.key];

    if (value === null || value === undefined) {
      return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
    }

    if (Array.isArray(value)) {
      return (
        <span className="truncate" title={value.join(', ')}>
          {value.join(', ')}
        </span>
      );
    }

    if (typeof value === 'object') {
      return (
        <span className="truncate text-neutral-500 dark:text-neutral-400" title={JSON.stringify(value)}>
          {JSON.stringify(value)}
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="truncate" title={String(value)}>{String(value)}</span>;
  };

  const effectiveTotalPages = totalPages || (totalCount && pageSize ? Math.ceil(totalCount / pageSize) : 1);
  const effectivePage = page || 1;
  const startRecord = totalCount > 0 ? (effectivePage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(effectivePage * pageSize, totalCount || 0);

  // Compute filter columns (columns that have filterOptions)
  const filterableColumns = useMemo(() => {
    return columns.filter((col) => Array.isArray(col.filterOptions) && col.filterOptions.length > 0);
  }, [columns]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    if (!filters || typeof filters !== 'object') {
      return 0;
    }
    return Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length;
  }, [filters]);

  return (
    <div className="w-full space-y-4">
      {/* Toolbar: Search, Filters, Column Toggle, Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Search and Filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <label htmlFor="datatable-search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-neutral-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                id="datatable-search"
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="input pl-9 pr-8 text-sm"
                aria-label="Search table data"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Filter dropdown */}
          {filterableColumns.length > 0 && (
            <div className="relative" ref={filterMenuRef}>
              <button
                type="button"
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                aria-haspopup="true"
                aria-expanded={filterMenuOpen}
                aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-500 px-1 text-2xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterMenuOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-elevated dark:border-neutral-700 dark:bg-neutral-800"
                  role="dialog"
                  aria-label="Filter options"
                >
                  <div className="space-y-3">
                    {filterableColumns.map((col) => (
                      <div key={col.key}>
                        <label
                          htmlFor={`filter-${col.key}`}
                          className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          {col.label}
                        </label>
                        <select
                          id={`filter-${col.key}`}
                          value={(filters && filters[col.key]) || ''}
                          onChange={(e) => handleFilterChange(col.key, e.target.value)}
                          className="input text-sm"
                          aria-label={`Filter by ${col.label}`}
                        >
                          <option value="">All</option>
                          {col.filterOptions.map((opt) => {
                            const optValue = typeof opt === 'object' ? opt.value : opt;
                            const optLabel = typeof opt === 'object' ? opt.label : opt;
                            return (
                              <option key={optValue} value={optValue}>
                                {optLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Column Toggle and Export */}
        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          {typeof onToggleColumn === 'function' && (
            <div className="relative" ref={columnMenuRef}>
              <button
                type="button"
                onClick={() => setColumnMenuOpen((prev) => !prev)}
                className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                aria-haspopup="true"
                aria-expanded={columnMenuOpen}
                aria-label="Toggle column visibility"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Columns</span>
              </button>

              {columnMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-elevated dark:border-neutral-700 dark:bg-neutral-800"
                  role="dialog"
                  aria-label="Column visibility"
                >
                  <div className="space-y-0.5">
                    {columns.map((col) => {
                      const isVisible =
                        !Array.isArray(visibleColumns) ||
                        visibleColumns.length === 0 ||
                        visibleColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => handleToggleColumn(col.key)}
                            className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 dark:border-neutral-600"
                          />
                          <span className="truncate">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export dropdown */}
          {entityType && (
            <PermissionGate entityType={entityType} action="export">
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                  aria-haspopup="true"
                  aria-expanded={exportMenuOpen}
                  aria-label="Export data"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                </button>

                {exportMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-elevated dark:border-neutral-700 dark:bg-neutral-800"
                    role="menu"
                    aria-label="Export formats"
                  >
                    {[
                      { key: 'csv', label: 'CSV', icon: '📄' },
                      { key: 'json', label: 'JSON', icon: '📋' },
                      { key: 'xlsx', label: 'Excel (XLSX)', icon: '📊' },
                      { key: 'pdf', label: 'PDF (Print)', icon: '🖨️' },
                      { key: 'pptx', label: 'PowerPoint (Stub)', icon: '📽️' },
                      { key: 'pbix', label: 'Power BI (Stub)', icon: '📈' },
                    ].map((fmt) => (
                      <button
                        key={fmt.key}
                        type="button"
                        role="menuitem"
                        onClick={() => handleExport(fmt.key)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        <span aria-hidden="true">{fmt.icon}</span>
                        <span>{fmt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-card dark:border-neutral-700 dark:bg-neutral-800">
        <table
          className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
          role="table"
          aria-label={entityType ? `${entityType} data table` : 'Data table'}
        >
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr role="row">
              {effectiveVisibleColumns.map((col) => {
                const isSortable = col.sortable !== false;
                const isSorted = sortField === col.key;
                const ariaSort = isSorted
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none';

                return (
                  <th
                    key={col.key}
                    role="columnheader"
                    scope="col"
                    aria-sort={isSortable ? ariaSort : undefined}
                    className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ${
                      isSortable ? 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200' : ''
                    } ${col.className || ''}`}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    tabIndex={isSortable ? 0 : undefined}
                    onClick={isSortable ? () => handleSortClick(col.key) : undefined}
                    onKeyDown={isSortable ? (e) => handleSortKeyDown(e, col.key) : undefined}
                  >
                    <div className="flex items-center">
                      <span>{col.label}</span>
                      {isSortable && renderSortIndicator(col.key)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
            {loading && (
              <tr role="row">
                <td
                  colSpan={effectiveVisibleColumns.length}
                  className="px-4 py-12 text-center"
                  role="cell"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && (!Array.isArray(data) || data.length === 0) && (
              <tr role="row">
                <td
                  colSpan={effectiveVisibleColumns.length}
                  className="px-4 py-12 text-center"
                  role="cell"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      No data available.
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              Array.isArray(data) &&
              data.map((row, rowIndex) => {
                if (!row) {
                  return null;
                }
                const rowKey = row.id || `row-${rowIndex}`;
                return (
                  <tr
                    key={rowKey}
                    role="row"
                    className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                  >
                    {effectiveVisibleColumns.map((col) => (
                      <td
                        key={`${rowKey}-${col.key}`}
                        role="cell"
                        className={`whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 ${col.cellClassName || ''}`}
                      >
                        {renderCellContent(col, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Record count info */}
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {totalCount > 0 ? (
            <span>
              Showing <span className="font-medium text-neutral-700 dark:text-neutral-200">{startRecord}</span> to{' '}
              <span className="font-medium text-neutral-700 dark:text-neutral-200">{endRecord}</span> of{' '}
              <span className="font-medium text-neutral-700 dark:text-neutral-200">{totalCount}</span> results
            </span>
          ) : (
            <span>No results</span>
          )}
        </div>

        {/* Page size selector and pagination controls */}
        <div className="flex items-center gap-3">
          {/* Page size selector */}
          {typeof onPageSizeChange === 'function' && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="datatable-pagesize"
                className="text-xs text-neutral-500 dark:text-neutral-400"
              >
                Rows:
              </label>
              <select
                id="datatable-pagesize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="input w-16 py-1 text-xs"
                aria-label="Rows per page"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pagination buttons */}
          <nav aria-label="Table pagination" className="flex items-center gap-1">
            {/* First page */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={effectivePage <= 1}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to first page"
              title="First page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Previous page */}
            <button
              type="button"
              onClick={() => handlePageChange(effectivePage - 1)}
              disabled={effectivePage <= 1}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to previous page"
              title="Previous page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Page indicator */}
            <span className="flex items-center px-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{effectivePage}</span>
              <span className="mx-1">/</span>
              <span>{effectiveTotalPages}</span>
            </span>

            {/* Next page */}
            <button
              type="button"
              onClick={() => handlePageChange(effectivePage + 1)}
              disabled={effectivePage >= effectiveTotalPages}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to next page"
              title="Next page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Last page */}
            <button
              type="button"
              onClick={() => handlePageChange(effectiveTotalPages)}
              disabled={effectivePage >= effectiveTotalPages}
              className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to last page"
              title="Last page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

DataTable.propTypes = {
  /**
   * Column definitions for the table.
   * Each column should have at minimum: { key: string, label: string }.
   * Optional: sortable (boolean), render (function), filterOptions (array),
   * width (string), className (string), cellClassName (string).
   */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func,
      filterOptions: PropTypes.array,
      width: PropTypes.string,
      className: PropTypes.string,
      cellClassName: PropTypes.string,
    })
  ).isRequired,
  /** Array of data objects to display in the table. */
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Total number of records across all pages. */
  totalCount: PropTypes.number,
  /** Current page number (1-based). */
  page: PropTypes.number,
  /** Number of records per page. */
  pageSize: PropTypes.number,
  /** Total number of pages. */
  totalPages: PropTypes.number,
  /** Callback when page changes: (newPage: number) => void. */
  onPageChange: PropTypes.func,
  /** Callback when sort changes: (field: string, direction: string) => void. */
  onSort: PropTypes.func,
  /** Callback when a filter changes: (field: string, value: string) => void. */
  onFilter: PropTypes.func,
  /** Callback when search changes: (searchTerm: string) => void. */
  onSearch: PropTypes.func,
  /** Callback when export is triggered: (format: string) => void. If not provided, default export behavior is used. */
  onExport: PropTypes.func,
  /** Entity type key for permission gating on export buttons. */
  entityType: PropTypes.string,
  /** Current sort field key. */
  sortField: PropTypes.string,
  /** Current sort direction: 'asc' or 'desc'. */
  sortDirection: PropTypes.string,
  /** Current search term. */
  search: PropTypes.string,
  /** Current active filters as field-value pairs. */
  filters: PropTypes.object,
  /** Whether data is currently loading. */
  loading: PropTypes.bool,
  /** Array of visible column keys. If empty or not provided, all columns are visible. */
  visibleColumns: PropTypes.arrayOf(PropTypes.string),
  /** Callback to toggle column visibility: (columnKey: string) => void. */
  onToggleColumn: PropTypes.func,
  /** Callback when page size changes: (newPageSize: number) => void. */
  onPageSizeChange: PropTypes.func,
};

DataTable.defaultProps = {
  totalCount: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  onPageChange: null,
  onSort: null,
  onFilter: null,
  onSearch: null,
  onExport: null,
  entityType: null,
  sortField: '',
  sortDirection: 'asc',
  search: '',
  filters: {},
  loading: false,
  visibleColumns: [],
  onToggleColumn: null,
  onPageSizeChange: null,
};

export default DataTable;