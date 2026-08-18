export type TrainingType = 'Day 1' | 'Day 2' | 'Other Training' | 'Probationer Test';
export type TrainingStatus = 'Draft' | 'Open' | 'Full' | 'Completed' | 'Cancelled';
export type SignupRole = 'Cadet' | 'FTO' | 'Supervisor' | 'Observer';
export type SignupStatus = 'Signed Up' | 'Waiting List' | 'Withdrawn' | 'Attended' | 'No Show' | 'Cancelled';
export type AttendanceStatus = 'Pending' | 'Attended' | 'Late' | 'No Show' | 'Cancelled' | 'Excused';

export interface TrainingSignup {
  id: string;
  memberId: string;
  memberName: string;
  callsign?: string;
  role: SignupRole;
  status: SignupStatus;
  signedUpAt: string;
}

export interface TrainingAttendance {
  memberId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface TrainingActivity {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  type: TrainingType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  server: string;
  cadetCapacity: number;
  ftoCapacity: number;
  status: TrainingStatus;
  notes: string;
  createdBy: string;
  signups: TrainingSignup[];
  attendance: TrainingAttendance[];
  activity: TrainingActivity[];
}

export interface TrainingSessionInput {
  type: TrainingType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  server: string;
  cadetCapacity: number;
  ftoCapacity: number;
  notes: string;
}
