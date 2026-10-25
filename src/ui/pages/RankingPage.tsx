import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Container } from '../../composition/container';
import type { CarStatus } from '../../domain/userState';
import type { Powertrain } from '../../domain/car';
import { HeroCard } from '../components/HeroCard';
import { RankRow } from '../components/RankRow';
import { CriteriaPanel } from '../components/CriteriaPanel';
import { Icon } from '../components/Icon';
import { useRankingViewModel } from '../viewmodels/useRankingViewModel';
import { useCriteriaPanelViewModel } from '../viewmodels/useCriteriaPanelViewModel';
import { STATUS_FILTER_LABELS, POWERTRAIN_FILTER_LABELS } from '../viewmodels/rankingViewModel';
import { ROUTES } from '../routes';
import './RankingPage.css';

const STATUS_OPTIONS: (CarStatus | 'all')[] = [
  'all',
  'watching',
  'interested',
  'test-drive-planned',
];
const POWERTRAIN_OPTIONS: (Powertrain | 'all')[] = ['all', 'bev', 'phev', 'reev'];

const STATUS_OPTION_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: 'Alle',
  ...STATUS_FILTER_LABELS,
};

const POWERTRAIN_OPTION_LABELS: Record<(typeof POWERTRAIN_OPTIONS)[number], string> = {
  all: 'Alle',
  ...POWERTRAIN_FILTER_LABELS,
};

/** Ranking-Seite auf `/` (T10.4, T10.5, T3.4). Rendert nur, alle Werte aus den ViewModels. */
export function RankingPage({ container }: { container: Container }) {
  const { viewModel, filters, updateFilters, error, loading } = useRankingViewModel(container);
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

      {/* Filter (T3.4): Status, Powertrain, nur Watchlist, rejected ausblenden */}
      <div className="ranking__filters" role="group" aria-label="Rangliste filtern">
        <div className="ranking__filter-row">
          <span className="label">Status</span>
          <div className="ranking__chips">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`ranking__chip${filters.status === option ? ' ranking__chip--active' : ''}`}
                onClick={() => updateFilters({ status: option })}
              >
                {STATUS_OPTION_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="ranking__filter-row">
          <span className="label">Powertrain</span>
          <div className="ranking__chips">
            {POWERTRAIN_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`ranking__chip${filters.powertrain === option ? ' ranking__chip--active' : ''}`}
                onClick={() => updateFilters({ powertrain: option })}
              >
                {POWERTRAIN_OPTION_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="ranking__filter-row">
          <div className="ranking__chips">
            <button
              type="button"
              className={`ranking__chip${filters.onlyWatchlist ? ' ranking__chip--active' : ''}`}
              onClick={() => updateFilters({ onlyWatchlist: !filters.onlyWatchlist })}
              aria-pressed={filters.onlyWatchlist}
            >
              Nur Watchlist
            </button>
            <button
              type="button"
              className={`ranking__chip${filters.hideRejected ? ' ranking__chip--active' : ''}`}
              onClick={() => updateFilters({ hideRejected: !filters.hideRejected })}
              aria-pressed={filters.hideRejected}
            >
              Rejected ausblenden
            </button>
          </div>
        </div>
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
