import type { PriceHistory, PriceHistoryRepository } from '../ports/priceHistoryRepository';

/**
 * Laedt public/data/price-history.json (T7.6). Fehlt die Datei (404 oder
 * HTML-Fallback, erster Stand vor dem ersten Pipeline-Lauf), gilt die Historie
 * als leer — die App bricht nie. Kaputte Eintraege werden uebersprungen.
 */
export class JsonPriceHistoryRepository implements PriceHistoryRepository {
  private lastModified: string | null = null;

  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async list(): Promise<PriceHistory> {
    const response = await this.fetchFn(this.url);
    if (response.status === 404) return {};
    if (!response.ok) throw new Error(`Could not load price history (${response.status})`);
    // SPA-Fallback-Abwehr wie bei JsonNewsRepository.
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) return {};
    this.lastModified = response.headers?.get?.('last-modified') ?? null;
    const raw = (await response.json()) as unknown;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const history: PriceHistory = {};
    for (const [carId, points] of Object.entries(raw as Record<string, unknown>)) {
      if (!Array.isArray(points)) continue;
      const valid = points.filter(
        (p): p is { date: string; priceEur: number } =>
          typeof p === 'object' &&
          p !== null &&
          typeof (p as { date?: unknown }).date === 'string' &&
          typeof (p as { priceEur?: unknown }).priceEur === 'number' &&
          Number.isFinite((p as { priceEur?: unknown }).priceEur),
      );
      if (valid.length > 0) history[carId] = valid;
    }
    return history;
  }

  /** Menschenlesbarer "Stand" (T8.3) oder null, wenn der Server keine Angabe macht. */
  getUpdatedAt(): string | null {
    return this.lastModified;
  }
}
