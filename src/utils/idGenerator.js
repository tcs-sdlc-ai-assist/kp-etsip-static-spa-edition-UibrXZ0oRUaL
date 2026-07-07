import { ID_PREFIXES, STORAGE_KEYS } from '../constants/constants';

/**
 * In-memory counters keyed by prefix string.
 * @type {Object<string, number>}
 */
const counters = {};

/**
 * localStorage key used to persist ID counters across sessions.
 * @type {string}
 */
const COUNTER_STORAGE_KEY = 'kp_etsip_id_counters';

/**
 * Loads persisted counters from localStorage into memory.
 * Called once on module initialization.
 */
const loadCounters = () => {
  try {
    const stored = localStorage.getItem(COUNTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.entries(parsed).forEach(([prefix, value]) => {
          if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
            counters[prefix] = value;
          }
        });
      }
    }
  } catch {
    // If localStorage is unavailable or data is corrupt, start fresh
  }
};

/**
 * Persists the current in-memory counters to localStorage.
 */
const saveCounters = () => {
  try {
    localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(counters));
  } catch {
    // If localStorage is unavailable, counters remain in memory only
  }
};

// Initialize counters from localStorage on module load
loadCounters();

/**
 * Pads a number with leading zeros to ensure a minimum width.
 * @param {number} num - The number to pad.
 * @param {number} width - The minimum width of the resulting string.
 * @returns {string} Zero-padded number string.
 */
const padNumber = (num, width) => {
  return String(num).padStart(width, '0');
};

/**
 * Generates a human-readable ID with the given prefix and optional sequence number.
 *
 * If a sequence number is provided, it is used directly and the internal counter
 * is updated if the sequence exceeds the current counter value.
 *
 * If no sequence number is provided, the internal per-prefix counter is incremented
 * and used as the sequence number.
 *
 * IDs are formatted as PREFIX + zero-padded sequence, e.g., "PF-001", "APP-042".
 *
 * @param {string} prefix - The ID prefix (e.g., 'PF-', 'APP-'). Should be one of ID_PREFIXES values.
 * @param {number} [sequence] - Optional explicit sequence number. If omitted, auto-increments.
 * @returns {string} The generated ID string.
 */
export const generateId = (prefix, sequence) => {
  if (typeof prefix !== 'string' || prefix.trim() === '') {
    throw new Error('Prefix must be a non-empty string');
  }

  let seq;

  if (typeof sequence === 'number' && Number.isFinite(sequence) && sequence >= 0) {
    seq = Math.floor(sequence);
    // Update counter if the explicit sequence exceeds the current counter
    const current = counters[prefix] || 0;
    if (seq >= current) {
      counters[prefix] = seq + 1;
      saveCounters();
    }
  } else {
    // Auto-increment
    if (counters[prefix] === undefined) {
      counters[prefix] = 0;
    }
    counters[prefix] += 1;
    seq = counters[prefix];
    saveCounters();
  }

  // Use 3-digit padding for sequences under 1000, otherwise use natural width
  const width = seq < 1000 ? 3 : String(seq).length;
  return `${prefix}${padNumber(seq, width)}`;
};

/**
 * Returns the current counter value for a given prefix without incrementing.
 * @param {string} prefix - The ID prefix to query.
 * @returns {number} The current counter value, or 0 if no IDs have been generated for this prefix.
 */
export const getCurrentCounter = (prefix) => {
  if (typeof prefix !== 'string') {
    return 0;
  }
  return counters[prefix] || 0;
};

/**
 * Sets the counter for a given prefix to a specific value.
 * Useful when syncing with existing data (e.g., after loading seed data).
 * @param {string} prefix - The ID prefix to set.
 * @param {number} value - The counter value to set.
 */
export const setCounter = (prefix, value) => {
  if (typeof prefix !== 'string' || prefix.trim() === '') {
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return;
  }
  counters[prefix] = Math.floor(value);
  saveCounters();
};

/**
 * Resets the counter for a given prefix back to 0.
 * @param {string} prefix - The ID prefix to reset.
 */
export const resetCounter = (prefix) => {
  if (typeof prefix !== 'string') {
    return;
  }
  delete counters[prefix];
  saveCounters();
};

/**
 * Resets all counters back to 0 and clears persisted state.
 */
export const resetAllCounters = () => {
  Object.keys(counters).forEach((key) => {
    delete counters[key];
  });
  saveCounters();
};

/**
 * Synchronizes counters with an existing dataset by scanning all IDs and
 * setting each prefix counter to the maximum sequence number found.
 *
 * @param {Array<{id: string}>} records - Array of records with id fields to scan.
 */
export const syncCountersWithData = (records) => {
  if (!Array.isArray(records)) {
    return;
  }

  const prefixValues = Object.values(ID_PREFIXES);

  records.forEach((record) => {
    if (!record || typeof record.id !== 'string') {
      return;
    }

    const id = record.id;

    for (const prefix of prefixValues) {
      if (id.startsWith(prefix)) {
        const sequencePart = id.slice(prefix.length);
        const num = parseInt(sequencePart, 10);
        if (!Number.isNaN(num) && num >= 0) {
          const current = counters[prefix] || 0;
          if (num >= current) {
            counters[prefix] = num + 1;
          }
        }
        break;
      }
    }
  });

  saveCounters();
};

/**
 * Returns a snapshot of all current counters.
 * @returns {Object<string, number>} A copy of the current counter state.
 */
export const getAllCounters = () => {
  return { ...counters };
};