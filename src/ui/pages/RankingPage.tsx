import type { Container } from '../../composition/container';
import { HeroCard } from '../components/HeroCard';
import { RankRow } from '../components/RankRow';
import { useRankingViewModel } from '../viewmodels/useRankingViewModel';

/** Ranking-Seite auf `/` (T10.4). Rendert nur, alle Werte aus dem ViewModel. */
export function RankingPage({ container }: { container: Container }) {
  const { viewModel, error, loading } = useRankingViewModel(container);

  return (
    <section>
      <p className="label">Auto-Tracker</p>
      <h1>Rangliste</h1>
      {error && <p role="alert">Fehler: {error}</p>}
      {loading && <p>Lade Daten ...</p>}
      {!error && !loading && (
        <>
          {viewModel.hero && <HeroCard row={viewModel.hero} />}
          {viewModel.rest.map((row) => (
            <RankRow key={row.id} row={row} />
          ))}
        </>
      )}
    </section>
  );
}
