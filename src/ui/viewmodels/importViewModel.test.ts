import { describe, expect, it } from 'vitest';
import { formatAttributeValue, toCarPreviewVM } from './importViewModel';
import type { Car } from '../../domain/car';

function car(overrides: Partial<Car['attributes']> = {}): Car {
  return {
    id: 'xpeng-g6',
    brand: 'XPeng',
    model: 'G6',
    bodyType: 'suv',
    powertrain: 'bev',
    attributes: {
      priceEur: { value: 51600, confidence: 'estimated', source: 'test', updatedAt: '2026-10-25' },
      hud: { value: null, confidence: 'estimated', source: 'test', updatedAt: '2026-10-25' },
      ...overrides,
    },
  };
}

describe('toCarPreviewVM', () => {
  it('listet alle Katalog-Attribute mit Label und Format', () => {
    const vm = toCarPreviewVM(car());
    expect(vm.label).toBe('XPeng G6');
    const price = vm.rows.find((row) => row.key === 'priceEur');
    expect(price?.display).toBe('51600 EUR');
    expect(price?.missing).toBe(false);
    const hud = vm.rows.find((row) => row.key === 'hud');
    expect(hud?.display).toBe('unbekannt');
    expect(hud?.missing).toBe(true);
    expect(vm.missingCount).toBe(vm.rows.filter((row) => row.missing).length);
  });

  it('formatiert Booleans als ja/nein', () => {
    expect(formatAttributeValue('hud', true)).toBe('ja');
    expect(formatAttributeValue('hud', false)).toBe('nein');
    expect(formatAttributeValue('hud', null)).toBe('unbekannt');
  });
});
