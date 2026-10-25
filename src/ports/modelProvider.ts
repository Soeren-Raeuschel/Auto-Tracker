import type { Car } from '../domain/car';

export interface ModelRef {
  url: string; // glTF/GLB
  kind: 'generic' | 'specific';
  license?: string;
}

/** Start with generic models per body type; swap in specific GLBs per car later. */
export interface ModelProvider {
  getModel(car: Car): ModelRef | null;
}
