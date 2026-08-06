import type { TrainingSession } from './types';

export function formatTrainingDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export function getSessionCounts(session: TrainingSession) {
  const active = session.signups.filter((signup) => signup.status !== 'Withdrawn' && signup.status !== 'Cancelled');
  return {
    cadets: active.filter((signup) => signup.role === 'Cadet').length,
    ftos: active.filter((signup) => signup.role === 'FTO').length,
    waiting: active.filter((signup) => signup.status === 'Waiting List').length,
  };
}

export function sessionTone(status: TrainingSession['status']) {
  if (status === 'Completed') return 'green' as const;
  if (status === 'Cancelled') return 'red' as const;
  if (status === 'Full') return 'amber' as const;
  if (status === 'Open') return 'blue' as const;
  return 'neutral' as const;
}
