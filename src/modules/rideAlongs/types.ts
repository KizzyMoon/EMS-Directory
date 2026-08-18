export type RideAlongStatus = 'In Progress' | 'Completed' | 'Cancelled';
export type FeedbackStatus = 'Not Started' | 'Draft' | 'Submitted';

export interface RideAlongCadet {
  id: string;
  memberId: string;
  name: string;
  employeeNumber: string;
  callsign?: string;
  feedbackStatus: FeedbackStatus;
}

export interface RideAlongFeedback {
  id: string;
  cadetId: string;
  cadetName: string;
  strengths: string;
  areasToImprove: string;
  currentFocus: string;
  generalFeedback: string;
  concerns: string;
  internalNotes: string;
  recommendedNextStep: 'Continue Ride Alongs' | 'Ready for Day 2' | 'Needs Specific Training' | 'Command Review Required';
  status: FeedbackStatus;
  submittedAt?: string;
}

export interface RideAlong {
  id: string;
  ftoId: string;
  ftoName: string;
  ftoCallsign: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  status: RideAlongStatus;
  cadets: RideAlongCadet[];
  feedback: RideAlongFeedback[];
  callsAttended: string[];
  createdAt: string;
}

export interface AvailableRideAlongCadet {
  id: string;
  name: string;
  employeeNumber: string;
  callsign: string;
  daysRemaining: number | null;
  rideAlongs: number;
  currentFocus: string;
}

export type RideAlongFeedbackInput = Pick<
  RideAlongFeedback,
  | 'strengths'
  | 'areasToImprove'
  | 'currentFocus'
  | 'generalFeedback'
  | 'concerns'
  | 'internalNotes'
  | 'recommendedNextStep'
>;
