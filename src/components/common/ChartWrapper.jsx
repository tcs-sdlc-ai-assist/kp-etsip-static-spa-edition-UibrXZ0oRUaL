import { useState, useCallback, useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Default color palette for chart series.
 * @type {string[]}
 */
const DEFAULT_COLORS = [
  '#1a56db',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

/**
 * Accessible chart wrapper component using Recharts.
 * Renders a chart with an accessible text/table equivalent toggle for screen readers.
 * Supports bar, line, pie, and area chart types.
 * Keyboard navigable with ARIA attributes.
 *
 * @param {Object} props
 * @param {string} props.type - Chart type: 'bar', 'line', 'pie', or 'area'.
 * @param {Array<Object>} props.data - Array of data objects for the chart.
 * @param {Object} [props.config] - Chart configuration options.
 * @param {string} [props.config.xAxisKey] - Key for the X axis data field. Defaults to 'name'.
 * @param {Array<{dataKey: string, label?: string, color?: string, stackId?: string}>} [props.config.series] - Series definitions for bar/line/area charts.
 * @param {string} [props.config.dataKey] - Data key for pie chart values.
 * @param {string} [props.config.nameKey] - Name key for pie chart labels.
 * @param {number} [props.config.height] - Chart height in pixels. Defaults to 300.
 * @param {boolean} [props.config.showGrid] - Whether to show the cartesian grid. Defaults to true.
 * @param {boolean} [props.config.showLegend] - Whether to show the legend. Defaults to true.
 * @param {boolean} [props.config.showTooltip] - Whether to show tooltips. Defaults to true.
 * @param {string[]} [props.config.colors] - Custom color palette for chart series.
 * @param {string} props.title - Chart title displayed above the chart.
 * @param {Array<{headers: string[], rows: Array<Array<string|number>>}>} [props.accessibleTableData] - Accessible table data for screen reader alternative.
 * @param {string} [props.className] - Additional CSS classes for the wrapper.
 * @returns {React.ReactElement}
 */
const ChartWrapper = ({
  type,
  data,
  config,
  title,
  accessibleTableData,
  className,
}) => {
  const [showTable, setShowTable] = useState(false);
  const chartId = useId();
  const titleId = `chart-title-${chartId}`;
  const descId = `chart-desc-${chartId}`;

  const effectiveConfig = useMemo(() => {
    const defaults = {
      xAxisKey: 'name',
      series: [],
      dataKey: 'value',
      nameKey: 'name',
      height: 300,
      showGrid: true,
      showLegend: true,
      showTooltip: true,
      colors: DEFAULT_COLORS,
    };

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return defaults;
    }

    return {
      xAxisKey: typeof config.xAxisKey === 'string' && config.xAxisKey.trim() !== '' ? config.xAxisKey : defaults.xAxisKey,
      series: Array.isArray(config.series) ? config.series : defaults.series,
      dataKey: typeof config.dataKey === 'string' && config.dataKey.trim() !== '' ? config.dataKey : defaults.dataKey,
      nameKey: typeof config.nameKey === 'string' && config.nameKey.trim() !== '' ? config.nameKey : defaults.nameKey,
      height: typeof config.height === 'number' && config.height > 0 ? config.height : defaults.height,
      showGrid: typeof config.showGrid === 'boolean' ? config.showGrid : defaults.showGrid,
      showLegend: typeof config.showLegend === 'boolean' ? config.showLegend : defaults.showLegend,
      showTooltip: typeof config.showTooltip === 'boolean' ? config.showTooltip : defaults.showTooltip,
      colors: Array.isArray(config.colors) && config.colors.length > 0 ? config.colors : defaults.colors,
    };
  }, [config]);

  /**
   * Derives series from data keys if no explicit series config is provided.
   * @returns {Array<{dataKey: string, label: string, color: string}>}
   */
  const effectiveSeries = useMemo(() => {
    if (effectiveConfig.series.length > 0) {
      return effectiveConfig.series.map((s, i) => ({
        dataKey: s.dataKey,
        label: s.label || s.dataKey,
        color: s.color || effectiveConfig.colors[i % effectiveConfig.colors.length],
        stackId: s.stackId || undefined,
      }));
    }

    // Auto-detect series from data keys (exclude xAxisKey)
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (firstItem && typeof firstItem === 'object') {
        const keys = Object.keys(firstItem).filter(
          (key) => key !== effectiveConfig.xAxisKey && typeof firstItem[key] === 'number'
        );
        return keys.map((key, i) => ({
          dataKey: key,
          label: key,
          color: effectiveConfig.colors[i % effectiveConfig.colors.length],
        }));
      }
    }

    return [];
  }, [effectiveConfig, data]);

  const handleToggleView = useCallback(() => {
    setShowTable((prev) => !prev);
  }, []);

  const handleToggleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleView();
      }
    },
    [handleToggleView]
  );

  /**
   * Generates accessible table data from chart data if not explicitly provided.
   * @returns {{ headers: string[], rows: Array<Array<string|number>> } | null}
   */
  const resolvedTableData = useMemo(() => {
    if (
      accessibleTableData &&
      typeof accessibleTableData === 'object' &&
      Array.isArray(accessibleTableData.headers) &&
      Array.isArray(accessibleTableData.rows)
    ) {
      return accessibleTableData;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    if (type === 'pie') {
      const headers = [effectiveConfig.nameKey, effectiveConfig.dataKey];
      const rows = data.map((item) => {
        if (!item || typeof item !== 'object') {
          return ['—', '—'];
        }
        return [
          item[effectiveConfig.nameKey] !== null && item[effectiveConfig.nameKey] !== undefined
            ? String(item[effectiveConfig.nameKey])
            : '—',
          item[effectiveConfig.dataKey] !== null && item[effectiveConfig.dataKey] !== undefined
            ? item[effectiveConfig.dataKey]
            : '—',
        ];
      });
      return { headers, rows };
    }

    // Bar, Line, Area
    const headers = [effectiveConfig.xAxisKey, ...effectiveSeries.map((s) => s.label)];
    const rows = data.map((item) => {
      if (!item || typeof item !== 'object') {
        return headers.map(() => '—');
      }
      return [
        item[effectiveConfig.xAxisKey] !== null && item[effectiveConfig.xAxisKey] !== undefined
          ? String(item[effectiveConfig.xAxisKey])
          : '—',
        ...effectiveSeries.map((s) =>
          item[s.dataKey] !== null && item[s.dataKey] !== undefined ? item[s.dataKey] : '—'
        ),
      ];
    });
    return { headers, rows };
  }, [accessibleTableData, data, type, effectiveConfig, effectiveSeries]);

  /**
   * Renders the chart based on the type prop.
   * @returns {React.ReactElement|null}
   */
  const renderChart = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
          No data available to display.
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 10, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={effectiveConfig.height}>
            <BarChart {...commonProps}>
              {effectiveConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
              )}
              <XAxis
                dataKey={effectiveConfig.xAxisKey}
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              {effectiveConfig.showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {effectiveConfig.showLegend && <Legend wrapperStyle={{ fontSize: '0.75rem' }} />}
              {effectiveSeries.map((series) => (
                <Bar
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  name={series.label}
                  fill={series.color}
                  stackId={series.stackId}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={effectiveConfig.height}>
            <LineChart {...commonProps}>
              {effectiveConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
              )}
              <XAxis
                dataKey={effectiveConfig.xAxisKey}
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              {effectiveConfig.showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {effectiveConfig.showLegend && <Legend wrapperStyle={{ fontSize: '0.75rem' }} />}
              {effectiveSeries.map((series) => (
                <Line
                  key={series.dataKey}
                  type="monotone"
                  dataKey={series.dataKey}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: series.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={effectiveConfig.height}>
            <AreaChart {...commonProps}>
              {effectiveConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
              )}
              <XAxis
                dataKey={effectiveConfig.xAxisKey}
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-neutral-500 dark:text-neutral-400"
              />
              {effectiveConfig.showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {effectiveConfig.showLegend && <Legend wrapperStyle={{ fontSize: '0.75rem' }} />}
              {effectiveSeries.map((series) => (
                <Area
                  key={series.dataKey}
                  type="monotone"
                  dataKey={series.dataKey}
                  name={series.label}
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  stackId={series.stackId}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={effectiveConfig.height}>
            <PieChart>
              {effectiveConfig.showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {effectiveConfig.showLegend && <Legend wrapperStyle={{ fontSize: '0.75rem' }} />}
              <Pie
                data={data}
                dataKey={effectiveConfig.dataKey}
                nameKey={effectiveConfig.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(effectiveConfig.height / 3, 120)}
                innerRadius={Math.min(effectiveConfig.height / 6, 50)}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={effectiveConfig.colors[index % effectiveConfig.colors.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex h-48 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  /**
   * Renders the accessible table alternative.
   * @returns {React.ReactElement|null}
   */
  const renderTable = () => {
    if (!resolvedTableData) {
      return (
        <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No table data available.
        </div>
      );
    }

    const { headers, rows } = resolvedTableData;

    return (
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
          role="table"
          aria-label={title ? `Data table for ${title}` : 'Chart data table'}
        >
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr role="row">
              {headers.map((header, index) => (
                <th
                  key={`header-${index}`}
                  role="columnheader"
                  scope="col"
                  className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
            {rows.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                role="row"
                className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    role="cell"
                    className="whitespace-nowrap px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  >
                    {cell !== null && cell !== undefined ? String(cell) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const chartTypeLabel = useMemo(() => {
    switch (type) {
      case 'bar':
        return 'bar chart';
      case 'line':
        return 'line chart';
      case 'pie':
        return 'pie chart';
      case 'area':
        return 'area chart';
      default:
        return 'chart';
    }
  }, [type]);

  const dataPointCount = Array.isArray(data) ? data.length : 0;
  const seriesCount = type === 'pie' ? 1 : effectiveSeries.length;

  return (
    <div
      className={`rounded-xl bg-white shadow-card transition-shadow duration-300 hover:shadow-soft dark:bg-neutral-800 ${className || ''}`}
      role="figure"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
        <h3
          id={titleId}
          className="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
        >
          {title || 'Chart'}
        </h3>
        <button
          type="button"
          onClick={handleToggleView}
          onKeyDown={handleToggleKeyDown}
          className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs"
          aria-pressed={showTable}
          aria-label={showTable ? 'Switch to chart view' : 'Switch to accessible table view'}
          title={showTable ? 'Show chart' : 'Show data table'}
        >
          {showTable ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Chart</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
              <span>Table</span>
            </>
          )}
        </button>
      </div>

      {/* Screen reader description */}
      <p id={descId} className="sr-only">
        {`${title || 'Chart'}: A ${chartTypeLabel} with ${dataPointCount} data point${dataPointCount !== 1 ? 's' : ''}${
          seriesCount > 0 ? ` and ${seriesCount} series` : ''
        }. Use the table toggle button to view data in an accessible table format.`}
      </p>

      {/* Content */}
      <div className="p-4">
        {showTable ? (
          <div role="region" aria-label={`${title || 'Chart'} data table`}>
            {renderTable()}
          </div>
        ) : (
          <div
            role="img"
            aria-label={`${title || 'Chart'} ${chartTypeLabel} visualization`}
          >
            {renderChart()}
          </div>
        )}
      </div>
    </div>
  );
};

ChartWrapper.propTypes = {
  /** Chart type: 'bar', 'line', 'pie', or 'area'. */
  type: PropTypes.oneOf(['bar', 'line', 'pie', 'area']).isRequired,
  /** Array of data objects for the chart. */
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Chart configuration options. */
  config: PropTypes.shape({
    /** Key for the X axis data field. Defaults to 'name'. */
    xAxisKey: PropTypes.string,
    /** Series definitions for bar/line/area charts. */
    series: PropTypes.arrayOf(
      PropTypes.shape({
        dataKey: PropTypes.string.isRequired,
        label: PropTypes.string,
        color: PropTypes.string,
        stackId: PropTypes.string,
      })
    ),
    /** Data key for pie chart values. */
    dataKey: PropTypes.string,
    /** Name key for pie chart labels. */
    nameKey: PropTypes.string,
    /** Chart height in pixels. Defaults to 300. */
    height: PropTypes.number,
    /** Whether to show the cartesian grid. Defaults to true. */
    showGrid: PropTypes.bool,
    /** Whether to show the legend. Defaults to true. */
    showLegend: PropTypes.bool,
    /** Whether to show tooltips. Defaults to true. */
    showTooltip: PropTypes.bool,
    /** Custom color palette for chart series. */
    colors: PropTypes.arrayOf(PropTypes.string),
  }),
  /** Chart title displayed above the chart. */
  title: PropTypes.string,
  /** Accessible table data for screen reader alternative. */
  accessibleTableData: PropTypes.shape({
    headers: PropTypes.arrayOf(PropTypes.string).isRequired,
    rows: PropTypes.arrayOf(PropTypes.array).isRequired,
  }),
  /** Additional CSS classes for the wrapper. */
  className: PropTypes.string,
};

ChartWrapper.defaultProps = {
  config: null,
  title: 'Chart',
  accessibleTableData: null,
  className: '',
};

export default ChartWrapper;