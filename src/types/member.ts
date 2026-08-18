export const EMS_RANKS = [
  'Chief',
  'Deputy Chief',
  'Captain',
  'Lieutenant',
  'Sergeant',
  'Senior EMT',
  'EMT IV',
  'EMT III',
  'EMT II',
  'EMT I',
  'Probationer',
  'Cadet',
] as const;

export type EmsRank = (typeof EMS_RANKS)[number];

export type MemberStatus = 'Active' | 'LOA' | 'Inactive';

export interface MemberQualifications {
  fto: boolean;
  hart: boolean;
  met: boolean;
  doctor: boolean;
}

export interface EmsMember {
  id: string;
  rank: EmsRank;
  callsign: string;
  name: string;
  employeeNumber: string;
  steamName: string;
  discordName: string;
  discordUserId: string | null;
  timezone: string;
  status: MemberStatus;
  qualifications: MemberQualifications;
  source?: 'Google Sheets' | 'Supabase';
}

export type RosterMemberInput = Omit<EmsMember, 'id' | 'discordName' | 'discordUserId'>;
