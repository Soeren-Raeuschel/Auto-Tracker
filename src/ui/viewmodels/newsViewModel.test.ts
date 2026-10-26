import { describe, expect, it } from 'vitest';
import type { NewsItem } from '../../domain/news';
import { newsForCar, toNewsPageViewModel } from './newsViewModel';

const item = (overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: 'a',
  title: 'Titel',
  url: 'https://example.com/a',
  source: 'Blog',
  publishedAt: '2026-10-25T10:00:00Z',
  summary: 'Kurzfassung',
  carIds: ['xpeng-g6'],
  ...overrides,
});

describe('toNewsPageViewModel', () => {
  it('sorts newest first and formats the date de-DE', () => {
    const vm = toNewsPageViewModel([
      item({ id: 'old', publishedAt: '2026-01-01T00:00:00Z' }),
      item({ id: 'new', publishedAt: '2026-10-25T10:00:00Z' }),
    ]);
    expect(vm.rows.map((row) => row.id)).toEqual(['new', 'old']);
    expect(vm.rows[0]?.dateDisplay).toBe('25.10.2026');
  });

  it('marks empty lists and passes the stand timestamp through', () => {
    const vm = toNewsPageViewModel([], 'So, 26. Okt 2026');
    expect(vm.empty).toBe(true);
    expect(vm.stand).toBe('So, 26. Okt 2026');
  });

  it('falls back to an empty summary', () => {
    const vm = toNewsPageViewModel([item({ summary: undefined })]);
    expect(vm.rows[0]?.summary).toBe('');
  });
});

describe('newsForCar', () => {
  it('keeps only items naming the car', () => {
    const vm = newsForCar(
      [item({ id: 'match' }), item({ id: 'other', carIds: ['byd-tang'] })],
      'xpeng-g6',
    );
    expect(vm.rows.map((row) => row.id)).toEqual(['match']);
  });
});
