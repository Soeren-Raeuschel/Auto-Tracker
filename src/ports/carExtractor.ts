import type { CarCandidate } from '../domain/carCandidate';

/** Turns raw article text into structured candidates. Groq is just one implementation. */
export interface CarExtractor {
  extract(articleText: string, sourceUrl: string): Promise<CarCandidate[]>;
}
