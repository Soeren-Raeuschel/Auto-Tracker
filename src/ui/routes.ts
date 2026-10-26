/**
 * Zentrale Routen-Konfiguration (T2.1). Reine Daten, damit die Routen testbar sind,
 * ohne React zu rendern. `/news` und `/candidates` seit T7.3/T7.5 aktiv.
 */
export const ROUTES = {
  ranking: '/',
  settings: '/settings',
  carDetail: '/car/:id',
  compare: '/compare',
  news: '/news',
  watchlist: '/watchlist',
  importCars: '/import',
  candidates: '/candidates',
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Alle definierten Pfade (fuer Tests und Nav-Abgleich). */
export const routePaths: readonly string[] = Object.values(ROUTES);
