import { describe, expect, it } from 'vitest';
import { buildCarsJsonExport, mergeImported, toImportableCars } from './importService';
import type { Car } from '../domain/car';
import type { CarCandidate } from '../domain/carCandidate';

function car(id: string): Car {
  return {
    id,
    brand: 'Test',
    model: id,
    bodyType: 'suv',
    powertrain: 'bev',
    attributes: {
      priceEur: { value: 10000, confidence: 'estimated', source: 'test', updatedAt: '2026-10-25' },
    },
  };
}

describe('mergeImported', () => {
  it('haengt neue Autos an und skippt Duplikate', () => {
    const existing = [car('a'), car('b')];
    const imported = [car('b'), car('c')];
    const result = mergeImported(existing, imported);
    expect(result.added.map((c) => c.id)).toEqual(['c']);
    expect(result.skipped.map((c) => c.id)).toEqual(['b']);
  });
});

describe('buildCarsJsonExport', () => {
  it('erzeugt JSON mit bestehenden + neuen Autos', () => {
    const existing = [car('a')];
    const imported = [car('b')];
    const json = JSON.parse(buildCarsJsonExport(existing, imported)) as Car[];
    expect(json.map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('toImportableCars', () => {
  it('erzeugt Cars aus Kandidaten (Factory: id, ai-extracted, sourceUrl)', () => {
    const candidate: CarCandidate = {
      brand: 'XPeng',
      model: 'G6',
      variant: 'Long Range',
      bodyType: 'suv',
      powertrain: 'bev',
      attributes: {
        priceEur: {
          value: 52000,
          confidence: 'ai-extracted',
          source: 'Artikel',
          updatedAt: '2026-10-25',
        },
      },
      sourceUrl: 'https://example.com',
    };
    const cars = toImportableCars([candidate], new Date('2026-10-25T12:00:00Z'));
    const created = cars[0]!;
    expect(created.id).toBe('xpeng-g6-long-range');
    expect(created.attributes.priceEur?.confidence).toBe('ai-extracted');
  });
});
