export type CadetStage =
  | 'Awaiting Day 1'
  | 'Day 1 Signed Up'
  | 'Available for Ride Alongs'
  | 'Ready for Day 2'
  | 'Day 2 Booked';

export interface Cadet {
  id: string;
  name: string;
  employeeNumber: string;
  stage: CadetStage;
  startDate: string;
  deadline: string;
  rideAlongs: number;
  uniqueFtos: number;
  currentFocus: string;
  dayOneComplete: boolean;
}
