import { estimateChargingStops, type ChargingStopsResult } from '../../application/tripPlanner';
import { getAttributeValue, type Car } from '../../domain/car';

/**
 * Standard-Distanz der Beispielstrecke Kassel–Budapest in km.
 * Vor Nutzung prüfen (Route, Baustellen, Umwege) - daher im UI sichtbar markiert.
 */
export const DEFAULT_TRIP_DISTANCE_KM = 1020;

export interface TripPlannerVM {
  /** false, wenn das Auto keine Reichweite hat. */
  available: boolean;
  /** Hinweis-Text unter dem Eingabefeld, z. B. Prüfhinweis oder Fehler. */
  hint: string | null;
  /** Ergebnis als fertiger Text, null wenn keine Schätzung moeglich. */
  resultText: string | null;
}

function parseDistance(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_TRIP_DISTANCE_KM;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function toResultText(result: ChargingStopsResult): string {
  if (result.chargingStops === 0) {
    return 'Kein Ladestopp nötig, die Strecke passt in eine Ladung.';
  }
  const stops = `ca. ${result.chargingStops} ${result.chargingStops === 1 ? 'Ladestopp' : 'Ladestopps'}`;
  if (result.chargingTimeMin === null) {
    return `${stops} (Ladezeit unbekannt, DC-Leistung oder Kapazität fehlt).`;
  }
  return `${stops}, ca. ${result.chargingTimeMin} min Ladezeit.`;
}

/** Reine Logik der Ladestopps-Karte auf der Detailseite (T6.2). Das UI rendert nur. */
export function toTripViewModel(car: Car, distanceInput: string): TripPlannerVM {
  const rangeKm = getAttributeValue(car, 'rangeKm');
  if (typeof rangeKm !== 'number' || rangeKm <= 0) {
    return {
      available: false,
      hint: 'Reichweite unbekannt, daher keine Schätzung möglich.',
      resultText: null,
    };
  }

  const distanceKm = parseDistance(distanceInput);
  if (distanceKm === null) {
    return {
      available: true,
      hint: 'Bitte eine gültige Distanz in km eingeben.',
      resultText: null,
    };
  }

  const dcMaxKw = getAttributeValue(car, 'dcMaxKw');
  const batteryKwh = getAttributeValue(car, 'batteryKwh');
  const result = estimateChargingStops(
    {
      rangeKm,
      dcMaxKw: typeof dcMaxKw === 'number' ? dcMaxKw : null,
      distanceKm,
      // Nutzen 10-80 % des Akkus: Akku schonen und DC-Bereich halten.
      usableFromPct: 10,
      usableToPct: 80,
    },
    {
      bufferPct: 10,
      batteryKwh: typeof batteryKwh === 'number' ? batteryKwh : null,
      averageDcFactor: 0.6,
      stopOverheadMin: 5,
    },
  );

  return {
    available: true,
    resultText: result ? toResultText(result) : null,
    hint: 'Distanz vor Nutzung prüfen (Beispiel: Kassel–Budapest ca. 1.020 km).',
  };
}
