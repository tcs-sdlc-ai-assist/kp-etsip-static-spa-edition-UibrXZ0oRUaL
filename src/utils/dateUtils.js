import { ANCHOR_DATE } from '../constants/constants';

/**
 * Formats a Date object or date string to YYYY-MM-DD format.
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted date string in YYYY-MM-DD format, or empty string if invalid.
 */
export const formatDate = (date) => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Formats a Date object or date string to a full datetime string (YYYY-MM-DD HH:mm:ss).
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted datetime string, or empty string if invalid.
 */
export const formatDateTime = (date) => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '';
  }
};

/**
 * Parses a date string into a Date object.
 * Supports YYYY-MM-DD and ISO 8601 formats.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} Parsed Date object, or null if invalid.
 */
export const parseDate = (dateString) => {
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return null;
  }
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return d;
  } catch {
    return null;
  }
};

/**
 * Adds a specified number of days to a date.
 * @param {Date|string} date - The starting date.
 * @param {number} days - Number of days to add (can be negative).
 * @returns {Date|null} New Date with days added, or null if input is invalid.
 */
export const addDays = (date, days) => {
  if (date === null || date === undefined || typeof days !== 'number' || Number.isNaN(days)) {
    return null;
  }
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    d.setDate(d.getDate() + days);
    return d;
  } catch {
    return null;
  }
};

/**
 * Adds a specified number of months to a date.
 * If the resulting month has fewer days, the date is clamped to the last day of that month.
 * @param {Date|string} date - The starting date.
 * @param {number} months - Number of months to add (can be negative).
 * @returns {Date|null} New Date with months added, or null if input is invalid.
 */
export const addMonths = (date, months) => {
  if (date === null || date === undefined || typeof months !== 'number' || Number.isNaN(months)) {
    return null;
  }
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== originalDay) {
      d.setDate(0);
    }
    return d;
  } catch {
    return null;
  }
};

/**
 * Calculates the difference in days between two dates.
 * Returns a positive number if dateB is after dateA, negative if before.
 * @param {Date|string} dateA - The first date.
 * @param {Date|string} dateB - The second date.
 * @returns {number|null} Number of days between the two dates, or null if inputs are invalid.
 */
export const diffDays = (dateA, dateB) => {
  if (dateA === null || dateA === undefined || dateB === null || dateB === undefined) {
    return null;
  }
  try {
    const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
    const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return null;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / msPerDay);
  } catch {
    return null;
  }
};

/**
 * Checks whether dateA is before dateB.
 * @param {Date|string} dateA - The first date.
 * @param {Date|string} dateB - The second date.
 * @returns {boolean} True if dateA is before dateB, false otherwise or if inputs are invalid.
 */
export const isBeforeDate = (dateA, dateB) => {
  if (dateA === null || dateA === undefined || dateB === null || dateB === undefined) {
    return false;
  }
  try {
    const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
    const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return false;
    }
    return a.getTime() < b.getTime();
  } catch {
    return false;
  }
};

/**
 * Checks whether dateA is after dateB.
 * @param {Date|string} dateA - The first date.
 * @param {Date|string} dateB - The second date.
 * @returns {boolean} True if dateA is after dateB, false otherwise or if inputs are invalid.
 */
export const isAfterDate = (dateA, dateB) => {
  if (dateA === null || dateA === undefined || dateB === null || dateB === undefined) {
    return false;
  }
  try {
    const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
    const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return false;
    }
    return a.getTime() > b.getTime();
  } catch {
    return false;
  }
};

/**
 * Returns a date relative to the ANCHOR_DATE by adding a specified number of days.
 * Useful for deterministic date generation in seeded data.
 * @param {number} offsetDays - Number of days to offset from the anchor date (can be negative).
 * @param {string} [anchorDate] - Optional anchor date string in YYYY-MM-DD format. Defaults to ANCHOR_DATE constant.
 * @returns {Date|null} The resulting Date, or null if inputs are invalid.
 */
export const getRelativeDate = (offsetDays, anchorDate) => {
  const anchor = anchorDate || ANCHOR_DATE;
  if (typeof offsetDays !== 'number' || Number.isNaN(offsetDays)) {
    return null;
  }
  return addDays(anchor, offsetDays);
};

/**
 * Returns a formatted date string (YYYY-MM-DD) relative to the ANCHOR_DATE.
 * Convenience wrapper around getRelativeDate + formatDate.
 * @param {number} offsetDays - Number of days to offset from the anchor date.
 * @param {string} [anchorDate] - Optional anchor date string. Defaults to ANCHOR_DATE constant.
 * @returns {string} Formatted date string, or empty string if invalid.
 */
export const getRelativeDateString = (offsetDays, anchorDate) => {
  const result = getRelativeDate(offsetDays, anchorDate);
  return result ? formatDate(result) : '';
};

/**
 * Returns a formatted ISO datetime string relative to the ANCHOR_DATE.
 * @param {number} offsetDays - Number of days to offset from the anchor date.
 * @param {string} [anchorDate] - Optional anchor date string. Defaults to ANCHOR_DATE constant.
 * @returns {string} ISO datetime string, or empty string if invalid.
 */
export const getRelativeDateISO = (offsetDays, anchorDate) => {
  const result = getRelativeDate(offsetDays, anchorDate);
  if (!result) {
    return '';
  }
  return result.toISOString();
};

/**
 * Checks whether a date string or Date object represents a date in the past
 * relative to the ANCHOR_DATE.
 * @param {Date|string} date - The date to check.
 * @param {string} [anchorDate] - Optional anchor date string. Defaults to ANCHOR_DATE constant.
 * @returns {boolean} True if the date is before the anchor date.
 */
export const isPastDate = (date, anchorDate) => {
  const anchor = anchorDate || ANCHOR_DATE;
  return isBeforeDate(date, anchor);
};

/**
 * Checks whether a date string or Date object represents a date in the future
 * relative to the ANCHOR_DATE.
 * @param {Date|string} date - The date to check.
 * @param {string} [anchorDate] - Optional anchor date string. Defaults to ANCHOR_DATE constant.
 * @returns {boolean} True if the date is after the anchor date.
 */
export const isFutureDate = (date, anchorDate) => {
  const anchor = anchorDate || ANCHOR_DATE;
  return isAfterDate(date, anchor);
};

/**
 * Returns the number of days between a given date and the ANCHOR_DATE.
 * Positive if the date is after the anchor, negative if before.
 * @param {Date|string} date - The date to compare.
 * @param {string} [anchorDate] - Optional anchor date string. Defaults to ANCHOR_DATE constant.
 * @returns {number|null} Number of days from anchor to date, or null if invalid.
 */
export const daysFromAnchor = (date, anchorDate) => {
  const anchor = anchorDate || ANCHOR_DATE;
  return diffDays(anchor, date);
};