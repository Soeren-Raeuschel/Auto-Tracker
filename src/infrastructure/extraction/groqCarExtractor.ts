import type { CarCandidate } from '../../domain/carCandidate';
import { attributeCatalog } from '../../domain/attributeCatalog';
import type { ApiKeyRepository } from '../../ports/apiKeyRepository';
import type { CarExtractor } from '../../ports/carExtractor';
import { parseValid, carCandidateSchema } from '../../validation/schemas';

/** Groq chat endpoint (OpenAI-kompatibel). JSON-Mode via response_format. */
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
/**
 * Fallback-Modelle, falls das Standard-Modell fuer den eigenen Key nicht
 * verfuegbar ist (Groq antwortet dann mit HTTP 404 model_not_found).
 */
export const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'] as const;

/** Keys + Labels dynamisch aus dem Katalog — der Import sucht genau nach den Filter-Kriterien der App. */
const ATTRIBUTE_KEYS = attributeCatalog.map((a) => a.key) as string[];

/** Boolean-Keys ableiten statt hardcoden — sonst werden neue Bool-Attribute als Zahl geparst. */
const BOOLEAN_KEYS: ReadonlySet<string> = new Set(
  attributeCatalog.filter((a) => a.kind === 'boolean').map((a) => a.key),
);

/** Prompt-Bausteine aus dem Katalog, damit Prompt und Kriterien immer synchron sind. */
const KEY_HINTS = attributeCatalog
  .map((a) => `${a.key} = ${a.label}${a.unit ? ` (${a.unit})` : ''}`)
  .join('; ');

const EXTRACTION_HINTS: Record<string, string> = {
  priceEur: 'auch geschätzter/Einstiegspreis zählt',
  rangeKm: 'bevorzugt WLTP',
  dcMaxKw: 'Ladeleistung in kW, nicht Ladezeit in Minuten',
};

const SYSTEM_PROMPT = `Du bist ein Assistent für Elektroauto-Daten. Extrahiere aus dem gegebenen Artikel alle Fahrzeuge und gib sie als JSON zurück.

Antworte NUR mit einem JSON-Objekt in dieser Form:
{"cars":[{"brand":"Markenname","model":"Modellname","variant":"Ausstattungslinie oder null","bodyType":"suv|sedan|hatchback|wagon|other","powertrain":"bev|phev|reev","attributes":{"priceEur":{"value":46600,"source":"Preisliste"},"rangeKm":{"value":420,"source":"Datenblatt"}}}]}

Regeln:
- Erlaubte attribute-Keys sind NUR: ${ATTRIBUTE_KEYS.join(', ')}.
- Das sind genau die Filter-Kriterien der App. Prüfe den Artikel SYSTEMATISCH auf jeden dieser Keys, auch unter alternativen Bezeichnungen:
  ${KEY_HINTS}.
- Zusätzliche Hinweise: ${Object.entries(EXTRACTION_HINTS)
  .map(([k, h]) => `${k}: ${h}`)
  .join('; ')}.
- Suchbegriffe auf der Seite können variieren (z. B. „Reichweite“, „WLTP“, „Batteriekapazität“, „Akkukapazität“, „DC-Laden“). Nutze sie alle für die Keys oben.
- Schiebetüren, antibakterielle Materialien o. ä. gehören NICHT in attributes — nur die Keys oben.
- Steht der Artikel als Fließtext ohne Ausstattungsliste, übernimm trotzdem alles, was zu einem Key passt. Fehlt ein Key komplett: weglassen, nicht mit null füllen.
- Zahlen ohne Währung/Einheiten (z. B. 46600, nicht "46.600 €"). Booleans als true/false.
- Wenn ein Wert im Artikel steht, übernimm ihn. Wenn er fehlt und du ihn sicher aus deinem eigenen Wissen kennst, ergänze ihn. Wenn du unsicher bist: value null.
- Bei E-Reichweite von Reichweiten-Streckern (EREV) nutze die rein elektrische WLTP-Reichweite.
- Gib source als kurze Erklärung (z. B. "Preisliste" oder "aus eigenem Wissen, prüfen").
- Ein Artikel kann mehrere Fahrzeuge beschreiben; erstelle für jedes gültige Fahrzeug einen Eintrag.`;

export interface GroqExtractorDeps {
  apiKeyRepository: ApiKeyRepository;
  fetchFn?: typeof fetch;
  model?: string;
}

export interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

/** Parst Zahlen, die als Text kommen ("46.600 €", "63,5 kWh", "ab 34.900"). */
export function parseNumberish(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[^\d.,-]/g, '');
  if (cleaned === '') return null;
  // Deutsches Format: Punkt als Tausender, Komma als Dezimal.
  const normalized = cleaned.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Normalisiert booleans, die als String kommen ("ja", "true", "nein"). */
export function parseBooleanish(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const lower = raw.trim().toLowerCase();
    if (['ja', 'true', 'yes', 'vorhanden', 'serienmäßig', 'serie'].includes(lower)) return true;
    if (['nein', 'false', 'no', 'nicht vorhanden', 'kein'].includes(lower)) return false;
  }
  return null;
}

const BODY_TYPES: Record<string, CarCandidate['bodyType']> = {
  suv: 'suv',
  sedan: 'sedan',
  limousine: 'sedan',
  hatchback: 'hatchback',
  wagon: 'wagon',
  kombi: 'wagon',
  coupe: 'sedan',
  coupé: 'sedan',
  van: 'other',
  pickup: 'other',
  other: 'other',
};

