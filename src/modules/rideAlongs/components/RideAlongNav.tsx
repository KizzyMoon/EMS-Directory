import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Overview', path: '/ride-alongs' },
  { label: 'Start Ride Along', path: '/ride-alongs/start' },
  { label: 'History', path: '/ride-alongs/history' },
];

export function RideAlongNav() {
  return (
    <nav className="module-tabs" aria-label="Ride along navigation">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.path === '/ride-alongs'}
          className={({ isActive }) => (isActive ? 'module-tab active' : 'module-tab')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
