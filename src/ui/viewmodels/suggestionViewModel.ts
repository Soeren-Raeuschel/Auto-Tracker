import { pickSuggestions } from '../../application/suggestionService';
import type { ScoredCar } from '../../domain/score';
import type { Settings } from '../../domain/settings';
import type { UserCarState } from '../../domain/userState';

export interface SuggestionRowVM {
  id: string;
  label: string;
  score: number;
}

export interface SuggestionsVM {
  rows: SuggestionRowVM[];
  threshold: number;
}

/** Ready-to-render data for the suggestions block on `/`. The view only displays it. */
export function toSuggestionsViewModel(
  ranking: readonly ScoredCar[],
  states: readonly UserCarState[],
  settings: Settings,
  label: (carId: string) => string,
): SuggestionsVM {
  return {
    rows: pickSuggestions(ranking, states, settings).map((scored) => ({
      id: scored.car.id,
      label: label(scored.car.id),
      score: scored.total,
    })),
    threshold: settings.suggestionThreshold,
  };
}
