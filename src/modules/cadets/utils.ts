import type { CadetStage } from './types';

export function daysRemaining(deadline: string | null) {
  if (!deadline) return null;
  const today = new Date();
  const due = new Date(`${deadline}T12:00:00`);
  return Math.max(0, Math.ceil((due.getTime() - today.getTime()) / 86_400_000));
}

export function formatCadetDate(date: string | null) {
  if (!date) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export function cadetStageTone(stage: CadetStage) {
  if (stage === 'Awaiting Day 1') return 'amber' as const;
  if (stage === 'Day 1 Signed Up') return 'blue' as const;
  if (stage === 'Available for Ride Alongs') return 'pink' as const;
  if (stage === 'Ready for Day 2') return 'green' as const;
  return 'blue' as const;
}
