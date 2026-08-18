import { mockRideAlongs } from '../rideAlongs/data/mockRideAlongs';
import type { TrainingSession } from '../training/types';
import type { CadetRecord } from './types';

export function getCadetRideAlongs(cadet: CadetRecord) {
  return mockRideAlongs.filter((rideAlong) =>
    rideAlong.cadets.some((entry) => entry.memberId === cadet.memberId),
  );
}

export function getCadetFeedback(cadet: CadetRecord) {
  return getCadetRideAlongs(cadet)
    .flatMap((rideAlong) => rideAlong.feedback)
    .filter((feedback) => feedback.cadetId === cadet.memberId)
    .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
}

export function getCadetStats(cadet: CadetRecord) {
  const rideAlongs = getCadetRideAlongs(cadet);
  const completedRideAlongs = rideAlongs.filter((rideAlong) => rideAlong.status === 'Completed');
  const uniqueFtos = new Set(completedRideAlongs.map((rideAlong) => rideAlong.ftoId)).size;
  const feedback = getCadetFeedback(cadet);
  const latestFeedback = feedback[0];

  return {
    rideAlongCount: completedRideAlongs.length,
    uniqueFtoCount: uniqueFtos,
    latestFeedback,
    currentFocus: latestFeedback?.currentFocus || 'Not set',
  };
}

export function getCadetTrainingSessions(cadet: CadetRecord, sessions: TrainingSession[] = []) {
  return sessions.filter((session) =>
    session.signups.some((signup) => signup.memberId === cadet.memberId),
  );
}

export function getUpcomingCadetSession(cadet: CadetRecord, sessions: TrainingSession[] = []) {
  return getCadetTrainingSessions(cadet, sessions).find((session) =>
    session.status === 'Open' || session.status === 'Full',
  );
}
