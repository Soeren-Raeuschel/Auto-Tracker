import { describe, expect, it } from 'vitest';
import type { Car } from '../src/domain/car';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';
import { buildPriceHistory, detectPriceDrops, sortHistory } from './priceHistoryLogic';

const car = (id: string, priceEur: number | null): Car => ({
  id,
  brand: 'X',
  model: id,
  bodyType: 'other',
  powertrain: 'bev',
  attributes:
    priceEur === null
      ? {}
      : { priceEur: { value: priceEur, confidence: 'estimated', source: 'Test' } },
});

describe('buildPriceHistory', () => {
  it('appends today snapshot for cars with a known price', () => {
    const history = buildPriceHistory({}, [car('a', 46600), car('b', null)], '2026-10-26');
    expect(history.a).toEqual([{ date: '2026-10-26', priceEur: 46600 }]);
    expect(history.b).toBeUndefined();
  });

  it('replaces the same day instead of duplicating and keeps sorted order', () => {
    const existing: PriceHistory = {
      a: [
        { date: '2026-10-24', priceEur: 47000 },
        { date: '2026-10-26', priceEur: 48000 },
      ],
    };
    const history = buildPriceHistory(existing, [car('a', 46600)], '2026-10-26');
    expect(history.a).toEqual([
      { date: '2026-10-24', priceEur: 47000 },
      { date: '2026-10-26', priceEur: 46600 },
    ]);
  });

  it('ignores non-numeric price values', () => {
    const weird = car('c', null);
    weird.attributes.priceEur = { value: null, confidence: 'estimated' };
    expect(buildPriceHistory({}, [weird], '2026-10-26')).toEqual({});
  });
});

describe('detectPriceDrops', () => {
  it('reports only drops of at least minPercent', () => {
    const history: PriceHistory = {
      a: [
        { date: '2026-10-25', priceEur: 10000 },
        { date: '2026-10-26', priceEur: 9600 },
      ],
      b: [
        { date: '2026-10-25', priceEur: 10000 },
        { date: '2026-10-26', priceEur: 9900 },
      ],
      c: [{ date: '2026-10-26', priceEur: 5000 }],
    };
    expect(detectPriceDrops(history)).toEqual([
      { carId: 'a', from: 10000, to: 9600, percent: 4 },
    ]);
  });

  it('ignores rises and zero prices', () => {
    const history: PriceHistory = {
      a: [
        { date: '2026-10-25', priceEur: 9000 },
        { date: '2026-10-26', priceEur: 10000 },
      ],
      b: [
        { date: '2026-10-25', priceEur: 0 },
        { date: '2026-10-26', priceEur: 100 },
      ],
    };
    expect(detectPriceDrops(history)).toEqual([]);
  });
});

describe('sortHistory', () => {
  it('sorts each car ascending by date', () => {
    const sorted = sortHistory({
      a: [
        { date: '2026-10-26', priceEur: 1 },
        { date: '2026-10-24', priceEur: 2 },
      ],
    });
    expect(sorted.a.map((p) => p.date)).toEqual(['2026-10-24', '2026-10-26']);
  });
});
