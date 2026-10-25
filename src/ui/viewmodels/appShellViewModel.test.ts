import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, toAppShellViewModel } from './appShellViewModel';

describe('appShellViewModel', () => {
  it('hat die geforderten Tabs', () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      'Ranking',
      'News',
      'Vergleich',
      'Watchlist',
      'Import',
    ]);
  });

  it('markiert die exakte Route als aktiv', () => {
    const vm = toAppShellViewModel('/compare');
    expect(vm.find((item) => item.key === 'compare')?.active).toBe(true);
    expect(vm.filter((item) => item.active)).toHaveLength(1);
  });

  it('matcht Praefixe bei aktiven Eintraegen', () => {
    const vm = toAppShellViewModel('/compare/xyz');
    expect(vm.find((item) => item.key === 'compare')?.active).toBe(true);
    expect(vm.find((item) => item.key === 'ranking')?.active).toBe(false);
  });

  it('matcht "/" nur exakt', () => {
    expect(toAppShellViewModel('/').find((item) => item.key === 'ranking')?.active).toBe(true);
    expect(toAppShellViewModel('/settings').find((item) => item.key === 'ranking')?.active).toBe(
      false,
    );
  });

  it('deaktivierte Eintraege sind nie aktiv', () => {
    const vm = toAppShellViewModel('/news');
    expect(vm.find((item) => item.key === 'news')?.active).toBe(false);
    expect(vm.find((item) => item.key === 'news')?.disabled).toBe(true);
  });
});
