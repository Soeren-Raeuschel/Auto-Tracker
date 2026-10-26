import type { CarCandidate } from '../domain/carCandidate';

/** KI-Kandidaten aus public/data/candidates.json (Pipeline T7.4). */
export interface CandidateRepository {
  list(): Promise<CarCandidate[]>;
}
