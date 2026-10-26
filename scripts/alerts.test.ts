import { describe, expect, it } from 'vitest';
import type { CarCandidate } from '../src/domain/carCandidate';
import type { PriceHistory } from '../src/ports/priceHistoryRepository';
import { alertsSummary, detectAlerts } from './alerts';

const candidate = { brand: 'Xpeng', model: 'G6' } as unknown as CarCandidate;

describe('detectAlerts', () => {
  it('counts new candidates', () => {
    const result = detectAlerts([candidate], [candidate, candidate], {}, {}, 3);
    expect(result.newCandidateCount).toBe(1);
    expect(result.priceDrops).toEqual([]);
  });

  it('reports a fresh price drop but not an old one', () => {
    const before: PriceHistory = {
      a: [
        { date: '2026-10-25', priceEur: 10000 },
        { date: '2026-10-26', priceEur: 9000 },
      ],
    };
    const after: PriceHistory = {
      a: [
        { date: '2026-10-25', priceEur: 10000 },
        { date: '2026-10-26', priceEur: 9000 },
        { date: '2026-10-27', priceEur: 8000 },
      ],
    };
    const fresh = detectAlerts([], [], {}, after, 3);
    expect(fresh.priceDrops).toHaveLength(1);
    // Gleicher Stand wie vorher: kein neuer Alarm, der letzte Stand blieb erhalten.
    expect(detectAlerts([], [], before, before, 3).priceDrops).toEqual([]);
  });

  it('renders a summary line per alert', () => {
    const result = { newCandidateCount: 2, priceDrops: [{ carId: 'a', from: 10, to: 9, percent: 10 }] };
    const summary = alertsSummary(result, (id) => `Auto ${id}`);
    expect(summary).toContain('2 neue KI-Kandidaten');
    expect(summary).toContain('Preisfall Auto a: 10 -> 9 EUR (-10 %)');
  });
});
