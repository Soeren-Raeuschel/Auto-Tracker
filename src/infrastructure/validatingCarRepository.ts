import type { Car } from '../domain/car';
import type { CarRepository } from '../ports/carRepository';
import { carSchema, parseValid } from '../validation/schemas';

// Pattern: Decorator (Vorlesung 02, S. 70). Same interface, adds validation.
export class ValidatingCarRepository implements CarRepository {
  constructor(
    private readonly inner: CarRepository,
    private readonly report: (message: string) => void = (message) => console.warn(message),
  ) {}

  async list(): Promise<Car[]> {
    const raw = await this.inner.list();
    return parseValid(carSchema, raw, (index, message) =>
      this.report(`Ungültiges Auto an Position ${index} übersprungen: ${message}`),
    );
  }
}
