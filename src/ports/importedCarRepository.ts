import type { Car } from '../domain/car';

/** Cars that were imported via URL and live in localStorage until exported. */
export interface ImportedCarRepository {
  list(): Promise<Car[]>;
  save(cars: readonly Car[]): Promise<void>;
}