const POWERTRAINS: Record<string, CarCandidate['powertrain']> = {
  bev: 'bev',
  elektro: 'bev',
  electric: 'bev',
  phev: 'phev',
  hybrid: 'phev',
  'plug-in-hybrid': 'phev',
  reev: 'reev',
  'range-extender': 'reev',
  erev: 'reev',
};

interface RawAttribute {
  value?: unknown;
  source?: unknown;
}
type RawCar = Record<string, unknown> & { attributes?: Record<string, RawAttribute> };

export function normalizeRawCar(raw: RawCar, sourceUrl: string): CarCandidate | null {
  const brand = typeof raw.brand === 'string' ? raw.brand.trim() : '';
  const model = typeof raw.model === 'string' ? raw.model.trim() : '';
  if (brand === '' || model === '') return null;
  const bodyType = BODY_TYPES[String(raw.bodyType ?? '').toLowerCase()] ?? 'other';
  const powertrain = POWERTRAINS[String(raw.powertrain ?? '').toLowerCase()] ?? 'bev';
  const today = new Date().toISOString().slice(0, 10);
  const rawAttributes = raw.attributes ?? {};
  const attributes: CarCandidate['attributes'] = {};
  for (const key of ATTRIBUTE_KEYS) {
    const rawAttribute = rawAttributes[key];
    if (rawAttribute === undefined) continue;
    const isBooleanKey = BOOLEAN_KEYS.has(key);
    const value = isBooleanKey
      ? parseBooleanish(rawAttribute.value)
      : parseNumberish(rawAttribute.value);
    if (value === null) continue; // Kein Wert ermittelbar -> Attribut gar nicht anlegen.
    const rawSource = rawAttribute.source;
    const source =
      typeof rawSource === 'string' && rawSource.trim() !== ''
        ? rawSource.trim()
        : `Groq, prüfen (${sourceUrl})`;
    attributes[key] = { value, confidence: 'ai-extracted', source, updatedAt: today };
  }
  const rawVariant = raw.variant;
  const variant =
    typeof rawVariant === 'string' && rawVariant.trim() !== '' ? rawVariant.trim() : undefined;
  const candidate: CarCandidate = {
    brand,
    model,
    ...(variant === undefined ? {} : { variant }),
    bodyType,
    powertrain,
    attributes,
    sourceUrl,
  };
  return candidate;
}

function parseResponseContent(content: string): RawCar[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq hat kein gültiges JSON geliefert.');
  }
  const rawCars = (parsed as { cars?: unknown }).cars;
  if (Array.isArray(rawCars)) return rawCars as RawCar[];
  if (Array.isArray(parsed)) return parsed as RawCar[];
  throw new Error('Groq-Antwort enthält keine Fahrzeugliste ("cars").');
}

/** Pattern: Strategy — Groq ist eine Implementierung des CarExtractor-Ports. */
export class GroqCarExtractor implements CarExtractor {
  private readonly fetchFn: typeof fetch;
  private readonly model: string;

  constructor(private readonly deps: GroqExtractorDeps) {
    this.fetchFn = deps.fetchFn ?? fetch.bind(globalThis);
    this.model = deps.model ?? DEFAULT_GROQ_MODEL;
  }

  async extract(articleText: string, sourceUrl: string): Promise<CarCandidate[]> {
    const apiKey = this.deps.apiKeyRepository.get();
    if (apiKey === null || apiKey === '') {
      throw new Error(
        'Kein Groq-API-Key gesetzt. Auf console.groq.com einen kostenlosen Key erstellen und unten eintragen.',
      );
    }
    const models = [this.model, ...FALLBACK_MODELS.filter((m) => m !== this.model)];
    let lastError: Error | null = null;
    for (const model of models) {
      let response: Response;
      try {
        response = await this.fetchFn(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Quelle: ${sourceUrl}\n\nArtikel:\n${articleText}` },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        });
      } catch {
        throw new Error('Groq-API nicht erreichbar (Netzwerk oder Key ungueltig).');
      }
      if (!response.ok) {
        const detail = await errorDetail(response);
        if (response.status === 404) {
          // Modell fuer diesen Key nicht verfuegbar -> naechstes Fallback-Modell.
          lastError = new Error(`Groq-Modell "${model}" nicht verfuegbar (HTTP 404${detail}).`);
          continue;
        }
        const hint =
          response.status === 401
            ? ' (API-Key ungültig)'
            : response.status === 429
              ? ' (Limit erreicht, später erneut)'
              : '';
        throw new Error(`Groq-Fehler HTTP ${response.status}${hint}${detail}`);
      }
      const payload = (await response.json()) as GroqResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content === '') {
        throw new Error('Groq-Antwort ohne Inhalt.');
      }
      const rawCars = parseResponseContent(content);
      const candidates = rawCars
        .map((raw) => normalizeRawCar(raw, sourceUrl))
        .filter((candidate): candidate is CarCandidate => candidate !== null);
      const valid = parseValid(carCandidateSchema, candidates, () => {
        // Schema-Bruch wäre ein interner Bug in normalizeRawCar; hier nicht erwartet.
      });
      if (valid.length === 0) {
        throw new Error('Groq hat kein gültiges Fahrzeug extrahiert. Bitte manuell prüfen.');
      }
      return valid;
    }
    throw lastError ?? new Error('Groq-Fehler: kein Modell verfuegbar.');
  }
}

/** Liest aus einer Fehlerantwort die Groq-Fehlermeldung (z. B. model_not_found). */
async function errorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    const message = payload.error?.message;
    return typeof message === 'string' && message !== '' ? `: ${message}` : '';
  } catch {
    return '';
  }
}
