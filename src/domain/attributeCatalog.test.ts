import { describe, expect, it } from 'vitest';
import { attributeCatalog, findAttribute } from './attributeCatalog';

describe('attributeCatalog', () => {
  it('has unique keys', () => {
    const keys = attributeCatalog.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('finds an attribute by key', () => {
    expect(findAttribute('hud')?.kind).toBe('boolean');
    expect(findAttribute('dcMaxKw')?.unit).toBe('kW');
  });

  it('returns undefined for unknown keys', () => {
    expect(findAttribute('doesNotExist')).toBeUndefined();
  });
});
