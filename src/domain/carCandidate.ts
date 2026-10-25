import type { Car } from './car';

/** A car as extracted from an article. Not yet part of the catalog. */
export type CarCandidate = Omit<Car, 'id'> & { sourceUrl: string };
