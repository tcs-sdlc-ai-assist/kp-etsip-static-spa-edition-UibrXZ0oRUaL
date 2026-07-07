import * as XLSX from 'xlsx';
import { EXPORT_FORMATS } from '../constants/constants';

/**
 * Triggers a browser download for the given content.
 * @param {string|Blob|ArrayBuffer|Uint8Array} content - The file content.
 * @param {string} filename - The filename for the download.
 * @param {string} mimeType - The MIME type of the content.
 */
const triggerDownload = (content, filename, mimeType) => {
  let blob;
  if (content instanceof Blob) {
    blob = content;
  } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Ensures the filename has the correct extension.
 * @param {string} filename - The base filename.
 * @param {string} extension - The expected extension (e.g., '.csv').
 * @returns {string} Filename with the correct extension.
 */
const ensureExtension = (filename, extension) => {
  if (typeof filename !== 'string' || filename.trim() === '') {
    return `export${extension}`;
  }
  if (filename.toLowerCase().endsWith(extension.toLowerCase())) {
    return filename;
  }
  return `${filename}${extension}`;
};

/**
 * Flattens an object for CSV/XLSX export by converting nested objects and arrays to strings.
 * @param {Object} obj - The object to flatten.
 * @returns {Object} A flat object with string values for complex types.
 */
const flattenObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (Array.isArray(value)) {
      result[key] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  });
  return result;
};

/**
 * Escapes a CSV field value by wrapping in quotes if it contains commas, quotes, or newlines.
 * @param {*} value - The value to escape.
 * @returns {string} The escaped CSV field.
 */
