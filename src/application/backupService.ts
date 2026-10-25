import type { BackupData } from '../domain/backup';
import type { SettingsRepository } from '../ports/settingsRepository';
import type { UserStateRepository } from '../ports/userStateRepository';
import { backupSchema } from '../validation/schemas';

export class BackupError extends Error {}

/** Export/import of everything the user entered. Validates before writing anything. */
export class BackupService {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly userState: UserStateRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async exportJson(): Promise<string> {
    const data: BackupData = {
      version: 1,
      exportedAt: this.now().toISOString(),
      settings: await this.settings.load(),
      userState: await this.userState.list(),
    };
    return JSON.stringify(data, null, 2);
  }

  async importJson(json: string): Promise<void> {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new BackupError('Die Datei ist kein gültiges JSON.');
    }
    const result = backupSchema.safeParse(raw);
    if (!result.success) throw new BackupError('Die Backup-Datei hat ein ungültiges Format.');

    await this.settings.save(result.data.settings);
    for (const existing of await this.userState.list()) {
      await this.userState.remove(existing.carId);
    }
    for (const state of result.data.userState) {
      await this.userState.save(state);
    }
  }
}
