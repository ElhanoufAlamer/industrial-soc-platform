import { DEMO_INDUSTRIAL_SOC_DATA } from './demo-data';
import { IndustrialSocDataProvider } from './types';

export const demoIndustrialSocDataProvider: IndustrialSocDataProvider = {
  loadSnapshot: () => Promise.resolve(DEMO_INDUSTRIAL_SOC_DATA),
};
