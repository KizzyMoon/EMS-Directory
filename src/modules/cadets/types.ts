export type CadetStage =
  | 'Not currently booked'
  | 'Awaiting Day 1'
  | 'Day 1 Signed Up'
  | 'Available for Ride Alongs'
  | 'Ready for Day 2'
  | 'Day 2 Booked';

export interface CadetRecord {
  id: string;
  memberId: string;
  name: string;
  employeeNumber: string;
  callsign: string;
  startDate: string | null;
  deadline: string | null;
  stage: CadetStage;
  dayOneComplete: boolean;
  dayOneSessionId?: string;
  dayTwoSessionId?: string;
  nextStep: string;
  source?: 'Google Sheets' | 'Supabase';
}
