import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_MODELS,
  DEFAULT_GROQ_MODEL,
  GroqCarExtractor,
  parseBooleanish,
  parseNumberish,
} from './groqCarExtractor';
import { LocalStorageApiKeyRepository } from '../localStorageApiKeyRepository';

const storage: Record<string, string> = {};
const fakeStorageApi = {
  getItem: (key: string): string | null => (key in storage ? (storage[key] ?? null) : null),
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
};

const article = 'XPeng G6 Long Range, 52.000 Euro, 87,5 kWh, 550 km WLTP, 451 kW DC.';

function groqResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response;
}

function buildExtractor(fetchFn: typeof fetch) {
  const apiKeyRepository = new LocalStorageApiKeyRepository(fakeStorageApi);
  return new GroqCarExtractor({ apiKeyRepository, fetchFn });
}

describe('parseNumberish', () => {
  beforeEach(() => {
    delete storage['auto-tracker:groq-key'];
  });
  it('parst deutsches Zahlenformat', () => {
    expect(parseNumberish('46.600 €')).toBe(46600);
    expect(parseNumberish('87,5 kWh')).toBe(87.5);
    expect(parseNumberish('ab 24.900')).toBe(24900);
    expect(parseNumberish(133)).toBe(133);
  });

  it('gibt null bei Unsinn zurück', () => {
    expect(parseNumberish('')).toBeNull();
    expect(parseNumberish('keine Angabe')).toBeNull();
  });
});

describe('parseBooleanish', () => {
  it('parst deutsche Booleans', () => {
    expect(parseBooleanish('ja')).toBe(true);
    expect(parseBooleanish('nein')).toBe(false);
    expect(parseBooleanish(true)).toBe(true);
    expect(parseBooleanish('vielleicht')).toBeNull();
  });
});

describe('GroqCarExtractor', () => {
  beforeEach(() => {
    delete storage['auto-tracker:groq-key'];
  });

  const validContent = JSON.stringify({
    cars: [
      {
        brand: 'XPeng',
        model: 'G6',
        bodyType: 'SUV',
        powertrain: 'Elektro',
        attributes: {
          priceEur: { value: '52.000 €', source: 'Artikel' },
          rangeKm: { value: 550, source: 'Hersteller' },
          panoramaRoof: { value: 'ja', source: 'Artikel' },
          hud: { value: null, source: 'nicht genannt' },
        },
      },
    ],
  });

  it('extrahiert einen Kandidaten aus der Groq-Antwort', async () => {
    const fetchFn = vi.fn(async () => groqResponse(validContent));
    const extractor = buildExtractor(fetchFn as unknown as typeof fetch);
    storage['auto-tracker:groq-key'] = 'gsk_test';
    const candidates = await extractor.extract(article, 'https://example.com/artikel');
    expect(candidates).toHaveLength(1);
    const extracted = candidates[0]!;
    expect(extracted.brand).toBe('XPeng');
    expect(extracted.bodyType).toBe('suv');
    expect(extracted.powertrain).toBe('bev');
    expect(extracted.attributes.priceEur?.value).toBe(52000);
    expect(extracted.attributes.panoramaRoof?.value).toBe(true);
    expect(extracted.attributes.hud).toBeUndefined();
    expect(extracted.sourceUrl).toBe('https://example.com/artikel');
    // Auth-Header gesetzt?
    const request = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(request[0]).toContain('api.groq.com');
    expect(request[1].headers).toMatchObject({
      Authorization: expect.stringContaining('Bearer'),
    });
  });
  it('lehnt fehlenden API-Key ab', async () => {
    const fetchFn = vi.fn();
    const extractor = new GroqCarExtractor({
      apiKeyRepository: new LocalStorageApiKeyRepository(fakeStorageApi),
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await expect(extractor.extract(article, 'https://example.com')).rejects.toThrow('API-Key');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('liefert HTTP-Fehler als klare Meldung', async () => {
    const fetchFn = vi.fn(async () => ({ ok: false, status: 401 }) as unknown as Response);
    const extractor = buildExtractor(fetchFn as unknown as typeof fetch);
    storage['auto-tracker:groq-key'] = 'gsk_test';
    await expect(extractor.extract(article, 'https://example.com')).rejects.toThrow('401');
  });

  it('weicht bei 404 (Modell nicht verfuegbar) auf Fallback-Modelle aus', async () => {
    const notFound = {
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'model_not_found', type: 'invalid_request_error' } }),
    } as unknown as Response;
    const fetchFn = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(notFound)
      .mockResolvedValueOnce(groqResponse(validContent));
    const extractor = buildExtractor(fetchFn as unknown as typeof fetch);
    storage['auto-tracker:groq-key'] = 'gsk_test';
    const candidates = await extractor.extract(article, 'https://example.com');
    expect(candidates).toHaveLength(1);
    const models = fetchFn.mock.calls.map(
      (call) => (JSON.parse(String((call[1] as RequestInit).body)) as { model: string }).model,
    );
    expect(models[0]).toBe(DEFAULT_GROQ_MODEL);
    expect(models[1]).toBe(FALLBACK_MODELS[0]);
  });

  it('schmeisst Fehler wenn kein Modell verfuegbar ist', async () => {
    const notFound = { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
    const fetchFn = vi.fn(async () => notFound);
    const extractor = buildExtractor(fetchFn as unknown as typeof fetch);
    storage['auto-tracker:groq-key'] = 'gsk_test';
    await expect(extractor.extract(article, 'https://example.com')).rejects.toThrow(
      'nicht verfuegbar',
    );
    expect(fetchFn).toHaveBeenCalledTimes(1 + FALLBACK_MODELS.length);
  });

  it('schmeisst ungueltige Eintraege weg (parseValid, kein Absturz)', async () => {
    const mixed = JSON.stringify({
      cars: [
        { brand: '', model: 'ohne Marke', bodyType: 'suv', powertrain: 'bev', attributes: {} },
        {
          brand: 'Leapmotor',
          model: 'B03X',
          bodyType: 'suv',
          powertrain: 'bev',
          attributes: { priceEur: { value: 29400, source: 'ADAC' } },
        },
      ],
    });
    const fetchFn = vi.fn(async () => groqResponse(mixed));
    const extractor = buildExtractor(fetchFn as unknown as typeof fetch);
    storage['auto-tracker:groq-key'] = 'gsk_test';
    const candidates = await extractor.extract(article, 'https://example.com');
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.model).toBe('B03X');
  });
});
