import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
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
import { SocService, SocServiceStatus } from './data/types';

interface HealthPageProps {
  services: SocService[];
}

const serviceStatusLabels: Record<SocServiceStatus, string> = {
  'integration-pending': 'Integration pending',
  'not-connected': 'Not connected',
};

const statusOptions = [
  { value: '', text: 'All status types' },
  { value: 'integration-pending', text: 'Integration pending' },
  { value: 'not-connected', text: 'Not connected' },
];

export const IndustrialSocHealthPage: React.FC<HealthPageProps> = ({ services }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedService, setSelectedService] = useState<SocService | null>(null);
  const integrationPendingCount = services.filter(
    (service) => service.status === 'integration-pending'
  ).length;
  const disconnectedCount = services.filter((service) => service.status === 'not-connected').length;
  const filteredServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        [service.name, service.description, service.status, service.id]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);

      return matchesSearch && (!status || service.status === status);
    });
  }, [services, search, status]);
  const hasActiveFilters = Boolean(search || status);

  const columns: EuiBasicTableColumn<SocService>[] = [
    { field: 'name', name: 'Monitored component', sortable: true },
    { field: 'description', name: 'Planned health signal', sortable: true },
    {
      field: 'status',
      name: 'Integration state',
      sortable: true,
      render: (value: SocServiceStatus) => (
        <EuiBadge color="hollow">{serviceStatusLabels[value]}</EuiBadge>
      ),
    },
    {
      name: 'Details',
      actions: [
        {
          name: 'View status details',
          description: 'Open component status details',
          type: 'icon',
          icon: 'inspect',
          onClick: (service: SocService) => setSelectedService(service),
        },
      ],
    },
  ];

  return (
    <>
      <EuiCallOut
        className="industrial-soc-health-note"
        color="primary"
        iconType="info"
        title="Live component health monitoring will be enabled during backend integration."
      >
        Statuses below describe integration readiness; no live health checks are performed.
      </EuiCallOut>
      <EuiSpacer size="m" />
      <div className="industrial-soc-metrics">
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Integration pending
          </EuiText>
          <div className="industrial-soc-metric__value">{integrationPendingCount}</div>
        </EuiPanel>
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Not connected
          </EuiText>
          <div className="industrial-soc-metric__value">{disconnectedCount}</div>
        </EuiPanel>
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Live checks performed
          </EuiText>
          <div className="industrial-soc-metric__value">0</div>
        </EuiPanel>
      </div>
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Industrial SOC monitored components</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Review the planned monitoring scope and integration readiness.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={2}>
            <EuiFieldSearch
              aria-label="Search system health"
              placeholder="Search components or health signals"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              isClearable
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter health by state"
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
                  setStatus('');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<SocService>
          items={filteredServices}
          columns={columns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No statuses match these filters."
        />
      </EuiPanel>

      {selectedService && (
        <EuiFlyout
          onClose={() => setSelectedService(null)}
          size="m"
          aria-label="Service status details"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>{selectedService.name}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiDescriptionList
              type="column"
              listItems={[
                { title: 'Component ID', description: selectedService.id },
                {
                  title: 'Integration state',
                  description: serviceStatusLabels[selectedService.status],
                },
                {
                  title: 'Health signal',
                  description: selectedService.description,
                },
              ]}
            />
            <EuiSpacer size="l" />
            <EuiButton onClick={() => setSelectedService(null)}>Close</EuiButton>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
