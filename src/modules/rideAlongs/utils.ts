import type { FeedbackStatus, RideAlongStatus } from './types';

export function formatRideAlongDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDuration(minutes?: number) {
  if (!minutes) return 'In progress';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

export function rideAlongTone(status: RideAlongStatus) {
  if (status === 'Completed') return 'green' as const;
  if (status === 'Cancelled') return 'red' as const;
  return 'blue' as const;
}

export function feedbackTone(status: FeedbackStatus) {
  if (status === 'Submitted') return 'green' as const;
  if (status === 'Draft') return 'amber' as const;
  return 'neutral' as const;
}
