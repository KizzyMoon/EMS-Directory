import { isBackendConfigured } from '../config/env';
import { mockMembers } from '../data/mockMembers';
import type { EmsMember, RosterMemberInput } from '../types/member';
import { apiRequest } from './api';

export async function getRoster(): Promise<EmsMember[]> {
  if (!isBackendConfigured) return mockMembers;
  const response = await apiRequest<{ members: EmsMember[] }>('/api/roster');
  return response.members;
}

export async function getRosterMember(memberId: string): Promise<EmsMember | null> {
  if (!isBackendConfigured) return mockMembers.find((member) => member.id === memberId) ?? null;
  const response = await apiRequest<{ member: EmsMember }>(`/api/roster/${encodeURIComponent(memberId)}`);
  return response.member;
}

export async function createRosterMember(input: RosterMemberInput): Promise<EmsMember> {
  const response = await apiRequest<{ member: EmsMember }>('/api/roster', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.member;
}

export async function updateRosterMember(memberId: string, input: RosterMemberInput): Promise<EmsMember> {
  const response = await apiRequest<{ member: EmsMember }>(`/api/roster/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.member;
}

export async function archiveRosterMember(memberId: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/api/roster/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
}
