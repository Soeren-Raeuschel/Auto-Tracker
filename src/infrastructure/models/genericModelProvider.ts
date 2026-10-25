import type { BodyType, Car } from '../../domain/car';
import type { ModelProvider, ModelRef } from '../../ports/modelProvider';

// Pattern: Adapter (Vorlesung 02, S. 63). GenericModelProvider bildet ein Auto
// per bodyType auf eine GLB-Datei unter public/models/ ab. Fehlt die Datei,
// liefert der Provider null (Platzhalter-Hinweis in der UI, T5.3).

export interface ModelFileChecker {
  exists(url: string): Promise<boolean>;
}

/**
 * Prueft per HEAD, ob die GLB-Datei vorhanden ist. Ein fehlender Datei-Eintrag
 * wirft nichts, sondern meldet einfach "nicht da".
 */
export class FetchModelFileChecker implements ModelFileChecker {
  constructor(private readonly fetchFn: typeof fetch = (i, init) => fetch(i, init)) {}

  async exists(url: string): Promise<boolean> {
    try {
      const response = await this.fetchFn(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/** BodyType -> Dateiname. */
export function modelFileName(bodyType: BodyType): string {
  return `${bodyType}.glb`;
}

/** URL der generischen Modelldatei (ausnutzbar fuer Tests). */
export function genericModelUrl(baseUrl: string, bodyType: BodyType): string {
  return `${baseUrl.replace(/\/$/, '')}/models/${modelFileName(bodyType)}`;
}

/** T5.2: Modell pro bodyType aus public/models/<bodyType>.glb. */
export class GenericModelProvider implements ModelProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly checker: ModelFileChecker,
  ) {}

  async getModel(car: Car): Promise<ModelRef | null> {
    const url = genericModelUrl(this.baseUrl, car.bodyType);
    if (!(await this.checker.exists(url))) return null;
    return { url, kind: 'generic' };
  }
}
