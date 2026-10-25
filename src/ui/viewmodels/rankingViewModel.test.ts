import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import type { Criterion } from '../../domain/criterion';
import { defaultEvaluators } from '../../scoring/evaluators';
import { ScoringEngine } from '../../scoring/scoringEngine';
import { formatEuro, confidenceBadgeLabel, toRankingViewModel } from './rankingViewModel';

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
    const vm = toRankingViewModel(ranking, criteria);
    expect(vm.hero?.id).toBe('a');
    expect(vm.hero?.rank).toBe(1);
    expect(vm.rest.map((r) => r.rank)).toEqual([2]);
  });

  it('formats price and charging power, and flags estimated data', () => {
    const vm = toRankingViewModel(engine.rank([car('a', 46600, true)], criteria), criteria);
    expect(normalize(vm.hero?.subtitle ?? '')).toBe('46.600 € · 200 kW');
    expect(vm.hero?.hasEstimatedData).toBe(true);
    expect(vm.hero?.confidenceBadge).toBe('estimated');
    expect(confidenceBadgeLabel(vm.hero?.confidenceBadge ?? null)).toBe('geschätzt');
  });

  it('shows unknown price and unknown counts, with rangeKm as fact', () => {
    const vm = toRankingViewModel(engine.rank([car('a', null, true)], criteria), criteria);
    expect(vm.hero?.subtitle).toContain('Preis unbekannt');
    expect(vm.hero?.unknownLabel).toBe('1 unbekannt');
    const facts = Object.fromEntries((vm.hero?.facts ?? []).map((f) => [f.label, f.value]));
    expect(facts['Preis']).toBe('unbekannt');
    expect(facts['DC-Ladeleistung']).toBe('200 kW');
    expect(facts['Reichweite']).toBe('unbekannt');
  });

  it('provides per-criterion scores and knockout labels', () => {
    const vm = toRankingViewModel(engine.rank([car('a', 40000, false)], criteria), criteria);
    expect(vm.hero).toBeNull();
    const row = vm.rest[0];
    expect(row?.excludedLabel).toBe('K.-o.');
    expect(row?.excludedByLabels).toEqual(['HUD']);
    const priceScore = row?.criteria.find((c) => c.id === 'price');
    expect(priceScore?.label).toBe('Preis');
    expect(priceScore?.score).toBe(Math.round(((70000 - 40000) / 40000) * 100));
    const hudScore = row?.criteria.find((c) => c.id === 'hud');
    expect(hudScore?.score).toBe(0);
  });

  it('marks ai-extracted data and falls back to the criterion id for unknown labels', () => {
    const aiCar = {
      ...car('a', 40000, true),
      attributes: {
        ...car('a', 40000, true).attributes,
        priceEur: { value: 40000, confidence: 'ai-extracted' as const },
      },
    };
    const vm = toRankingViewModel(engine.rank([aiCar], criteria), criteria);
    expect(vm.hero?.confidenceBadge).toBe('ai-extracted');
    expect(confidenceBadgeLabel('ai-extracted')).toBe('KI-extrahiert');
    expect(vm.hero?.criteria.map((c) => c.label)).toEqual(['Preis', 'HUD']);
  });

  it('formats euros without decimals', () => {
    expect(normalize(formatEuro(42990))).toBe('42.990 €');
  });
});

// ---- T3.4: Ranking filters ----
import { applyRankingFilters, DEFAULT_RANKING_FILTERS } from './rankingViewModel';
import type { UserCarState } from '../../domain/userState';
import type { ScoredCar } from '../../domain/score';

const scored = (id: string, powertrain: 'bev' | 'phev' | 'reev' = 'bev'): ScoredCar =>
  ({
    car: { ...car(id, 40000, true), powertrain },
    total: 80,
    excluded: false,
    excludedBy: [],
    unknownCount: 0,
    details: [],
  }) as unknown as ScoredCar;

const state = (carId: string, status: UserCarState['status']): UserCarState => ({
  carId,
  status,
  notes: '',
  checklist: {},
});

describe('applyRankingFilters', () => {
  const ranking = [scored('a'), scored('b', 'phev'), scored('c')];

  it('keeps everything with default filters', () => {
    expect(applyRankingFilters(ranking, [], DEFAULT_RANKING_FILTERS).map((s) => s.car.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('hides rejected cars by default (no user state entry = watching, not rejected)', () => {
    const states = [state('b', 'rejected')];
    expect(
      applyRankingFilters(ranking, states, DEFAULT_RANKING_FILTERS).map((s) => s.car.id),
    ).toEqual(['a', 'c']);
  });

  it('shows rejected cars when hideRejected is off', () => {
    const states = [state('b', 'rejected')];
    const vm = applyRankingFilters(ranking, states, {
      ...DEFAULT_RANKING_FILTERS,
      hideRejected: false,
    });
    expect(vm.map((s) => s.car.id)).toEqual(['a', 'b', 'c']);
  });

  it('filters by status, treating missing entries as watching', () => {
    const states = [state('a', 'interested'), state('b', 'test-drive-planned')];
    const watching = applyRankingFilters(ranking, states, {
      ...DEFAULT_RANKING_FILTERS,
      status: 'watching',
    });
    expect(watching.map((s) => s.car.id)).toEqual(['c']);

    const interested = applyRankingFilters(ranking, states, {
      ...DEFAULT_RANKING_FILTERS,
      status: 'interested',
    });
    expect(interested.map((s) => s.car.id)).toEqual(['a']);
  });

  it('filters by powertrain', () => {
    const vm = applyRankingFilters(ranking, [], {
      ...DEFAULT_RANKING_FILTERS,
      powertrain: 'phev',
    });
    expect(vm.map((s) => s.car.id)).toEqual(['b']);
  });

  it('keeps only cars the user actually tracks when onlyWatchlist is on', () => {
    const states = [state('a', 'interested'), state('b', 'rejected')];
    const vm = applyRankingFilters(ranking, states, {
      ...DEFAULT_RANKING_FILTERS,
      onlyWatchlist: true,
      hideRejected: false,
    });
    expect(vm.map((s) => s.car.id)).toEqual(['a']);
  });
});
