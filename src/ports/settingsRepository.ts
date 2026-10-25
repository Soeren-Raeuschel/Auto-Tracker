import type { Settings } from '../domain/settings';

export interface SettingsRepository {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}
