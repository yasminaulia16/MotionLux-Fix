import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, CalendarClock, House, Lightbulb, LogOut, Map, Menu, Power, Settings, UsersRound, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { profile, logout } = useAuth();
  const { lamps } = useApp();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const lampId = lamps[0]?.id || 1;
  const isAdmin = profile?.role === 'admin';
  const roleLabel = isAdmin ? 'Administrator' : 'User';

  const base = [
    ['/', 'Dashboard', House],
    [`/lamps/${lampId}`, 'Lamp Control', Lightbulb],
    ['/schedule', 'Schedule', CalendarClock],
    ['/automation', 'Sunrise / Sunset', Map],
    ['/motion-sensor', 'Motion Sensor', Activity],
    ['/settings', 'Settings', Settings]
  ];
  // Admin hanya punya 2 menu: User Management & Shutdown Lamp. Profil admin dibuka dari avatar di kanan atas.
  const adminItems = [['/users', 'User Management', UsersRound], ['/shutdown', 'Shutdown Lamp', Power]];
  const items = isAdmin ? adminItems : base;
  const section = pathname.startsWith('/lamps/')
    ? 'Lamp Control'
    : pathname === '/settings'
      ? 'Settings'
      : items.find(([to]) => to === pathname)?.[1] || 'MotionLux';

  return (
    <div className="app-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={20} fill="currentColor" /></div>
          <div>
            <strong>MotionLux</strong>
            <span>Smart Lighting</span>
          </div>
        </div>

        <nav>
          <p className="nav-label">Control Center</p>
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-status">
            <span className="status-dot" />
            <div>
              <strong>System Online</strong>
              <small>{roleLabel} account</small>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-title">
            <p className="crumb">MotionLux <span>/</span> <strong>{section}</strong></p>
          </div>
          <Link to="/settings" className="profile" title="Pengaturan profil">
            <div className="avatar">{(profile?.name || 'U').slice(0, 2).toUpperCase()}</div>
            <div className="profile-text">
              <strong>{profile?.name}</strong>
              <span>{roleLabel}</span>
            </div>
          </Link>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
