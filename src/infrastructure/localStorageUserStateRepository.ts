import type { UserCarState } from '../domain/userState';
import type { UserStateRepository } from '../ports/userStateRepository';
import { readJson, writeJson, type KeyValueStorage } from './storage/jsonStorage';

const KEY = 'auto-tracker:user-state';

export class LocalStorageUserStateRepository implements UserStateRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async list(): Promise<UserCarState[]> {
    return readJson<UserCarState[]>(this.storage, KEY, []);
  }

  async save(state: UserCarState): Promise<void> {
    const others = (await this.list()).filter((s) => s.carId !== state.carId);
    writeJson(this.storage, KEY, [...others, state]);
  }

  async remove(carId: string): Promise<void> {
    const rest = (await this.list()).filter((s) => s.carId !== carId);
    writeJson(this.storage, KEY, rest);
  }
}
