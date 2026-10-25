import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';

/** Combines the static cars.json with locally imported cars; imported wins on same id. */
export class MergedCarRepository implements CarRepository {
  constructor(
    private readonly base: CarRepository,
    private readonly imported: CarRepository,
  ) {}

  async list(): Promise<Car[]> {
    const [base, imported] = await Promise.all([this.base.list(), this.imported.list()]);
    const baseIds = new Set(base.map((car) => car.id));
    return [...base, ...imported.filter((car) => !baseIds.has(car.id))];
  }
}
