import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Container } from '../../composition/container';
import type { CarCandidate } from '../../domain/carCandidate';
import { GlassCard } from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/PrimaryButton';
import { useCandidatesViewModel } from '../viewmodels/useCandidatesViewModel';
import { applyEdit, type EditableCandidate } from '../viewmodels/candidatesViewModel';
import './CandidatesPage.css';

/** Kandidaten-Freigabe (T7.5): pruefen, bearbeiten, uebernehmen oder verwerfen. */
export function CandidatesPage({ container }: { container: Container }) {
  const { viewModel, loading, error, message, approve, dismiss } =
    useCandidatesViewModel(container);
  const [edits, setEdits] = useState<Record<string, EditableCandidate>>({});

  const edited = (candidate: CarCandidate, id: string): CarCandidate => {
    const edit = edits[id];
    return edit ? applyEdit(candidate, edit) : candidate;
  };

  return (
    <section className="candidates-page">
      <p className="label">Auto-Tracker</p>
      <h1>KI-Kandidaten</h1>
      <p className="candidates-page__hint">
        Vorschläge aus der News-Pipeline (public/data/candidates.json). Übernommene Autos landen als
        Ergänzung im lokalen Speicher, cars.json bleibt Repo-Daten.
      </p>
      {error && <p role="alert">Fehler: {error}</p>}
      {loading && <p>Lade Kandidaten ...</p>}
      {message && (
        <p className="candidates-page__message" role="status">
          <Icon name="check" size={16} /> {message}
        </p>
      )}

      {viewModel.empty && !loading && !error && (
        <GlassCard className="candidates-page__empty">
          <Icon name="inbox" size={22} />
          <p>
            Keine offenen Kandidaten
            {viewModel.decidedCount > 0 ? ` (${viewModel.decidedCount} erledigt).` : '.'}
          </p>
        </GlassCard>
      )}

      <ul className="candidates-page__list">
        {viewModel.rows.map((row) => (
          <li key={row.id}>
            <GlassCard className="candidates-page__item">
              <h2 className="candidates-page__title">{row.label}</h2>
              <a
                className="candidates-page__source"
                href={row.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quelle ansehen <Icon name="search" size={16} />
              </a>
              <div className="candidates-page__edit">
                {(['brand', 'model', 'variant'] as const).map((field) => (
                  <label key={field}>
                    <span className="label">
                      {field === 'brand' ? 'Marke' : field === 'model' ? 'Modell' : 'Variante'}
                    </span>
                    <input
                      value={edits[row.id]?.[field] ?? row.editable[field]}
                      onChange={(e) =>
                        setEdits((previous) => ({
                          ...previous,
                          [row.id]: {
                            ...(previous[row.id] ?? row.editable),
                            [field]: e.target.value,
                          },
                        }))
                      }
                      aria-label={`${field === 'brand' ? 'Marke' : field === 'model' ? 'Modell' : 'Variante'} bearbeiten`}
                    />
                  </label>
                ))}
              </div>
              <ul className="candidates-page__rows">
                {row.preview.rows.map((attribute) => (
                  <li
                    key={attribute.key}
                    className={attribute.missing ? 'candidates-page__row--missing' : ''}
                  >
                    <span>{attribute.label}</span>
                    <span>{attribute.display}</span>
                  </li>
                ))}
              </ul>
              <div className="candidates-page__actions">
                <PrimaryButton onClick={() => void approve(edited(row.candidate, row.id))}>
                  <Icon name="check" size={16} /> Übernehmen
                </PrimaryButton>
                <button
                  type="button"
                  className="candidates-page__dismiss"
                  onClick={() => void dismiss(row.candidate)}
                >
                  Verwerfen
                </button>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>

      <p className="candidates-page__back">
        <Link to="/import">Zurück zum Import</Link>
      </p>
    </section>
  );
}
