import { describe, expect, it } from 'vitest';
import type { CarCandidate } from '../domain/carCandidate';
import { createCarFromCandidate, slugify } from './carFactory';

const candidate: CarCandidate = {
  brand: 'Xpeng',
  model: 'P7+',
  variant: 'Max',
  bodyType: 'sedan',
  powertrain: 'bev',
  sourceUrl: 'https://example.com/article',
  attributes: {
    priceEur: { value: 53600, confidence: 'verified' },
    hud: { value: null, confidence: 'estimated', source: 'own' },
  },
};

describe('createCarFromCandidate', () => {
  it('creates a stable slug id and drops the source url field', () => {
    const car = createCarFromCandidate(candidate, new Date('2026-10-18T00:00:00Z'));
    expect(car.id).toBe('xpeng-p7plus-max');
    expect('sourceUrl' in car).toBe(false);
  });

  it('marks every attribute as ai-extracted and fills provenance', () => {
    const car = createCarFromCandidate(candidate, new Date('2026-10-18T00:00:00Z'));
    expect(car.attributes.priceEur).toMatchObject({
      confidence: 'ai-extracted',
      source: 'https://example.com/article',
      updatedAt: '2026-10-18',
    });
    expect(car.attributes.hud?.source).toBe('own');
    expect(car.attributes.hud?.value).toBeNull();
  });
});

describe('slugify', () => {
  it('handles umlauts, plus signs and hash signs', () => {
    expect(slugify('Škoda Peaq')).toBe('skoda-peaq');
    expect(slugify('smart #5')).toBe('smart-5');
    expect(slugify('P7+')).toBe('p7plus');
  });
});
