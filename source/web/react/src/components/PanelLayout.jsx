import { useContext } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserContext } from '../context/auth';
import { useInventory } from '../hooks/useInventory';
import Icon from './Icon';
import kiLogo from '../assets/ki_LOGO_b.svg';
const links = [
  ['/', 'Przegląd', 'overview'],
  ['/devices', 'Devices', 'devices'],
  ['/sensors', 'Czujniki', 'sensors'],
  ['/locations', 'Locations', 'locations'],
];
export default function PanelLayout() {
  const { user, logout } = useContext(UserContext);
  const inventory = useInventory();
  const location = useLocation();
  const isAdmin = Boolean(user.isAdmin || user.role === 'admin');
  const current =
    links.find(([url]) => url === location.pathname)?.[1] || 'Administracja';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink
          to="/"
          className="brand"
          aria-label="Smart City Hub — przegląd"
        >
          <img src={kiLogo} alt="KI" className="brand-logo" />
          <span>Smart City Hub</span>
        </NavLink>
        <nav aria-label="Nawigacja główna">
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
            <span className="nav-label admin-label">Administracja</span>
            <nav aria-label="Administracja">
              <NavLink to="/devices/new" className="nav-link">
                <Icon name="add" />
                Dodaj urządzenie
              </NavLink>
              <NavLink to="/users" className="nav-link">
                <Icon name="users" />
                Użytkownicy
              </NavLink>
              <NavLink to="/esp-tokens" className="nav-link">
                <Icon name="devices" />
                Tokeny ESP
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
              {isAdmin ? 'Wszystkie lokalizacje' : 'Dostęp do lokalizacji'}
            </span>
          </div>
          <button onClick={logout} className="icon-button" aria-label="Wyloguj">
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
                ? 'Problem z połączeniem'
                : inventory.loading
                  ? 'Odświeżanie'
                  : 'Dane aktualne'}
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
            Ostatnia próba odświeżenia:{' '}
            {inventory.updated?.toLocaleTimeString('pl-PL') || '—'}
          </span>
        </footer>
      </div>
    </div>
  );
}
