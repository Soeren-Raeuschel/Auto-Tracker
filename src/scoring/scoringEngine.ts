import { getAttributeValue, type Car } from '../domain/car';
import type { Criterion, CriterionKind } from '../domain/criterion';
import type { CriterionResult, ScoredCar } from '../domain/score';
import type { CriterionEvaluator } from './criterionEvaluator';

export class ScoringEngine {
  private readonly evaluators = new Map<CriterionKind, CriterionEvaluator>();

  constructor(evaluators: CriterionEvaluator[]) {
    evaluators.forEach((e) => this.evaluators.set(e.kind, e));
  }

  rank(cars: Car[], criteria: Criterion[]): ScoredCar[] {
    return cars
      .map((car) => this.score(car, criteria))
      .sort((a, b) => Number(a.excluded) - Number(b.excluded) || b.total - a.total);
  }

  score(car: Car, criteria: Criterion[]): ScoredCar {
    const details: CriterionResult[] = [];
    const excludedBy: string[] = [];
    let weighted = 0;
    let weightSum = 0;
    let unknownCount = 0;

    for (const criterion of criteria) {
      const evaluator = this.evaluators.get(criterion.kind);
      if (!evaluator) throw new Error(`No evaluator registered for kind "${criterion.kind}"`);

      const score = evaluator.evaluate(criterion, getAttributeValue(car, criterion.attributeKey));
      details.push({ criterionId: criterion.id, score, weight: criterion.weight });

      if (score === null) {
        unknownCount++; // unknown is not 0: it neither helps nor hurts
        continue;
      }
      weighted += criterion.weight * score;
      weightSum += criterion.weight;
      if (criterion.knockout && score === 0) excludedBy.push(criterion.id);
    }

    return {
      car,
      total: weightSum > 0 ? Math.round((weighted / weightSum) * 100) : 0,
      excluded: excludedBy.length > 0,
      excludedBy,
      unknownCount,
      details,
    };
  }
}
