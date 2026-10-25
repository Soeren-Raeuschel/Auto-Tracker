/**
 * Reichweiten- und Ladestopps-Schätzung für eine Fahrt (T6.2).
 * Reine Funktion, keine Annahmen im Code: alle Schätz-Parameter kommen als `assumptions`.
 */
export interface ChargingStopsInput {
  /** WLTP-Reichweite in km; null = unbekannt. */
  rangeKm: number | null;
  /** DC-Spitzenladeleistung in kW; null = unbekannt. */
  dcMaxKw: number | null;
  distanceKm: number;
  /** Untere nutzbare SoC-Grenze in Prozent (z. B. Reserve 10). */
  usableFromPct: number;
  /** Obere nutzbare SoC-Grenze in Prozent (z. B. Laden bis 80). */
  usableToPct: number;
}

/** Annahmen als Parameter, damit die Funktion nichts unterschlägt. */
export interface ChargingAssumptions {
  /** SoC am Start in Prozent; Standard: usableToPct. */
  startSocPct?: number;
  /** Sicherheitsreserve pro Streckenabschnitt, Prozent der Reichweite (z. B. 10). */
  bufferPct?: number;
  /** Batteriekapazität in kWh für die Zeitschätzung; fehlt sie, gibt es keine Zeit. */
  batteryKwh?: number | null;
  /** Anteil der DC-Spitzenleistung, der im Mittel gezogen wird (0 bis 1). */
  averageDcFactor?: number;
  /** Pausen- und Abfertigungszeit pro Stopp in Minuten. */
  stopOverheadMin?: number;
}

export interface ChargingStopsResult {
  chargingStops: number;
  /** Gesamt-Ladezeit inkl. Overhead in Minuten; null, wenn Daten fehlen. */
  chargingTimeMin: number | null;
}

/**
 * Schätzt Ladestopps und Ladezeit. Gibt null zurück, wenn die Eingaben
 * unplausibel oder unvollständig sind (Range null, SoC-Fenster ungültig).
 */
export function estimateChargingStops(
  input: ChargingStopsInput,
  assumptions: ChargingAssumptions = {},
): ChargingStopsResult | null {
  const { rangeKm, dcMaxKw, distanceKm, usableFromPct, usableToPct } = input;
  if (
    rangeKm === null ||
    rangeKm <= 0 ||
    !Number.isFinite(distanceKm) ||
    distanceKm < 0 ||
    !Number.isFinite(usableFromPct) ||
    !Number.isFinite(usableToPct) ||
    usableFromPct < 0 ||
    usableToPct > 100 ||
    usableToPct <= usableFromPct
  ) {
    return null;
  }

  const startSocPct = assumptions.startSocPct ?? usableToPct;
  if (!Number.isFinite(startSocPct) || startSocPct < usableFromPct || startSocPct > 100) {
    return null;
  }

  const bufferPct = assumptions.bufferPct ?? 0;
  const bufferKm = (rangeKm * bufferPct) / 100;
  const usableSpan = (usableToPct - usableFromPct) / 100;
  const legRangeKm = rangeKm * usableSpan - bufferKm;
  if (legRangeKm <= 0) return null;

  // Erster Abschnitt: ab Start-SoC bis zur unteren Grenze.
  const firstLegKm = (rangeKm * (startSocPct - usableFromPct)) / 100 - bufferKm;
  if (distanceKm <= firstLegKm) {
    return { chargingStops: 0, chargingTimeMin: 0 };
  }

  const chargingStops = Math.ceil((distanceKm - firstLegKm) / legRangeKm);

  // Zeitschätzung nur, wenn Batterie und DC-Leistung bekannt sind.
  const batteryKwh = assumptions.batteryKwh ?? null;
  const averageDcFactor = assumptions.averageDcFactor ?? 0.6;
  const stopOverheadMin = assumptions.stopOverheadMin ?? 0;
  let chargingTimeMin: number | null = null;
  if (batteryKwh !== null && batteryKwh > 0 && dcMaxKw !== null && dcMaxKw > 0) {
    const averageKw = dcMaxKw * averageDcFactor;
    const energyPerStopKwh = batteryKwh * usableSpan;
    const minutesPerStop = (energyPerStopKwh / averageKw) * 60 + stopOverheadMin;
    chargingTimeMin = Math.ceil(minutesPerStop * chargingStops);
  }

  return { chargingStops, chargingTimeMin };
}
