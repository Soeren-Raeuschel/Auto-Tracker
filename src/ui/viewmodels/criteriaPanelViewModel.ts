import type { Criterion } from '../../domain/criterion';
import { MAX_WEIGHT, MIN_WEIGHT } from './settingsViewModel';

/** Ready-to-render data for one CriteriaSlider. The view only displays it. */
export interface CriteriaSliderVM {
  id: string;
  label: string;
  weight: number;
  weightLabel: string;
  fillPercent: number;
  knockout: boolean;
  knockoutLabel: string | null;
}

export function weightLabel(weight: number): string {
  return `${weight} / ${MAX_WEIGHT}`;
}

export function sliderFillPercent(weight: number): number {
  const range = MAX_WEIGHT - MIN_WEIGHT;
  if (range <= 0) return 0;
  return Math.round((Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight)) / range) * 100);
}

export function knockoutLabel(knockout: boolean): string | null {
  return knockout ? 'K.-o.' : null;
}

// Pattern: MVVM. Pure function = easy to test without a browser.
export function toCriteriaSliderVMs(criteria: readonly Criterion[]): CriteriaSliderVM[] {
  return criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    weight: criterion.weight,
    weightLabel: weightLabel(criterion.weight),
    fillPercent: sliderFillPercent(criterion.weight),
    knockout: criterion.knockout,
    knockoutLabel: knockoutLabel(criterion.knockout),
  }));
}
