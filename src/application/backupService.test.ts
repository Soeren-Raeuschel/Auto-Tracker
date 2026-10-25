import { describe, expect, it } from 'vitest';
import type { Settings } from '../domain/settings';
import type { UserCarState } from '../domain/userState';
import type { SettingsRepository } from '../ports/settingsRepository';
import type { UserStateRepository } from '../ports/userStateRepository';
import { BackupError, BackupService } from './backupService';

class MemorySettings implements SettingsRepository {
  constructor(public value: Settings) {}
  async load() {
    return this.value;
  }
  async save(settings: Settings) {
    this.value = settings;
  }
}

class MemoryUserState implements UserStateRepository {
  constructor(public items: UserCarState[] = []) {}
  async list() {
    return this.items;
  }
  async save(state: UserCarState) {
    this.items = [...this.items.filter((s) => s.carId !== state.carId), state];
  }
  async remove(carId: string) {
    this.items = this.items.filter((s) => s.carId !== carId);
  }
}

const settingsA: Settings = { criteria: [], suggestionThreshold: 70 };
const stateA: UserCarState = { carId: 'a', status: 'interested', notes: 'ok', checklist: {} };
const fixedNow = () => new Date('2026-10-18T10:00:00Z');

describe('BackupService', () => {
  it('round-trips settings and user state', async () => {
    const source = new BackupService(
      new MemorySettings(settingsA),
      new MemoryUserState([stateA]),
      fixedNow,
    );
    const json = await source.exportJson();

    const targetSettings = new MemorySettings({ criteria: [], suggestionThreshold: 10 });
    const targetState = new MemoryUserState([{ ...stateA, carId: 'old' }]);
    await new BackupService(targetSettings, targetState, fixedNow).importJson(json);

    expect(targetSettings.value).toEqual(settingsA);
    expect(targetState.items).toEqual([stateA]);
  });

  it('rejects invalid JSON without touching data', async () => {
    const settings = new MemorySettings(settingsA);
    const service = new BackupService(settings, new MemoryUserState(), fixedNow);
    await expect(service.importJson('{not json')).rejects.toBeInstanceOf(BackupError);
    expect(settings.value).toEqual(settingsA);
  });

  it('rejects a wrong format without touching data', async () => {
    const state = new MemoryUserState([stateA]);
    const service = new BackupService(new MemorySettings(settingsA), state, fixedNow);
    await expect(service.importJson('{"version":2}')).rejects.toBeInstanceOf(BackupError);
    expect(state.items).toEqual([stateA]);
  });
});
