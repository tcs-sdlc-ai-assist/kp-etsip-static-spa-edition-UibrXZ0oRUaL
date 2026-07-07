import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';
import { PersonaProvider } from '../../contexts/PersonaContext';
import { STORAGE_KEYS } from '../../constants/constants';

// Mock exportUtils to prevent actual file downloads
vi.mock('../../utils/exportUtils', () => ({
  exportToCSV: vi.fn(() => true),
  exportToJSON: vi.fn(() => true),
  exportToXLSX: vi.fn(() => true),
  exportToPDF: vi.fn(() => true),
  generateStubFile: vi.fn(() => true),
}));

/**
 * Sets up localStorage with admin persona and minimal seed data
 * so PersonaContext can resolve permissions.
 */
const setupLocalStorage = () => {
  localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-platform-administrator'));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
    {
      id: 'persona-platform-administrator',
      username: 'admin',
      email: 'admin@kpetsip.example.com',
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      accessLevel: 'admin',
      status: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      version: 1,
    },
  ]));
  localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_CATEGORIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_STANDARDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_ENTRIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEFINITIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TECH_DEBT, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.QUALITY_GATES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.GOVERNANCE_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.APPROVAL_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WAIVERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.AI_ANALYSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USE_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PDE_CONFIGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEMO_SCENARIOS, JSON.stringify([]));
};

/**
 * Wraps a component with PersonaProvider for permission-gated rendering.
 */
const renderWithProviders = (ui) => {
  return render(
    <PersonaProvider>
      {ui}
    </PersonaProvider>
  );
};

/**
 * Sample columns for testing.
 */
const sampleColumns = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true, filterOptions: ['active', 'inactive', 'retired'] },
  { key: 'score', label: 'Score', sortable: false },
];

/**
 * Sample data for testing.
 */
const sampleData = [
  { id: 'PF-001', name: 'Alpha Portfolio', status: 'active', score: 85 },
  { id: 'PF-002', name: 'Beta Portfolio', status: 'inactive', score: 60 },
  { id: 'PF-003', name: 'Gamma Portfolio', status: 'active', score: 92 },
  { id: 'PF-004', name: 'Delta Portfolio', status: 'retired', score: 45 },
  { id: 'PF-005', name: 'Epsilon Portfolio', status: 'active', score: 78 },
];

