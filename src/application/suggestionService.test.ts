import { describe, expect, it } from 'vitest';
import type { Car } from '../domain/car';
import type { ScoredCar } from '../domain/score';
import type { Settings } from '../domain/settings';
import type { UserCarState } from '../domain/userState';
import { EventBus } from './eventBus';
import { SuggestionService, isSuggestable, pickSuggestions } from './suggestionService';

const car = (id: string): Car =>
  ({
    id,
    brand: 'A',
    model: id,
    variant: null,
    bodyType: 'sedan',
    powertrain: 'bev',
    attributes: {},
  }) as unknown as Car;

const scored = (id: string, total: number): ScoredCar =>
  ({
    car: car(id),
    total,
    excluded: false,
    excludedBy: [],
    unknownCount: 0,
    details: [],
  }) as unknown as ScoredCar;

const settings: Settings = { criteria: [], suggestionThreshold: 70 };

const state = (carId: string, status: UserCarState['status']): UserCarState => ({
  carId,
  status,
  notes: '',
  checklist: {},
});

describe('isSuggestable', () => {
  it('suggests cars at or above the threshold', () => {
    expect(isSuggestable(scored('a', 70), [], settings.suggestionThreshold)).toBe(true);
    expect(isSuggestable(scored('a', 69), [], settings.suggestionThreshold)).toBe(false);
  });

  it('excludes watching, interested and rejected, keeps unknown and test-drive-planned', () => {
    const states: UserCarState[] = [
      state('w', 'watching'),
      state('i', 'interested'),
      state('r', 'rejected'),
      state('t', 'test-drive-planned'),
    ];
    expect(isSuggestable(scored('w', 90), states, settings.suggestionThreshold)).toBe(false);
    expect(isSuggestable(scored('i', 90), states, settings.suggestionThreshold)).toBe(false);
    expect(isSuggestable(scored('r', 90), states, settings.suggestionThreshold)).toBe(false);
    expect(isSuggestable(scored('t', 90), states, settings.suggestionThreshold)).toBe(true);
    expect(isSuggestable(scored('unknown', 90), states, settings.suggestionThreshold)).toBe(true);
  });
});

describe('pickSuggestions', () => {
  it('returns only suggestable cars, best first', () => {
    const ranking = [scored('low', 50), scored('t', 80), scored('new', 95)];
    const result = pickSuggestions(ranking, [state('t', 'test-drive-planned')], settings);
    expect(result.map((s) => s.car.id)).toEqual(['new', 't']);
  });
});

describe('SuggestionService', () => {
  it('publishes NewCarSuggested once per car and skips already suggested ones', () => {
    const bus = new EventBus();
    const events: unknown[] = [];
    bus.subscribe('NewCarSuggested', (e) => events.push(e));
    const service = new SuggestionService(bus);
    const ranking = [scored('a', 80), scored('b', 60)];

    service.sync(ranking, [], settings);
    expect(events).toEqual([{ type: 'NewCarSuggested', carId: 'a', score: 80 }]);

    // same run again: no duplicate event
    service.sync(ranking, [], settings);
    expect(events).toHaveLength(1);

    // a car crossing the threshold later is picked up
    service.sync([scored('a', 80), scored('b', 75)], [], settings);
    expect(events).toEqual([
      { type: 'NewCarSuggested', carId: 'a', score: 80 },
      { type: 'NewCarSuggested', carId: 'b', score: 75 },
    ]);

    // reset: everything may be suggested again
    service.reset();
    service.sync([scored('a', 80)], [], settings);
    expect(events).toHaveLength(3);
  });
});
