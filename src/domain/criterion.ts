export type CriterionKind = 'boolean' | 'number' | 'choice';

interface CriterionBase {
  id: string;
  label: string;
  /** Key into Car.attributes */
  attributeKey: string;
  weight: number;
  /** If true, a score of exactly 0 removes the car from the ranking. */
  knockout: boolean;
}

export interface BooleanCriterion extends CriterionBase {
  kind: 'boolean';
}

export interface NumberCriterion extends CriterionBase {
  kind: 'number';
  direction: 'higher-better' | 'lower-better';
  /** Values at or beyond the bad end score 0, at or beyond the good end score 1. */
  min: number;
  max: number;
}

export interface ChoiceCriterion extends CriterionBase {
  kind: 'choice';
  /** option -> score between 0 and 1 */
  scores: Record<string, number>;
}

export type Criterion = BooleanCriterion | NumberCriterion | ChoiceCriterion;
