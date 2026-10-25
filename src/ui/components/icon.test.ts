import { describe, expect, it } from 'vitest';
import { ICON_NAMES, ICON_RECORD } from './Icon';

describe('Icon-Katalog (T10.8)', () => {
  it('deckt alle IconName-Eintraege ab', () => {
    expect([...ICON_NAMES].sort()).toEqual(['bookmark', 'compare', 'newspaper', 'trophy']);
    for (const name of ICON_NAMES) {
      expect(ICON_RECORD[name]).toBeDefined();
    }
  });
});
