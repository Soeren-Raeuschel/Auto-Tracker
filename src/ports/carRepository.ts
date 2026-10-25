import type { Car } from '../domain/car';

export interface CarRepository {
  list(): Promise<Car[]>;
}
