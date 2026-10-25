import { describe, expect, it } from 'vitest';
import type { ScoredCar } from '../../domain/score';
import type { Settings } from '../../domain/settings';
import type { UserCarState } from '../../domain/userState';
import { toSuggestionsViewModel } from './suggestionViewModel';

const scored = (id: string, total: number) =>
  ({
    car: {
      id,
      brand: 'A',
      model: id,
      variant: null,
      bodyType: 'sedan',
      powertrain: 'bev',
      attributes: {},
    },
    total,
    excluded: false,
    excludedBy: [],
    unknownCount: 0,
    details: [],
  }) as unknown as ScoredCar;

const settings: Settings = { criteria: [], suggestionThreshold: 70 };
const states: UserCarState[] = [
  { carId: 'watched', status: 'watching', notes: '', checklist: {} },
  { carId: 'rejected', status: 'rejected', notes: '', checklist: {} },
];

describe('toSuggestionsViewModel', () => {
  it('lists suggestable cars best first and reports the threshold', () => {
    const ranking = [
      scored('watched', 99),
      scored('rejected', 99),
      scored('new', 80),
      scored('low', 50),
    ];
    const vm = toSuggestionsViewModel(ranking, states, settings, (id) => `Auto ${id}`);
    expect(vm.threshold).toBe(70);
    expect(vm.rows).toEqual([{ id: 'new', label: 'Auto new', score: 80 }]);
  });

  it('returns an empty list when nothing reaches the threshold', () => {
    const vm = toSuggestionsViewModel([scored('low', 10)], states, settings, (id) => id);
    expect(vm.rows).toEqual([]);
  });
});
