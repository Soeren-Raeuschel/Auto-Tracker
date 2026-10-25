import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import { MobileDeProvider } from './mobileDeProvider';
import { AutoScout24Provider } from './autoScout24Provider';
import { KleinanzeigenProvider } from './kleinanzeigenProvider';
import { freeTextQuery } from './urlTemplates';

const car: Car = {
  id: 'vw-id4',
  brand: 'Volkswagen',
  model: 'ID.4',
  variant: 'Pro',
  bodyType: 'suv',
  powertrain: 'bev',
  attributes: {},
};

const filters = { maxPriceEur: 20000.5, maxMileageKm: 50000, minYear: 2020 };

describe('freeTextQuery', () => {
  it('joins brand, model and variant', () => {
    expect(freeTextQuery(car)).toBe('Volkswagen ID.4 Pro');
    expect(freeTextQuery({ brand: 'A', model: 'B' })).toBe('A B');
  });
});

describe('MobileDeProvider', () => {
  it('builds a mobile.de search with free text and filters', () => {
    const url = new MobileDeProvider().buildSearchUrl(car, filters);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://suchen.mobile.de');
    expect(parsed.pathname).toBe('/fahrzeuge/search.html');
    expect(parsed.searchParams.get('isSearchRequest')).toBe('true');
    expect(parsed.searchParams.get('sb')).toBe('p');
    expect(parsed.searchParams.get('od')).toBe('up');
    expect(parsed.searchParams.get('q')).toBe('Volkswagen ID.4 Pro');
    expect(parsed.searchParams.get('maxPrice')).toBe('20001');
    expect(parsed.searchParams.get('maxMileage')).toBe('50000');
    expect(parsed.searchParams.get('minFirstRegistrationDate')).toBe('2020-01-01');
  });

  it('omits unset filters', () => {
    const parsed = new URL(new MobileDeProvider().buildSearchUrl(car, {}));
    expect(parsed.searchParams.has('maxPrice')).toBe(false);
    expect(parsed.searchParams.has('maxMileage')).toBe(false);
    expect(parsed.searchParams.has('minFirstRegistrationDate')).toBe(false);
  });
});

describe('AutoScout24Provider', () => {
  it('builds an AutoScout24 search with free text and filters', () => {
    const url = new AutoScout24Provider().buildSearchUrl(car, filters);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://www.autoscout24.de');
    expect(parsed.pathname).toBe('/lst');
    expect(parsed.searchParams.get('atype')).toBe('C');
    expect(parsed.searchParams.get('q')).toBe('Volkswagen ID.4 Pro');
    expect(parsed.searchParams.get('sort')).toBe('price');
    expect(parsed.searchParams.get('desc')).toBe('0');
    expect(parsed.searchParams.get('priceto')).toBe('20001');
    expect(parsed.searchParams.get('kmto')).toBe('50000');
    expect(parsed.searchParams.get('yearfrom')).toBe('2020');
  });
});

describe('KleinanzeigenProvider', () => {
  it('builds a free-text search without guessed filter parameters', () => {
    // Filter bewusst ignoriert (nicht sicher dokumentierte Parameter).
    const url = new KleinanzeigenProvider().buildSearchUrl(car);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://www.kleinanzeigen.de');
    expect(parsed.pathname).toBe('/s-suchanfrage.html');
    expect(parsed.searchParams.get('keywords')).toBe('Volkswagen ID.4 Pro');
    // Filter bewusst nicht als Parameter (nicht sicher dokumentiert).
    expect([...parsed.searchParams.keys()].filter((k) => k !== 'keywords')).toEqual([]);
  });
});
