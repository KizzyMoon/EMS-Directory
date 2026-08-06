export type EmsRank =
  | 'Chief'
  | 'Deputy Chief'
  | 'Captain'
  | 'Lieutenant'
  | 'Sergeant'
  | 'Senior EMT'
  | 'EMT IV'
  | 'EMT III'
  | 'EMT II'
  | 'EMT I'
  | 'Probationer'
  | 'Cadet';

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
}
