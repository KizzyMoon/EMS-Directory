import {
  Ambulance,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  HeartPulse,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasAnyPermission } from '../auth/permissions';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Gauge;
  permissions?: Parameters<typeof hasAnyPermission>[1];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  { items: [{ label: 'Dashboard', path: '/', icon: Gauge }] },
  {
    label: 'Personnel',
    items: [
      { label: 'Roster', path: '/roster', icon: Users },
      { label: 'Cadets', path: '/cadets', icon: GraduationCap },
    ],
  },
  {
    label: 'Training',
    items: [
      { label: 'Sessions', path: '/training', icon: CalendarDays },
      { label: 'Ride Alongs', path: '/ride-alongs', icon: Ambulance },
      { label: 'Training Sheets', path: '/training-sheets', icon: ClipboardList, permissions: ['fto_resources.read'] },
      { label: 'Probationer Tests', path: '/probationer-tests', icon: ShieldCheck, permissions: ['fto_resources.read'] },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Quick Reference', path: '/quick-reference', icon: HeartPulse },
      { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen, permissions: ['fto_resources.read'] },
      { label: 'Forms', path: '/forms', icon: FileText, permissions: ['fto_resources.read'] },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Administration', path: '/administration', icon: Settings, permissions: ['admin.read'] },
      { label: 'Discord IDs', path: '/administration/discord-linking', icon: ShieldCheck, permissions: ['discord_ids.manage'] },
    ],
  },
];

export function AppLayout() {
  const { user, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ems-sidebar-collapsed') === 'true');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ems-theme') !== 'light');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ems-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('ems-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('#global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shellClass = useMemo(
    () => `app-shell${collapsed ? ' sidebar-collapsed' : ''}`,
    [collapsed],
  );

  return (
    <div className={shellClass}>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><HeartPulse size={22} /></div>
          <div className="brand-copy">
            <strong>EMS Directory</strong>
            <span>Pillbox Ops - Shared</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((group, groupIndex) => (
            <div className="nav-group" key={group.label ?? `group-${groupIndex}`}>
              {group.label ? <p className="nav-group-label">{group.label}</p> : null}
              {group.items.filter((item) => !item.permissions || hasAnyPermission(user, item.permissions)).map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <Stethoscope size={18} />
            <span>My Profile</span>
          </NavLink>
          <button className="collapse-button" type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>

          <label className="search-box" htmlFor="global-search">
            <Search size={18} />
            <input id="global-search" type="search" placeholder="Search units, cadets, protocols..." />
            <kbd>Ctrl K</kbd>
          </label>

          <div className="topbar-actions">
            <button className="icon-button topbar-button" type="button" onClick={() => setDarkMode((value) => !value)} aria-label="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="notification-wrap">
              <button className="icon-button topbar-button notification-button" type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Notifications">
                <Bell size={18} />
                <span className="notification-dot" />
              </button>
              {notificationsOpen ? (
                <div className="notification-panel glass-card">
                  <div className="panel-header compact">
                    <div>
                      <p className="eyebrow">Notifications</p>
                      <h2>Latest updates</h2>
                    </div>
                    <button className="text-button" type="button">Mark all read</button>
                  </div>
                  <div className="notification-item unread">
                    <strong>Day 1 training needs an FTO</strong>
                    <span>8 August - 19:00</span>
                  </div>
                  <div className="notification-item">
                    <strong>Ride-along feedback saved</strong>
                    <span>Alex Morgan - 12 minutes ago</span>
                  </div>
                </div>
              ) : null}
            </div>

            <button className="user-chip user-chip-text-only" type="button" onClick={() => void logout()}>
              <div className="user-copy">
                <strong>{user?.displayName ?? 'Not signed in'}</strong>
                <span>{status === 'unconfigured' ? 'Setup mode' : user?.rank ?? 'No rank'}</span>
              </div>
              <ChevronDown size={15} />
            </button>
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
