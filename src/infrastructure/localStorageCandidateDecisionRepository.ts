import type { CandidateDecisionRepository } from '../ports/candidateDecisionRepository';
import { readJson, writeJson, type KeyValueStorage } from './storage/jsonStorage';

const KEY = 'auto-tracker:dismissed-candidates';

/** Uebernommene oder verworfene Kandidaten-IDs, lokal im Browser (T7.5). */
export class LocalStorageCandidateDecisionRepository implements CandidateDecisionRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async listDismissed(): Promise<string[]> {
    return readJson<string[]>(this.storage, KEY, []);
  }

  async dismiss(candidateId: string): Promise<void> {
    const dismissed = await this.listDismissed();
    if (!dismissed.includes(candidateId)) {
      writeJson(this.storage, KEY, [...dismissed, candidateId]);
    }
  }
}
