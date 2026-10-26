import type { CarCandidate } from '../domain/carCandidate';
import type { CandidateRepository } from '../ports/candidateRepository';

/**
 * Laedt KI-Kandidaten aus public/data/candidates.json (T7.5). Fehlt die Datei
 * (404, erster Stand vor dem ersten Pipeline-Lauf), gilt die Liste als leer.
 * Validierung passiert im Container ueber ValidatingListRepository.
 */
export class JsonCandidateRepository implements CandidateRepository {
  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async list(): Promise<CarCandidate[]> {
    const response = await this.fetchFn(this.url);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Could not load candidates (${response.status})`);
    return (await response.json()) as CarCandidate[];
  }
}
