import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronDown,
  GitCompare,
  Inbox,
  Loader,
  Newspaper,
  Search,
  SlidersHorizontal,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/**
 * Zentrale Icon-Komponente (T10.8). Einziger Ort, der `lucide-react` importieren
 * darf (ESLint no-restricted-imports). Neue Icons = ein Eintrag in ICONS.
 */
export type IconName =
  | 'trophy'
  | 'newspaper'
  | 'compare'
  | 'bookmark'
  | 'chevronDown'
  | 'sliders'
  | 'search'
  | 'check'
  | 'inbox'
  | 'alert'
  | 'loader';

const ICONS: Record<IconName, LucideIcon> = {
  trophy: Trophy,
  newspaper: Newspaper,
  compare: GitCompare,
  bookmark: Bookmark,
  chevronDown: ChevronDown,
  sliders: SlidersHorizontal,
  search: Search,
  check: Check,
  inbox: Inbox,
  alert: AlertTriangle,
  loader: Loader,
};

/** Testbar exportiert: alle Namen und ihre Lucide-Komponente. */
export const ICON_RECORD = ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** Erlaubte Groessen laut DESIGN.md: 16 inline, 20 Buttons/Sidebar, 22 TabBar. */
export type IconSize = 16 | 20 | 22;

export function Icon({ name, size = 20 }: { name: IconName; size?: IconSize }) {
  const LucideComponent = ICONS[name];
  // Icons sind dekorativ; der Name steht im sichtbaren Text oder im aria-label.
  return <LucideComponent size={size} strokeWidth={2} aria-hidden="true" />;
}
