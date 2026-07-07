import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import {
  listSchedules,
  getSchedule,
  createSchedule,
  editSchedule,
  pauseSchedule,
  resumeSchedule,
  deleteSchedule,
  runNow,
  getAllSchedules,
  getScheduleSummary,
  getDistinctTypes,
  getDistinctStatuses,
  getDistinctFrequencies,
} from '../services/schedulerService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PermissionDenied from '../components/common/PermissionDenied';
import PermissionGate from '../components/common/PermissionGate';
import StatusBadge from '../components/common/StatusBadge';
import ScoreCard from '../components/common/ScoreCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';

/**
 * Maps schedule status to StatusBadge variant.
 * @param {string} status - The schedule status.
 * @returns {string}
 */
const statusToVariant = (status) => {
  if (typeof status !== 'string') return 'neutral';
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'danger';
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
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1 && diffMs >= 0) {
      return 'Just now';
    }
    if (diffMinutes >= 0 && diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours >= 0 && diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays >= 0 && diffDays < 7) {
      return `${diffDays}d ago`;
    }
    // For future dates
    if (diffMs < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 0) {
        const futureHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
        if (futureHours === 0) {
          const futureMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
          return `in ${futureMinutes}m`;
        }
        return `in ${futureHours}h`;
      }
      if (futureDays < 7) {
        return `in ${futureDays}d`;
      }
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
};

/**
 * Formats a string for display (replaces underscores, capitalizes words).
 * @param {string} str - The string to format.
 * @returns {string}
 */
