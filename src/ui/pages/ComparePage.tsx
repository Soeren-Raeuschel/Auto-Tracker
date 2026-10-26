import { Link, useSearchParams } from 'react-router-dom';
import type { Container } from '../../composition/container';
import { GlassCard } from '../components/GlassCard';
import { Label } from '../components/Label';
import { useCompareViewModel } from '../viewmodels/useCompareViewModel';
import { FeedbackState } from '../components/FeedbackState';
import { idsToParam, idsWithSlot, parseCompareIds } from '../viewmodels/compareViewModel';
import './ComparePage.css';

const SLOT_LABELS = ['Auto 1', 'Auto 2', 'Auto 3'];

/** Vergleichsseite auf `/compare` (T3.3). Rendert nur, alle Werte aus dem ViewModel. */
export function ComparePage({ container }: { container: Container }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const ids = parseCompareIds(searchParams.get('ids'));
  const { viewModel, selection, error, loading } = useCompareViewModel(container, ids);

  const changeSlot = (index: number, value: string) => {
    const param = idsToParam(idsWithSlot(ids, index, value));
    if (param) setSearchParams({ ids: param });
    else setSearchParams({});
  };

  return (
    <section className="compare">
      <p className="label">Auto-Tracker</p>
      <h1>Vergleich</h1>
      {error && <FeedbackState kind="error" message={`Fehler: ${error}`} />}
      {loading && !error && <FeedbackState kind="loading" message="Lade Daten ..." />}

      <GlassCard className="compare__picker">
        <Label>Vergleichen</Label>
        <div className="compare__slots">
          {selection.map((slot) => (
            <label key={slot.index} className="compare__slot">
              <span className="label">{SLOT_LABELS[slot.index]}</span>
              <select
                value={slot.value}
                onChange={(e) => changeSlot(slot.index, e.target.value)}
                aria-label={`Auto ${slot.index + 1} auswählen`}
              >
                <option value="">–</option>
                {slot.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </GlassCard>

      {viewModel.columns.length >= 2 ? (
        <GlassCard className="compare__table-card">
          <table className="compare__table">
            <caption className="visually-hidden">Autos im Vergleich</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Kriterium</span>
                </th>
                {viewModel.columns.map((column) => (
                  <th scope="col" key={column.id}>
                    <Link className="compare__car-link" to={`/car/${column.id}`}>
                      {column.label}
                    </Link>
                    <span className="compare__score">{column.score}</span>
                    {column.excludedLabel && (
                      <span className="compare__knockout label">{column.excludedLabel}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="compare__group">
                <th scope="rowgroup" colSpan={viewModel.columns.length + 1}>
                  <Label>Kriterien</Label>
                </th>
              </tr>
              {viewModel.criteriaRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td key={index} data-best={index === row.bestIndex}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="compare__group">
                <th scope="rowgroup" colSpan={viewModel.columns.length + 1}>
                  <Label>Attribute</Label>
                </th>
              </tr>
              {viewModel.attributeRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        !loading &&
        !error && (
          <FeedbackState
            kind="empty"
            message="Mindestens zwei Autos auswählen, um zu vergleichen."
          />
        )
      )}
    </section>
  );
}
