import { isBackendConfigured } from '../config/env';
import type {
  AvailableRideAlongCadet,
  RideAlong,
  RideAlongFeedbackInput,
} from '../modules/rideAlongs/types';
import { apiRequest } from './api';

export interface RideAlongOverview {
  rideAlongs: RideAlong[];
  availableCadets: AvailableRideAlongCadet[];
}

export async function getRideAlongOverview(): Promise<RideAlongOverview> {
  if (!isBackendConfigured) return { rideAlongs: [], availableCadets: [] };
  return apiRequest<RideAlongOverview>('/api/ride-alongs');
}

export async function getRideAlong(rideAlongId: string): Promise<RideAlong | null> {
  if (!isBackendConfigured) return null;
  const response = await apiRequest<{ rideAlong: RideAlong }>(`/api/ride-alongs/${encodeURIComponent(rideAlongId)}`);
  return response.rideAlong;
}

export async function startRideAlong(cadetIds: string[], startedAt: string): Promise<RideAlong> {
  const response = await apiRequest<{ rideAlong: RideAlong }>('/api/ride-alongs', {
    method: 'POST',
    body: JSON.stringify({ cadetIds, startedAt }),
  });
  return response.rideAlong;
}

export async function addRideAlongCall(rideAlongId: string, callCode: string): Promise<RideAlong> {
  const response = await apiRequest<{ rideAlong: RideAlong }>(`/api/ride-alongs/${encodeURIComponent(rideAlongId)}/calls`, {
    method: 'POST',
    body: JSON.stringify({ callCode }),
  });
  return response.rideAlong;
}

export async function endRideAlong(rideAlongId: string): Promise<RideAlong> {
  const response = await apiRequest<{ rideAlong: RideAlong }>(`/api/ride-alongs/${encodeURIComponent(rideAlongId)}/end`, { method: 'POST' });
  return response.rideAlong;
}

export async function saveRideAlongFeedback(
  rideAlongId: string,
  cadetId: string,
  feedback: RideAlongFeedbackInput,
  submit: boolean,
): Promise<RideAlong> {
  const response = await apiRequest<{ rideAlong: RideAlong }>(`/api/ride-alongs/${encodeURIComponent(rideAlongId)}/feedback/${encodeURIComponent(cadetId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...feedback, submit }),
  });
  return response.rideAlong;
}
