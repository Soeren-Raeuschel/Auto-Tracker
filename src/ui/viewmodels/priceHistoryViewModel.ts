import type { PricePoint } from '../../ports/priceHistoryRepository';

/** Reine Logik des Preis-Diagramms (T7.6): Punkte in SVG-Koordinaten (viewBox 320x120). */
export interface PriceChartVM {
  available: boolean;
  /** Punkte bereits in SVG-Koordinaten, mit de-DE-Preis-Label. */
  points: { x: number; y: number; date: string; priceLabel: string }[];
  /** Polyline-Pfad oder null bei weniger als zwei Punkten. */
  path: string | null;
  minLabel: string;
  maxLabel: string;
  /** Aktueller Preis als fertiger Text. */
  latestLabel: string;
  /** Zeitraum als Text, z. B. "24.10. - 26.10.2026", oder null. */
  span: string | null;
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 10;

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });

function scale(points: PricePoint[]): { x: number; y: number; date: string; priceLabel: string }[] {
  const prices = points.map((p) => p.priceEur);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min;
  return points.map((p, i) => ({
    x: PAD + (i * (WIDTH - 2 * PAD)) / Math.max(1, points.length - 1),
    // Flache Kurve: mittig statt Division durch null.
    y: span === 0 ? HEIGHT / 2 : PAD + ((max - p.priceEur) / span) * (HEIGHT - 2 * PAD),
    date: p.date,
    priceLabel: euro.format(p.priceEur),
  }));
}

export function toPriceHistoryChart(points: PricePoint[]): PriceChartVM {
  if (points.length === 0) {
    return {
      available: false,
      points: [],
      path: null,
      minLabel: '',
      maxLabel: '',
      latestLabel: 'unbekannt',
      span: null,
    };
  }
  const scaled = scale(points);
  const path =
    points.length < 2
      ? null
      : scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const prices = points.map((p) => p.priceEur);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) throw new Error('unreachable: points.length > 0');
  return {
    available: true,
    points: scaled,
    path,
    minLabel: euro.format(Math.min(...prices)),
    maxLabel: euro.format(Math.max(...prices)),
    latestLabel: euro.format(last.priceEur),
    span:
      points.length < 2
        ? null
        : `${dateShort.format(new Date(first.date))} - ${dateShort.format(
            new Date(last.date),
          )}${new Date(last.date).getFullYear()}`,
  };
}
