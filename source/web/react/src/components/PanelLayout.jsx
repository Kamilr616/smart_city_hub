import { useContext } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserContext } from '../context/auth';
import { useInventory } from '../hooks/useInventory';
import Icon from './Icon';
import kiLogo from '../assets/ki_LOGO_b.svg';
const links = [
  ['/', 'Overview', 'overview'],
  ['/devices', 'Devices', 'devices'],
  ['/sensors', 'Sensors', 'sensors'],
  ['/locations', 'Locations', 'locations'],
];
export default function PanelLayout() {
  const { user, logout } = useContext(UserContext);
  const inventory = useInventory();
  const location = useLocation();
  const isAdmin = Boolean(user.isAdmin || user.role === 'admin');
  const current =
    links.find(([url]) => url === location.pathname)?.[1] || 'Administration';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink
          to="/"
          className="brand"
          aria-label="Smart City Hub — overview"
        >
          <img src={kiLogo} alt="KI" className="brand-logo" />
          <span>Smart City Hub</span>
        </NavLink>
        <nav aria-label="Main navigation">
          {links.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' active' : '')
              }
            >
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        {isAdmin && (
          <>
            <span className="nav-label admin-label">Administration</span>
            <nav aria-label="Administration">
              <NavLink to="/devices/new" className="nav-link">
                <Icon name="add" />
                Add device
              </NavLink>
              <NavLink to="/users" className="nav-link">
                <Icon name="users" />
                Users
              </NavLink>
              <NavLink to="/esp-tokens" className="nav-link">
                <Icon name="devices" />
                ESP tokens
              </NavLink>
            </nav>
          </>
        )}
        <div className="sidebar-footer">
          <div className="avatar">
            {isAdmin ? 'A' : (user.role || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{isAdmin ? 'Administrator' : user.role}</strong>
            <span>
              {isAdmin ? 'All locations' : 'Location access'}
            </span>
          </div>
          <button onClick={logout} className="icon-button" aria-label="Log out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Smart City Hub <span>/</span> <strong>{current}</strong>
          </div>
          <div className="topbar-meta">
            <span
              className={
                'connection ' +
                (Object.keys(inventory.errors).length ? 'warning' : '')
              }
            >
              <i />
              {Object.keys(inventory.errors).length
                ? 'Connection problem'
                : inventory.loading
                  ? 'Refreshing'
                  : 'Data up to date'}
            </span>
            <span className="role-pill">
              {isAdmin ? 'Administrator' : user.role}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet context={{ ...inventory, isAdmin, user }} />
        </main>
        <footer className="page-footer">
          <span>
            Last refresh attempt:{' '}
            {inventory.updated?.toLocaleTimeString('en-GB') || '—'}
          </span>
        </footer>
      </div>
    </div>
  );
}
