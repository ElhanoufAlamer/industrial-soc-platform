import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiDescriptionList,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiInMemoryTable,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { SocLogEntry, SocSeverity } from './data/types';

interface LogsPageProps {
  logs: SocLogEntry[];
}

const severityColors: Record<SocSeverity, string> = {
  critical: '#bd271e',
  high: '#d04a3a',
  medium: '#d99b18',
  low: '#6554a4',
  informational: '#8792a2',
};

const severityOptions = [
  { value: '', text: 'All severities' },
  { value: 'critical', text: 'Critical' },
  { value: 'high', text: 'High' },
  { value: 'medium', text: 'Medium' },
  { value: 'low', text: 'Low' },
  { value: 'informational', text: 'Informational' },
];

const timeOptions = [
  { value: 'all', text: 'All loaded times' },
  { value: '1', text: 'Last hour' },
  { value: '24', text: 'Last 24 hours' },
  { value: '168', text: 'Last 7 days' },
  { value: '720', text: 'Last 30 days' },
];

const columns: EuiBasicTableColumn<SocLogEntry>[] = [
  {
    field: 'timestamp',
    name: 'Time',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleString(),
  },
  { field: 'host', name: 'Host', sortable: true },
  { field: 'source', name: 'Source', sortable: true },
  { field: 'facility', name: 'Facility', sortable: true },
  {
    field: 'severity',
    name: 'Severity',
    sortable: true,
    render: (value: SocSeverity) => <EuiBadge color={severityColors[value]}>{value}</EuiBadge>,
  },
  { field: 'message', name: 'Message', sortable: true },
];

export const IndustrialSocLogsPage: React.FC<LogsPageProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [severity, setSeverity] = useState('');
  const [timeWindow, setTimeWindow] = useState('all');
  const [selectedLog, setSelectedLog] = useState<SocLogEntry | null>(null);

  const sourceOptions = useMemo(
    () => [
      { value: '', text: 'All sources' },
      ...Array.from(new Set(logs.map((log) => log.source)))
        .sort()
        .map((value) => ({ value, text: value })),
    ],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const cutoff = timeWindow === 'all' ? null : Date.now() - Number(timeWindow) * 60 * 60 * 1000;

    return logs.filter((log) => {
      const timestamp = new Date(log.timestamp).getTime();
      const matchesSearch =
        !query ||
        [
          log.id,
          log.timestamp,
          log.host,
          log.source,
          log.facility,
          log.severity,
          log.message,
          log.payload,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);

      return (
        matchesSearch &&
        (!source || log.source === source) &&
        (!severity || log.severity === severity) &&
        (cutoff === null || (Number.isFinite(timestamp) && timestamp >= cutoff))
      );
    });
  }, [logs, search, source, severity, timeWindow]);

  const hasActiveFilters = Boolean(search || source || severity || timeWindow !== 'all');

  const logColumns: EuiBasicTableColumn<SocLogEntry>[] = [
    ...columns,
    {
      name: 'Details',
      actions: [
        {
          name: 'Inspect log',
          description: 'Open log details',
          type: 'icon',
          icon: 'inspect',
          onClick: (log: SocLogEntry) => setSelectedLog(log),
        },
      ],
    },
  ];

  return (
    <>
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Log explorer</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Search and inspect events across the selected time range.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={2}>
            <EuiFieldSearch
              aria-label="Search logs"
              placeholder="Search logs"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              isClearable
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter logs by source"
              options={sourceOptions}
              value={source}
              onChange={(event) => setSource(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter logs by severity"
              options={severityOptions}
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter logs by time"
              options={timeOptions}
              value={timeWindow}
              onChange={(event) => setTimeWindow(event.target.value)}
            />
          </EuiFlexItem>
          {hasActiveFilters && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={() => {
                  setSearch('');
                  setSource('');
                  setSeverity('');
                  setTimeWindow('all');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<SocLogEntry>
          items={filteredLogs}
          columns={logColumns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No logs match these filters."
        />
      </EuiPanel>

      {selectedLog && (
        <EuiFlyout onClose={() => setSelectedLog(null)} size="m" aria-label="Log details">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>Log event details</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiDescriptionList
              type="column"
              listItems={[
                {
                  title: 'Time',
                  description: new Date(selectedLog.timestamp).toLocaleString(),
                },
                { title: 'Host', description: selectedLog.host },
                { title: 'Source', description: selectedLog.source },
                { title: 'Facility', description: selectedLog.facility },
                {
                  title: 'Severity',
                  description: (
                    <EuiBadge color={severityColors[selectedLog.severity]}>
                      {selectedLog.severity}
                    </EuiBadge>
                  ),
                },
                { title: 'Message', description: selectedLog.message },
              ]}
            />
            <EuiSpacer size="m" />
            <EuiTitle size="xs">
              <h3>Payload</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiCodeBlock language="text" isCopyable>
              {selectedLog.payload}
            </EuiCodeBlock>
            <EuiSpacer size="l" />
            <EuiButton onClick={() => setSelectedLog(null)}>Close</EuiButton>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