const escapeCSVField = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Exports an array of objects to a CSV file and triggers a browser download.
 * @param {Array<Object>} data - The data to export. Each object represents a row.
 * @param {string} [filename='export.csv'] - The filename for the downloaded file.
 * @returns {boolean} True if the export was successful, false otherwise.
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    const flatData = data.map(flattenObject);

    const headers = [];
    const headerSet = new Set();
    flatData.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((key) => {
          if (!headerSet.has(key)) {
            headerSet.add(key);
            headers.push(key);
          }
        });
      }
    });

    if (headers.length === 0) {
      return false;
    }

    const csvRows = [];
    csvRows.push(headers.map(escapeCSVField).join(','));

    flatData.forEach((row) => {
      const values = headers.map((header) => {
        const value = row && typeof row === 'object' ? row[header] : '';
        return escapeCSVField(value);
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const safeFilename = ensureExtension(filename, '.csv');
    triggerDownload(csvContent, safeFilename, 'text/csv;charset=utf-8;');
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports data to a JSON file and triggers a browser download.
 * @param {*} data - The data to export. Can be any JSON-serializable value.
 * @param {string} [filename='export.json'] - The filename for the downloaded file.
 * @returns {boolean} True if the export was successful, false otherwise.
 */
export const exportToJSON = (data, filename = 'export.json') => {
  try {
    if (data === undefined) {
      return false;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const safeFilename = ensureExtension(filename, '.json');
    triggerDownload(jsonContent, safeFilename, 'application/json;charset=utf-8;');
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports an array of objects to an XLSX file using SheetJS and triggers a browser download.
 * @param {Array<Object>} data - The data to export. Each object represents a row.
 * @param {string} [filename='export.xlsx'] - The filename for the downloaded file.
 * @param {string} [sheetName='Sheet1'] - The name of the worksheet.
 * @returns {boolean} True if the export was successful, false otherwise.
 */
export const exportToXLSX = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    const flatData = data.map(flattenObject);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const xlsxBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const safeFilename = ensureExtension(filename, '.xlsx');
    triggerDownload(
      new Uint8Array(xlsxBuffer),
      safeFilename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports the current page to PDF using the browser's native print dialog.
 * This opens the print dialog where the user can select "Save as PDF".
 * @returns {boolean} True if the print dialog was triggered, false otherwise.
 */
export const exportToPDF = () => {
  try {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      return false;
    }
    window.print();
    return true;
  } catch {
    return false;
  }
};

/**
 * Generates a stub file for formats that require specialized tools (e.g., PowerPoint, Power BI).
 * The stub contains metadata and instructions for creating the actual file.
 * @param {string} format - The target format (e.g., 'pptx', 'pbix', 'powerpoint', 'powerbi').
 * @param {Object} [options] - Optional configuration for the stub.
 * @param {string} [options.title] - Title for the stub document.
 * @param {string} [options.description] - Description of the intended content.
 * @param {Object} [options.metadata] - Additional metadata to include.
 * @returns {boolean} True if the stub was generated and downloaded, false otherwise.
 */
export const generateStubFile = (format, options = {}) => {
  try {
    if (typeof format !== 'string' || format.trim() === '') {
      return false;
    }

    const normalizedFormat = format.toLowerCase().trim();
    const title = options.title || 'KP ETSIP Export';
    const description = options.description || `Stub file for ${normalizedFormat} format export`;
    const metadata = options.metadata || {};
    const timestamp = new Date().toISOString();

    const stubContent = {
      format: normalizedFormat,
      title,
      description,
      generatedAt: timestamp,
      generatedBy: 'KP ETSIP Platform',
      version: '1.0.0',
      metadata,
      instructions: '',
      extension: '',
    };

    switch (normalizedFormat) {
      case 'pptx':
      case 'powerpoint': {
        stubContent.instructions =
          'This is a stub file for PowerPoint export. ' +
          'To create the actual presentation, import this JSON into a PowerPoint template ' +
          'or use a server-side library such as PptxGenJS or python-pptx.';
        stubContent.extension = '.pptx.json';
        break;
      }
      case 'pbix':
      case 'powerbi': {
        stubContent.instructions =
          'This is a stub file for Power BI export. ' +
          'To create the actual Power BI report, import the data from this JSON into Power BI Desktop ' +
          'or use the Power BI REST API to create a dataset and report.';
        stubContent.extension = '.pbix.json';
        break;
      }
      case 'docx':
      case 'word': {
        stubContent.instructions =
          'This is a stub file for Word document export. ' +
          'To create the actual document, import this JSON into a Word template ' +
          'or use a server-side library such as docx or python-docx.';
        stubContent.extension = '.docx.json';
        break;
      }
      default: {
        stubContent.instructions =
          `This is a stub file for ${normalizedFormat} format export. ` +
          'The actual file generation requires specialized tooling not available in the browser. ' +
          'Use this JSON as input for a server-side conversion process.';
        stubContent.extension = `.${normalizedFormat}.json`;
        break;
      }
    }

    const jsonContent = JSON.stringify(stubContent, null, 2);
    const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}${stubContent.extension}`;
    triggerDownload(jsonContent, safeFilename, 'application/json;charset=utf-8;');
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports data in the specified format.
 * Convenience wrapper that dispatches to the appropriate export function.
 * @param {Array<Object>|*} data - The data to export.
 * @param {string} format - One of EXPORT_FORMATS values ('csv', 'json', 'xlsx', 'pdf').
 * @param {string} [filename] - Optional filename for the download.
 * @returns {boolean} True if the export was successful, false otherwise.
 */
export const exportData = (data, format, filename) => {
  if (typeof format !== 'string') {
    return false;
  }

  const normalizedFormat = format.toLowerCase().trim();

  switch (normalizedFormat) {
    case EXPORT_FORMATS.CSV:
      return exportToCSV(data, filename || 'export.csv');
    case EXPORT_FORMATS.JSON:
      return exportToJSON(data, filename || 'export.json');
    case EXPORT_FORMATS.XLSX:
      return exportToXLSX(data, filename || 'export.xlsx');
    case EXPORT_FORMATS.PDF:
      return exportToPDF();
    default:
      return false;
  }
};