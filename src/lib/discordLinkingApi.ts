import type { EmsMember } from '../types/member';
import { apiRequest } from './api';

export async function getDiscordLinkCandidates(): Promise<EmsMember[]> {
  const response = await apiRequest<{ members: EmsMember[] }>('/api/discord-links');
  return response.members;
}

export async function linkDiscordAccount(memberId: string, discordUserId: string, note: string): Promise<EmsMember> {
  const response = await apiRequest<{ member: EmsMember }>('/api/discord-links', {
    method: 'POST',
    body: JSON.stringify({ memberId, discordUserId, note }),
  });
  return response.member;
}
