import { useEffect, useState } from 'react';
import type { Container } from '../../composition/container';
import { toPriceHistoryChart, type PriceChartVM } from './priceHistoryViewModel';
import { formatStandTimestamp } from './feedbackViewModel';

/** ViewModel-Hook der Preis-Historie (T7.6): laedt price-history.json ueber das Repository. */
export function usePriceHistoryViewModel(container: Container, carId: string) {
  const { priceHistoryRepository, priceHistoryUpdatedAt } = container;
  const [viewModel, setViewModel] = useState<PriceChartVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stand, setStand] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    priceHistoryRepository
      .list()
      .then((history) => {
        if (!active) return;
        setViewModel(toPriceHistoryChart(history[carId] ?? []));
        setStand(formatStandTimestamp(priceHistoryUpdatedAt()));
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        // Diagramm fehlt -> keine Historie, die App bricht nicht.
        setViewModel(null);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [priceHistoryRepository, carId, priceHistoryUpdatedAt]);

  return { viewModel, loading, error, stand };
}
