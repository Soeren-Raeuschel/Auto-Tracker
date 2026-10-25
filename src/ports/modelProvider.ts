import type { Car } from '../domain/car';

export interface ModelRef {
  url: string; // glTF/GLB
  kind: 'generic' | 'specific';
  license?: string;
}

/**
 * Start with generic models per body type; swap in specific GLBs per car later.
 * Asynchron, weil die Implementierung pruefen muss, ob eine Datei existiert
 * (T5.2). null = kein Modell verfuegbar (UI zeigt Platzhalter).
 */
export interface ModelProvider {
  getModel(car: Car): Promise<ModelRef | null>;
}
