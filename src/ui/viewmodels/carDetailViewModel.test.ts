import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import {
  toCarDetailViewModel,
  attributeRows,
  checklistRows,
  confidenceLabel,
  listingLinks,
  toPositiveFilterValue,
} from './carDetailViewModel';

const car: Car = {
  id: 'vw-id4',
  brand: 'Volkswagen',
  model: 'ID.4',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {
    priceEur: { value: 39990, confidence: 'verified', source: 'Hersteller' },
    hud: { value: true, confidence: 'estimated', source: 'Konfigurator' },
    dcMaxKw: { value: 135, confidence: 'verified' },
    trunkL: { value: null, confidence: 'verified' },
    massageSeats: { value: false, confidence: 'verified' },
  },
};

describe('carDetailViewModel', () => {
  it('lists every catalog attribute in order with label and formatted value', () => {
    const rows = attributeRows(car);
    expect(rows.map((r) => r.key)).toEqual([
      'priceEur',
      'panoramaRoof',
      'hud',
      'massageSeats',
      'acc',
      'regenAdjustable',
      'dcMaxKw',
      'rangeKm',
      'batteryKwh',
      'consumptionKwh100',
      'trunkL',
      'seats',
    ]);
    expect(rows[0]!.value).toBe('39.990 EUR');
    expect(rows[2]!.value).toBe('Ja');
    expect(rows[6]!.value).toBe('135 kW');
  });

  it('keeps confidence and source, marks missing values as unknown', () => {
    const rows = attributeRows(car);
    const price = rows[0]!;
    expect(price.confidence).toBe('verified');
    expect(price.source).toBe('Hersteller');
    expect(price.unknown).toBe(false);
    const hud = rows[2]!;
    expect(hud.confidence).toBe('estimated');
    expect(confidenceLabel(hud.confidence)).toBe('geschätzt');
    const trunk = rows[10]!;
    expect(trunk.value).toBe('unbekannt');
    expect(trunk.unknown).toBe(true);
  });

  it('formats numbers with units and false booleans as "Nein"', () => {
    const rows = attributeRows(car);
    expect(rows[3]!.value).toBe('Nein'); // massageSeats
    expect(rows[3]!.unknown).toBe(false);
    expect(rows[8]!.value).toBe('unbekannt'); // batteryKwh missing
  });

  it('shows "unbekannt" for attributes not present on the car at all', () => {
    const rows = attributeRows(car);
    expect(rows[1]!.value).toBe('unbekannt');
    expect(rows[1]!.unknown).toBe(true);
  });

  it('builds checklist rows from the catalog', () => {
    const rows = checklistRows({ hud: true, massage: false });
    expect(rows.map((r) => r.checked)).toEqual([true, false, false, false]);
  });

  it('exposes allowed status targets including the current one', () => {
    const vm = toCarDetailViewModel(car, {
      status: 'watching',
      notes: 'Probefahrt anfragen',
      checklist: {},
    });
    expect(vm.statusOptions).toEqual(['watching', 'interested', 'rejected']);
    expect(vm.status).toBe('watching');
    expect(vm.notes).toBe('Probefahrt anfragen');
    expect(vm.label).toBe('Volkswagen ID.4');
  });

  it('builds listing links from the providers with the given filters (T4.3)', () => {
    const providers = [
      {
        portal: 'A',
        buildSearchUrl: (c: Car, f: { maxPriceEur?: number }) =>
          `a?${c.brand}&${f.maxPriceEur ?? ''}`,
      },
      { portal: 'B', buildSearchUrl: () => 'b' },
    ];
    const links = listingLinks(car, { maxPriceEur: 20000 }, providers);
    expect(links).toEqual([
      { portal: 'A', url: 'a?Volkswagen&20000' },
      { portal: 'B', url: 'b' },
    ]);
  });

  it('parses positive filter inputs and drops the rest', () => {
    expect(toPositiveFilterValue('20000')).toBe(20000);
    expect(toPositiveFilterValue('abc')).toBeUndefined();
    expect(toPositiveFilterValue('-5')).toBeUndefined();
    expect(toPositiveFilterValue('')).toBeUndefined();
  });
});
