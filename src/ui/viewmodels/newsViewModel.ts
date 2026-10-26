import type { NewsItem } from '../../domain/news';

export interface NewsRowVM {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  /** de-DE formatiertes Datum, z. B. "25.10.2026". */
  dateDisplay: string;
  /** Eigene Kurzfassung (aus der Pipeline), nie Volltext. */
  summary: string;
  carIds: string[];
}

export interface NewsPageVM {
  rows: NewsRowVM[];
  /** "Stand: ..."-Zeitstempel oder null. */
  stand: string | null;
  empty: boolean;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(parsed);
}

function toRow(item: NewsItem): NewsRowVM {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    dateDisplay: formatDate(item.publishedAt),
    summary: item.summary ?? '',
    carIds: item.carIds,
  };
}

/** Ready-to-render Daten der News-Seite (T7.3). Die View rendert nur. */
// Pattern: MVVM. Pure function = easy to test without a browser.
export function toNewsPageViewModel(
  items: readonly NewsItem[],
  stand: string | null = null,
): NewsPageVM {
  return {
    rows: [...items]
      .sort((a, b) => {
        const ta = Date.parse(a.publishedAt) || 0;
        const tb = Date.parse(b.publishedAt) || 0;
        return tb - ta;
      })
      .map(toRow),
    stand,
    empty: items.length === 0,
  };
}

/** News-Block auf der Detailseite: nur Artikel, die das Auto nennen. */
export function newsForCar(
  items: readonly NewsItem[],
  carId: string,
  stand: string | null = null,
): NewsPageVM {
  const filtered = items.filter((item) => item.carIds.includes(carId));
  return toNewsPageViewModel(filtered, stand);
}
