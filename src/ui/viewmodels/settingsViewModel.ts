import type { AttributeDefinition } from '../../domain/attributeCatalog';
import type { Criterion } from '../../domain/criterion';

export const MIN_WEIGHT = 0;
export const MAX_WEIGHT = 5;

export const clampWeight = (weight: number): number =>
  Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, Math.round(weight)));

/** Kriterium aus einem Katalog-Eintrag anlegen. Null, wenn der Key schon benutzt ist. */
export function createCriterion(
  attribute: AttributeDefinition,
  existing: readonly Criterion[],
): Criterion | null {
  if (existing.some((c) => c.attributeKey === attribute.key)) return null;
  const base = {
    id: attribute.key,
    label: attribute.label,
    attributeKey: attribute.key,
    weight: 1,
    knockout: false,
  };
  if (attribute.kind === 'number') {
    return { ...base, kind: 'number', direction: 'higher-better', min: 0, max: 100 };
  }
  return { ...base, kind: 'boolean' };
}

export function removeCriterion(criteria: readonly Criterion[], id: string): Criterion[] {
  return criteria.filter((c) => c.id !== id);
}

export function withWeight(
  criteria: readonly Criterion[],
  id: string,
  weight: number,
): Criterion[] {
  return criteria.map((c) => (c.id === id ? { ...c, weight: clampWeight(weight) } : c));
}

export function withKnockout(
  criteria: readonly Criterion[],
  id: string,
  knockout: boolean,
): Criterion[] {
  return criteria.map((c) => (c.id === id ? { ...c, knockout } : c));
}

/** min/max bei Zahl-Kriterien setzen; min bleibt immer kleiner als max. */
export function withNumberBounds(
  criteria: readonly Criterion[],
  id: string,
  patch: { direction?: 'higher-better' | 'lower-better'; min?: number; max?: number },
): Criterion[] {
  return criteria.map((c) => {
    if (c.id !== id || c.kind !== 'number') return c;
    const next = { ...c, ...patch };
    if (next.min >= next.max) {
      if (patch.min !== undefined) next.min = next.max - 1;
      else next.max = next.min + 1;
    }
    return next;
  });
}

/** Katalog-Eintraege, die noch kein Kriterium benutzen. */
export function availableAttributes(
  catalog: readonly AttributeDefinition[],
  criteria: readonly Criterion[],
): AttributeDefinition[] {
  const used = new Set(criteria.map((c) => c.attributeKey));
  return catalog.filter((a) => !used.has(a.key));
}
