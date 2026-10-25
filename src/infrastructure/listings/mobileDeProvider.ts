import type { ListingFilters, ListingSearchProvider } from '../../ports/listingSearchProvider';
import type { Car } from '../../domain/car';
import { freeTextQuery, mobileDeUrl } from './urlTemplates';

// Pattern: Adapter (Vorlesung 02, S. 63). Objekt-Adapter per Delegation:
// mobile.de wird auf den Port ListingSearchProvider abgebildet. Baut nur
// einen Link, ruft nichts ab.

/** mobile.de (T4.3): Freitextsuche mit Preis/km/Baujahr-Filtern. */
export class MobileDeProvider implements ListingSearchProvider {
  readonly portal = 'mobile.de';

  buildSearchUrl(car: Car, filters: ListingFilters): string {
    return mobileDeUrl(freeTextQuery(car), filters);
  }
}