const formatLabel = (str) => {
  if (typeof str !== 'string' || str.trim() === '') {
    return '—';
  }
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats the access level for display.
 * @param {string} accessLevel - The raw access level string.
 * @returns {string}
 */
const formatAccessLevel = (accessLevel) => {
  if (typeof accessLevel !== 'string') return '';
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Valid schedule types.
 * @type {Array<{value: string, label: string}>}
 */
const SCHEDULE_TYPE_OPTIONS = [
  { value: 'review', label: 'Review' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'sync', label: 'Sync' },
  { value: 'report', label: 'Report' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'audit', label: 'Audit' },
];

/**
 * Valid schedule frequencies.
 * @type {Array<{value: string, label: string}>}
 */
const SCHEDULE_FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

/**
 * Valid schedule statuses.
 * @type {Array<{value: string, label: string}>}
 */
const SCHEDULE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Scheduler page for configuring test execution schedules.
 * Lists schedules with status, frequency, next run, last run.
 * Supports create, edit, pause, resume, disable, delete.
 * 'Run Now' triggers simulated execution and notification.
 * All actions permission-gated and audit-logged.
 *
 * @returns {React.ReactElement}
 */
const SchedulerPage = () => {
  const navigate = useNavigate();
  const { persona, canView, canCreate: personaCanCreate, canEdit: personaCanEdit, canDelete: personaCanDelete } = usePersona();

  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedLoading, setSimulatedLoading] = useState(true);

  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState({});
  const [actionResult, setActionResult] = useState(null);

  // Create/Edit modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Run Now result state
  const [runResultModalOpen, setRunResultModalOpen] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const hasViewPermission = useMemo(() => {
    return canView('SCHEDULE');
  }, [canView]);

  const hasCreatePermission = useMemo(() => {
    return personaCanCreate('SCHEDULE');
  }, [personaCanCreate]);

  const hasEditPermission = useMemo(() => {
    return personaCanEdit('SCHEDULE');
  }, [personaCanEdit]);

  const hasDeletePermission = useMemo(() => {
    return personaCanDelete('SCHEDULE');
  }, [personaCanDelete]);

  /**
   * Loads all schedules and summary data.
   */
  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const allSchedules = getAllSchedules();
      setSchedules(allSchedules);
      const summaryData = getScheduleSummary();
      setSummary(summaryData);
    } catch {
      setSchedules([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasViewPermission) {
      loadData();
    }
    const timer = setTimeout(() => {
      setSimulatedLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasViewPermission, loadData]);

  /**
   * Clears the action result after a delay.
   */
  const clearActionResult = useCallback(() => {
    setTimeout(() => {
      setActionResult(null);
    }, 5000);
  }, []);

  /**
   * Filters schedules based on current filter state.
   */
  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    if (typeof filterType === 'string' && filterType.trim() !== '') {
      const typeLower = filterType.trim().toLowerCase();
      result = result.filter(
        (s) => s && s.type && s.type.toLowerCase() === typeLower
      );
    }

    if (typeof filterStatus === 'string' && filterStatus.trim() !== '') {
      const statusLower = filterStatus.trim().toLowerCase();
      result = result.filter(
        (s) => s && s.status && s.status.toLowerCase() === statusLower
      );
    }

    if (typeof filterFrequency === 'string' && filterFrequency.trim() !== '') {
      const frequencyLower = filterFrequency.trim().toLowerCase();
      result = result.filter(
        (s) => s && s.frequency && s.frequency.toLowerCase() === frequencyLower
      );
    }

    if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const searchLower = searchTerm.trim().toLowerCase();
      result = result.filter((s) => {
        if (!s) return false;
        const searchableFields = [s.name, s.description, s.type, s.frequency, s.status];
        return searchableFields.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by nextRunDate ascending (upcoming first), then by name
    result.sort((a, b) => {
      const tsA = a && a.nextRunDate ? a.nextRunDate : '';
      const tsB = b && b.nextRunDate ? b.nextRunDate : '';
      if (tsA && tsB) return tsA.localeCompare(tsB);
      if (tsA) return -1;
      if (tsB) return 1;
      const nameA = a && a.name ? a.name : '';
      const nameB = b && b.name ? b.name : '';
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [schedules, filterType, filterStatus, filterFrequency, searchTerm]);

  const availableTypes = useMemo(() => {
    try {
      return getDistinctTypes();
    } catch {
      return [];
    }
  }, [schedules]);

  const availableStatuses = useMemo(() => {
    try {
      return getDistinctStatuses();
    } catch {
      return [];
    }
  }, [schedules]);

  const availableFrequencies = useMemo(() => {
    try {
      return getDistinctFrequencies();
    } catch {
      return [];
    }
  }, [schedules]);

  const hasActiveFilters = filterType !== '' || filterStatus !== '' || filterFrequency !== '' || searchTerm !== '';

  const handleClearFilters = useCallback(() => {
    setFilterType('');
    setFilterStatus('');
    setFilterFrequency('');
    setSearchTerm('');
  }, []);

  /**
   * Handles refresh action.
   */
  const handleRefresh = useCallback(() => {
    setSimulatedLoading(true);
    setActionResult(null);
    loadData();
    setTimeout(() => {
      setSimulatedLoading(false);
    }, 400);
  }, [loadData]);

  /**
   * Opens the create modal.
   */
  const handleOpenCreate = useCallback(() => {
    setFormMode('create');
    setEditTargetId(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      frequency: '',
      status: 'active',
      startDate: '',
      endDate: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  }, []);

  /**
   * Opens the edit modal for a specific schedule.
   * @param {Object} schedule - The schedule to edit.
   */
  const handleOpenEdit = useCallback((schedule) => {
    if (!schedule || !schedule.id) return;
    setFormMode('edit');
    setEditTargetId(schedule.id);
    setFormData({
      name: schedule.name || '',
      description: schedule.description || '',
      type: schedule.type || '',
      frequency: schedule.frequency || '',
      status: schedule.status || 'active',
      startDate: schedule.startDate || '',
      endDate: schedule.endDate || '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  }, []);

  /**
   * Closes the create/edit modal.
   */
  const handleCloseFormModal = useCallback(() => {
    setFormModalOpen(false);
    setFormData({});
    setFormErrors({});
    setEditTargetId(null);
  }, []);

  /**
   * Handles form field change.
   */
  const handleFormFieldChange = useCallback((name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /**
   * Validates the form data.
   * @returns {{ valid: boolean, errors: Object<string, string> }}
   */
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }
    if (!formData.type || formData.type.trim() === '') {
      errors.type = 'Type is required';
    }
    if (!formData.frequency || formData.frequency.trim() === '') {
      errors.frequency = 'Frequency is required';
    }
    if (!formData.startDate || formData.startDate.trim() === '') {
      errors.startDate = 'Start date is required';
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }, [formData]);

  /**
   * Handles form submission (create or edit).
   */
  const handleFormSubmit = useCallback(() => {
    const validation = validateForm();
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormLoading(true);
    setActionResult(null);

    try {
      if (formMode === 'create') {
        const result = createSchedule({
          name: formData.name.trim(),
          description: formData.description || '',
          type: formData.type.trim(),
          frequency: formData.frequency.trim(),
          status: formData.status || 'active',
          startDate: formData.startDate.trim(),
          endDate: formData.endDate || null,
        });

        if (result.success) {
          setActionResult({ type: 'success', message: `Schedule "${formData.name}" created successfully.` });
          setFormModalOpen(false);
          setFormData({});
          setFormErrors({});
          loadData();
          clearActionResult();
        } else {
          setFormErrors({ _form: result.error || 'Failed to create schedule' });
        }
      } else if (formMode === 'edit' && editTargetId) {
        const result = editSchedule(editTargetId, {
          name: formData.name.trim(),
          description: formData.description || '',
          type: formData.type.trim(),
          frequency: formData.frequency.trim(),
          status: formData.status || undefined,
          startDate: formData.startDate.trim(),
          endDate: formData.endDate || null,
        });

        if (result.success) {
          setActionResult({ type: 'success', message: `Schedule "${formData.name}" updated successfully.` });
          setFormModalOpen(false);
          setFormData({});
          setFormErrors({});
          setEditTargetId(null);
          loadData();
          clearActionResult();
        } else {
          setFormErrors({ _form: result.error || 'Failed to update schedule' });
        }
      }
    } catch (err) {
      setFormErrors({ _form: err && err.message ? err.message : 'An error occurred' });
    } finally {
      setFormLoading(false);
    }
  }, [formMode, formData, editTargetId, validateForm, loadData, clearActionResult]);

  /**
   * Handles pause action for a schedule.
   * @param {string} scheduleId - The schedule ID.
   */
  const handlePause = useCallback(
    (scheduleId) => {
      if (!scheduleId || actionLoading[scheduleId]) return;

      setActionLoading((prev) => ({ ...prev, [scheduleId]: 'pausing' }));
      setActionResult(null);

      try {
        const result = pauseSchedule(scheduleId);
        if (result.success) {
          setActionResult({ type: 'success', message: `Schedule paused successfully.` });
          loadData();
          clearActionResult();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to pause schedule.' });
          clearActionResult();
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to pause schedule.' });
        clearActionResult();
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[scheduleId];
          return next;
        });
      }
    },
    [actionLoading, loadData, clearActionResult]
  );

  /**
   * Handles resume action for a schedule.
   * @param {string} scheduleId - The schedule ID.
   */
  const handleResume = useCallback(
    (scheduleId) => {
      if (!scheduleId || actionLoading[scheduleId]) return;

      setActionLoading((prev) => ({ ...prev, [scheduleId]: 'resuming' }));
      setActionResult(null);

      try {
        const result = resumeSchedule(scheduleId);
        if (result.success) {
          setActionResult({ type: 'success', message: `Schedule resumed successfully.` });
          loadData();
          clearActionResult();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to resume schedule.' });
          clearActionResult();
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to resume schedule.' });
        clearActionResult();
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[scheduleId];
          return next;
        });
      }
    },
    [actionLoading, loadData, clearActionResult]
  );

  /**
   * Handles Run Now action for a schedule.
   * @param {string} scheduleId - The schedule ID.
   */
  const handleRunNow = useCallback(
    async (scheduleId) => {
      if (!scheduleId || actionLoading[scheduleId]) return;

      setActionLoading((prev) => ({ ...prev, [scheduleId]: 'running' }));
      setActionResult(null);

      try {
        const result = await runNow(scheduleId, 800);
        if (result.success && result.data) {
          setRunResult(result.data);
          setRunResultModalOpen(true);
          loadData();
        } else {
          setActionResult({ type: 'error', message: result.error || 'Failed to run schedule.' });
          clearActionResult();
        }
      } catch (err) {
        setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to run schedule.' });
        clearActionResult();
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[scheduleId];
          return next;
        });
      }
    },
    [actionLoading, loadData, clearActionResult]
  );

  /**
   * Opens the delete confirmation dialog.
   * @param {string} id - The schedule ID.
   * @param {string} name - The schedule name.
   */
  const handleOpenDelete = useCallback((id, name) => {
    if (!id) return;
    setDeleteTargetId(id);
    setDeleteTargetName(name || id);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * Confirms the delete action.
   */
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTargetId) return;

    setDeleteLoading(true);
    setActionResult(null);

    try {
      const result = deleteSchedule(deleteTargetId);
      if (result.success) {
        setActionResult({ type: 'success', message: `Schedule "${deleteTargetName}" deleted successfully.` });
        setDeleteDialogOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetName('');
        loadData();
        clearActionResult();
      } else {
        setActionResult({ type: 'error', message: result.error || 'Failed to delete schedule.' });
        setDeleteDialogOpen(false);
        clearActionResult();
      }
    } catch (err) {
      setActionResult({ type: 'error', message: err && err.message ? err.message : 'Failed to delete schedule.' });
      setDeleteDialogOpen(false);
      clearActionResult();
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTargetId, deleteTargetName, loadData, clearActionResult]);

  /**
   * Cancels the delete action.
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  }, []);

  /**
   * Closes the run result modal.
   */
  const handleCloseRunResult = useCallback(() => {
    setRunResultModalOpen(false);
    setRunResult(null);
  }, []);

  /**
   * Navigates to the schedule detail page.
   * @param {string} scheduleId - The schedule ID.
   */
  const handleViewDetail = useCallback(
    (scheduleId) => {
      if (scheduleId) {
        navigate(`/schedules/${scheduleId}`);
      }
    },
    [navigate]
  );

  // Handle permission denied
  if (!hasViewPermission) {
    return (
      <PermissionDenied
        title="Access Denied — Schedules"
        entityType="SCHEDULE"
        action="view"
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const isLoading = simulatedLoading || loading;

  if (isLoading && schedules.length === 0) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading schedules"
      >
        <LoadingSpinner size="lg" label="Loading schedules..." />
      </div>
    );
  }

  if (!isLoading && schedules.length === 0) {
    return (
      <div className="space-y-6" role="region" aria-label="Schedules">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Schedules
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              No schedules found
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
              aria-label="Refresh schedules"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Refresh</span>
            </button>
            <PermissionGate entityType="SCHEDULE" action="create">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
                aria-label="Create new schedule"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Create Schedule</span>
              </button>
            </PermissionGate>
          </div>
        </header>
        <EmptyState
          title="No Schedules Found"
          message="No schedule records are available. Create a new schedule to get started."
          actionLabel={hasCreatePermission ? 'Create Schedule' : 'Refresh'}
          onAction={hasCreatePermission ? handleOpenCreate : handleRefresh}
        />
        {/* Create Modal */}
        <Modal
          isOpen={formModalOpen}
          onClose={handleCloseFormModal}
          title="Create Schedule"
          size="md"
        >
          {renderFormContent()}
        </Modal>
      </div>
    );
  }

  /**
   * Renders the form content for create/edit modal.
   * @returns {React.ReactElement}
   */
  function renderFormContent() {
    return (
      <div className="space-y-4">
        {formErrors._form && (
          <div
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
          >
            {formErrors._form}
          </div>
        )}

        <FormField
          name="name"
          label="Name"
          type="text"
          value={formData.name || ''}
          onChange={handleFormFieldChange}
          error={formErrors.name || null}
          required
          placeholder="Schedule name"
        />

        <FormField
          name="description"
          label="Description"
          type="textarea"
          value={formData.description || ''}
          onChange={handleFormFieldChange}
          error={formErrors.description || null}
          placeholder="Schedule description"
          rows={3}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="type"
            label="Type"
            type="select"
            value={formData.type || ''}
            onChange={handleFormFieldChange}
            error={formErrors.type || null}
            required
            options={SCHEDULE_TYPE_OPTIONS}
            placeholder="Select type"
          />

          <FormField
            name="frequency"
            label="Frequency"
            type="select"
            value={formData.frequency || ''}
            onChange={handleFormFieldChange}
            error={formErrors.frequency || null}
            required
            options={SCHEDULE_FREQUENCY_OPTIONS}
            placeholder="Select frequency"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="startDate"
            label="Start Date"
            type="date"
            value={formData.startDate || ''}
            onChange={handleFormFieldChange}
            error={formErrors.startDate || null}
            required
          />

          <FormField
            name="endDate"
            label="End Date"
            type="date"
            value={formData.endDate || ''}
            onChange={handleFormFieldChange}
            error={formErrors.endDate || null}
          />
        </div>

        {formMode === 'edit' && (
          <FormField
            name="status"
            label="Status"
            type="select"
            value={formData.status || ''}
            onChange={handleFormFieldChange}
            error={formErrors.status || null}
            options={SCHEDULE_STATUS_OPTIONS}
          />
        )}

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleCloseFormModal}
            disabled={formLoading}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={formLoading}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={formMode === 'create' ? 'Create schedule' : 'Save changes'}
          >
            {formLoading && (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            <span>{formLoading ? (formMode === 'create' ? 'Creating...' : 'Saving...') : (formMode === 'create' ? 'Create Schedule' : 'Save Changes')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Schedules">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Schedules
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
            <span className="mx-1.5">·</span>
            <span className="font-medium">{formatAccessLevel(persona.accessLevel)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
            aria-label="Refresh schedules"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh</span>
          </button>
          <PermissionGate entityType="SCHEDULE" action="create">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
              aria-label="Create new schedule"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Create Schedule</span>
            </button>
          </PermissionGate>
        </div>
      </header>

      {/* Action result banner */}
      {actionResult && (
        <div
          className={`rounded-lg p-3 text-sm ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
          role="alert"
        >
          {actionResult.message}
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <section aria-label="Schedule summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            label="Total Schedules"
            value={summary.total}
            description={`${summary.active} active`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Active"
            value={summary.active}
            trend={summary.active > summary.paused ? 'up' : 'stable'}
            description={`${summary.paused} paused`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Completed"
            value={summary.completed}
            description={`${summary.cancelled} cancelled`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />
          <ScoreCard
            label="Upcoming (7d)"
            value={summary.upcomingCount}
            description="Scheduled within 7 days"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
        </section>
      )}

      {/* Filters */}
      <section aria-label="Schedule filters" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <label htmlFor="schedule-search" className="sr-only">
              Search schedules
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="schedule-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search schedules..."
                className="input pl-9 pr-8 text-sm"
                aria-label="Search schedules"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-2 text-xs max-w-[140px]"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-2 text-xs max-w-[140px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          {/* Frequency filter */}
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="input py-2 text-xs max-w-[140px]"
            aria-label="Filter by frequency"
          >
            <option value="">All Frequencies</option>
            {availableFrequencies.map((freq) => (
              <option key={freq} value={freq}>
                {formatLabel(freq)}
              </option>
            ))}
          </select>

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
        </div>

        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {filteredSchedules.length} of {schedules.length} shown
        </div>
      </section>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <EmptyState
          title="No Matching Schedules"
          message="No schedules match your current filters. Try adjusting your search or filter criteria."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Schedule List
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {filteredSchedules.length} result{filteredSchedules.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
              role="table"
              aria-label="Schedules table"
            >
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr role="row">
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Name
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Status
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Type
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Frequency
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Next Run
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Last Run
                  </th>
                  <th role="columnheader" scope="col" className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                {filteredSchedules.map((schedule) => {
                  if (!schedule || !schedule.id) return null;

                  const isActionLoading = !!actionLoading[schedule.id];
                  const currentAction = actionLoading[schedule.id] || null;

                  return (
                    <tr
                      key={schedule.id}
                      role="row"
                      className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                    >
                      {/* Name */}
                      <td role="cell" className="px-4 py-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(schedule.id)}
                            className="truncate text-sm font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline text-left"
                            aria-label={`View details for ${schedule.name || schedule.id}`}
                          >
                            {schedule.name || schedule.id}
                          </button>
                          {schedule.description && (
                            <p className="mt-0.5 truncate text-2xs text-neutral-500 dark:text-neutral-400 max-w-[200px]" title={schedule.description}>
                              {schedule.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3">
                        <StatusBadge
                          status={schedule.status || 'unknown'}
                          variant={statusToVariant(schedule.status)}
                          size="sm"
                        />
                      </td>

                      {/* Type */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">
                        {formatLabel(schedule.type)}
                      </td>

                      {/* Frequency */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">
                        {formatLabel(schedule.frequency)}
                      </td>

                      {/* Next Run */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                        {formatTimestamp(schedule.nextRunDate)}
                      </td>

                      {/* Last Run */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                        {formatTimestamp(schedule.lastRunDate)}
                      </td>

                      {/* Actions */}
                      <td role="cell" className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Run Now */}
                          {hasEditPermission && schedule.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleRunNow(schedule.id)}
                              disabled={isActionLoading}
                              className="btn-outline flex items-center gap-1 px-2 py-1 text-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Run now: ${schedule.name || schedule.id}`}
                              title="Run Now"
                            >
                              {currentAction === 'running' ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>{currentAction === 'running' ? 'Running...' : 'Run'}</span>
                            </button>
                          )}

                          {/* Pause / Resume */}
                          {hasEditPermission && schedule.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handlePause(schedule.id)}
                              disabled={isActionLoading}
                              className="btn-outline flex items-center gap-1 px-2 py-1 text-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Pause: ${schedule.name || schedule.id}`}
                              title="Pause"
                            >
                              {currentAction === 'pausing' ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" aria-hidden="true" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>Pause</span>
                            </button>
                          )}

                          {hasEditPermission && schedule.status === 'paused' && (
                            <button
                              type="button"
                              onClick={() => handleResume(schedule.id)}
                              disabled={isActionLoading}
                              className="btn-outline flex items-center gap-1 px-2 py-1 text-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Resume: ${schedule.name || schedule.id}`}
                              title="Resume"
                            >
                              {currentAction === 'resuming' ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-500 border-t-transparent" aria-hidden="true" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>Resume</span>
                            </button>
                          )}

                          {/* Edit */}
                          {hasEditPermission && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(schedule)}
                              disabled={isActionLoading}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Edit: ${schedule.name || schedule.id}`}
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          )}

                          {/* Delete */}
                          {hasDeletePermission && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(schedule.id, schedule.name)}
                              disabled={isActionLoading}
                              className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Delete: ${schedule.name || schedule.id}`}
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer note */}
      <footer className="text-center">
        <p className="text-2xs text-neutral-400 dark:text-neutral-500">
          All schedule executions are simulated. No real background processes or timers are used.
          Run Now triggers a simulated execution with deterministic results and generates a notification.
          All actions are audit-logged. Persona: {persona.name}.
        </p>
      </footer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        title={formMode === 'create' ? 'Create Schedule' : 'Edit Schedule'}
        size="md"
      >
        {renderFormContent()}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Schedule"
        message={`Are you sure you want to delete "${deleteTargetName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Run Result Modal */}
      <Modal
        isOpen={runResultModalOpen}
        onClose={handleCloseRunResult}
        title="Execution Result"
        size="md"
      >
        {runResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-2xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                simulated
              </span>
              {runResult.execution && (
                <StatusBadge
                  status={runResult.execution.result || 'unknown'}
                  variant={runResult.execution.result === 'passed' ? 'success' : 'danger'}
                  size="sm"
                />
              )}
            </div>

            {/* Schedule info */}
            {runResult.schedule && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {runResult.schedule.name || 'Schedule'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatLabel(runResult.schedule.type)} · {formatLabel(runResult.schedule.frequency)}
                </p>
              </div>
            )}

            {/* Execution details */}
            {runResult.execution && (
              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/50 space-y-2">
                <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Execution Details
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Result</span>
                    <span className={`font-medium ${runResult.execution.result === 'passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {runResult.execution.result === 'passed' ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Duration</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {runResult.execution.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Executed At</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {formatTimestamp(runResult.execution.executedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Executed By</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {runResult.execution.executedBy || '—'}
                    </span>
                  </div>
                </div>

                {/* Test summary */}
                {runResult.execution.summary && (
                  <div className="mt-3 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                      Test Summary
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center dark:border-neutral-700 dark:bg-neutral-800">
                        <p className="text-2xs text-neutral-500 dark:text-neutral-400">Total</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {runResult.execution.summary.total}
                        </p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center dark:border-neutral-700 dark:bg-neutral-800">
                        <p className="text-2xs text-neutral-500 dark:text-neutral-400">Passed</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {runResult.execution.summary.passed}
                        </p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center dark:border-neutral-700 dark:bg-neutral-800">
                        <p className="text-2xs text-neutral-500 dark:text-neutral-400">Failed</p>
                        <p className={`text-sm font-bold ${runResult.execution.summary.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          {runResult.execution.summary.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Updated schedule info */}
            {runResult.schedule && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Schedule Status</span>
                  <StatusBadge
                    status={runResult.schedule.status || 'unknown'}
                    variant={statusToVariant(runResult.schedule.status)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Last Run</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {formatTimestamp(runResult.schedule.lastRunDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Next Run</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {formatTimestamp(runResult.schedule.nextRunDate)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleCloseRunResult}
                className="btn-primary px-4 py-2 text-sm"
                aria-label="Close execution result"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SchedulerPage;