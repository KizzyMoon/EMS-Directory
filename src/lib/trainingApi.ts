import { isBackendConfigured } from '../config/env';
import type {
  AttendanceStatus,
  SignupRole,
  TrainingSession,
} from '../modules/training/types';
import { apiRequest } from './api';

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  if (!isBackendConfigured) return [];
  const response = await apiRequest<{ sessions: TrainingSession[] }>('/api/training-sessions');
  return response.sessions;
}

export async function getTrainingSession(sessionId: string): Promise<TrainingSession | null> {
  if (!isBackendConfigured) return null;
  const response = await apiRequest<{ session: TrainingSession }>(`/api/training-sessions/${encodeURIComponent(sessionId)}`);
  return response.session;
}

export async function signupForTrainingSession(sessionId: string, role: SignupRole): Promise<TrainingSession> {
  const response = await apiRequest<{ session: TrainingSession }>(`/api/training-sessions/${encodeURIComponent(sessionId)}/signup`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  return response.session;
}

export async function saveTrainingAttendance(
  sessionId: string,
  entries: Array<{ memberId: string; status: AttendanceStatus; notes: string }>,
): Promise<TrainingSession> {
  const response = await apiRequest<{ session: TrainingSession }>(`/api/training-sessions/${encodeURIComponent(sessionId)}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify({ entries }),
  });
  return response.session;
}
