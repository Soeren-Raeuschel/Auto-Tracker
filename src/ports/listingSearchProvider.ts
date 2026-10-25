import type { Car } from '../domain/car';

export interface ListingFilters {
  maxPriceEur?: number;
  maxMileageKm?: number;
  minYear?: number;
}

/** One implementation per portal (mobile.de, AutoScout24, Kleinanzeigen). Builds a link, never scrapes. */
export interface ListingSearchProvider {
  readonly portal: string;
  buildSearchUrl(car: Car, filters: ListingFilters): string;
}
