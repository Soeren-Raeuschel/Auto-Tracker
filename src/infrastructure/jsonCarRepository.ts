import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';

export class JsonCarRepository implements CarRepository {
  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async list(): Promise<Car[]> {
    const response = await this.fetchFn(this.url);
    if (!response.ok) throw new Error(`Could not load cars (${response.status})`);
    return (await response.json()) as Car[];
  }
}
