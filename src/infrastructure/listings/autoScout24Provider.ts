import type { ListingFilters, ListingSearchProvider } from '../../ports/listingSearchProvider';
import type { Car } from '../../domain/car';
import { autoScout24Url, freeTextQuery } from './urlTemplates';

// Pattern: Adapter (Vorlesung 02, S. 63). Objekt-Adapter per Delegation:
// AutoScout24 wird auf den Port ListingSearchProvider abgebildet. Baut nur
// einen Link, ruft nichts ab.

/** AutoScout24 (T4.3): Freitextsuche mit Preis/km/Baujahr-Filtern. */
export class AutoScout24Provider implements ListingSearchProvider {
  readonly portal = 'AutoScout24';

  buildSearchUrl(car: Car, filters: ListingFilters): string {
    return autoScout24Url(freeTextQuery(car), filters);
  }
}
