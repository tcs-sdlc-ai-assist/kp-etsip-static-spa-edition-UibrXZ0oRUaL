import { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  listEntries,
  getDistinctActions,
  getDistinctEntityTypes,
  getEntryCount,
} from '../../services/auditLogService';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

/**
 * Maps audit log status to StatusBadge variant.
 * @param {string} status - The audit log status.
 * @returns {string}
 */
const auditStatusToVariant = (status) => {
  if (typeof status !== 'string') return 'neutral';
  switch (status.toLowerCase()) {
    case 'success':
      return 'success';
    case 'failure':
      return 'danger';
    case 'partial':
      return 'warning';
    default:
      return 'neutral';
  }
};

/**
 * Formats a timestamp for display.
 * @param {string} timestamp - ISO 8601 timestamp.
 * @returns {string}
 */
const formatTimestamp = (timestamp) => {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    return '—';
  }
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
};

/**
 * Formats an action string for display.
 * @param {string} action - The action identifier.
 * @returns {string}
 */
const formatAction = (action) => {
  if (typeof action !== 'string' || action.trim() === '') {
    return '—';
  }
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats an entity type string for display.
 * @param {string} entityType - The entity type identifier.
 * @returns {string}
 */
const formatEntityType = (entityType) => {
  if (typeof entityType !== 'string' || entityType.trim() === '') {
    return '—';
  }
  return entityType.replace(/_/g, ' ');
};

/**
 * Default page size for audit log entries.
 * @type {number}
 */
const AUDIT_PAGE_SIZE = 20;

/**
 * Audit log viewer panel component used within the AdministrationPage.
 * Displays structured audit log entries in a table with search, filter
 * (by action type, entity type, status, date range), sort, and pagination.
 * Read-only view. Accessible with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @param {function} [props.onRefresh] - Optional callback invoked when the refresh button is clicked.
 * @returns {React.ReactElement}
 */
const AuditLogPanel = ({ className, onRefresh }) => {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Sort state
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter options
  const [availableActions, setAvailableActions] = useState([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState([]);

  /**
   * Loads filter options from the audit log service.
   */
  const loadFilterOptions = useCallback(() => {
    try {
      setAvailableActions(getDistinctActions());
      setAvailableEntityTypes(getDistinctEntityTypes());
    } catch {
      setAvailableActions([]);
      setAvailableEntityTypes([]);
    }
  }, []);

  /**
   * Loads audit log entries with current filters, sort, and pagination.
   */
  const loadEntries = useCallback(() => {
    setLoading(true);
    try {
      const filters = {
        page,
        pageSize: AUDIT_PAGE_SIZE,
        sortField,
        sortDirection,
      };

      if (search.trim() !== '') {
        filters.search = search.trim();
      }
      if (filterAction.trim() !== '') {
        filters.action = filterAction.trim();
      }
      if (filterEntityType.trim() !== '') {
        filters.entityType = filterEntityType.trim();
      }
      if (filterStatus.trim() !== '') {
        filters.status = filterStatus.trim();
      }
      if (filterStartDate.trim() !== '') {
        filters.startDate = filterStartDate.trim();
      }
      if (filterEndDate.trim() !== '') {
        filters.endDate = filterEndDate.trim();
      }

      const result = listEntries(filters);
      setEntries(Array.isArray(result.data) ? result.data : []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch {
      setEntries([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortDirection, search, filterAction, filterEntityType, filterStatus, filterStartDate, filterEndDate]);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load entries when dependencies change
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterAction, filterEntityType, filterStatus, filterStartDate, filterEndDate]);

  /**
   * Handles sort column click.
   * @param {string} field - The field to sort by.
   */
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    },
    [sortField]
  );

  /**
   * Handles sort column keyboard interaction.
   * @param {React.KeyboardEvent} e - The keyboard event.
   * @param {string} field - The field to sort by.
   */
  const handleSortKeyDown = useCallback(
    (e, field) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSort(field);
      }
    },
    [handleSort]
  );

  /**
   * Handles page change.
   * @param {number} newPage - The new page number.
   */
  const handlePageChange = useCallback((newPage) => {
    if (typeof newPage === 'number' && newPage >= 1) {
      setPage(newPage);
    }
  }, []);

  /**
   * Handles refresh action.
   */
  const handleRefresh = useCallback(() => {
    loadFilterOptions();
    loadEntries();
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  }, [loadFilterOptions, loadEntries, onRefresh]);

  /**
   * Clears all filters.
   */
  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilterAction('');
    setFilterEntityType('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);

  const hasActiveFilters = search !== '' || filterAction !== '' || filterEntityType !== '' || filterStatus !== '' || filterStartDate !== '' || filterEndDate !== '';

  const startRecord = total > 0 ? (page - 1) * AUDIT_PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(page * AUDIT_PAGE_SIZE, total);

  /**
   * Renders the sort indicator for a column header.
   * @param {string} field - The column field key.
   * @returns {React.ReactElement}
   */
  const renderSortIndicator = (field) => {
    if (sortField !== field) {
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
   * Column definitions for the audit log table.
   * @type {Array<{ key: string, label: string, sortable: boolean, width?: string }>}
   */
  const columns = useMemo(
    () => [
      { key: 'timestamp', label: 'Timestamp', sortable: true, width: '160px' },
      { key: 'action', label: 'Action', sortable: true, width: '120px' },
      { key: 'entityType', label: 'Entity Type', sortable: true, width: '140px' },
      { key: 'entityName', label: 'Entity', sortable: true, width: '160px' },
      { key: 'userName', label: 'User', sortable: true, width: '140px' },
      { key: 'status', label: 'Status', sortable: true, width: '100px' },
      { key: 'details', label: 'Details', sortable: false },
    ],
    []
  );

  if (loading && entries.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-8 ${className || ''}`}
        role="status"
        aria-label="Loading audit log"
      >
        <LoadingSpinner size="sm" label="Loading audit log..." />
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${className || ''}`}
      role="region"
      aria-label="Audit log viewer"
    >
      {/* Filters */}
      <section
        aria-label="Audit log filters"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <label htmlFor="audit-panel-search" className="sr-only">
            Search audit log
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
              id="audit-panel-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit log..."
              className="input pl-9 pr-8 text-sm"
              aria-label="Search audit log"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
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
        </div>

        {/* Action filter */}
        <div>
          <label htmlFor="audit-panel-action-filter" className="sr-only">
            Filter by action
          </label>
          <select
            id="audit-panel-action-filter"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input py-2 text-xs max-w-[140px]"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {availableActions.map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>
        </div>

        {/* Entity type filter */}
        <div>
          <label htmlFor="audit-panel-entity-filter" className="sr-only">
            Filter by entity type
          </label>
          <select
            id="audit-panel-entity-filter"
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="input py-2 text-xs max-w-[160px]"
            aria-label="Filter by entity type"
          >
            <option value="">All Entity Types</option>
            {availableEntityTypes.map((et) => (
              <option key={et} value={et}>
                {formatEntityType(et)}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label htmlFor="audit-panel-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="audit-panel-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-2 text-xs max-w-[120px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {/* Start date filter */}
        <div>
          <label htmlFor="audit-panel-start-date" className="sr-only">
            Filter from date
          </label>
          <input
            id="audit-panel-start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="input py-2 text-xs max-w-[150px]"
            aria-label="Filter from date"
            placeholder="Start date"
          />
        </div>

        {/* End date filter */}
        <div>
          <label htmlFor="audit-panel-end-date" className="sr-only">
            Filter to date
          </label>
          <input
            id="audit-panel-end-date"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="input py-2 text-xs max-w-[150px]"
            aria-label="Filter to date"
            placeholder="End date"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-outline flex h-8 w-8 items-center justify-center rounded-lg p-0"
          aria-label="Refresh audit log"
          title="Refresh"
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
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </section>

      {/* Audit entries table */}
      <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Audit Log Entries
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {total} total{hasActiveFilters ? ' (filtered)' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" label="Loading audit log..." />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {hasActiveFilters
                ? 'No audit entries match your filters.'
                : 'No audit log entries yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
                role="table"
                aria-label="Audit log entries"
              >
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr role="row">
                    {columns.map((col) => {
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
                          aria-sort={col.sortable ? ariaSort : undefined}
                          className={`whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ${
                            col.sortable
                              ? 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200'
                              : ''
                          }`}
                          style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                          tabIndex={col.sortable ? 0 : undefined}
                          onClick={col.sortable ? () => handleSort(col.key) : undefined}
                          onKeyDown={
                            col.sortable
                              ? (e) => handleSortKeyDown(e, col.key)
                              : undefined
                          }
                        >
                          <div className="flex items-center">
                            <span>{col.label}</span>
                            {col.sortable && renderSortIndicator(col.key)}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                  {entries.map((entry) => {
                    if (!entry || !entry.id) return null;
                    return (
                      <tr
                        key={entry.id}
                        role="row"
                        className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                      >
                        <td
                          role="cell"
                          className="whitespace-nowrap px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400"
                        >
                          {formatTimestamp(entry.timestamp)}
                        </td>
                        <td role="cell" className="whitespace-nowrap px-4 py-2 text-xs">
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-2xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                            {formatAction(entry.action)}
                          </span>
                        </td>
                        <td
                          role="cell"
                          className="whitespace-nowrap px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300"
                        >
                          {formatEntityType(entry.entityType)}
                        </td>
                        <td
                          role="cell"
                          className="max-w-[160px] truncate px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300"
                          title={entry.entityName || entry.entityId || ''}
                        >
                          {entry.entityName || entry.entityId || '—'}
                        </td>
                        <td
                          role="cell"
                          className="whitespace-nowrap px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300"
                        >
                          {entry.userName || '—'}
                        </td>
                        <td role="cell" className="whitespace-nowrap px-4 py-2">
                          <StatusBadge
                            status={entry.status || 'unknown'}
                            variant={auditStatusToVariant(entry.status)}
                            size="sm"
                          />
                        </td>
                        <td
                          role="cell"
                          className="max-w-[200px] truncate px-4 py-2 text-2xs text-neutral-500 dark:text-neutral-400"
                          title={entry.details || ''}
                        >
                          {entry.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3 dark:border-neutral-700 sm:flex-row">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {total > 0 ? (
                  <span>
                    Showing{' '}
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {startRecord}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {endRecord}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {total}
                    </span>{' '}
                    entries
                  </span>
                ) : (
                  <span>No entries</span>
                )}
              </div>
              <nav aria-label="Audit log pagination" className="flex items-center gap-1">
                {/* First page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={page <= 1}
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
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
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
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {page}
                  </span>
                  <span className="mx-1">/</span>
                  <span>{totalPages}</span>
                </span>

                {/* Next page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
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
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page >= totalPages}
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
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          Audit log entries are read-only. All platform actions are automatically recorded.
          Entries are sorted by timestamp (newest first) by default.
        </p>
      </footer>
    </div>
  );
};

AuditLogPanel.propTypes = {
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
  /** Optional callback invoked when the refresh button is clicked. */
  onRefresh: PropTypes.func,
};

AuditLogPanel.defaultProps = {
  className: '',
  onRefresh: null,
};

export default AuditLogPanel;