import type { NewsItem } from '../domain/news';
import type { NewsRepository } from '../ports/newsRepository';

/**
 * Laedt News aus public/data/news.json (T7.3). Fehlt die Datei (404, erster
 * Stand vor dem ersten Pipeline-Lauf), gilt die Liste als leer — die App bricht
 * nie. `getUpdatedAt` liefert Last-Modified des Servers als "Stand"-Zeitstempel.
 */
export class JsonNewsRepository implements NewsRepository {
  private lastModified: string | null = null;

  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async list(): Promise<NewsItem[]> {
    const response = await this.fetchFn(this.url);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Could not load news (${response.status})`);
    // SPA-Fallback-Abwehr: Dev-Server/Hosting antwortet bei fehlender Datei
    // mit index.html (Status 200). HTML ist dann keine gueltige Liste.
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) return [];
    this.lastModified = response.headers.get('last-modified');
    return (await response.json()) as NewsItem[];
  }

  /** Menschenlesbarer "Stand" oder null, wenn der Server keine Angabe macht. */
  getUpdatedAt(): string | null {
    return this.lastModified;
  }
}
