import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import { hotspotsForCar, placeholderHint } from './carViewerViewModel';

const car = (attributes: Car['attributes']): Car => ({
  id: 'audi-q4',
  brand: 'Audi',
  model: 'Q4',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes,
});

describe('carViewerViewModel', () => {
  it('lists active hotspots in catalog order with label and formatted value', () => {
    const car2 = car({
      panoramaRoof: { value: true, confidence: 'verified' },
      hud: { value: true, confidence: 'estimated' },
      massageSeats: { value: false, confidence: 'verified' },
      dcMaxKw: { value: 135, confidence: 'verified' },
    });
    const hotspots = hotspotsForCar(car2);
    expect(hotspots.map((h) => h.key)).toEqual(['panoramaRoof', 'hud', 'charging']);
    expect(hotspots.map((h) => h.label)).toContain('Ladeleistung');
    expect(hotspots.map((h) => h.valueText)).toContain('135 kW');
    expect(hotspots.every((h) => /^-?[\d.]+m -?[\d.]+m -?[\d.]+m$/.test(h.position))).toBe(true);
  });

  it('hides unknown and inactive attributes', () => {
    const car2 = car({
      panoramaRoof: { value: null, confidence: 'verified' },
      massageSeats: { value: false, confidence: 'verified' },
    });
    expect(hotspotsForCar(car2)).toEqual([]);
  });

  it('formats zero charging power as inactive', () => {
    const car2 = car({ dcMaxKw: { value: 0, confidence: 'verified' } });
    expect(hotspotsForCar(car2)).toEqual([]);
  });

  it('explains the placeholder when no model file exists', () => {
    expect(placeholderHint('sedan')).toContain('public/models/sedan.glb');
  });
});
