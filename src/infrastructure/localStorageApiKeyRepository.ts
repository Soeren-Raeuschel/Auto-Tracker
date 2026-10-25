import type { ApiKeyRepository } from '../ports/apiKeyRepository';
import type { KeyValueStorage } from './storage/jsonStorage';

const KEY = 'auto-tracker:groq-key';

export class LocalStorageApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  get(): string | null {
    return this.storage.getItem(KEY);
  }

  set(key: string): void {
    if (key.trim() === '') this.storage.setItem(KEY, '');
    else this.storage.setItem(KEY, key.trim());
  }
}
