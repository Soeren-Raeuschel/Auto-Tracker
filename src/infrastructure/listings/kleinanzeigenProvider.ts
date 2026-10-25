import type { ListingSearchProvider } from '../../ports/listingSearchProvider';
import type { Car } from '../../domain/car';
import { freeTextQuery, kleinanzeigenUrl } from './urlTemplates';

// Pattern: Adapter (Vorlesung 02, S. 63). Objekt-Adapter per Delegation:
// Kleinanzeigen wird auf den Port ListingSearchProvider abgebildet. Baut nur
// einen Link, ruft nichts ab.

/** Kleinanzeigen (T4.3): Freitextsuche, Filter-Parameter nicht sicher bekannt. */
export class KleinanzeigenProvider implements ListingSearchProvider {
  readonly portal = 'Kleinanzeigen';

  // Interface verlangt zweite Parameternutzung nicht: weniger Parameter erfuellt es trotzdem.
  buildSearchUrl(car: Car): string {
    return kleinanzeigenUrl(freeTextQuery(car));
  }
}
