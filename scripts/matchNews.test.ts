import { describe, expect, it, vi } from 'vitest';
import type { RawNewsItem } from './fetchNewsLogic';
import { aliasTerms, matchCarIds, matchNews, summarize, type CarAlias } from './matchNewsLogic';

const aliases: CarAlias[] = [
  { carId: 'xpeng-g6', brand: 'XPeng', model: 'G6 Performance', aliases: ['XPeng G6', 'G6'] },
  { carId: 'smart-5', brand: 'Smart', model: '5', aliases: ['Smart #5'] },
];

const raw = (overrides: Partial<RawNewsItem> = {}): RawNewsItem => ({
  id: 'id-1',
  title: 'XPeng G6: Preise gesenkt',
  url: 'https://example.com/a',
  source: 'Blog',
  publishedAt: '2026-10-25T10:00:00Z',
  carIds: [],
  ...overrides,
});

describe('summarize', () => {
  it('returns the title unchanged when short enough', () => {
    expect(summarize('Kurzer Titel')).toBe('Kurzer Titel');
  });

  it('truncates long titles and never includes full text', () => {
    const long = 'x'.repeat(300);
    const summary = summarize(long);
    expect(summary.length).toBeLessThanOrEqual(160);
    expect(summary.endsWith('…')).toBe(true);
  });
});

describe('aliasTerms', () => {
  it('includes brand+model, model and aliases, lowercase', () => {
    expect(aliasTerms(aliases[0] as CarAlias)).toEqual([
      'xpeng g6 performance',
      'g6 performance',
      'xpeng g6',
      'g6',
    ]);
  });
});

describe('matchCarIds', () => {
  it('matches by alias and by brand-model combo', () => {
    expect(matchCarIds('Neue Preise beim XPeng G6', aliases)).toEqual(['xpeng-g6']);
    expect(matchCarIds('Smart #5 kommt nach Europa', aliases)).toEqual(['smart-5']);
  });

  it('returns empty when nothing matches and dedupes carIds', () => {
    expect(matchCarIds('Vollig anderes Thema', aliases)).toEqual([]);
  });
});

describe('matchNews', () => {
  it('fills carIds and adds a summary', () => {
    const [item] = matchNews([raw()], aliases);
    expect(item).toMatchObject({
      carIds: ['xpeng-g6'],
      summary: 'XPeng G6: Preise gesenkt',
    });
  });

  it('keeps pre-assigned carIds from the raw item', () => {
    const [item] = matchNews([raw({ carIds: ['byd-tang'] })], aliases);
    expect(item?.carIds).toEqual(['byd-tang']);
  });

  it('drops invalid items and reports them', () => {
    const onInvalid = vi.fn();
    const items = matchNews([raw({ url: 'keine-url' })], aliases, onInvalid);
    expect(items).toHaveLength(0);
    expect(onInvalid).toHaveBeenCalledOnce();
  });
});
