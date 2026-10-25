import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Container } from '../../composition/container';
import { HeroCard } from '../components/HeroCard';
import { RankRow } from '../components/RankRow';
import { CriteriaPanel } from '../components/CriteriaPanel';
import { Icon } from '../components/Icon';
import { useRankingViewModel } from '../viewmodels/useRankingViewModel';
import { useCriteriaPanelViewModel } from '../viewmodels/useCriteriaPanelViewModel';
import { ROUTES } from '../routes';
import './RankingPage.css';

/** Ranking-Seite auf `/` (T10.4, T10.5). Rendert nur, alle Werte aus den ViewModels. */
export function RankingPage({ container }: { container: Container }) {
  const { viewModel, error, loading } = useRankingViewModel(container);
  const { sliders, error: panelError, setWeight } = useCriteriaPanelViewModel(container);
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="ranking">
      <div className="ranking__head">
        <div>
          <p className="label">Auto-Tracker</p>
          <h1>Rangliste</h1>
        </div>
        <button
          type="button"
          className="ranking__panel-toggle"
          onClick={() => setPanelOpen(true)}
          aria-label="Kriterien-Panel öffnen"
        >
          <Icon name="sliders" size={20} />
        </button>
      </div>
      {error && <p role="alert">Fehler: {error}</p>}
      {panelError && <p role="alert">Fehler: {panelError}</p>}
      {loading && <p>Lade Daten ...</p>}
      {!error && !loading && (
        <div className="ranking__layout">
          <div className="ranking__list">
            {viewModel.hero && <HeroCard row={viewModel.hero} />}
            {viewModel.rest.map((row) => (
              <RankRow key={row.id} row={row} />
            ))}
          </div>
          <CriteriaPanel
            sliders={sliders}
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            onWeight={setWeight}
            onAdd={() => navigate(ROUTES.settings)}
          />
        </div>
      )}
    </section>
  );
}
