/**
 * Reine Bewegungs-Logik (T10.6), siehe docs/DESIGN.md, Abschnitt Bewegung.
 * Kein DOM-Zugriff hier - das misst der Hook `useFlipReorder`.
 */

/** Staffelung des Einblendens: 100 ms pro Stufe, maximal 5 Stufen, danach 0. */
export function staggerDelayMs(index: number, stepMs = 100, maxSteps = 5): number {
  if (index < 0) return 0;
  return Math.min(index, maxSteps) * stepMs;
}

/** Rechteck-Ausschnitt, den der Hook aus getBoundingClientRect uebertraegt. */
export interface FlipRect {
  top: number;
  left: number;
}

/** Ergebnis je Element-ID: Verschiebung von der alten zur neuen Position. */
export interface FlipDelta {
  dx: number;
  dy: number;
}

/**
 * FLIP-Technik (First - Last - Invert - Play): Deltas von der vorherigen
 * zur aktuellen Position. Elemente, die nur in einer Map existieren
 * (neu dazugekommen oder verschwunden), bekommen kein Delta.
 */
export function computeFlipTransforms(
  previous: ReadonlyMap<string, FlipRect>,
  current: ReadonlyMap<string, FlipRect>,
): Map<string, FlipDelta> {
  const deltas = new Map<string, FlipDelta>();
  for (const [id, rect] of current) {
    const before = previous.get(id);
    if (!before) continue;
    deltas.set(id, { dx: before.left - rect.left, dy: before.top - rect.top });
  }
  return deltas;
}
