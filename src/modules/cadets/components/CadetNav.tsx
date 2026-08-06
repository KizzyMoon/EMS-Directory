import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Overview', path: '/cadets' },
  { label: 'Awaiting Day 1', path: '/cadets?stage=Awaiting%20Day%201' },
  { label: 'Ride Along Ready', path: '/cadets?stage=Available%20for%20Ride%20Alongs' },
  { label: 'Ready for Day 2', path: '/cadets?stage=Ready%20for%20Day%202' },
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
