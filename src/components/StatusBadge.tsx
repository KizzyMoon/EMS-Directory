interface StatusBadgeProps {
  children: string;
  tone?: 'pink' | 'green' | 'amber' | 'red' | 'blue' | 'neutral';
}

export function StatusBadge({ children, tone = 'pink' }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
