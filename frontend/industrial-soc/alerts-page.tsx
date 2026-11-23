import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonEmpty,
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
import { SocAlert, SocAlertStatus, SocSeverity } from './data/types';

interface AlertsPageProps {
  alerts: SocAlert[];
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

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'new', text: 'New' },
  { value: 'investigating', text: 'Investigating' },
  { value: 'reviewed', text: 'Reviewed' },
  { value: 'resolved', text: 'Resolved' },
];

const columns: EuiBasicTableColumn<SocAlert>[] = [
  {
    field: 'timestamp',
    name: 'Time',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleString(),
  },
  { field: 'source', name: 'Source', sortable: true },
  { field: 'title', name: 'Alert', sortable: true },
  {
    field: 'severity',
    name: 'Severity',
    sortable: true,
    render: (value: SocSeverity) => <EuiBadge color={severityColors[value]}>{value}</EuiBadge>,
  },
  {
    field: 'status',
    name: 'Status',
    sortable: true,
    render: (value: SocAlertStatus) => (
      <EuiBadge color={value === 'resolved' ? 'success' : 'hollow'}>{value}</EuiBadge>
    ),
  },
];

export const IndustrialSocAlertsPage: React.FC<AlertsPageProps> = ({ alerts }) => {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SocAlert | null>(null);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return alerts.filter((alert) => {
      const matchesSearch =
        !query ||
        [
          alert.id,
          alert.timestamp,
          alert.assetId,
          alert.source,
          alert.title,
          alert.description,
          alert.ruleId,
          alert.category,
          alert.status,
          alert.severity,
          ...alert.techniqueIds,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      const matchesSeverity = !severity || alert.severity === severity;
      const matchesStatus = !status || alert.status === status;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [alerts, search, severity, status]);

  const hasActiveFilters = Boolean(search || severity || status);

  const alertColumns: EuiBasicTableColumn<SocAlert>[] = [
    ...columns,
    {
      name: 'Details',
      actions: [
        {
          name: 'View alert details',
          description: 'Open alert details',
          type: 'icon',
          icon: 'inspect',
          onClick: (alert: SocAlert) => setSelectedAlert(alert),
        },
      ],
    },
  ];

  return (
    <>
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Security alerts</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Search, filter, and inspect security alerts.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={2}>
            <EuiFieldSearch
              aria-label="Search alerts"
              placeholder="Search alerts"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              isClearable
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter alerts by severity"
              options={severityOptions}
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter alerts by status"
              options={statusOptions}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          </EuiFlexItem>
          {hasActiveFilters && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={() => {
                  setSearch('');
                  setSeverity('');
                  setStatus('');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<SocAlert>
          items={filteredAlerts}
          columns={alertColumns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No alerts match these filters."
        />
      </EuiPanel>

      {selectedAlert && (
        <EuiFlyout onClose={() => setSelectedAlert(null)} size="m" aria-label="Alert details">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>{selectedAlert.title}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiDescriptionList
              type="column"
              listItems={[
                {
                  title: 'Severity',
                  description: (
                    <EuiBadge color={severityColors[selectedAlert.severity]}>
                      {selectedAlert.severity}
                    </EuiBadge>
                  ),
                },
                { title: 'Status', description: selectedAlert.status },
                {
                  title: 'Time',
                  description: new Date(selectedAlert.timestamp).toLocaleString(),
                },
                { title: 'Source', description: selectedAlert.source },
                { title: 'Asset ID', description: selectedAlert.assetId },
                { title: 'Category', description: selectedAlert.category },
                { title: 'Rule ID', description: selectedAlert.ruleId },
                {
                  title: 'MITRE ICS techniques',
                  description: selectedAlert.techniqueIds.join(', ') || 'None',
                },
                {
                  title: 'Description',
                  description: selectedAlert.description,
                },
              ]}
            />
            <EuiSpacer size="l" />
            <EuiButton onClick={() => setSelectedAlert(null)}>Close</EuiButton>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
