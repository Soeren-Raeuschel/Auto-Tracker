import type { Criterion } from './criterion';

export interface Settings {
  criteria: Criterion[];
  /** Cars not on the watchlist are suggested when their score reaches this value. */
  suggestionThreshold: number;
}
