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
import { SocAsset, SocAssetStatus, SocLogEntry } from './data/types';

interface OtPageProps {
  assets: SocAsset[];
  logs: SocLogEntry[];
}

interface AssetEventSummary extends SocAsset {
  exampleEventCount: number;
}

const assetStatusLabels: Record<SocAssetStatus, string> = {
  'demo-monitored': 'Monitored',
  'demo-attention': 'Needs attention',
  'demo-not-connected': 'Not connected',
};

const assetStatusColors: Record<SocAssetStatus, string> = {
  'demo-monitored': 'success',
  'demo-attention': 'warning',
  'demo-not-connected': 'hollow',
};

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'demo-monitored', text: 'Monitored' },
  { value: 'demo-attention', text: 'Needs attention' },
  { value: 'demo-not-connected', text: 'Not connected' },
];

export const IndustrialSocOtPage: React.FC<OtPageProps> = ({ assets, logs }) => {
  const [search, setSearch] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [protocol, setProtocol] = useState('');
  const [status, setStatus] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetEventSummary | null>(null);

  const protocolOptions = useMemo(
    () => [
      { value: '', text: 'All protocols' },
      ...Array.from(new Set(assets.flatMap((asset) => asset.protocols)))
        .sort()
        .map((value) => ({ value, text: value })),
    ],
    [assets]
  );
  const typeOptions = useMemo(
    () => [
      { value: '', text: 'All device categories' },
      ...Array.from(new Set(assets.map((asset) => asset.type)))
        .sort()
        .map((value) => ({ value, text: value })),
    ],
    [assets]
  );

  const rows = useMemo<AssetEventSummary[]>(
    () =>
      assets.map((asset) => ({
        ...asset,
        exampleEventCount: logs.filter((log) => log.host === asset.id).length,
      })),
    [assets, logs]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return rows.filter((asset) => {
      const matchesSearch =
        !query ||
        [
          asset.id,
          asset.name,
          asset.zone,
          asset.type,
          asset.status,
          asset.collectionSource,
          ...asset.protocols,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);

      return (
        matchesSearch &&
        (!deviceType || asset.type === deviceType) &&
        (!protocol || asset.protocols.includes(protocol)) &&
        (!status || asset.status === status)
      );
    });
  }, [rows, search, deviceType, protocol, status]);

  const protocolCount = protocolOptions.length - 1;
  const highSeverityEvents = logs.filter(
    (log) => log.severity === 'critical' || log.severity === 'high'
  ).length;
  const hasActiveFilters = Boolean(search || deviceType || protocol || status);

  const columns: EuiBasicTableColumn<AssetEventSummary>[] = [
    { field: 'name', name: 'Device', sortable: true },
    { field: 'id', name: 'Asset ID', sortable: true },
    { field: 'type', name: 'Category', sortable: true },
    {
      field: 'protocols',
      name: 'Protocols',
      sortable: true,
      render: (value: string[]) => value.join(', '),
    },
    {
      field: 'status',
      name: 'Monitoring status',
      sortable: true,
      render: (value: SocAssetStatus) => (
        <EuiBadge color={assetStatusColors[value]}>{assetStatusLabels[value]}</EuiBadge>
      ),
    },
    {
      field: 'exampleEventCount',
      name: 'Events',
      sortable: true,
    },
    {
      name: 'Details',
      actions: [
        {
          name: 'View OT device details',
          description: 'Open OT device details',
          type: 'icon',
          icon: 'inspect',
          onClick: (asset: AssetEventSummary) => setSelectedAsset(asset),
        },
      ],
    },
  ];

  return (
    <>
      <div className="industrial-soc-metrics">
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Assets in range
          </EuiText>
          <div className="industrial-soc-metric__value">{assets.length}</div>
          <EuiText size="xs" color="subdued">
            Records matching the selected range
          </EuiText>
        </EuiPanel>
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Protocol categories
          </EuiText>
          <div className="industrial-soc-metric__value">{protocolCount}</div>
          <EuiText size="xs" color="subdued">
            Distinct protocol values
          </EuiText>
        </EuiPanel>
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            Matching log events
          </EuiText>
          <div className="industrial-soc-metric__value">{logs.length}</div>
          <EuiText size="xs" color="subdued">
            Events from listed assets
          </EuiText>
        </EuiPanel>
        <EuiPanel paddingSize="l" className="industrial-soc-metric">
          <EuiText size="s" color="subdued">
            High-severity events
          </EuiText>
          <div className="industrial-soc-metric__value">{highSeverityEvents}</div>
          <EuiText size="xs" color="subdued">
            Critical and high severity
          </EuiText>
        </EuiPanel>
      </div>

      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Industrial assets</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Event totals match asset hosts in the selected global time range.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={2}>
            <EuiFieldSearch
              aria-label="Search OT devices"
              placeholder="Search devices or protocols"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              isClearable
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter OT devices by category"
              options={typeOptions}
              value={deviceType}
              onChange={(event) => setDeviceType(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter OT devices by protocol"
              options={protocolOptions}
              value={protocol}
              onChange={(event) => setProtocol(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter OT devices by monitoring status"
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
                  setDeviceType('');
                  setProtocol('');
                  setStatus('');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<AssetEventSummary>
          items={filteredRows}
          columns={columns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No devices match these filters."
        />
      </EuiPanel>

      {selectedAsset && (
        <EuiFlyout onClose={() => setSelectedAsset(null)} size="m" aria-label="OT device details">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>{selectedAsset.name}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiDescriptionList
              type="column"
              listItems={[
                { title: 'Asset ID', description: selectedAsset.id },
                { title: 'Category', description: selectedAsset.type },
                {
                  title: 'Monitoring status',
                  description: assetStatusLabels[selectedAsset.status],
                },
                {
                  title: 'Protocols',
                  description: selectedAsset.protocols.join(', ') || 'None',
                },
                {
                  title: 'Event count',
                  description: selectedAsset.exampleEventCount,
                },
                {
                  title: 'Collection source',
                  description: selectedAsset.collectionSource,
                },
                {
                  title: 'Description',
                  description: selectedAsset.description,
                },
              ]}
            />
            <EuiSpacer size="l" />
            <EuiButton onClick={() => setSelectedAsset(null)}>Close</EuiButton>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
