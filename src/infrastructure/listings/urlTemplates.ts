import type { ListingFilters } from '../../ports/listingSearchProvider';

/**
 * Zentrale URL-Muster der Portale (T4.3).
 * WICHTIG: im Browser verifizieren, bevor die Links dem Nutzer angezeigt werden.
 * Parameter nie raten: Wo ein Filter-Parameter unsicher ist, entfaellt er und die
 * Suche laeuft als Freitextsuche (siehe Provider).
 */

/** Freitext-Anfrage aus Marke, Modell und Variante. */
export function freeTextQuery(car: { brand: string; model: string; variant?: string }): string {
  return [car.brand, car.model, car.variant].filter(Boolean).join(' ');
}

/**
 * mobile.de: Suchseite mit Freitext (q) und dokumentierten Filtern
 * (maxPrice, maxMileage, minFirstRegistrationDate als YYYY-MM-DD).
 * Nach dem Link-Bau im Browser pruefen.
 */
export function mobileDeUrl(query: string, filters: ListingFilters): string {
  const params = new URLSearchParams();
  params.set('isSearchRequest', 'true');
  params.set('q', query);
  if (filters.maxPriceEur !== undefined) {
    params.set('maxPrice', String(Math.round(filters.maxPriceEur)));
  }
  if (filters.maxMileageKm !== undefined) {
    params.set('maxMileage', String(Math.round(filters.maxMileageKm)));
  }
  if (filters.minYear !== undefined) {
    params.set(
      'minFirstRegistrationDate',
      `${Math.round(filters.minYear).toString().padStart(4, '0')}-01-01`,
    );
  }
  return `https://suchen.mobile.de/fahrzeuge/search.html?${params.toString()}`;
}

/**
 * AutoScout24: Listen-Endpunkt /lst mit Freitext (q) und dokumentierten Filtern
 * (priceto, kmto, yearfrom). Nach dem Link-Bau im Browser pruefen.
 */
export function autoScout24Url(query: string, filters: ListingFilters): string {
  const params = new URLSearchParams();
  params.set('atype', 'C');
  params.set('q', query);
  if (filters.maxPriceEur !== undefined) {
    params.set('priceto', String(Math.round(filters.maxPriceEur)));
  }
  if (filters.maxMileageKm !== undefined) {
    params.set('kmto', String(Math.round(filters.maxMileageKm)));
  }
  if (filters.minYear !== undefined) {
    params.set('yearfrom', String(Math.round(filters.minYear)));
  }
  return `https://www.autoscout24.de/lst?${params.toString()}`;
}

/**
 * Kleinanzeigen: Freitextsuche via s-suchanfrage (keywords). Die Filter-Parameter
 * von Kleinanzeigen sind pfadbasiert und hier NICHT sicher bekannt, deshalb
 * bewusst Freitext ohne Preis/km/Baujahr (Parameternamen nicht raten).
 * Nach dem Link-Bau im Browser pruefen.
 */
export function kleinanzeigenUrl(query: string): string {
  const params = new URLSearchParams();
  params.set('keywords', query);
  return `https://www.kleinanzeigen.de/s-suchanfrage.html?${params.toString()}`;
}
