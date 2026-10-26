import { useEffect, useState } from 'react';
import type { Container } from '../../composition/container';
import type { NewsItem } from '../../domain/news';
import { toNewsPageViewModel, type NewsPageVM } from './newsViewModel';

/** ViewModel-Hook der News-Ansicht (T7.3): laedt news.json ueber das Repository. */
export function useNewsViewModel(container: Container) {
  const { newsRepository, newsUpdatedAt } = container;
  const [viewModel, setViewModel] = useState<NewsPageVM>({ rows: [], stand: null, empty: true });
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    newsRepository
      .list()
      .then((loaded) => {
        if (!active) return;
        setItems(loaded);
        setViewModel(toNewsPageViewModel(loaded, newsUpdatedAt()));
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [newsRepository, newsUpdatedAt]);

  return { viewModel, items, loading, error };
}
