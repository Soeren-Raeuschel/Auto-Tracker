// T12.3: Integrationstests fuer die Pipeline-Schritte — temporaere Dateien und
// Fake-fetch, kein Netz. Groq-Antworten: gueltig, ungueltig, leer.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Car } from '../src/domain/car';
import type { CarCandidate } from '../src/domain/carCandidate';
import { FetchNewsStep } from './fetchNews';
import { MatchNewsStep } from './matchNews';
import { ExtractCandidatesStep, type ExtractPaths } from './extractCandidates';
import { SnapshotPricesStep } from './priceHistory';
import type { RawNewsItem } from './fetchNewsLogic';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'pipeline-test-'));
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeJson(name: string, data: unknown): Promise<string> {
  const path = join(dir, name);
  await writeFile(path, JSON.stringify(data), 'utf8');
  return path;
}
/** Bewusst kaputte Datei: roher Text, kein gueltiges JSON. */
async function writeRaw(name: string, text: string): Promise<string> {
  const path = join(dir, name);
  await writeFile(path, text, 'utf8');
  return path;
}
async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(dir, name), 'utf8')) as T;
}
const rss = `<rss><channel><item><title>Preisfall bei XPeng G6</title><link>https://example.com/a</link><pubDate>Wed, 21 Oct 2026 10:00:00 GMT</pubDate><guid>id-a</guid></item></channel></rss>`;
const makeResponse = (body: string, ok = true, status = 200): Response =>
  ({ ok, status, text: async () => body }) as unknown as Response;

describe('FetchNewsStep (Integration)', () => {
  it('holt Test-Feeds per Fake-fetch, dedupliziert und schreibt news-raw.json', async () => {
    const sources = await writeJson('sources.json', {
      feeds: [
        { name: 'Blog', url: 'https://feeds.example/rss' },
        { name: 'Tot', url: 'https://feeds.example/dead' },
      ],
    });
    const fetchLike = vi.fn(async (url: string) =>
      url.endsWith('dead') ? makeResponse('', false, 503) : makeResponse(rss),
    );
    const ok = await new FetchNewsStep(fetchLike, sources, join(dir, 'news-raw-1.json')).run();
    expect(ok).toBe(true);
    const items = await readJson<RawNewsItem[]>('news-raw-1.json');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'id-a', source: 'Blog', carIds: [] });
  });

  it('bricht nicht ab: kaputte Eingabe laesst den letzten Stand unberuehrt', async () => {
    const sources = await writeRaw('sources-broken.txt', 'kein json');
    const previous = await writeJson('news-raw-2.json', [{ id: 'alt', title: 'Alt', url: 'https://x.test/a', source: 's', publishedAt: '', carIds: [] }]);
    const ok = await new FetchNewsStep(async () => makeResponse(rss), sources, previous).run();
    expect(ok).toBe(false);
    const items = await readJson<RawNewsItem[]>('news-raw-2.json');
    expect(items.map((item) => item.id)).toEqual(['alt']);
  });
});

describe('MatchNewsStep (Integration)', () => {
  it('ordnet Titel per Aliasen zu und schreibt news.json mit Kurzfassung', async () => {
    const input = await writeJson('match-raw.json', [
      { id: 'id-a', title: 'Preisfall bei XPeng G6', url: 'https://example.com/a', source: 'Blog', publishedAt: '2026-10-21T10:00:00Z', carIds: [] },
    ]);
    const aliases = await writeJson('match-aliases.json', [{ carId: 'xpeng-g6', brand: 'XPeng', model: 'G6', aliases: [] }]);
    const ok = await new MatchNewsStep({ input, aliases, output: join(dir, 'news-1.json') }).run();
    expect(ok).toBe(true);
    const items = await readJson<{ id: string; carIds: string[]; summary: string }[]>('news-1.json');
    expect(items[0]).toMatchObject({ id: 'id-a', carIds: ['xpeng-g6'], summary: 'Preisfall bei XPeng G6' });
  });
});

