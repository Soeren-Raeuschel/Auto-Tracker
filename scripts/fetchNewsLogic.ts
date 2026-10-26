// T7.1: Reine Logik fuer fetchNews — RSS-/Atom-Parsing, Dedupe. Kein Node-API,
// kein Netz: alles ueber Injektion testbar (Fake-fetch in fetchNewsLogic.test.ts).
import type { NewsItem } from '../src/domain/news';
import { newsItemSchema } from '../src/validation/schemas';

export interface SourceFeed {
  name: string;
  url: string;
}

export interface RawNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  carIds: string[];
}

export function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function tagContent(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeEntities(match[1] ?? '') : '';
}

function attr(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'));
  return match ? (match[1] ?? '') : '';
}

/** Minimaler RSS-2.0-/Atom-Parser (Regex), reicht fuer Titel/Link/Datum. */
export function parseFeed(xml: string, sourceName: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const isAtom = /<feed[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s\S]*?<\/entry>/gi : /<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = tagContent(block, 'title');
    if (!title) continue;
    let url = '';
    if (isAtom) {
      const linkTags = block.match(/<link[^>]*>/gi) ?? [];
      const alternate = linkTags.find((tag) => attr(tag, 'rel') !== 'self');
      url = alternate ? attr(alternate, 'href') : '';
    } else {
      url = tagContent(block, 'link');
    }
    if (!url) continue;
    const publishedAt = isAtom
      ? tagContent(block, 'published') || tagContent(block, 'updated')
      : tagContent(block, 'pubDate');
    const guid = tagContent(block, 'guid');
    const id = guid || url;
    items.push({ id, title, url, source: sourceName, publishedAt, carIds: [] });
  }
  return items;
}

/** Dedupe nach id (guid/URL), zuerst gesehener Eintrag gewinnt. */
export function dedupeNews(items: readonly RawNewsItem[]): RawNewsItem[] {
  const seen = new Set<string>();
  const unique: RawNewsItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

/** Neueste zuerst. */
export function sortNews(items: readonly RawNewsItem[]): RawNewsItem[] {
  const time = (item: RawNewsItem): number => {
    const parsed = Date.parse(item.publishedAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  return [...items].sort((a, b) => time(b) - time(a));
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

/** Holt einen Feed; wirft bei HTTP-Fehlern, damit der Aufrufer pro Feed faengt. */
export async function fetchFeed(feed: SourceFeed, fetchLike: FetchLike): Promise<RawNewsItem[]> {
  const response = await fetchLike(feed.url);
  if (!response.ok) {
    throw new Error(`${feed.name}: HTTP ${response.status}`);
  }
  return parseFeed(await response.text(), feed.name);
}

/**
 * Laedt alle Quellen. Ein ausgefallener Feed wird geloggt und uebersprungen,
 * der Lauf bricht nicht ab. Ungueltige Eintraege fallen durch das Schema weg.
 */
export async function collectNews(
  feeds: readonly SourceFeed[],
  fetchLike: FetchLike,
  logInvalid: (source: string, message: string) => void = () => undefined,
): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => await fetchFeed(feed, fetchLike)),
  );
  const raw: RawNewsItem[] = [];
  results.forEach((result, index) => {
    const feed = feeds[index];
    if (!feed) return;
    if (result.status === 'fulfilled') {
      raw.push(...result.value);
    } else {
      console.error(`Feed fehlgeschlagen: ${feed.name}`, result.reason);
    }
  });
  const candidates = sortNews(dedupeNews(raw));
  const valid: NewsItem[] = [];
  for (const item of candidates) {
    const result = newsItemSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      logInvalid(
        item.source,
        result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      );
    }
  }
  return valid;
}
