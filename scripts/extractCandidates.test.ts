import { describe, expect, it, vi } from 'vitest';
import type { CarCandidate } from '../src/domain/carCandidate';
import { callGroq, mergeCandidates, validateCandidates } from './groqCarExtractor';

const groqBody = (cars: unknown) => ({
  choices: [{ message: { content: JSON.stringify({ cars }) } }],
});

const make =
  (response: unknown, ok = true): ((url: string, init?: RequestInit) => Promise<Response>) =>
  async () =>
    ({ ok, status: ok ? 200 : 500, json: async () => response }) as unknown as Response;

const candidate: CarCandidate = {
  brand: 'XPeng',
  model: 'G6',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {
    priceEur: {
      value: 46600,
      confidence: 'ai-extracted',
      source: 'Artikel',
      updatedAt: '2026-10-26',
    },
  },
  sourceUrl: 'https://example.com/a',
};

describe('callGroq', () => {
  const groqCall = { apiKey: 'k', model: 'test-model', fetchFn: make(groqBody([candidate])) };

  it('returns normalized candidates on a valid response', async () => {
    const result = await callGroq('Artikel', 'https://example.com/a', groqCall);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      brand: 'XPeng',
      model: 'G6',
      sourceUrl: 'https://example.com/a',
    });
  });

  it('throws on HTTP error, network error and non-JSON content', async () => {
    await expect(
      callGroq('x', 'u', { ...groqCall, fetchFn: make(groqBody([candidate]), false) }),
    ).rejects.toThrow('Groq HTTP 500');
    await expect(
      callGroq('x', 'u', {
        ...groqCall,
        fetchFn: async () => {
          throw new Error('down');
        },
      }),
    ).rejects.toThrow('Groq nicht erreichbar');
    await expect(
      callGroq('x', 'u', {
        ...groqCall,
        fetchFn: make({ choices: [{ message: { content: 'kein json' } }] }),
      }),
    ).rejects.toThrow('kein gueltiges JSON');
  });

  it('discards empty car lists (valid response, no candidates)', async () => {
    const result = await callGroq('x', 'u', { ...groqCall, fetchFn: make(groqBody([])) });
    expect(result).toEqual([]);
  });
});

describe('validateCandidates', () => {
  it('keeps valid candidates and drops broken ones via schema', () => {
    const onInvalid = vi.fn();
    const broken = { ...candidate, brand: '' } as unknown as CarCandidate;
    const valid = validateCandidates([candidate, broken], onInvalid);
    expect(valid).toEqual([candidate]);
    expect(onInvalid).toHaveBeenCalledOnce();
  });
});

describe('mergeCandidates', () => {
  it('appends new and skips duplicates by brand/model/variant/sourceUrl', () => {
    const merged = mergeCandidates([candidate], [candidate, { ...candidate, model: 'G9' }]);
    expect(merged).toHaveLength(2);
    expect(mergeCandidates(merged, [candidate, { ...candidate, variant: 'Long' }])).toHaveLength(3);
  });
});
