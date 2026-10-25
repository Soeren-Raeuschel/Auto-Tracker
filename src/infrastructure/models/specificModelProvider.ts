import type { Car } from '../../domain/car';
import type { ModelProvider, ModelRef } from '../../ports/modelProvider';
import type { ModelFileChecker } from './genericModelProvider';

// Pattern: Decorator ueber ModelProvider (Vorlesung 02, S. 70). Bevorzugt eine
// eigene GLB pro Auto unter public/models/cars/<id>.glb, sonst Fall-back auf
// den GenericModelProvider (T5.4). Haelt den Vertrag von ModelProvider ein.

/** URL der Auto-spezifischen Modelldatei (ausnutzbar fuer Tests). */
export function specificModelUrl(baseUrl: string, carId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/models/cars/${encodeURIComponent(carId)}.glb`;
}

/** T5.4: spezifisches Modell pro Auto-ID, sonst generisches Modell per bodyType. */
export class SpecificModelProvider implements ModelProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly checker: ModelFileChecker,
    private readonly fallback: ModelProvider,
  ) {}

  async getModel(car: Car): Promise<ModelRef | null> {
    const url = specificModelUrl(this.baseUrl, car.id);
    if (await this.checker.exists(url)) return { url, kind: 'specific' };
    return this.fallback.getModel(car);
  }
}
