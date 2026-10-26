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
      if (!response.ok) return false;
      // SPA-Fallback (z. B. Vite Dev-Server) antwortet auf fehlende Dateien
      // mit 200 + index.html. Das zaehlt nicht als Modell.
      const contentType = response.headers.get('content-type') ?? '';
      return !contentType.includes('text/html');
    } catch {
      return false;
    }
  }
}

/** BodyType -> Dateiname. */
export function modelFileName(bodyType: BodyType): string {
  return `${bodyType}.glb`;
}

/**
 * Fallback-Kette: fuer BodyTypes ohne eigene GLB wird ein aehnliches Modell
 * genutzt, damit immer ein 3D-Modell angezeigt wird, solange mindestens eine
 * GLB hinterlegt ist. Eigene Datei geht immer vor.
 */
const MODEL_FALLBACKS: Record<BodyType, BodyType[]> = {
  suv: ['other', 'sedan'],
  sedan: ['suv'],
  hatchback: ['sedan', 'suv'],
  wagon: ['sedan', 'suv'],
  other: ['suv', 'sedan'],
};

/** Kandidaten-URLs in Reihenfolge: eigene Datei zuerst, dann Fallbacks. */
export function modelUrlCandidates(baseUrl: string, bodyType: BodyType): string[] {
  const base = baseUrl.replace(/\/$/, '');
  return [bodyType, ...MODEL_FALLBACKS[bodyType]].map(
    (type) => `${base}/models/${modelFileName(type)}`,
  );
}

/** URL der generischen Modelldatei (ausnutzbar fuer Tests). */
export function genericModelUrl(baseUrl: string, bodyType: BodyType): string {
  return modelUrlCandidates(baseUrl, bodyType)[0] ?? `${baseUrl}/models/${bodyType}.glb`;
}

/** T5.2: Modell pro bodyType aus public/models/<bodyType>.glb. */
export class GenericModelProvider implements ModelProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly checker: ModelFileChecker,
  ) {}

  async getModel(car: Car): Promise<ModelRef | null> {
    for (const url of modelUrlCandidates(this.baseUrl, car.bodyType)) {
      if (await this.checker.exists(url)) return { url, kind: 'generic' };
    }
    return null;
  }
}
