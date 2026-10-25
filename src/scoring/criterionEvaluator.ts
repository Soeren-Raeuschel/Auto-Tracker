import type { AttributeValue } from '../domain/car';
import type { Criterion, CriterionKind } from '../domain/criterion';

/** Strategy: one implementation per criterion kind. Returns 0..1, or null if the value is unknown. */
export interface CriterionEvaluator {
  readonly kind: CriterionKind;
  evaluate(criterion: Criterion, value: AttributeValue | null): number | null;
}
