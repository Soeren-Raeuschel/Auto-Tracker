import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppShellViewModel } from '../viewmodels/useAppShellViewModel';
import type { NavItemVM } from '../viewmodels/appShellViewModel';
import './AppShell.css';

/**
 * Responsive Layout-Shell (T10.3). Breakpoints nur per CSS:
 * mobil <768 px schwebende TabBar, Tablet 768-1023 px Icon-Sidebar,
 * Desktop ab 1024 px Sidebar mit Labels. Safe Areas via env().
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navItems = useAppShellViewModel();

  return (
    <div className="app-shell">
      <header className="app-shell__sidebar" aria-label="Hauptnavigation">
        <div className="app-shell__logo">
          <span className="app-shell__logo-dot" aria-hidden="true" />
          <span className="app-shell__logo-text label">Auto-Tracker</span>
        </div>
        <nav className="app-shell__nav" aria-label="Navigation">
          {navItems.map((item) => (
            <NavItemLink key={item.key} item={item} />
          ))}
        </nav>
      </header>

      <main className="app-shell__content">{children}</main>

      <nav className="app-shell__tabbar glass" aria-label="Hauptnavigation">
        {navItems.map((item) => (
          <NavItemLink key={item.key} item={item} compact />
        ))}
      </nav>
    </div>
  );
}

function NavItemLink({ item, compact = false }: { item: NavItemVM; compact?: boolean }) {
  if (item.disabled) {
    return (
      <span className="app-shell__nav-item app-shell__nav-item--disabled" aria-disabled="true">
        <span className="app-shell__nav-label">{item.label}</span>
      </span>
    );
  }
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `app-shell__nav-item${compact ? ' app-shell__nav-item--compact' : ''}${
          isActive ? ' app-shell__nav-item--active' : ''
        }`
      }
    >
      <span className="app-shell__nav-label">{item.label}</span>
    </NavLink>
  );
}
