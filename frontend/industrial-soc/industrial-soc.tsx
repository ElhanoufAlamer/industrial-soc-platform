import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiCallOut,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { demoIndustrialSocDataProvider } from './data/data-provider';
import { IndustrialSocDataProvider, IndustrialSocSnapshot, SocTimeRange } from './data/types';
import { IndustrialSocAssetsPage } from './assets-page';
import { IndustrialSocAlertsPage } from './alerts-page';
import { IndustrialSocHealthPage } from './health-page';
import { IndustrialSocLogsPage } from './logs-page';
import { IndustrialSocMitrePage } from './mitre-page';
import { IndustrialSocOtPage } from './ot-page';
import { IndustrialSocOverviewPage } from './overview-page';
import { IndustrialSocReportsPage } from './reports-page';
import './industrial-soc.scss';

type SocPageId = 'overview' | 'alerts' | 'logs' | 'assets' | 'ot' | 'mitre' | 'reports' | 'health';

interface SocPage {
  id: SocPageId;
  label: string;
}

interface IndustrialSocProps {
  dataProvider?: IndustrialSocDataProvider;
}

const pages: SocPage[] = [
  { id: 'overview', label: 'SOC Overview' },
  { id: 'alerts', label: 'Security Alerts' },
  { id: 'logs', label: 'Log Explorer' },
  { id: 'assets', label: 'Asset Inventory' },
  { id: 'ot', label: 'OT Monitoring' },
  { id: 'mitre', label: 'MITRE ATT&CK for ICS' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'health', label: 'System Health' },
];

const timeRangeOptions = [
  { value: '24h' as SocTimeRange, text: 'Last 24 hours' },
  { value: '7d' as SocTimeRange, text: 'Last 7 days' },
  { value: '30d' as SocTimeRange, text: 'Last 30 days' },
  { value: 'all' as SocTimeRange, text: 'All records' },
];

function isSocTimeRange(value: string): value is SocTimeRange {
  return ['24h', '7d', '30d', 'all'].includes(value);
}

function isWithinRange(timestamp: string, range: SocTimeRange): boolean {
  if (range === 'all') {
    return true;
  }

  const rangeHours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
  const earliestTimestamp = Date.now() - rangeHours * 60 * 60 * 1000;
  return new Date(timestamp).getTime() >= earliestTimestamp;
}

function filterSnapshotByTime(
  snapshot: IndustrialSocSnapshot,
  range: SocTimeRange
): IndustrialSocSnapshot {
  if (range === 'all') {
    return snapshot;
  }

  return {
    ...snapshot,
    alerts: snapshot.alerts.filter((alert) => isWithinRange(alert.timestamp, range)),
    logs: snapshot.logs.filter((log) => isWithinRange(log.timestamp, range)),
  };
}

export const IndustrialSOC: React.FC<IndustrialSocProps> = ({
  dataProvider = demoIndustrialSocDataProvider,
}) => {
  const [activePage, setActivePage] = useState<SocPageId>('overview');
  const [timeRange, setTimeRange] = useState<SocTimeRange>('7d');
  const [snapshot, setSnapshot] = useState<IndustrialSocSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const active = pages.find((page) => page.id === activePage) || pages[0];

  useEffect(() => {
    let isMounted = true;
    setSnapshot(null);
    setLoadError(null);

    dataProvider
      .loadSnapshot()
      .then((data) => {
        if (isMounted) {
          setSnapshot(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dataProvider]);

  const filteredSnapshot = useMemo(
    () => (snapshot ? filterSnapshotByTime(snapshot, timeRange) : null),
    [snapshot, timeRange]
  );

  const renderContent = () => {
    if (!filteredSnapshot) {
      return null;
    }

    switch (activePage) {
      case 'alerts':
        return <IndustrialSocAlertsPage alerts={filteredSnapshot.alerts} />;
      case 'logs':
        return <IndustrialSocLogsPage logs={filteredSnapshot.logs} />;
      case 'assets':
        return <IndustrialSocAssetsPage assets={filteredSnapshot.assets} />;
      case 'ot':
        return (
          <IndustrialSocOtPage assets={filteredSnapshot.assets} logs={filteredSnapshot.logs} />
        );
      case 'mitre':
        return <IndustrialSocMitrePage techniques={filteredSnapshot.techniques} />;
      case 'reports':
        return <IndustrialSocReportsPage alerts={snapshot?.alerts ?? filteredSnapshot.alerts} />;
      case 'health':
        return <IndustrialSocHealthPage services={filteredSnapshot.services} />;
      default:
        return <IndustrialSocOverviewPage snapshot={filteredSnapshot} timeRange={timeRange} />;
    }
  };

  return (
    <EuiPage className="industrial-soc-page" paddingSize="l">
      <EuiPageBody>
        <header className="industrial-soc-header">
          <div>
            <div className="industrial-soc-eyebrow">INDUSTRIAL SECURITY OPERATIONS</div>
            <EuiTitle size="l">
              <h1>{active.label}</h1>
            </EuiTitle>
            <EuiText color="subdued" size="s">
              Unified visibility across industrial and enterprise environments
            </EuiText>
          </div>
          <div className="industrial-soc-controls">
            <div className="industrial-soc-prototype-indicator" role="note">
              <span className="industrial-soc-prototype-indicator__label">
                Prototype environment
              </span>
              <span aria-hidden="true">·</span>
              <span>Sample IT/OT security data</span>
            </div>
            <EuiSelect
              aria-label="SOC data time range"
              options={timeRangeOptions}
              value={timeRange}
              onChange={(event) => {
                if (isSocTimeRange(event.target.value)) {
                  setTimeRange(event.target.value);
                }
              }}
            />
          </div>
        </header>
        <EuiSpacer size="m" />
        <div className="industrial-soc-layout">
          <nav className="industrial-soc-sidebar" aria-label="Industrial SOC sections">
            <div className="industrial-soc-sidebar__label">SOC workspace</div>
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={
                  activePage === page.id
                    ? 'industrial-soc-nav__button is-active'
                    : 'industrial-soc-nav__button'
                }
                aria-current={activePage === page.id ? 'page' : undefined}
                onClick={() => setActivePage(page.id)}
              >
                {page.label}
              </button>
            ))}
          </nav>
          <main className="industrial-soc-main">
            {loadError ? (
              <EuiCallOut
                color="danger"
                iconType="alert"
                title="Industrial SOC data could not be loaded"
              >
                {loadError}
              </EuiCallOut>
            ) : !filteredSnapshot ? (
              <EuiPanel paddingSize="l">
                <EuiText>Loading SOC data…</EuiText>
              </EuiPanel>
            ) : (
              renderContent()
            )}
            <EuiSpacer size="l" />
          </main>
        </div>
      </EuiPageBody>
    </EuiPage>
  );
};
