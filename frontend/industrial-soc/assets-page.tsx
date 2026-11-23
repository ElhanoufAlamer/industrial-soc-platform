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
import { SocAsset, SocAssetStatus } from './data/types';

interface AssetsPageProps {
  assets: SocAsset[];
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

export const IndustrialSocAssetsPage: React.FC<AssetsPageProps> = ({ assets }) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<SocAsset | null>(null);

  const typeOptions = useMemo(
    () => [
      { value: '', text: 'All device types' },
      ...Array.from(new Set(assets.map((asset) => asset.type)))
        .sort()
        .map((value) => ({ value, text: value })),
    ],
    [assets]
  );

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        [
          asset.id,
          asset.name,
          asset.zone,
          asset.type,
          asset.status,
          asset.collectionSource,
          asset.vendor,
          asset.model,
          ...asset.protocols,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);

      return (
        matchesSearch && (!type || asset.type === type) && (!status || asset.status === status)
      );
    });
  }, [assets, search, type, status]);

  const columns: EuiBasicTableColumn<SocAsset>[] = [
    { field: 'id', name: 'Asset ID', sortable: true },
    { field: 'name', name: 'Asset', sortable: true },
    { field: 'zone', name: 'Zone', sortable: true },
    { field: 'type', name: 'Type', sortable: true },
    {
      field: 'status',
      name: 'Status',
      sortable: true,
      render: (value: SocAssetStatus) => (
        <EuiBadge color={assetStatusColors[value]}>{assetStatusLabels[value]}</EuiBadge>
      ),
    },
    { field: 'collectionSource', name: 'Collection source', sortable: true },
    {
      name: 'Details',
      actions: [
        {
          name: 'View asset details',
          description: 'Open asset details',
          type: 'icon',
          icon: 'inspect',
          onClick: (asset: SocAsset) => setSelectedAsset(asset),
        },
      ],
    },
  ];

  const hasActiveFilters = Boolean(search || type || status);

  return (
    <>
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>Asset inventory</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Inventory records and collection state.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem grow={2}>
            <EuiFieldSearch
              aria-label="Search assets"
              placeholder="Search assets"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              isClearable
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter assets by device type"
              options={typeOptions}
              value={type}
              onChange={(event) => setType(event.target.value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiSelect
              aria-label="Filter assets by status"
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
                  setType('');
                  setStatus('');
                }}
              >
                Clear filters
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiInMemoryTable<SocAsset>
          items={filteredAssets}
          columns={columns}
          itemId="id"
          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
          sorting={true}
          tableLayout="auto"
          message="No assets match these filters."
        />
      </EuiPanel>

      {selectedAsset && (
        <EuiFlyout onClose={() => setSelectedAsset(null)} size="m" aria-label="Asset details">
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
                { title: 'Type', description: selectedAsset.type },
                { title: 'Zone', description: selectedAsset.zone },
                { title: 'Vendor', description: selectedAsset.vendor },
                { title: 'Model', description: selectedAsset.model },
                {
                  title: 'Status',
                  description: assetStatusLabels[selectedAsset.status],
                },
                {
                  title: 'Collection source',
                  description: selectedAsset.collectionSource,
                },
                {
                  title: 'Protocols',
                  description: selectedAsset.protocols.join(', ') || 'None',
                },
                {
                  title: 'Recorded last seen',
                  description: new Date(selectedAsset.lastSeen).toLocaleString(),
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
