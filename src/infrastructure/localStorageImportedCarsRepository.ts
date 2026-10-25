import type { Car } from '../domain/car';
import type { ImportedCarRepository } from '../ports/importedCarRepository';
import { readJson, writeJson, type KeyValueStorage } from './storage/jsonStorage';

const KEY = 'auto-tracker:imported-cars';

/** Locally persisted cars from URL imports, until they are exported into cars.json. */
export class LocalStorageImportedCarsRepository implements ImportedCarRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async list(): Promise<Car[]> {
    return readJson<Car[]>(this.storage, KEY, []);
  }

  async save(cars: readonly Car[]): Promise<void> {
    writeJson(this.storage, KEY, cars);
  }
}
