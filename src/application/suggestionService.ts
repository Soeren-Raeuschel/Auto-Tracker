import type { Settings } from '../domain/settings';
import type { ScoredCar } from '../domain/score';
import type { CarStatus, UserCarState } from '../domain/userState';
import type { EventBus } from './eventBus';

/**
 * Status, die einen Vorschlag ausschliessen. Woertlich nach T4.1: Autos ohne
 * UserState-Eintrag und 'test-drive-planned' sind vorschlagsfaehig.
 */
const EXCLUDED_STATUSES: readonly CarStatus[] = ['watching', 'interested', 'rejected'];

/** Reine Logik: Ist ein gepostetes Auto vorschlagsfaehig? */
export function isSuggestable(
  scored: ScoredCar,
  states: readonly UserCarState[],
  threshold: number,
): boolean {
  if (scored.total < threshold) return false;
  const status = states.find((s) => s.carId === scored.car.id)?.status;
  if (status === undefined) return true;
  return !EXCLUDED_STATUSES.includes(status);
}

/** Reine Logik: alle vorschlagsfaehigen Autos, beste zuerst. */
export function pickSuggestions(
  ranking: readonly ScoredCar[],
  states: readonly UserCarState[],
  settings: Settings,
): ScoredCar[] {
  return ranking
    .filter((scored) => isSuggestable(scored, states, settings.suggestionThreshold))
    .sort((a, b) => b.total - a.total);
}

/**
 * Publiziert `NewCarSuggested` fuer jedes Auto, das den Schwellwert erreicht und
 * noch nicht vorgeschlagen wurde. Bekannte IDs werden gemerkt, damit nicht bei
 * jedem Lauf dieselben Autos erneut publiziert werden.
 */
export class SuggestionService {
  private readonly suggested = new Set<string>();

  constructor(private readonly eventBus: EventBus) {}

  /** Prueft das aktuelle Ranking und publiziert neue Vorschlaege. */
  sync(ranking: readonly ScoredCar[], states: readonly UserCarState[], settings: Settings): void {
    for (const scored of pickSuggestions(ranking, states, settings)) {
      if (this.suggested.has(scored.car.id)) continue;
      this.suggested.add(scored.car.id);
      this.eventBus.publish({
        type: 'NewCarSuggested',
        carId: scored.car.id,
        score: scored.total,
      });
    }
  }

  /** Reset (z. B. nach Backup-Import): alles darf erneut vorgeschlagen werden. */
  reset(): void {
    this.suggested.clear();
  }
}
