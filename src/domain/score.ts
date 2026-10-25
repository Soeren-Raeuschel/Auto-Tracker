import type { Car } from './car';

export interface CriterionResult {
  criterionId: string;
  score: number | null; // null = unknown value
  weight: number;
}

export interface ScoredCar {
  car: Car;
  total: number; // 0..100
  excluded: boolean;
  excludedBy: string[];
  unknownCount: number;
  details: CriterionResult[];
}
