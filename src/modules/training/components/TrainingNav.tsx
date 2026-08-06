import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Dashboard', path: '/training' },
  { label: 'Sessions', path: '/training/sessions' },
  { label: 'Attendance', path: '/training/attendance' },
  { label: 'Training Records', path: '/training/records' },
];

export function TrainingNav() {
  return (
    <nav className="module-tabs" aria-label="Training navigation">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.path === '/training'}
          className={({ isActive }) => (isActive ? 'module-tab active' : 'module-tab')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
