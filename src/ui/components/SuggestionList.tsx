import { Link } from 'react-router-dom';
import type { SuggestionsVM } from '../viewmodels/suggestionViewModel';
import { ScoreBar } from './ScoreBar';
import './SuggestionList.css';

/** Vorschlags-Block auf `/` (T4.2). Rendert nur, Daten aus dem ViewModel. */
export function SuggestionList({ suggestions }: { suggestions: SuggestionsVM }) {
  if (suggestions.rows.length === 0) return null;
  return (
    <div className="suggestions">
      <p className="label">Vorschläge (ab {suggestions.threshold} Punkten)</p>
      <ul className="suggestions__list">
        {suggestions.rows.map((row) => (
          <li key={row.id} className="suggestions__item glass">
            <Link to={`/car/${row.id}`} className="suggestions__link">
              <span className="suggestions__name">{row.label}</span>
              <span className="suggestions__score">
                <ScoreBar score={row.score} label={`Eignung ${row.score} von 100`} />
                {row.score}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
