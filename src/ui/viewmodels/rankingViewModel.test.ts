import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import type { Criterion } from '../../domain/criterion';
import { defaultEvaluators } from '../../scoring/evaluators';
import { ScoringEngine } from '../../scoring/scoringEngine';
import { formatEuro, toRankingViewModel } from './rankingViewModel';

const car = (id: string, price: number | null, hud: boolean | null): Car => ({
  id,
  brand: 'Test',
  model: id,
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {
    priceEur: { value: price, confidence: 'estimated' },
    hud: { value: hud, confidence: 'verified' },
    dcMaxKw: { value: 200, confidence: 'verified' },
  },
});

const criteria: Criterion[] = [
  {
    id: 'price',
    label: 'Preis',
    attributeKey: 'priceEur',
    kind: 'number',
    direction: 'lower-better',
    min: 30000,
    max: 70000,
    weight: 1,
    knockout: false,
  },
  { id: 'hud', label: 'HUD', attributeKey: 'hud', kind: 'boolean', weight: 1, knockout: true },
];

const engine = new ScoringEngine(defaultEvaluators());
const normalize = (text: string) => text.replace(/\u00a0/g, ' ');

describe('toRankingViewModel', () => {
  it('puts the best non-excluded car in the hero and numbers all rows', () => {
    const ranking = engine.rank([car('b', 60000, true), car('a', 35000, true)], criteria);
    const vm = toRankingViewModel(ranking);
    expect(vm.hero?.id).toBe('a');
    expect(vm.hero?.rank).toBe(1);
    expect(vm.rest.map((r) => r.rank)).toEqual([2]);
  });

  it('formats price and charging power, and flags estimated data', () => {
    const vm = toRankingViewModel(engine.rank([car('a', 46600, true)], criteria));
    expect(normalize(vm.hero?.subtitle ?? '')).toBe('46.600 € · 200 kW');
    expect(vm.hero?.hasEstimatedData).toBe(true);
  });

  it('shows unknown price and unknown counts', () => {
    const vm = toRankingViewModel(engine.rank([car('a', null, true)], criteria));
    expect(vm.hero?.subtitle).toContain('Preis unbekannt');
    expect(vm.hero?.unknownLabel).toBe('1 unbekannt');
  });

  it('has no hero when everything is excluded', () => {
    const vm = toRankingViewModel(engine.rank([car('a', 40000, false)], criteria));
    expect(vm.hero).toBeNull();
    expect(vm.rest[0]?.excludedLabel).toBe('K.-o.');
  });

  it('formats euros without decimals', () => {
    expect(normalize(formatEuro(42990))).toBe('42.990 €');
  });
});
