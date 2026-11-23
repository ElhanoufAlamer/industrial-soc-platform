import { SocAlert } from './types';

const columns: Array<{ label: string; value: (alert: SocAlert) => string }> = [
  { label: 'Alert ID', value: alert => alert.id },
  { label: 'Timestamp', value: alert => alert.timestamp },
  { label: 'Severity', value: alert => alert.severity },
  { label: 'Category', value: alert => alert.category },
  { label: 'Source', value: alert => alert.source },
  { label: 'Title', value: alert => alert.title },
  { label: 'Status', value: alert => alert.status },
  { label: 'Asset ID', value: alert => alert.assetId },
  { label: 'Rule ID', value: alert => alert.ruleId },
];

function quoteCsvField(value: string): string {
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function createAlertsCsv(alerts: SocAlert[]): string {
  const header = columns.map(column => quoteCsvField(column.label)).join(',');
  const rows = alerts.map(alert =>
    columns.map(column => quoteCsvField(column.value(alert))).join(','),
  );

  return `\uFEFF${[header, ...rows].join('\r\n')}`;
}
