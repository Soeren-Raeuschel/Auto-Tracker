import { createContainer } from './composition/container';
import { RankingTable } from './ui/RankingTable';
import { useRankingViewModel } from './ui/viewmodels/useRankingViewModel';

const container = createContainer();

export default function App() {
  const { viewModel, error, loading } = useRankingViewModel(container);

  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 16 }}
    >
      <h1>Auto-Tracker</h1>
      {error && <p role="alert">Fehler: {error}</p>}
      {loading && <p>Lade Daten ...</p>}
      {!error && !loading && <RankingTable viewModel={viewModel} />}
    </main>
  );
}
