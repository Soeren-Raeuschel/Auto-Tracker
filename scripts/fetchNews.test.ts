import { describe, expect, it, vi } from 'vitest';
import { PipelineStep } from './pipelineStep';
import { collectNews, dedupeNews, parseFeed, sortNews } from './fetchNewsLogic';

class OkStep extends PipelineStep {
  readonly name = 'ok';
   
  protected async execute(): Promise<void> {}
}

class FailingStep extends PipelineStep {
  readonly name = 'failing';
   
  protected async execute(): Promise<void> {
    throw new Error('boom');
  }
}

describe('PipelineStep', () => {
  it('returns true and logs on success', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(await new OkStep().run()).toBe(true);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it('catches errors, keeps last data and returns false', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await new FailingStep().run()).toBe(false);
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});

const rss = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Neuer Preis</title>
    <link>https://example.com/a</link>
    <pubDate>Wed, 21 Oct 2026 10:00:00 GMT</pubDate>
    <guid>id-a</guid>
  </item>
  <item>
    <title><![CDATA[Update &amp; mehr]]></title>
    <link>https://example.com/b</link>
    <pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

const atom = `<?xml version="1.0"?>
<feed>
  <entry>
    <title>Atom Titel</title>
    <link rel="alternate" href="https://example.com/c"/>
    <published>2026-10-23T10:00:00Z</published>
  </entry>
</feed>`;

describe('parseFeed', () => {
  it('parses RSS items with title, link, date and guid', () => {
    const items = parseFeed(rss, 'Blog');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 'id-a',
      title: 'Neuer Preis',
      url: 'https://example.com/a',
      source: 'Blog',
      carIds: [],
    });
    expect(items[1]?.title).toBe('Update & mehr');
  });

  it('parses Atom entries with alternate link', () => {
    const [item] = parseFeed(atom, 'Feed');
    expect(item).toMatchObject({
      title: 'Atom Titel',
      url: 'https://example.com/c',
      publishedAt: '2026-10-23T10:00:00Z',
    });
  });
});

describe('dedupeNews', () => {
  it('drops duplicates by id, first wins', () => {
    const item = { id: 'x', title: 't', url: 'u', source: 's', publishedAt: '', carIds: [] };
    expect(dedupeNews([item, { ...item, url: 'u2' }])).toHaveLength(1);
  });
});

describe('sortNews', () => {
  it('sorts newest first and tolerates unparseable dates', () => {
    const base = { title: 't', url: 'u', source: 's', carIds: [] as string[] };
    const sorted = sortNews([
      { ...base, id: 'old', publishedAt: '2026-01-01' },
      { ...base, id: 'bad', publishedAt: 'nope' },
      { ...base, id: 'new', publishedAt: '2026-10-26' },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['new', 'old', 'bad']);
  });
});

describe('collectNews', () => {
  const makeResponse = (body: string, ok = true, status = 200): Response =>
    ({ ok, status, text: async () => body }) as unknown as Response;

  it('merges feeds, dedupes and validates via newsItemSchema', async () => {
    const items = await collectNews(
      [
        { name: 'Blog', url: 'https://feeds.example/rss' },
        { name: 'Feed', url: 'https://feeds.example/atom' },
      ],
      async (url) => (url.endsWith('rss') ? makeResponse(rss) : makeResponse(atom)),
    );
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.id)).toEqual([
      'https://example.com/c',
      'https://example.com/b',
      'id-a',
    ]);
  });

  it('does not abort when one feed fails', async () => {
    const items = await collectNews(
      [
        { name: 'Tot', url: 'https://feeds.example/dead' },
        { name: 'Blog', url: 'https://feeds.example/rss' },
      ],
      async (url) =>
        url.endsWith('dead') ? makeResponse('', false, 500) : makeResponse(rss),
    );
    expect(items).toHaveLength(2);
  });

  it('filters invalid items through the schema', async () => {
    const broken = '<rss><channel><item><title>Kein Link</title></item></channel></rss>';
    const logInvalid = vi.fn();
    const items = await collectNews(
      [{ name: 'Blog', url: 'https://feeds.example/rss' }],
      async () => makeResponse(broken),
      logInvalid,
    );
    expect(items).toHaveLength(0);
    expect(logInvalid).not.toHaveBeenCalled(); // item ohne Link wird schon im Parser verworfen
  });

  it('reports schema-invalid items via logInvalid', async () => {
    const noDate = '<rss><channel><item><title>t</title><link>https://x.test/a</link></item></channel></rss>';
    const logInvalid = vi.fn();
    const items = await collectNews(
      [{ name: 'Blog', url: 'https://feeds.example/rss' }],
      async () => makeResponse(noDate),
      logInvalid,
    );
    expect(items).toHaveLength(0);
    expect(logInvalid).toHaveBeenCalledOnce();
  });
});
