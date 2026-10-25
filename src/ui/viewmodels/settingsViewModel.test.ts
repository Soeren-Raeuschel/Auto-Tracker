import { describe, expect, it } from 'vitest';
import type { Criterion } from '../../domain/criterion';
import {
  availableAttributes,
  clampWeight,
  createCriterion,
  removeCriterion,
  withKnockout,
  withNumberBounds,
  withWeight,
} from './settingsViewModel';

const catalog = [
  { key: 'hud', label: 'Head-up-Display', kind: 'boolean' as const },
  { key: 'priceEur', label: 'Preis', kind: 'number' as const, unit: 'EUR' },
];

const existing: Criterion[] = [
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
];

describe('settingsViewModel', () => {
  it('clamps weights to 0..5', () => {
    expect(clampWeight(-1)).toBe(0);
    expect(clampWeight(2.4)).toBe(2);
    expect(clampWeight(9)).toBe(5);
  });

  it('creates boolean and number criteria and rejects duplicates', () => {
    expect(createCriterion(catalog[0]!, existing)).toEqual({
      id: 'hud',
      label: 'Head-up-Display',
      attributeKey: 'hud',
      kind: 'boolean',
      weight: 1,
      knockout: false,
    });
    const number = createCriterion(catalog[1]!, []);
    expect(number).toMatchObject({ kind: 'number', direction: 'higher-better', min: 0, max: 100 });
    const duplicate: Criterion = {
      id: 'dc',
      label: 'DC',
      attributeKey: 'priceEur',
      kind: 'number',
      direction: 'higher-better',
      min: 0,
      max: 1,
      weight: 1,
      knockout: false,
    };
    expect(createCriterion(catalog[1]!, [...existing, duplicate])).toBeNull();
  });

  it('removes criteria and keeps the rest untouched', () => {
    expect(removeCriterion(existing, 'price')).toEqual([]);
    expect(removeCriterion(existing, 'other')).toEqual(existing);
  });

  it('changes weight and knockout only for the given id', () => {
    expect(withWeight(existing, 'price', 9)[0]?.weight).toBe(5);
    expect(withWeight(existing, 'price', -3)[0]?.weight).toBe(0);
    expect(withKnockout(existing, 'price', true)[0]?.knockout).toBe(true);
  });

  it('changes direction and keeps min below max', () => {
    expect(withNumberBounds(existing, 'price', { direction: 'higher-better' })[0]).toMatchObject({
      direction: 'higher-better',
      min: 35000,
      max: 65000,
    });
    expect(withNumberBounds(existing, 'price', { min: 70000 })[0]).toMatchObject({ min: 64999 });
    expect(withNumberBounds(existing, 'price', { max: 30000 })[0]).toMatchObject({ max: 35001 });
    expect(withNumberBounds(existing, 'price', { min: 40000, max: 50000 })[0]).toMatchObject({
      min: 40000,
      max: 50000,
    });
  });

  it('lists only unused catalog entries', () => {
    expect(availableAttributes(catalog, existing).map((a) => a.key)).toEqual(['hud']);
  });
});
