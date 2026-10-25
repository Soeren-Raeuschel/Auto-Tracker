import { carLabel, getAttributeValue, type AttributeValue } from '../../domain/car';
import { findAttribute } from '../../domain/attributeCatalog';
import type { Criterion } from '../../domain/criterion';
import type { ScoredCar } from '../../domain/score';

/** Ready-to-render data. The view only displays it, it never computes anything. */
export interface CriterionScoreVM {
  id: string;
  label: string;
  score: number | null; // 0..100, null = unknown value
  weight: number;
}

export interface FactVM {
  label: string;
  value: string;
}

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
  bodyType: string;
  confidenceBadge: 'estimated' | 'ai-extracted' | null;
  excludedByLabels: string[];
  criteria: CriterionScoreVM[];
  facts: FactVM[];
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

function formatNumbered(value: AttributeValue, unit: string): string {
  if (typeof value !== 'number') return String(value);
  const formatted = new Intl.NumberFormat('de-DE').format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/** Worst confidence present; "verified" needs no badge, missing data shows "unbekannt" via facts. */
function worstConfidenceBadge(scored: ScoredCar): RankingRowVM['confidenceBadge'] {
  const confidences = Object.values(scored.car.attributes).map((a) => a.confidence);
  if (confidences.includes('ai-extracted')) return 'ai-extracted';
  if (confidences.includes('estimated')) return 'estimated';
  return null;
}

export function confidenceBadgeLabel(badge: RankingRowVM['confidenceBadge']): string | null {
  if (badge === 'estimated') return 'geschätzt';
  if (badge === 'ai-extracted') return 'KI-extrahiert';
  return null;
}

function buildFacts(scored: ScoredCar): FactVM[] {
  const fact = (key: string, format: (value: AttributeValue) => string): FactVM => {
    const definition = findAttribute(key);
    const value = getAttributeValue(scored.car, key);
    return {
      label: definition?.label ?? key,
      value: value === null ? 'unbekannt' : format(value),
    };
  };
  return [
    fact('priceEur', (v) => (typeof v === 'number' ? formatEuro(v) : String(v))),
    fact('dcMaxKw', (v) => formatNumbered(v, 'kW')),
    fact('rangeKm', (v) => formatNumbered(v, 'km')),
  ];
}

function toRow(scored: ScoredCar, index: number, criteria: Criterion[]): RankingRowVM {
  const labelById = new Map(criteria.map((c) => [c.id, c.label]));
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
    bodyType: scored.car.bodyType,
    confidenceBadge: worstConfidenceBadge(scored),
    excludedByLabels: scored.excludedBy.map((id) => labelById.get(id) ?? id),
    criteria: scored.details.map((detail) => ({
      id: detail.criterionId,
      label: labelById.get(detail.criterionId) ?? detail.criterionId,
      score: detail.score === null ? null : Math.round(detail.score * 100),
      weight: detail.weight,
    })),
    facts: buildFacts(scored),
  };
}

// Pattern: MVVM. Pure function = easy to test without a browser.
export function toRankingViewModel(ranking: ScoredCar[], criteria: Criterion[]): RankingVM {
  const rows = ranking.map((scored, index) => toRow(scored, index, criteria));
  const [first, ...others] = rows;
  if (!first || first.excluded) return { hero: null, rest: rows };
  return { hero: first, rest: others };
}
