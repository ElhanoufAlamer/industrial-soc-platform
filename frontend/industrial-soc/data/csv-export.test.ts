import { createAlertsCsv } from './csv-export';
import { SocAlert } from './types';

describe('createAlertsCsv', () => {
  it('quotes fields and escapes commas, quotes, and embedded newlines', () => {
    const alert: SocAlert = {
      id: 'demo-alert-1',
      timestamp: '2025-01-02T03:04:05.000Z',
      assetId: 'OT-PLC-001',
      source: 'Controller, zone 1',
      title: 'Program "changed"\nexample',
      description: 'Synthetic record',
      severity: 'high',
      status: 'new',
      ruleId: 'demo-rule-1',
      category: 'Configuration',
      techniqueIds: [],
    };

    const csv = createAlertsCsv([alert]);

    expect(csv).toContain('\uFEFF"Alert ID","Timestamp","Severity"');
    expect(csv).toContain('"Controller, zone 1"');
    expect(csv).toContain('"Program ""changed""\nexample"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('neutralizes spreadsheet formulas in exported values', () => {
    const alert: SocAlert = {
      id: 'demo-alert-2',
      timestamp: '2025-01-02T03:04:05.000Z',
      assetId: 'OT-PLC-001',
      source: 'Syslog',
      title: 'Example',
      description: 'Synthetic record',
      severity: 'high',
      status: 'new',
      ruleId: 'demo-rule-2',
      category: '=HYPERLINK("https://example.invalid","link")',
      techniqueIds: [],
    };

    expect(createAlertsCsv([alert])).toContain('\x27=HYPERLINK(');
  });
});
