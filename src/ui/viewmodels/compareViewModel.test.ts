import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import type { Criterion } from '../../domain/criterion';
import type { ScoredCar } from '../../domain/score';
import {
  idsToParam,
  idsWithSlot,
  parseCompareIds,
  toCompareSelectionVM,
  toCompareViewModel,
} from './compareViewModel';

const criteria: Criterion[] = [
  {
    id: 'price',
    label: 'Preis',
    attributeKey: 'priceEur',
    kind: 'number',
    direction: 'lower-better',
    min: 35000,
    max: 65000,
    weight: 3,
    knockout: false,
  },
  {
    id: 'hud',
    label: 'Head-up-Display',
    attributeKey: 'hud',
    kind: 'boolean',
    weight: 5,
    knockout: true,
  },
];

const carA: Car = {
  id: 'vw-id4',
  brand: 'Volkswagen',
  model: 'ID.4',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {
    priceEur: { value: 39990, confidence: 'verified' },
    hud: { value: true, confidence: 'verified' },
  },
};

const carB: Car = {
  id: 'ioniq5',
  brand: 'Hyundai',
  model: 'IONIQ 5',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {
    priceEur: { value: 45000, confidence: 'verified' },
    hud: { value: false, confidence: 'verified' },
  },
};

function scored(car: Car, total: number, details: ScoredCar['details']): ScoredCar {
  return { car, total, excluded: false, excludedBy: [], unknownCount: 0, details };
}

describe('compareViewModel', () => {
  it('parses ids from the query parameter: trim, dedupe, max 3', () => {
    expect(parseCompareIds('a, b,,a,c,d')).toEqual(['a', 'b', 'c']);
    expect(parseCompareIds(null)).toEqual([]);
  });

  it('round-trips slot edits into the URL parameter', () => {
    expect(idsWithSlot(['a'], 1, 'b')).toEqual(['a', 'b']);
    expect(idsWithSlot(['a', 'b'], 1, '')).toEqual(['a']);
    expect(idsWithSlot(['a', 'b'], 1, 'a')).toEqual(['a']);
    expect(idsToParam(['a', 'b'])).toBe('a,b');
    expect(idsToParam([])).toBeNull();
  });

  it('builds one column per car with label, score and knockout', () => {
    const vm = toCompareViewModel(
      [
        scored(carA, 81, [
          { criterionId: 'price', score: 0.7, weight: 3 },
          { criterionId: 'hud', score: 1, weight: 5 },
        ]),
        scored(carB, 44, [
          { criterionId: 'price', score: 0.3, weight: 3 },
          { criterionId: 'hud', score: 0, weight: 5 },
        ]),
      ],
      criteria,
    );
    expect(vm.columns).toEqual([
      { id: 'vw-id4', label: 'Volkswagen ID.4', score: 81, excluded: false, excludedLabel: null },
      { id: 'ioniq5', label: 'Hyundai IONIQ 5', score: 44, excluded: false, excludedLabel: null },
    ]);
  });

  it('lists catalog attribute rows with formatted values, unknown stays visible', () => {
    const vm = toCompareViewModel([scored(carA, 81, []), scored(carB, 44, [])], criteria);
    const price = vm.attributeRows.find((row) => row.key === 'priceEur');
    expect(price?.values).toEqual(['39.990 EUR', '45.000 EUR']);
    const range = vm.attributeRows.find((row) => row.key === 'rangeKm');
    expect(range?.values).toEqual(['unbekannt', 'unbekannt']);
  });

  it('marks the best criterion score, unknown scores never win', () => {
    const vm = toCompareViewModel(
      [
        scored(carA, 81, [
          { criterionId: 'price', score: 0.7, weight: 3 },
          { criterionId: 'hud', score: null, weight: 5 },
        ]),
        scored(carB, 44, [
          { criterionId: 'price', score: 0.3, weight: 3 },
          { criterionId: 'hud', score: 1, weight: 5 },
        ]),
      ],
      criteria,
    );
    const price = vm.criteriaRows.find((row) => row.key === 'price');
    expect(price?.values).toEqual(['70', '30']);
    expect(price?.bestIndex).toBe(0);
    const hud = vm.criteriaRows.find((row) => row.key === 'hud');
    expect(hud?.values).toEqual(['unbekannt', '100']);
    expect(hud?.bestIndex).toBe(1);
  });

  it('builds three selection slots listing every available car', () => {
    const slots = toCompareSelectionVM(
      [
        { id: 'vw-id4', label: 'Volkswagen ID.4' },
        { id: 'ioniq5', label: 'Hyundai IONIQ 5' },
      ],
      ['vw-id4'],
    );
    expect(slots).toHaveLength(3);
    expect(slots[0]?.value).toBe('vw-id4');
    expect(slots[1]?.value).toBe('');
    expect(slots[2]?.options).toHaveLength(2);
  });
});
