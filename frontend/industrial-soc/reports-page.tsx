import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { createAlertsCsv } from './data/csv-export';
import { SocAlert, SocSeverity } from './data/types';

interface ReportsPageProps {
  alerts: SocAlert[];
}

const severityOrder: SocSeverity[] = ['critical', 'high', 'medium', 'low', 'informational'];

const severityColors: Record<SocSeverity, string> = {
  critical: '#bd271e',
  high: '#d04a3a',
  medium: '#d99b18',
  low: '#6554a4',
  informational: '#8792a2',
};

const timeOptions = [
  { value: 'all', text: 'All records' },
  { value: '24', text: 'Last 24 hours' },
  { value: '168', text: 'Last 7 days' },
  { value: '720', text: 'Last 30 days' },
];

const columns: EuiBasicTableColumn<SocAlert>[] = [
  {
    field: 'timestamp',
    name: 'Time',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleString(),
  },
  { field: 'category', name: 'Category', sortable: true },
  {
    field: 'severity',
    name: 'Severity',
    sortable: true,
    render: (value: SocSeverity) => <EuiBadge color={severityColors[value]}>{value}</EuiBadge>,
  },
  { field: 'title', name: 'Alert', sortable: true },
  { field: 'source', name: 'Source', sortable: true },
];

function downloadCsv(alerts: SocAlert[]): void {
  const blob = new Blob([createAlertsCsv(alerts)], {
    type: 'text/csv;charset=utf-8',
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `industrial-soc-demo-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export const IndustrialSocReportsPage: React.FC<ReportsPageProps> = ({ alerts }) => {
  const [timeWindow, setTimeWindow] = useState('all');
  const [category, setCategory] = useState('');
  const categoryOptions = useMemo(
    () => [
      { value: '', text: 'All categories' },
      ...Array.from(new Set(alerts.map((alert) => alert.category)))
        .sort()
        .map((value) => ({ value, text: value })),
    ],
    [alerts]
  );
  const filteredAlerts = useMemo(() => {
    const cutoff = timeWindow === 'all' ? null : Date.now() - Number(timeWindow) * 60 * 60 * 1000;

    return alerts.filter((alert) => {
      const timestamp = new Date(alert.timestamp).getTime();
      return (
        (!category || alert.category === category) &&
        (cutoff === null || (Number.isFinite(timestamp) && timestamp >= cutoff))
      );
    });
  }, [alerts, category, timeWindow]);

  const severityCounts = severityOrder.map((severity) => ({
    severity,
    count: filteredAlerts.filter((alert) => alert.severity === severity).length,
  }));
  const maxSeverityCount = Math.max(...severityCounts.map((item) => item.count), 1);
  const highPriority = filteredAlerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'high'
  ).length;
  const hasActiveFilters = Boolean(category || timeWindow !== 'all');

  return (
    <>
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Reports & analytics</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Filter alerts independently of the SOC overview time range, then export the matching
            subset.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter report by date range"
              options={timeOptions}
              value={timeWindow}
              onChange={(event) => setTimeWindow(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter report by alert category"
              options={categoryOptions}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="download"
              onClick={() => downloadCsv(filteredAlerts)}
              isDisabled={!filteredAlerts.length}
            >
              Export filtered CSV
            </EuiButton>
          </EuiFlexItem>
          {hasActiveFilters && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={() => {
                  setTimeWindow('all');
                  setCategory('');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <div className="industrial-soc-metrics">
          <EuiPanel paddingSize="l" className="industrial-soc-metric">
            <EuiText size="s" color="subdued">
              Matching alerts
            </EuiText>
            <div className="industrial-soc-metric__value">{filteredAlerts.length}</div>
            <EuiText size="xs" color="subdued">
              Records in this selection
            </EuiText>
          </EuiPanel>
          <EuiPanel paddingSize="l" className="industrial-soc-metric">
            <EuiText size="s" color="subdued">
              High-priority alerts
            </EuiText>
            <div className="industrial-soc-metric__value">{highPriority}</div>
            <EuiText size="xs" color="subdued">
              Critical and high severity
            </EuiText>
          </EuiPanel>
        </div>
        <div className="industrial-soc-grid industrial-soc-grid--two">
          <EuiPanel paddingSize="l" className="industrial-soc-panel">
            <div className="industrial-soc-page-title">
              <EuiTitle size="s">
                <h3>Severity summary</h3>
              </EuiTitle>
              <EuiText color="subdued" size="s">
                Counts from the current selection.
              </EuiText>
            </div>
            <EuiSpacer size="m" />
            <div className="industrial-soc-severity-chart">
              {severityCounts.map((item) => (
                <div className="industrial-soc-severity-row" key={item.severity}>
                  <EuiBadge color={severityColors[item.severity]}>{item.severity}</EuiBadge>
                  <EuiProgress
                    value={item.count}
                    max={maxSeverityCount}
                    color={severityColors[item.severity]}
                    size="m"
                    aria-label={`${item.severity}: ${item.count} alerts`}
                  />
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </EuiPanel>
          <EuiPanel paddingSize="l" className="industrial-soc-panel">
            <div className="industrial-soc-page-title">
              <EuiTitle size="s">
                <h3>Category summary</h3>
              </EuiTitle>
              <EuiText color="subdued" size="s">
                Calculated from alerts matching the selected filters.
              </EuiText>
            </div>
            <EuiSpacer size="m" />
            <div className="industrial-soc-summary-list">
              {categoryOptions
                .slice(1)
                .filter((option) => !category || option.value === category)
                .map((option) => (
                  <div className="industrial-soc-summary-row" key={option.value}>
                    <span>{option.text}</span>
                    <strong>
                      {filteredAlerts.filter((alert) => alert.category === option.value).length}
                    </strong>
                  </div>
                ))}
            </div>
          </EuiPanel>
        </div>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<SocAlert>
          items={filteredAlerts}
          columns={columns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No alerts match these report filters."
        />
      </EuiPanel>
    </>
  );
};
