interface QualificationBadgeProps {
  label: 'FTO' | 'HART' | 'MET' | 'Doctor';
}

export function QualificationBadge({ label }: QualificationBadgeProps) {
  return <span className="qualification-badge">{label}</span>;
}
