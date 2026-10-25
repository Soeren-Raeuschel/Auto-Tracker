import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { computeFlipTransforms, type FlipRect } from './motionViewModel';

/**
 * FLIP-Umsortierung (T10.6, docs/DESIGN.md Bewegung): misst vor dem Rendern
 * die Positionen der Kinder mit `data-row-id` und animiert die Verschiebung
 * per `transform` (400 ms). Laeuft noch eine Einblend-Animation, wird sie
 * vorher beendet (`animation: none`), damit nicht zwei Systeme transform steuern.
 */
export function useFlipReorder(containerRef: RefObject<HTMLElement | null>, ids: string): void {
  const previousRects = useRef<Map<string, FlipRect> | null>(null);
  const previousIds = useRef<string | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentIds = ids;
    const hadRender = previousIds.current !== null;
    previousIds.current = currentIds;

    const current = measure(container);
    const previous = previousRects.current;
    previousRects.current = current;

    if (!hadRender || !previous) return;
    const deltas = computeFlipTransforms(previous, current);
    if (deltas.size === 0) return;

    const elements: HTMLElement[] = [];
    for (const [id, delta] of deltas) {
      if (delta.dx === 0 && delta.dy === 0) continue;
      const element = container.querySelector<HTMLElement>(`[data-row-id="${id}"]`);
      if (!element) continue;
      element.style.animation = 'none';
      element.style.transition = 'none';
      element.style.transform = `translate(${delta.dx}px, ${delta.dy}px)`;
      elements.push(element);
    }
    if (elements.length === 0) return;

    // Double-Raf: Browser muss die Invert-Position zuerst painten.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const element of elements) {
          element.style.transition = 'transform var(--t-base) var(--ease)';
          element.style.transform = '';
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [containerRef, ids]);

  // Referenzen am Ende aufraeumen.
  useEffect(() => {
    return () => {
      previousRects.current = null;
      previousIds.current = null;
    };
  }, []);
}

function measure(container: HTMLElement): Map<string, FlipRect> {
  const rects = new Map<string, FlipRect>();
  for (const element of container.querySelectorAll<HTMLElement>('[data-row-id]')) {
    const id = element.dataset.rowId;
    if (!id) continue;
    const rect = element.getBoundingClientRect();
    rects.set(id, { top: rect.top, left: rect.left });
  }
  return rects;
}
