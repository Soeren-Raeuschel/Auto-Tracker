import { carLabel, getAttributeValue } from '../../domain/car';
import type { ScoredCar } from '../../domain/score';

/** Ready-to-render data. The view only displays it, it never computes anything. */
export interface RankingRowVM {
  id: string;
  rank: number;
  label: string;
  subtitle: string;
  score: number;
  excluded: boolean;
  excludedLabel: string | null;
  unknownLabel: string | null;
  hasEstimatedData: boolean;
}

export interface RankingVM {
  hero: RankingRowVM | null;
  rest: RankingRowVM[];
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function toRow(scored: ScoredCar, index: number): RankingRowVM {
  const price = getAttributeValue(scored.car, 'priceEur');
  const dcKw = getAttributeValue(scored.car, 'dcMaxKw');
  const parts = [
    typeof price === 'number' ? formatEuro(price) : 'Preis unbekannt',
    typeof dcKw === 'number' ? `${dcKw} kW` : null,
  ].filter((part): part is string => part !== null);

  return {
    id: scored.car.id,
    rank: index + 1,
    label: carLabel(scored.car),
    subtitle: parts.join(' · '),
    score: scored.total,
    excluded: scored.excluded,
    excludedLabel: scored.excluded ? 'K.-o.' : null,
    unknownLabel: scored.unknownCount > 0 ? `${scored.unknownCount} unbekannt` : null,
    hasEstimatedData: Object.values(scored.car.attributes).some((a) => a.confidence !== 'verified'),
  };
}

// Pattern: MVVM. Pure function = easy to test without a browser.
export function toRankingViewModel(ranking: ScoredCar[]): RankingVM {
  const rows = ranking.map(toRow);
  const [first, ...others] = rows;
  if (!first || first.excluded) return { hero: null, rest: rows };
  return { hero: first, rest: others };
}
