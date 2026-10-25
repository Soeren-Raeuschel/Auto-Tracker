import { ROUTES } from '../routes';
import type { IconName } from '../components/Icon';

/** Reine Nav-Daten der Shell (T10.3). Tabs laut Aufgabe: Ranking, News, Vergleich, Watchlist. */
export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: IconName;
  disabled: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'ranking', label: 'Ranking', path: ROUTES.ranking, icon: 'trophy', disabled: false },
  { key: 'news', label: 'News', path: ROUTES.news, icon: 'newspaper', disabled: true },
  { key: 'compare', label: 'Vergleich', path: ROUTES.compare, icon: 'compare', disabled: false },
  {
    key: 'watchlist',
    label: 'Watchlist',
    path: ROUTES.watchlist,
    icon: 'bookmark',
    disabled: true,
  },
];

/** Ready-to-render Nav-Eintrag: aktiv, wenn der Pfad zur aktuellen Route passt. */
export interface NavItemVM extends NavItem {
  active: boolean;
}

/**
 * Reine Funktion: markiert den aktiven Eintrag. `/` matcht exakt, alle anderen
 * Pfade matchen auch Praefixe (z. B. `/car/:id` unterliegt keinem Nav-Eintrag,
 * aber `/news/xyz` wuerde News markieren, sobald es Unterrouten gibt).
 */
// Pattern: MVVM. Pure function = easy to test without a browser.
export function toAppShellViewModel(
  activePath: string,
  items: readonly NavItem[] = NAV_ITEMS,
): NavItemVM[] {
  return items.map((item) => ({
    ...item,
    active: item.disabled
      ? false
      : item.path === '/'
        ? activePath === item.path
        : activePath === item.path || activePath.startsWith(`${item.path}/`),
  }));
}