describe('DataTable', () => {
  beforeEach(() => {
    localStorage.clear();
    setupLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('rendering columns and data', () => {
    it('renders all column headers', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      expect(screen.getByText('ID')).toBeDefined();
      expect(screen.getByText('Name')).toBeDefined();
      expect(screen.getByText('Status')).toBeDefined();
      expect(screen.getByText('Score')).toBeDefined();
    });

    it('renders all data rows', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      expect(screen.getByText('Alpha Portfolio')).toBeDefined();
      expect(screen.getByText('Beta Portfolio')).toBeDefined();
      expect(screen.getByText('Gamma Portfolio')).toBeDefined();
      expect(screen.getByText('Delta Portfolio')).toBeDefined();
      expect(screen.getByText('Epsilon Portfolio')).toBeDefined();
    });

    it('renders cell values for each column', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      expect(screen.getByText('PF-001')).toBeDefined();
      expect(screen.getByText('85')).toBeDefined();
      expect(screen.getByText('active')).toBeDefined();
    });

    it('renders empty state when no data is provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={[]}
          totalCount={0}
        />
      );

      expect(screen.getByText('No data available.')).toBeDefined();
    });

    it('renders loading state when loading is true', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={[]}
          totalCount={0}
          loading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('renders null cell values as dash', () => {
      const dataWithNull = [
        { id: 'PF-001', name: null, status: 'active', score: null },
      ];

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={dataWithNull}
          totalCount={1}
        />
      );

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it('renders boolean values as Yes/No badges', () => {
      const boolColumns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'isActive', label: 'Active', sortable: false },
      ];
      const boolData = [
        { id: 'PF-001', isActive: true },
        { id: 'PF-002', isActive: false },
      ];

      renderWithProviders(
        <DataTable
          columns={boolColumns}
          data={boolData}
          totalCount={2}
        />
      );

      expect(screen.getByText('Yes')).toBeDefined();
      expect(screen.getByText('No')).toBeDefined();
    });

    it('renders custom render function for columns', () => {
      const customColumns = [
        { key: 'id', label: 'ID', sortable: true },
        {
          key: 'name',
          label: 'Name',
          sortable: true,
          render: (value) => {
            return <span data-testid="custom-render">{`Custom: ${value}`}</span>;
          },
        },
      ];

      renderWithProviders(
        <DataTable
          columns={customColumns}
          data={[{ id: 'PF-001', name: 'Test' }]}
          totalCount={1}
        />
      );

      expect(screen.getByText('Custom: Test')).toBeDefined();
      expect(screen.getByTestId('custom-render')).toBeDefined();
    });
  });

  describe('ARIA roles and accessibility', () => {
    it('renders a table with role="table"', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeDefined();
    });

    it('renders column headers with role="columnheader"', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(sampleColumns.length);
    });

    it('renders rows with role="row"', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const rows = screen.getAllByRole('row');
      // Header row + data rows
      expect(rows.length).toBe(sampleData.length + 1);
    });

    it('renders cells with role="cell"', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBe(sampleData.length * sampleColumns.length);
    });

    it('renders sortable column headers with aria-sort attribute', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          sortField="name"
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const nameHeader = columnHeaders.find((h) => h.textContent.includes('Name'));
      expect(nameHeader).toBeDefined();
      expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    });

    it('renders non-sortable column headers without aria-sort', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          sortField="name"
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const scoreHeader = columnHeaders.find((h) => h.textContent.includes('Score'));
      expect(scoreHeader).toBeDefined();
      expect(scoreHeader.getAttribute('aria-sort')).toBeNull();
    });

    it('renders search input with aria-label', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSearch={() => {}}
        />
      );

      const searchInput = screen.getByLabelText('Search table data');
      expect(searchInput).toBeDefined();
    });

    it('renders pagination navigation with aria-label', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={1}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const nav = screen.getByLabelText('Table pagination');
      expect(nav).toBeDefined();
    });
  });

  describe('search functionality', () => {
    it('renders search input', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSearch={() => {}}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeDefined();
    });

    it('calls onSearch when user types in search input', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
      });
    });

    it('displays clear search button when search has value', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          search="Alpha"
          onSearch={onSearch}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeDefined();
    });

    it('calls onSearch with empty string when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          search="Alpha"
          onSearch={onSearch}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('syncs local search state with search prop', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          search="Beta"
          onSearch={() => {}}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput.value).toBe('Beta');
    });
  });

  describe('sort functionality', () => {
    it('calls onSort when a sortable column header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSort={onSort}
          sortField=""
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const nameHeader = columnHeaders.find((h) => h.textContent.includes('Name'));
      await user.click(nameHeader);

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('toggles sort direction when same column is clicked again', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSort={onSort}
          sortField="name"
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const nameHeader = columnHeaders.find((h) => h.textContent.includes('Name'));
      await user.click(nameHeader);

      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('does not call onSort when a non-sortable column header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSort={onSort}
          sortField=""
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const scoreHeader = columnHeaders.find((h) => h.textContent.includes('Score'));
      await user.click(scoreHeader);

      expect(onSort).not.toHaveBeenCalled();
    });

    it('displays ascending sort indicator for sorted column', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          sortField="name"
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const nameHeader = columnHeaders.find((h) => h.textContent.includes('Name'));
      expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    });

    it('displays descending sort indicator for sorted column', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          sortField="name"
          sortDirection="desc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const nameHeader = columnHeaders.find((h) => h.textContent.includes('Name'));
      expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
    });

    it('handles keyboard Enter on sortable column header', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSort={onSort}
          sortField=""
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const idHeader = columnHeaders.find((h) => h.textContent.includes('ID'));
      idHeader.focus();
      await user.keyboard('{Enter}');

      expect(onSort).toHaveBeenCalledWith('id', 'asc');
    });

    it('handles keyboard Space on sortable column header', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSort={onSort}
          sortField=""
          sortDirection="asc"
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      const idHeader = columnHeaders.find((h) => h.textContent.includes('ID'));
      idHeader.focus();
      await user.keyboard(' ');

      expect(onSort).toHaveBeenCalledWith('id', 'asc');
    });
  });

  describe('pagination', () => {
    it('renders pagination controls', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={1}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByLabelText('Go to first page')).toBeDefined();
      expect(screen.getByLabelText('Go to previous page')).toBeDefined();
      expect(screen.getByLabelText('Go to next page')).toBeDefined();
      expect(screen.getByLabelText('Go to last page')).toBeDefined();
    });

    it('displays correct record count information', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={1}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('25')).toBeDefined();
    });

    it('disables previous and first page buttons on first page', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={1}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const firstPageBtn = screen.getByLabelText('Go to first page');
      const prevPageBtn = screen.getByLabelText('Go to previous page');
      expect(firstPageBtn.disabled).toBe(true);
      expect(prevPageBtn.disabled).toBe(true);
    });

    it('disables next and last page buttons on last page', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={5}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const nextPageBtn = screen.getByLabelText('Go to next page');
      const lastPageBtn = screen.getByLabelText('Go to last page');
      expect(nextPageBtn.disabled).toBe(true);
      expect(lastPageBtn.disabled).toBe(true);
    });

    it('calls onPageChange when next page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={1}
          pageSize={5}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextPageBtn = screen.getByLabelText('Go to next page');
      await user.click(nextPageBtn);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={3}
          pageSize={5}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const prevPageBtn = screen.getByLabelText('Go to previous page');
      await user.click(prevPageBtn);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when first page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={3}
          pageSize={5}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const firstPageBtn = screen.getByLabelText('Go to first page');
      await user.click(firstPageBtn);

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange when last page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={2}
          pageSize={5}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const lastPageBtn = screen.getByLabelText('Go to last page');
      await user.click(lastPageBtn);

      expect(onPageChange).toHaveBeenCalledWith(5);
    });

    it('displays page indicator with current page and total pages', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={25}
          page={3}
          pageSize={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByText('3')).toBeDefined();
      expect(screen.getByText('/')).toBeDefined();
    });

    it('displays "No results" when totalCount is 0', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={[]}
          totalCount={0}
          page={1}
          pageSize={5}
          totalPages={1}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByText('No results')).toBeDefined();
    });
  });

  describe('page size selector', () => {
    it('renders page size selector when onPageSizeChange is provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          pageSize={20}
          onPageSizeChange={() => {}}
        />
      );

      const pageSizeSelect = screen.getByLabelText('Rows per page');
      expect(pageSizeSelect).toBeDefined();
    });

    it('calls onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup();
      const onPageSizeChange = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          pageSize={20}
          onPageSizeChange={onPageSizeChange}
        />
      );

      const pageSizeSelect = screen.getByLabelText('Rows per page');
      await user.selectOptions(pageSizeSelect, '50');

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('does not render page size selector when onPageSizeChange is not provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          pageSize={20}
        />
      );

      const pageSizeSelect = screen.queryByLabelText('Rows per page');
      expect(pageSizeSelect).toBeNull();
    });
  });

  describe('filter functionality', () => {
    it('renders filter button when columns have filterOptions', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onFilter={() => {}}
        />
      );

      const filterButton = screen.getByLabelText('Filters');
      expect(filterButton).toBeDefined();
    });

    it('does not render filter button when no columns have filterOptions', () => {
      const noFilterColumns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
      ];

      renderWithProviders(
        <DataTable
          columns={noFilterColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onFilter={() => {}}
        />
      );

      const filterButton = screen.queryByLabelText('Filters');
      expect(filterButton).toBeNull();
    });

    it('opens filter dropdown when filter button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onFilter={() => {}}
        />
      );

      const filterButton = screen.getByLabelText('Filters');
      await user.click(filterButton);

      const filterDialog = screen.getByLabelText('Filter options');
      expect(filterDialog).toBeDefined();
    });

    it('displays active filter count badge', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onFilter={() => {}}
          filters={{ status: 'active' }}
        />
      );

      const filterButton = screen.getByLabelText('Filters (1 active)');
      expect(filterButton).toBeDefined();
    });
  });

  describe('column visibility toggle', () => {
    it('renders column toggle button when onToggleColumn is provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onToggleColumn={() => {}}
          visibleColumns={['id', 'name', 'status', 'score']}
        />
      );

      const toggleButton = screen.getByLabelText('Toggle column visibility');
      expect(toggleButton).toBeDefined();
    });

    it('does not render column toggle button when onToggleColumn is not provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const toggleButton = screen.queryByLabelText('Toggle column visibility');
      expect(toggleButton).toBeNull();
    });

    it('opens column visibility dropdown when toggle button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onToggleColumn={() => {}}
          visibleColumns={['id', 'name', 'status', 'score']}
        />
      );

      const toggleButton = screen.getByLabelText('Toggle column visibility');
      await user.click(toggleButton);

      const dialog = screen.getByLabelText('Column visibility');
      expect(dialog).toBeDefined();
    });

    it('only renders visible columns in the table', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onToggleColumn={() => {}}
          visibleColumns={['id', 'name']}
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(2);
      expect(columnHeaders[0].textContent).toContain('ID');
      expect(columnHeaders[1].textContent).toContain('Name');
    });
  });

  describe('export functionality', () => {
    it('renders export button when entityType is provided (admin persona)', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          entityType="PORTFOLIO"
        />
      );

      const exportButton = screen.getByLabelText('Export data');
      expect(exportButton).toBeDefined();
    });

    it('does not render export button when entityType is not provided', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
        />
      );

      const exportButton = screen.queryByLabelText('Export data');
      expect(exportButton).toBeNull();
    });

    it('opens export dropdown when export button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          entityType="PORTFOLIO"
        />
      );

      const exportButton = screen.getByLabelText('Export data');
      await user.click(exportButton);

      const exportMenu = screen.getByLabelText('Export formats');
      expect(exportMenu).toBeDefined();
    });

    it('displays export format options in the dropdown', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          entityType="PORTFOLIO"
        />
      );

      const exportButton = screen.getByLabelText('Export data');
      await user.click(exportButton);

      expect(screen.getByText('CSV')).toBeDefined();
      expect(screen.getByText('JSON')).toBeDefined();
      expect(screen.getByText('Excel (XLSX)')).toBeDefined();
      expect(screen.getByText('PDF (Print)')).toBeDefined();
    });

    it('calls onExport when a format is selected and onExport is provided', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          entityType="PORTFOLIO"
          onExport={onExport}
        />
      );

      const exportButton = screen.getByLabelText('Export data');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV');
      await user.click(csvOption);

      expect(onExport).toHaveBeenCalledWith('csv');
    });

    it('does not render export button for external persona without export permission', () => {
      localStorage.setItem('kp_etsip_active_persona', JSON.stringify('persona-vendor-partner'));

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          entityType="PORTFOLIO"
        />
      );

      const exportButton = screen.queryByLabelText('Export data');
      expect(exportButton).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles array cell values by joining them', () => {
      const arrayColumns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'tags', label: 'Tags', sortable: false },
      ];
      const arrayData = [
        { id: 'PF-001', tags: ['critical', 'cloud-native', 'security'] },
      ];

      renderWithProviders(
        <DataTable
          columns={arrayColumns}
          data={arrayData}
          totalCount={1}
        />
      );

      expect(screen.getByText('critical, cloud-native, security')).toBeDefined();
    });

    it('handles undefined data gracefully', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={undefined}
          totalCount={0}
        />
      );

      expect(screen.getByText('No data available.')).toBeDefined();
    });

    it('renders with minimal props', () => {
      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={[]}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeDefined();
    });

    it('handles data with missing fields gracefully', () => {
      const sparseData = [
        { id: 'PF-001' },
      ];

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sparseData}
          totalCount={1}
        />
      );

      expect(screen.getByText('PF-001')).toBeDefined();
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('handles search form submission', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      renderWithProviders(
        <DataTable
          columns={sampleColumns}
          data={sampleData}
          totalCount={sampleData.length}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'test{Enter}');

      expect(onSearch).toHaveBeenCalled();
    });
  });
});