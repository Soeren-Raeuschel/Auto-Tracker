import { describe, expect, it } from 'vitest';
import type { Settings } from '../domain/settings';
import { JsonCarRepository } from './jsonCarRepository';
import { LocalStorageSettingsRepository } from './localStorageSettingsRepository';
import { LocalStorageUserStateRepository } from './localStorageUserStateRepository';
import type { KeyValueStorage } from './storage/jsonStorage';

class FakeStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const defaults: Settings = { criteria: [], suggestionThreshold: 70 };

describe('LocalStorageSettingsRepository', () => {
  it('returns defaults when empty or corrupt, and round-trips saved settings', async () => {
    const storage = new FakeStorage();
    const repo = new LocalStorageSettingsRepository(storage, defaults);
    expect(await repo.load()).toEqual(defaults);

    await repo.save({ ...defaults, suggestionThreshold: 55 });
    expect((await repo.load()).suggestionThreshold).toBe(55);

    storage.setItem('auto-tracker:settings', '{broken');
    expect(await repo.load()).toEqual(defaults);
  });
});

describe('LocalStorageUserStateRepository', () => {
  it('saves, replaces by car id and removes', async () => {
    const repo = new LocalStorageUserStateRepository(new FakeStorage());
    await repo.save({ carId: 'a', status: 'watching', notes: '', checklist: {} });
    await repo.save({ carId: 'a', status: 'interested', notes: 'x', checklist: {} });
    await repo.save({ carId: 'b', status: 'rejected', notes: '', checklist: {} });
    const all = await repo.list();
    expect(all).toHaveLength(2);
    expect(all.find((s) => s.carId === 'a')?.status).toBe('interested');
    await repo.remove('a');
    expect((await repo.list()).map((s) => s.carId)).toEqual(['b']);
  });
});

describe('JsonCarRepository', () => {
  it('returns parsed JSON and throws on HTTP errors', async () => {
    const ok = (async () => ({
      ok: true,
      json: async () => [{ id: 'a' }],
    })) as unknown as typeof fetch;
    const bad = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
    await expect(new JsonCarRepository('/x', ok).list()).resolves.toEqual([{ id: 'a' }]);
    await expect(new JsonCarRepository('/x', bad).list()).rejects.toThrow('404');
  });
});
