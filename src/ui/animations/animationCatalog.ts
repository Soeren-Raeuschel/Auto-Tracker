import type { IconName } from '../components/Icon';

/**
 * Animations-Katalog (T13.1/T13.2), siehe docs/DESIGN.md, Abschnitt Lottie-Animationen.
 * Die JSON-Dateien legt der Nutzer selbst unter `src/assets/animations/` ab
 * (Quelle/Lizenz dort in LICENSES.md). Fehlt eine Datei, zeigt die Komponente
 * nur das Ersatz-Icon - nichts bricht.
 */
export type AnimationId = 'success' | 'empty' | 'error' | 'watchlistToggle' | 'loadingHero';

export interface AnimationDefinition {
  id: AnimationId;
  /** Pfad innerhalb von src/assets/animations. */
  file: string;
  loop: boolean;
  fallbackIcon: IconName;
  /** Herkunft, z. B. "LottieFlow". */
  source: string;
}

/** Slots laut T13.2. Erst wenn die JSON-Datei existiert, wird animiert. */
export const ANIMATION_CATALOG: Partial<Record<AnimationId, AnimationDefinition>> = {
  success: {
    id: 'success',
    file: 'success.json',
    loop: false,
    fallbackIcon: 'check',
    source: 'LottieFlow',
  },
  empty: {
    id: 'empty',
    file: 'empty.json',
    loop: true,
    fallbackIcon: 'inbox',
    source: 'LottieFlow',
  },
  error: {
    id: 'error',
    file: 'error.json',
    loop: false,
    fallbackIcon: 'alert',
    source: 'LottieFlow',
  },
  watchlistToggle: {
    id: 'watchlistToggle',
    file: 'watchlist-toggle.json',
    loop: false,
    fallbackIcon: 'bookmark',
    source: 'LottieFlow',
  },
  loadingHero: {
    id: 'loadingHero',
    file: 'loading-hero.json',
    loop: true,
    fallbackIcon: 'loader',
    source: 'LottieFlow',
  },
};

export function getAnimationDefinition(id: AnimationId): AnimationDefinition | null {
  return ANIMATION_CATALOG[id] ?? null;
}

/**
 * Reine Logik (T13.1): Nur ohne Reduced Motion und nur bei registriertem Slot
 * wird animiert; sonst (oder ohne Definition) gilt das Ersatz-Icon.
 */
export function shouldAnimate(
  prefersReducedMotion: boolean,
  definition: AnimationDefinition | null,
): boolean {
  return !prefersReducedMotion && definition !== null;
}
