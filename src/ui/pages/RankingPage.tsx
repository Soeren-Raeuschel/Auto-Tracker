import type { Container } from '../../composition/container';
import { RankingTable } from '../RankingTable';
import { useRankingViewModel } from '../viewmodels/useRankingViewModel';

/** Ranking-Seite auf `/` (T2.1). Inhalt wird in T10.4 neu gestaltet. */
export function RankingPage({ container }: { container: Container }) {
  const { viewModel, error, loading } = useRankingViewModel(container);

  return (
    <section>
      <h1>Auto-Tracker</h1>
      {error && <p role="alert">Fehler: {error}</p>}
      {loading && <p>Lade Daten ...</p>}
      {!error && !loading && <RankingTable viewModel={viewModel} />}
    </section>
  );
}
