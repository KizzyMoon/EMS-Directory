export type CadetStage =
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
  startDate: string;
  deadline: string;
  stage: CadetStage;
  dayOneComplete: boolean;
  dayOneSessionId?: string;
  dayTwoSessionId?: string;
  nextStep: string;
}
