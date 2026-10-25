import type { CarCandidate } from '../../domain/carCandidate';
import type { ApiKeyRepository } from '../../ports/apiKeyRepository';
import type { CarExtractor } from '../../ports/carExtractor';
import { parseValid, carCandidateSchema } from '../../validation/schemas';

/** Groq chat endpoint (OpenAI-kompatibel). JSON-Mode via response_format. */
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

const ATTRIBUTE_KEYS = [
  'priceEur',
  'rangeKm',
  'batteryKwh',
  'consumptionKwh100',
  'dcMaxKw',
  'panoramaRoof',
  'hud',
  'massageSeats',
] as const;

const SYSTEM_PROMPT = `Du bist ein Assistent für Elektroauto-Daten. Extrahiere aus dem gegebenen Artikel alle Fahrzeuge und gib sie als JSON zurück.

Antworte NUR mit einem JSON-Objekt in dieser Form:
{"cars":[{"brand":"Markenname","model":"Modellname","variant":"Ausstattungslinie oder null","bodyType":"suv|sedan|hatchback|wagon|other","powertrain":"bev|phev|reev","attributes":{"priceEur":{"value":46600,"source":"Preisliste"},"rangeKm":{"value":null,"source":""}}}]

Regeln:
- Erlaubte attribute-Keys sind NUR: ${ATTRIBUTE_KEYS.join(', ')}.
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
    const isBooleanKey = key === 'panoramaRoof' || key === 'hud' || key === 'massageSeats';
    const value = isBooleanKey
      ? parseBooleanish(rawAttribute.value)
      : parseNumberish(rawAttribute.value);
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
    let response: Response;
    try {
      response = await this.fetchFn(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
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
      const status = response.status;
      const detail =
        status === 401
          ? ' (API-Key ungültig)'
          : status === 429
            ? ' (Limit erreicht, später erneut)'
            : '';
      throw new Error(`Groq-Fehler HTTP ${status}${detail}`);
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
}
