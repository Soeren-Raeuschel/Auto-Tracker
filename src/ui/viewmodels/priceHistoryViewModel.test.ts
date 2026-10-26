import { describe, expect, it } from 'vitest';
import type { PricePoint } from '../../ports/priceHistoryRepository';
import { toPriceHistoryChart } from './priceHistoryViewModel';

const points: PricePoint[] = [
  { date: '2026-10-24', priceEur: 50000 },
  { date: '2026-10-26', priceEur: 45000 },
];

describe('toPriceHistoryChart', () => {
  it('shows unavailable without points', () => {
    const vm = toPriceHistoryChart([]);
    expect(vm.available).toBe(false);
    expect(vm.latestLabel).toBe('unbekannt');
  });

  it('scales two points into the viewBox and builds a path', () => {
    const vm = toPriceHistoryChart(points);
    expect(vm.available).toBe(true);
    expect(vm.points).toHaveLength(2);
    expect(vm.points[0]).toMatchObject({ x: 10, y: 10, priceLabel: '50.000\u00a0€' });
    expect(vm.points[1]).toMatchObject({ x: 310, y: 110, priceLabel: '45.000\u00a0€' });
    expect(vm.path).toBe('M10.0,10.0 L310.0,110.0');
    expect(vm.minLabel).toBe('45.000\u00a0€');
    expect(vm.maxLabel).toBe('50.000\u00a0€');
    expect(vm.span).toBe('24.10. - 26.10.2026');
  });

  it('handles a flat curve and a single point', () => {
    const flat = toPriceHistoryChart([
      { date: '2026-10-24', priceEur: 100 },
      { date: '2026-10-25', priceEur: 100 },
    ]);
    expect(flat.points[0]?.y ?? 0).toBe(60);
    const single = toPriceHistoryChart([{ date: '2026-10-24', priceEur: 100 }]);
    expect(single.path).toBeNull();
    expect(single.latestLabel).toBe('100\u00a0€');
    expect(single.span).toBeNull();
  });
});
