import React, { useMemo } from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '@elastic/charts';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiInMemoryTable,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { IndustrialSocSnapshot, SocAlert, SocSeverity, SocTimeRange } from './data/types';

interface OverviewPageProps {
  snapshot: IndustrialSocSnapshot;
  timeRange: SocTimeRange;
}

const severityOrder: SocSeverity[] = ['critical', 'high', 'medium', 'low', 'informational'];

const severityColors: Record<SocSeverity, string> = {
  critical: '#bd271e',
  high: '#d04a3a',
  medium: '#d99b18',
  low: '#6554a4',
  informational: '#8792a2',
};

const alertColumns: EuiBasicTableColumn<SocAlert>[] = [
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
];

function getActivityData(
  snapshot: IndustrialSocSnapshot,
  range: SocTimeRange
): Array<{ bucket: string; count: number }> {
  const now = Date.now();
  const bucketCount = range === '24h' ? 6 : range === '30d' ? 10 : 7;
  const defaultDuration = range === '24h' ? 24 : range === '7d' ? 168 : 720;
  const eventTimes = snapshot.logs
    .map((log) => new Date(log.timestamp).getTime())
    .filter((timestamp) => Number.isFinite(timestamp));
  const earliestEventTime = eventTimes.reduce(
    (earliest, timestamp) => Math.min(earliest, timestamp),
    Number.POSITIVE_INFINITY
  );
  const start =
    range === 'all' && eventTimes.length
      ? earliestEventTime
      : now - defaultDuration * 60 * 60 * 1000;
  const duration = Math.max(now - start, 1);
  const bucketDuration = duration / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + bucketDuration * index;
    const date = new Date(bucketStart);
    const label =
      range === '24h'
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return { bucket: label, count: 0, start: bucketStart };
  });

  eventTimes.forEach((timestamp) => {
    const index = Math.min(Math.floor((timestamp - start) / bucketDuration), bucketCount - 1);
    if (index >= 0) {
      buckets[index].count += 1;
    }
  });

  return buckets.map(({ bucket, count }) => ({ bucket, count }));
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <EuiPanel paddingSize="l" className="industrial-soc-metric">
      <EuiText size="s" color="subdued">
        {label}
      </EuiText>
      <div className="industrial-soc-metric__value">{value}</div>
      <EuiText size="xs" color="subdued">
        {detail}
      </EuiText>
    </EuiPanel>
  );
}

export const IndustrialSocOverviewPage: React.FC<OverviewPageProps> = ({ snapshot, timeRange }) => {
  const activityData = useMemo(() => getActivityData(snapshot, timeRange), [snapshot, timeRange]);
  const severityCounts = severityOrder.map((severity) => ({
    severity,
    count: snapshot.alerts.filter((alert) => alert.severity === severity).length,
  }));
  const maxSeverityCount = Math.max(...severityCounts.map((item) => item.count), 1);
  const monitoredAssets = snapshot.assets.filter((asset) => asset.status === 'demo-monitored')
    .length;
  const attentionAssets = snapshot.assets.filter((asset) => asset.status === 'demo-attention')
    .length;
  const disconnectedAssets = snapshot.assets.filter(
    (asset) => asset.status === 'demo-not-connected'
  ).length;
  const highPriority = snapshot.alerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'high'
  ).length;

  return (
    <>
      <div className="industrial-soc-metrics">
        <Metric
          label="Assets"
          value={String(snapshot.assets.length)}
          detail="In the selected range"
        />
        <Metric
          label="Alerts"
          value={String(snapshot.alerts.length)}
          detail="In the selected range"
        />
        <Metric
          label="High-priority alerts"
          value={String(highPriority)}
          detail="Critical and high severity"
        />
        <Metric
          label="Asset statuses"
          value={`${monitoredAssets}/${snapshot.assets.length}`}
          detail="Monitored statuses in this dataset"
        />
      </div>

      <div className="industrial-soc-grid industrial-soc-grid--two">
        <EuiPanel paddingSize="l" className="industrial-soc-panel">
          <div className="industrial-soc-page-title">
            <EuiTitle size="s">
              <h2>Alert severity distribution</h2>
            </EuiTitle>
            <EuiText color="subdued" size="s">
              Alert counts for the selected time range.
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
              <h2>Log activity</h2>
            </EuiTitle>
            <EuiText color="subdued" size="s">
              Log activity across the selected range.
            </EuiText>
          </div>
          <EuiSpacer size="m" />
          <div className="industrial-soc-chart">
            <Chart size="100%">
              <Settings showLegend={false} />
              <Axis id="industrial-soc-activity-y" position={Position.Left} />
              <Axis id="industrial-soc-activity-x" position={Position.Bottom} />
              <BarSeries
                id="industrial-soc-demo-log-activity"
                data={activityData}
                xAccessor="bucket"
                yAccessors={['count']}
                xScaleType={ScaleType.Ordinal}
                yScaleType={ScaleType.Linear}
                color="#6554a4"
              />
            </Chart>
          </div>
        </EuiPanel>
      </div>

      <EuiSpacer size="m" />
      <div className="industrial-soc-grid industrial-soc-grid--two">
        <EuiPanel paddingSize="l" className="industrial-soc-panel">
          <div className="industrial-soc-page-title">
            <EuiTitle size="s">
              <h2>Asset status</h2>
            </EuiTitle>
          </div>
          <EuiSpacer size="m" />
          <div className="industrial-soc-summary-list">
            <div className="industrial-soc-summary-row">
              <span>Monitored</span>
              <strong>{monitoredAssets}</strong>
            </div>
            <div className="industrial-soc-summary-row">
              <span>Needs attention</span>
              <strong>{attentionAssets}</strong>
            </div>
            <div className="industrial-soc-summary-row">
              <span>Not connected</span>
              <strong>{disconnectedAssets}</strong>
            </div>
          </div>
        </EuiPanel>

        <EuiPanel paddingSize="l" className="industrial-soc-panel">
          <div className="industrial-soc-page-title">
            <EuiTitle size="s">
              <h2>Recent alerts</h2>
            </EuiTitle>
          </div>
          <EuiSpacer size="m" />
          <EuiInMemoryTable<SocAlert>
            items={snapshot.alerts.slice(0, 5)}
            columns={alertColumns}
            itemId="id"
            sorting={true}
            message="No alerts match this time range."
          />
        </EuiPanel>
      </div>
    </>
  );
};
