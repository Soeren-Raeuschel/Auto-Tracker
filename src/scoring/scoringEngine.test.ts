import { describe, expect, it } from 'vitest';
import type { AttributeValue, Car } from '../domain/car';
import type { Criterion } from '../domain/criterion';
import { defaultEvaluators } from './evaluators';
import { ScoringEngine } from './scoringEngine';

const car = (id: string, attrs: Record<string, AttributeValue | null>): Car => ({
  id,
  brand: 'Test',
  model: id,
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: Object.fromEntries(
    Object.entries(attrs).map(([k, value]) => [k, { value, confidence: 'verified' as const }]),
  ),
});

const price: Criterion = {
  id: 'price',
  label: 'Preis',
  attributeKey: 'priceEur',
  kind: 'number',
  direction: 'lower-better',
  min: 30000,
  max: 70000,
  weight: 1,
  knockout: false,
};
const hud = (knockout = false): Criterion => ({
  id: 'hud',
  label: 'HUD',
  attributeKey: 'hud',
  kind: 'boolean',
  weight: 1,
  knockout,
});

const engine = new ScoringEngine(defaultEvaluators());

describe('ScoringEngine', () => {
  it('ranks the better car first', () => {
    const ranked = engine.rank(
      [car('expensive', { priceEur: 60000 }), car('cheap', { priceEur: 35000 })],
      [price],
    );
    expect(ranked.map((r) => r.car.id)).toEqual(['cheap', 'expensive']);
  });

  it('scores lower-better numbers on a 0..1 scale and clamps', () => {
    expect(engine.score(car('a', { priceEur: 30000 }), [price]).total).toBe(100);
    expect(engine.score(car('b', { priceEur: 70000 }), [price]).total).toBe(0);
    expect(engine.score(car('c', { priceEur: 99000 }), [price]).total).toBe(0);
  });

  it('puts knockout-excluded cars last, even with a higher total', () => {
    const ranked = engine.rank(
      [
        car('noHud', { priceEur: 30000, hud: false }),
        car('withHud', { priceEur: 70000, hud: true }),
      ],
      [price, hud(true)],
    );
    expect(ranked.map((r) => r.car.id)).toEqual(['withHud', 'noHud']);
    expect(ranked[1]?.excludedBy).toEqual(['hud']);
  });

  it('treats unknown values as neutral, not as zero', () => {
    const result = engine.score(car('x', { priceEur: 30000, hud: null }), [price, hud()]);
    expect(result.total).toBe(100);
    expect(result.unknownCount).toBe(1);
    expect(result.excluded).toBe(false);
  });

  it('throws a clear error for a missing evaluator', () => {
    const empty = new ScoringEngine([]);
    expect(() => empty.score(car('x', {}), [price])).toThrow(/No evaluator/);
  });
});
