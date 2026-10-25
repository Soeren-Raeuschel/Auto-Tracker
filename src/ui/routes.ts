/**
 * Zentrale Routen-Konfiguration (T2.1). Reine Daten, damit die Routen testbar sind,
 * ohne React zu rendern. `/news` und `/watchlist` sind Platzhalter bis T7.3.
 */
export const ROUTES = {
  ranking: '/',
  settings: '/settings',
  carDetail: '/car/:id',
  compare: '/compare',
  news: '/news',
  watchlist: '/watchlist',
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Alle definierten Pfade (ohne den späteren `/news`). */
export const routePaths: readonly string[] = Object.values(ROUTES);
