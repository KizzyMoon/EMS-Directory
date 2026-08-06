import {
  Ambulance,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  HeartPulse,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { NavigationItem } from '../types/navigation';

const navigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: Gauge },
  { label: 'Roster', path: '/roster', icon: Users },
  { label: 'Cadets', path: '/cadets', icon: GraduationCap },
  { label: 'Training', path: '/training', icon: CalendarDays },
  { label: 'Ride Alongs', path: '/ride-alongs', icon: Ambulance },
  { label: 'Training Sheets', path: '/training-sheets', icon: ClipboardList },
  { label: 'Probationer Tests', path: '/probationer-tests', icon: ShieldCheck },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  { label: 'Quick Reference', path: '/quick-reference', icon: HeartPulse },
  { label: 'Forms', path: '/forms', icon: FileText },
  { label: 'My Profile', path: '/profile', icon: Stethoscope },
  { label: 'Administration', path: '/administration', icon: Settings, permission: 'admin.view' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><HeartPulse size={22} /></div>
          <div>
            <strong>SAMD Internal</strong>
            <span>EMS operations</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <button className="search-button" type="button">
            <Search size={18} />
            <span>Search people, cadets, guides…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="user-chip">
            <div className="avatar">KM</div>
            <div>
              <strong>Kizzy Moon</strong>
              <span>FTO</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {mobileOpen ? <button className="backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}
    </div>
  );
}
