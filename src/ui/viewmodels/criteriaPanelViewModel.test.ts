import { describe, expect, it } from 'vitest';
import type { Criterion } from '../../domain/criterion';
import { MAX_WEIGHT } from './settingsViewModel';
import {
  knockoutLabel,
  sliderFillPercent,
  toCriteriaSliderVMs,
  weightLabel,
} from './criteriaPanelViewModel';

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

describe('criteriaPanelViewModel', () => {
  it('formats the weight as value of max', () => {
    expect(weightLabel(0)).toBe(`0 / ${MAX_WEIGHT}`);
    expect(weightLabel(3)).toBe(`3 / ${MAX_WEIGHT}`);
  });

  it('computes the fill percent within 0..100', () => {
    expect(sliderFillPercent(0)).toBe(0);
    expect(sliderFillPercent(2.5)).toBe(50);
    expect(sliderFillPercent(-4)).toBe(0);
    expect(sliderFillPercent(9)).toBe(100);
  });

  it('marks knockouts as text', () => {
    expect(knockoutLabel(true)).toBe('K.-o.');
    expect(knockoutLabel(false)).toBeNull();
  });

  it('builds slider view models in criterion order', () => {
    const vms = toCriteriaSliderVMs(criteria);
    expect(vms).toEqual([
      {
        id: 'price',
        label: 'Preis',
        weight: 3,
        weightLabel: `3 / ${MAX_WEIGHT}`,
        fillPercent: 60,
        knockout: false,
        knockoutLabel: null,
      },
      {
        id: 'hud',
        label: 'Head-up-Display',
        weight: 5,
        weightLabel: `5 / ${MAX_WEIGHT}`,
        fillPercent: 100,
        knockout: true,
        knockoutLabel: 'K.-o.',
      },
    ]);
  });
});
