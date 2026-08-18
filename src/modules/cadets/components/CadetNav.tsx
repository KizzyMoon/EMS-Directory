import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Overview', path: '/cadets' },
  { label: 'Not Booked', path: '/cadets?stage=Not%20currently%20booked' },
  { label: 'Day 1 Booked', path: '/cadets?stage=Day%201%20Signed%20Up' },
  { label: 'Ride Along Ready', path: '/cadets?stage=Available%20for%20Ride%20Alongs' },
  { label: 'Day 2 Booked', path: '/cadets?stage=Day%202%20Booked' },
];

export function CadetNav() {
  return (
    <nav className="module-tabs" aria-label="Cadet navigation">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.path === '/cadets'}
          className={({ isActive }) => (isActive ? 'module-tab active' : 'module-tab')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
