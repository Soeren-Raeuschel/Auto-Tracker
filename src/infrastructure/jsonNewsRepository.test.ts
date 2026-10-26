import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonNewsRepository } from './jsonNewsRepository';

const make =
  (status: number, body: string, headers: Record<string, string> = {}) =>
  async () =>
    ({
      ok: status < 400,
      status,
      json: async () => JSON.parse(body),
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    }) as unknown as Response;

const valid = JSON.stringify([
  {
    id: 'a',
    title: 'T',
    url: 'https://example.com/a',
    source: 'S',
    publishedAt: '2026-10-25',
    carIds: [],
  },
]);

afterEach(() => vi.restoreAllMocks());

describe('JsonNewsRepository', () => {
  it('returns items and the Last-Modified header', async () => {
    const repo = new JsonNewsRepository(
      'u',
      make(200, valid, { 'last-modified': 'Sun, 26 Oct 2026 08:00:00 GMT' }),
    );
    expect(await repo.list()).toHaveLength(1);
    expect(repo.getUpdatedAt()).toBe('Sun, 26 Oct 2026 08:00:00 GMT');
  });

  it('treats 404 as an empty list (first run before the pipeline)', async () => {
    const repo = new JsonNewsRepository('u', make(404, ''));
    expect(await repo.list()).toEqual([]);
    expect(repo.getUpdatedAt()).toBeNull();
  });

  it('throws on other HTTP errors', async () => {
    const repo = new JsonNewsRepository('u', make(500, ''));
    await expect(repo.list()).rejects.toThrow('500');
  });

  it('logs skipped invalid entries in the validating decorator chain', async () => {
    const { ValidatingListRepository } = await import('./validatingListRepository');
    const { newsItemSchema } = await import('../validation/schemas');
    const onInvalid = vi.fn();
    const repo = new ValidatingListRepository(
      new JsonNewsRepository('u', make(200, JSON.stringify([{ id: 'broken' }]))),
      newsItemSchema,
      onInvalid,
    );
    expect(await repo.list()).toEqual([]);
    expect(onInvalid).toHaveBeenCalledOnce();
  });
});
