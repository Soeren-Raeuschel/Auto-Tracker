import type { NewsItem } from '../domain/news';

export interface NewsRepository {
  list(): Promise<NewsItem[]>;
  /** Optionaler "Stand"-Zeitstempel (T7.3), null wenn unbekannt. */
  getUpdatedAt?(): string | null;
}
