import type { CadetRecord } from '../modules/cadets/types';
import { isBackendConfigured } from '../config/env';
import { apiRequest } from './api';

export async function getCadets(): Promise<CadetRecord[]> {
  if (!isBackendConfigured) return [];
  const response = await apiRequest<{ cadets: CadetRecord[] }>('/api/cadets');
  return response.cadets;
}

export async function getCadet(cadetId: string): Promise<CadetRecord | null> {
  if (!isBackendConfigured) return null;
  const response = await apiRequest<{ cadet: CadetRecord }>(`/api/cadets/${encodeURIComponent(cadetId)}`);
  return response.cadet;
}
