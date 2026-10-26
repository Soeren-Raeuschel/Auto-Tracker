// T7.4: GroqCarExtractor fuer die Pipeline (Node). Chat-Completions-API von Groq
// per fetch, Key aus env GROQ_API_KEY, Modell aus env GROQ_MODEL (Default:
// openai/gpt-oss-120b, mit Fallback-Modellen siehe Browser-Extractor).
// Prompt verlangt NUR JSON, fehlende Werte null; ungueltige Antworten werden
// verworfen. Normalisierung kommt aus dem Browser-Extractor (eine Stelle).
import type { CarCandidate } from '../src/domain/carCandidate';
import { carCandidateSchema } from '../src/validation/schemas';
import { normalizeRawCar } from '../src/infrastructure/extraction/groqCarExtractor';

export { GROQ_URL, DEFAULT_GROQ_MODEL } from '../src/infrastructure/extraction/groqCarExtractor';

export interface GroqCall {
  apiKey: string;
  model: string;
  fetchFn: (url: string, init?: RequestInit) => Promise<Response>;
}

const SYSTEM_PROMPT = `Du bist ein Assistent fuer Elektroauto-Nachrichten. Extrahiere aus dem Artikel alle Fahrzeuge und antworte NUR mit einem JSON-Objekt in dieser Form:
{"cars":[{"brand":"Markenname","model":"Modellname","variant":null,"bodyType":"suv|sedan|hatchback|wagon|other","powertrain":"bev|phev|reev","attributes":{"priceEur":{"value":null,"source":""},"rangeKm":{"value":null,"source":""}}}]}
Regeln:
- Fehlende Werte bekommen value null, niemals raten.
- Zahlen ohne Einheiten, Booleans als true/false.
- Ein Artikel kann mehrere Fahrzeuge beschreiben.`;

type RawCar = Record<string, unknown> & { attributes?: Record<string, unknown> };

/** Wirft bei HTTP-/Netzwerkfehlern, parst sonst die Fahrzeugliste aus dem JSON. */
export async function callGroq(
  articleText: string,
  sourceUrl: string,
  call: GroqCall,
): Promise<CarCandidate[]> {
  let response: Response;
  try {
    response = await call.fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${call.apiKey}` },
      body: JSON.stringify({
        model: call.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Quelle: ${sourceUrl}\n\nArtikel:\n${articleText}` },
        ],
      }),
    });
  } catch {
    throw new Error('Groq nicht erreichbar');
  }
  if (!response.ok) {
    throw new Error(`Groq HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content === '') {
    throw new Error('Groq-Antwort ohne Inhalt');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq hat kein gueltiges JSON geliefert');
  }
  const list = (parsed as { cars?: unknown }).cars;
  if (!Array.isArray(list)) {
    throw new Error('Groq-Antwort ohne "cars"-Liste');
  }
  return list
    .map((raw) => normalizeRawCar(raw as RawCar, sourceUrl))
    .filter((candidate): candidate is CarCandidate => candidate !== null);
}

/** Ungueltige Kandidaten fallen durch das Schema weg (T9.2), nie ein Absturz. */
export function validateCandidates(
  candidates: readonly CarCandidate[],
  onInvalid: (message: string) => void = () => undefined,
): CarCandidate[] {
  const valid: CarCandidate[] = [];
  candidates.forEach((candidate, index) => {
    const result = carCandidateSchema.safeParse(candidate);
    if (result.success) {
      valid.push(result.data);
    } else {
      onInvalid(`Kandidat ${index}: ${result.error.issues.map((i) => i.message).join('; ')}`);
    }
  });
  return valid;
}

/** Dedupe ueber brand+model+variant+sourceUrl, erster Eintrag gewinnt. */
export function mergeCandidates(
  existing: readonly CarCandidate[],
  incoming: readonly CarCandidate[],
): CarCandidate[] {
  const key = (candidate: CarCandidate): string =>
    [candidate.brand, candidate.model, candidate.variant ?? '', candidate.sourceUrl]
      .join('|')
      .toLowerCase();
  const seen = new Set(existing.map(key));
  const merged = [...existing];
  for (const candidate of incoming) {
    const candidateKey = key(candidate);
    if (seen.has(candidateKey)) continue;
    seen.add(candidateKey);
    merged.push(candidate);
  }
  return merged;
}
