import { useCallback, useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable accessible form field component supporting multiple input types.
 * Includes label, validation error display, required indicator, and ARIA attributes.
 *
 * @param {Object} props
 * @param {string} props.name - The field name attribute.
 * @param {string} props.label - The label text displayed above the input.
 * @param {string} [props.type] - Input type: 'text', 'textarea', 'select', 'date', 'number', 'checkbox', 'email', 'url', 'password'. Defaults to 'text'.
 * @param {*} props.value - The current field value.
 * @param {function} props.onChange - Callback invoked when the field value changes: (name, value) => void.
 * @param {string} [props.error] - Validation error message to display below the input.
 * @param {boolean} [props.required] - Whether the field is required.
 * @param {Array} [props.options] - Options for select type. Each option can be a string or { value: string, label: string }.
 * @param {boolean} [props.disabled] - Whether the field is disabled.
 * @param {string} [props.placeholder] - Placeholder text for text-like inputs.
 * @param {string} [props.helpText] - Optional help text displayed below the input.
 * @param {number} [props.min] - Minimum value for number inputs.
 * @param {number} [props.max] - Maximum value for number inputs.
 * @param {number} [props.step] - Step value for number inputs.
 * @param {number} [props.rows] - Number of rows for textarea inputs. Defaults to 3.
 * @param {number} [props.minLength] - Minimum length for text inputs.
 * @param {number} [props.maxLength] - Maximum length for text inputs.
 * @param {string} [props.className] - Additional CSS class for the wrapper div.
 * @returns {React.ReactElement}
 */
const FormField = ({
  name,
  label,
  type,
  value,
  onChange,
  error,
  required,
  options,
  disabled,
  placeholder,
  helpText,
  min,
  max,
  step,
  rows,
  minLength,
  maxLength,
  className,
}) => {
  const generatedId = useId();
  const fieldId = `formfield-${name || generatedId}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const hasError = typeof error === 'string' && error.trim() !== '';
  const hasHelp = typeof helpText === 'string' && helpText.trim() !== '';

  const buildAriaDescribedBy = () => {
    const parts = [];
    if (hasError) {
      parts.push(errorId);
    }
    if (hasHelp) {
      parts.push(helpId);
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  };

  const handleChange = useCallback(
    (e) => {
      if (typeof onChange !== 'function') {
        return;
      }

      if (type === 'checkbox') {
        onChange(name, e.target.checked);
      } else if (type === 'number') {
        const raw = e.target.value;
        if (raw === '') {
          onChange(name, '');
        } else {
          const parsed = parseFloat(raw);
          onChange(name, Number.isNaN(parsed) ? raw : parsed);
        }
      } else {
        onChange(name, e.target.value);
      }
    },
    [onChange, name, type]
  );

  const inputClasses = hasError
    ? 'input border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400'
    : 'input';

  const ariaDescribedBy = buildAriaDescribedBy();

  /**
   * Renders the appropriate input element based on the type prop.
   * @returns {React.ReactElement}
   */
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            rows={rows}
            minLength={minLength}
            maxLength={maxLength}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={required || undefined}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={required || undefined}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {Array.isArray(options) &&
              options.map((opt) => {
                const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
                const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              id={fieldId}
              type="checkbox"
              name={name}
              checked={!!value}
              onChange={handleChange}
              disabled={disabled}
              required={required}
              className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 dark:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-invalid={hasError || undefined}
              aria-describedby={ariaDescribedBy}
              aria-required={required || undefined}
            />
            <label
              htmlFor={fieldId}
              className={`text-sm font-medium ${
                disabled
                  ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
              {required && (
                <span className="ml-0.5 text-red-500\" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            name={name}
            value={value !== null && value !== undefined ? value : ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={required || undefined}
          />
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            min={typeof min === 'string' ? min : undefined}
            max={typeof max === 'string' ? max : undefined}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={required || undefined}
          />
        );

      case 'email':
      case 'url':
      case 'password':
      case 'text':
      default:
        return (
          <input
            id={fieldId}
            type={type === 'email' || type === 'url' || type === 'password' ? type : 'text'}
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            minLength={minLength}
            maxLength={maxLength}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={required || undefined}
          />
        );
    }
  };

  // Checkbox has its own label layout
  if (type === 'checkbox') {
    return (
      <div className={`space-y-1 ${className || ''}`}>
        {renderInput()}

        {hasError && (
          <p
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {hasHelp && (
          <p
            id={helpId}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className || ''}`}>
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={`block text-sm font-medium ${
          disabled
            ? 'text-neutral-400 dark:text-neutral-500'
            : 'text-neutral-700 dark:text-neutral-300'
        }`}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* Input */}
      {renderInput()}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          className="text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Help text */}
      {hasHelp && (
        <p
          id={helpId}
          className="text-xs text-neutral-500 dark:text-neutral-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  /** The field name attribute. */
  name: PropTypes.string.isRequired,
  /** The label text displayed above the input. */
  label: PropTypes.string.isRequired,
  /** Input type: 'text', 'textarea', 'select', 'date', 'number', 'checkbox', 'email', 'url', 'password'. */
  type: PropTypes.oneOf([
    'text',
    'textarea',
    'select',
    'date',
    'number',
    'checkbox',
    'email',
    'url',
    'password',
  ]),
  /** The current field value. */
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  /** Callback invoked when the field value changes: (name, value) => void. */
  onChange: PropTypes.func.isRequired,
  /** Validation error message to display below the input. */
  error: PropTypes.string,
  /** Whether the field is required. */
  required: PropTypes.bool,
  /** Options for select type. Each option can be a string or { value: string, label: string }. */
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  /** Whether the field is disabled. */
  disabled: PropTypes.bool,
  /** Placeholder text for text-like inputs. */
  placeholder: PropTypes.string,
  /** Optional help text displayed below the input. */
  helpText: PropTypes.string,
  /** Minimum value for number inputs or min date for date inputs. */
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Maximum value for number inputs or max date for date inputs. */
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Step value for number inputs. */
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Number of rows for textarea inputs. */
  rows: PropTypes.number,
  /** Minimum length for text inputs. */
  minLength: PropTypes.number,
  /** Maximum length for text inputs. */
  maxLength: PropTypes.number,
  /** Additional CSS class for the wrapper div. */
  className: PropTypes.string,
};

FormField.defaultProps = {
  type: 'text',
  value: '',
  error: null,
  required: false,
  options: [],
  disabled: false,
  placeholder: '',
  helpText: null,
  min: undefined,
  max: undefined,
  step: undefined,
  rows: 3,
  minLength: undefined,
  maxLength: undefined,
  className: '',
};

export default FormField;