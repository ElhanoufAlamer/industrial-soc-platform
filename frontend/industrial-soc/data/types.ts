export type SocSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type SocAlertStatus = 'new' | 'investigating' | 'reviewed' | 'resolved';

export type SocAssetStatus =
  | 'demo-monitored'
  | 'demo-attention'
  | 'demo-not-connected';

export type SocServiceStatus = 'integration-pending' | 'not-connected';

export type SocTimeRange = '24h' | '7d' | '30d' | 'all';

export interface SocAlert {
  id: string;
  timestamp: string;
  assetId: string;
  source: string;
  title: string;
  description: string;
  severity: SocSeverity;
  status: SocAlertStatus;
  ruleId: string;
  category: string;
  techniqueIds: string[];
}

export interface SocLogEntry {
  id: string;
  timestamp: string;
  host: string;
  source: string;
  facility: string;
  severity: SocSeverity;
  message: string;
  payload: string;
}

export interface SocAsset {
  id: string;
  name: string;
  zone: string;
  type: string;
  status: SocAssetStatus;
  collectionSource: string;
  vendor: string;
  model: string;
  protocols: string[];
  lastSeen: string;
  description: string;
}

export interface SocTechnique {
  id: string;
  tactic: string;
  name: string;
  description: string;
  observation: string;
  relatedAlertIds: string[];
}

export interface SocService {
  id: string;
  name: string;
  description: string;
  status: SocServiceStatus;
}

export interface IndustrialSocSnapshot {
  origin: 'demo';
  generatedAt: string;
  alerts: SocAlert[];
  logs: SocLogEntry[];
  assets: SocAsset[];
  techniques: SocTechnique[];
  services: SocService[];
}

export interface IndustrialSocDataProvider {
  loadSnapshot(): Promise<IndustrialSocSnapshot>;
}