describe('ExtractCandidatesStep (Integration)', () => {
  const candidate: CarCandidate = {
    brand: 'XPeng',
    model: 'G6',
    bodyType: 'suv',
    powertrain: 'bev',
    attributes: {
      priceEur: { value: 46600, confidence: 'ai-extracted', source: 'Artikel', updatedAt: '2026-10-26' },
    },
    sourceUrl: 'https://example.com/a',
  };

  const groqResponse = (cars: unknown, ok = true, status = 200): Response =>
    ({ ok, status, json: async () => ({ choices: [{ message: { content: JSON.stringify({ cars }) } }] }) }) as unknown as Response;

  function makeGroq(route: (title: string) => Response | Promise<never>): (url: string, init?: RequestInit) => Promise<Response> {
    return async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { messages: { content: string }[] };
      const title = /Artikel:\n(.*)$/s.exec(body.messages[1]?.content ?? '')?.[1] ?? '';
      return route(title);
    };
  }

  async function runStep(news: RawNewsItem[], processed: string[], fetchFn: (url: string, init?: RequestInit) => Promise<Response>, outName: string): Promise<boolean> {
    const paths: ExtractPaths = {
      news: await writeJson('ext-news.json', news),
      processed: await writeJson('ext-processed.json', processed),
      output: join(dir, outName),
    };
    const call = { apiKey: 'test-key', model: 'test-model', fetchFn };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ok = await new ExtractCandidatesStep(call, paths).run();
    error.mockRestore();
    return ok;
  }

  it('verarbeitet gueltige, ungueltige und leere Groq-Antworten ohne Netz', async () => {
    const news: RawNewsItem[] = [
      { id: 'gut', title: 'XPeng G6 vorgestellt', url: 'https://example.com/a', source: 'Blog', publishedAt: '', carIds: [] },
      { id: 'kaputt', title: 'Ungueltige Antwort', url: 'https://example.com/b', source: 'Blog', publishedAt: '', carIds: [] },
      { id: 'leer', title: 'Keine Fahrzeuge', url: 'https://example.com/c', source: 'Blog', publishedAt: '', carIds: [] },
    ];
    const fetchFn = makeGroq((title) => {
      if (title.includes('Ungueltige')) return groqResponse([{ ...candidate, brand: '' }]);
      if (title.includes('Keine')) return groqResponse([]);
      return groqResponse([{ ...candidate, attributes: {} }]);
    });
    const ok = await runStep(news, [], fetchFn, 'candidates-1.json');
    expect(ok).toBe(true);
    const candidates = await readJson<CarCandidate[]>('candidates-1.json');
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ brand: 'XPeng', model: 'G6' });
    const processed = await readJson<string[]>('ext-processed.json');
    expect(processed.sort()).toEqual(['gut', 'kaputt', 'leer']);
  });

  it('bleibt bei Groq-Fehlern stehen und wiederholt den Artikel beim naechsten Lauf', async () => {
    const news: RawNewsItem[] = [
      { id: 'fehler', title: 'Groq down', url: 'https://example.com/d', source: 'Blog', publishedAt: '', carIds: [] },
    ];
    const ok = await runStep(news, [], makeGroq(() => groqResponse([], false, 503)), 'candidates-2.json');
    expect(ok).toBe(true);
    expect(await readJson<CarCandidate[]>('candidates-2.json')).toEqual([]);
    expect(await readJson<string[]>('ext-processed.json')).toEqual([]);
  });
});

describe('SnapshotPricesStep (Integration)', () => {
  const car = { id: 'xpeng-g6', attributes: { priceEur: { value: 46600 } } } as unknown as Car;

  it('haengt Schnappschuss an und ersetzt beim zweiten Lauf den heutigen Tag', async () => {
    const cars = await writeJson('cars.json', [car]);
    const output = join(dir, 'price-history-1.json');
    expect(await new SnapshotPricesStep({ cars, output }).run()).toBe(true);
    expect(await new SnapshotPricesStep({ cars, output }).run()).toBe(true);
    const history = await readJson<PriceHistory>('price-history-1.json');
    expect(history['xpeng-g6']).toHaveLength(1);
    expect(history['xpeng-g6']?.[0]).toMatchObject({ priceEur: 46600 });
  });

  it('startet bei kaputter Historie neu und bricht nicht ab', async () => {
    const cars = await writeJson('cars2.json', [car]);
    const output = await writeRaw('price-history-2.txt', 'kein json');
    expect(await new SnapshotPricesStep({ cars, output }).run()).toBe(true);
    const history = await readJson<PriceHistory>('price-history-2.txt');
    expect(Object.keys(history)).toEqual(['xpeng-g6']);
  });
});
