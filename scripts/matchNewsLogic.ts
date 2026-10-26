// T7.2: Reine Logik fuer matchNews — ordnet News Autos per Marken-/Modell-Aliasen
// zu und erzeugt eine eigene Kurzfassung (nie Volltext). Kein Node-API, kein Netz.
import type { NewsItem } from '../src/domain/news';
import { newsItemSchema } from '../src/validation/schemas';
import type { RawNewsItem } from './fetchNewsLogic';

export interface CarAlias {
  carId: string;
  brand: string;
  model: string;
  aliases: string[];
}

/** Eigene Kurzfassung: nur aus dem Titel abgeleitet, gekuerzt, nie der Artikeltext. */
export function summarize(title: string, maxChars = 160): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

/** Alle Suchbegriffe (brand, model, aliases) eines Autos, case-insensitive. */
export function aliasTerms(alias: CarAlias): string[] {
  return [`${alias.brand} ${alias.model}`, alias.model, ...alias.aliases]
    .map((term) => term.toLowerCase().trim())
    .filter((term) => term !== '');
}

/**
 * Ordnet einen Titel den Autos zu, deren Alias (oder Marken-Modell-Kombi) als
 * Teilstring vorkommt. Erster Treffer pro Auto reicht; carIds bleiben dedupe-frei.
 */
export function matchCarIds(title: string, aliases: readonly CarAlias[]): string[] {
  const haystack = title.toLowerCase();
  const matched: string[] = [];
  for (const alias of aliases) {
    if (matched.includes(alias.carId)) continue;
    if (aliasTerms(alias).some((term) => haystack.includes(term))) {
      matched.push(alias.carId);
    }
  }
  return matched;
}

/** Passt rohe Feed-Eintrage an das NewsItem-Schema an; ungueltige fallen weg. */
export function matchNews(
  rawItems: readonly RawNewsItem[],
  aliases: readonly CarAlias[],
  onInvalid: (item: RawNewsItem, message: string) => void = () => undefined,
): NewsItem[] {
  const valid: NewsItem[] = [];
  for (const item of rawItems) {
    const candidate: NewsItem = {
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      summary: summarize(item.title),
      carIds: item.carIds.length > 0 ? item.carIds : matchCarIds(item.title, aliases),
    };
    const result = newsItemSchema.safeParse(candidate);
    if (result.success) {
      valid.push(result.data);
    } else {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      onInvalid(item, message);
    }
  }
  return valid;
}
