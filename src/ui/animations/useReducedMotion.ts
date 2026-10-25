import { useEffect, useState } from 'react';

/** MediaQuery fuer "Reduced Motion" (T13.1). */
const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Liest `prefers-reduced-motion` und aktualisiert sich live, falls der Nutzer
 * die Einstellung waehrend der Laufzeit aendert.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
