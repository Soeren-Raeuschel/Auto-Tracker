// T7.6: Reine Logik der Preis-Historie. Haengt priceEur pro Auto mit Datum an
// die bestehende Historie an; kein Doppel-Eintrag pro Tag (gleicher Tag = ersetzen).
import type { Car } from '../src/domain/car';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';

/** Fuegt fuer jedes Auto mit bekanntem priceEur den Schnappschuss von heute an. */
export function buildPriceHistory(
  existing: PriceHistory,
  cars: Car[],
  todayIso: string,
): PriceHistory {
  const history: PriceHistory = { ...existing };
  for (const car of cars) {
    const price = car.attributes.priceEur?.value;
    if (typeof price !== 'number' || !Number.isFinite(price)) continue;
    const points = [...(history[car.id] ?? [])].filter((p) => p.date !== todayIso);
    points.push({ date: todayIso, priceEur: price });
    points.sort((a, b) => a.date.localeCompare(b.date));
    history[car.id] = points;
  }
  return history;
}

/** Preisrueckgang pro Auto zwischen vorletztem und letztem Punkt. */
export interface PriceDrop {
  carId: string;
  from: number;
  to: number;
  percent: number;
}

export function detectPriceDrops(history: PriceHistory, minPercent = 3): PriceDrop[] {
  const drops: PriceDrop[] = [];
  for (const [carId, points] of Object.entries(history)) {
    if (points.length < 2) continue;
    const from = points[points.length - 2].priceEur;
    const to = points[points.length - 1].priceEur;
    if (from <= 0 || to >= from) continue;
    const percent = Math.round(((from - to) / from) * 100);
    if (percent >= minPercent) drops.push({ carId, from, to, percent });
  }
  return drops;
}

/** Sortiert die Historie aufsteigend nach Datum (Abwehr gegen kaputte Dateien). */
export function sortHistory(history: PriceHistory): PriceHistory {
  const sorted: PriceHistory = {};
  for (const [carId, points] of Object.entries(history)) {
    sorted[carId] = [...points].sort((a, b) => a.date.localeCompare(b.date));
  }
  return sorted;
}
