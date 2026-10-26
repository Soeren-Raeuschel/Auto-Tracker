import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';

export class JsonCarRepository implements CarRepository {
  private lastModified: string | null = null;

  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async list(): Promise<Car[]> {
    const response = await this.fetchFn(this.url);
    if (!response.ok) throw new Error(`Could not load cars (${response.status})`);
    this.lastModified = response.headers?.get?.('last-modified') ?? null;
    return (await response.json()) as Car[];
  }

  /** Menschenlesbarer "Stand" (T8.3) oder null, wenn der Server keine Angabe macht. */
  getUpdatedAt(): string | null {
    return this.lastModified;
  }
}
