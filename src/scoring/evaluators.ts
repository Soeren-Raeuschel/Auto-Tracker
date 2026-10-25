import type { AttributeValue } from '../domain/car';
import type { Criterion, CriterionKind } from '../domain/criterion';
import type { CriterionEvaluator } from './criterionEvaluator';

function expectKind<K extends CriterionKind>(
  criterion: Criterion,
  kind: K,
): asserts criterion is Extract<Criterion, { kind: K }> {
  if (criterion.kind !== kind) {
    throw new Error(`Evaluator for "${kind}" received criterion of kind "${criterion.kind}"`);
  }
}

export class BooleanEvaluator implements CriterionEvaluator {
  readonly kind = 'boolean' as const;
  evaluate(criterion: Criterion, value: AttributeValue | null): number | null {
    expectKind(criterion, 'boolean');
    if (typeof value !== 'boolean') return null;
    return value ? 1 : 0;
  }
}

export class NumberEvaluator implements CriterionEvaluator {
  readonly kind = 'number' as const;
  evaluate(criterion: Criterion, value: AttributeValue | null): number | null {
    expectKind(criterion, 'number');
    if (typeof value !== 'number') return null;
    const { min, max, direction } = criterion;
    if (max === min) return value >= min ? 1 : 0;
    const raw =
      direction === 'higher-better' ? (value - min) / (max - min) : (max - value) / (max - min);
    return Math.min(1, Math.max(0, raw));
  }
}

export class ChoiceEvaluator implements CriterionEvaluator {
  readonly kind = 'choice' as const;
  evaluate(criterion: Criterion, value: AttributeValue | null): number | null {
    expectKind(criterion, 'choice');
    if (typeof value !== 'string') return null;
    return criterion.scores[value] ?? null;
  }
}

export const defaultEvaluators = (): CriterionEvaluator[] => [
  new BooleanEvaluator(),
  new NumberEvaluator(),
  new ChoiceEvaluator(),
];
