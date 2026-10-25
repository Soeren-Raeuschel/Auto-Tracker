import type { Settings } from '../domain/settings';
import type { SettingsRepository } from '../ports/settingsRepository';
import { readJson, writeJson, type KeyValueStorage } from './storage/jsonStorage';

const KEY = 'auto-tracker:settings';

export class LocalStorageSettingsRepository implements SettingsRepository {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly defaults: Settings,
  ) {}

  async load(): Promise<Settings> {
    return readJson<Settings>(this.storage, KEY, this.defaults);
  }

  async save(settings: Settings): Promise<void> {
    writeJson(this.storage, KEY, settings);
  }
}
