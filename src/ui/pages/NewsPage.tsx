import { Link } from 'react-router-dom';
import type { Container } from '../../composition/container';
import { GlassCard } from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { useNewsViewModel } from '../viewmodels/useNewsViewModel';
import { FeedbackState } from '../components/FeedbackState';
import './NewsPage.css';

/** News-Ansicht `/news` (T7.3). Rendert nur, alle Werte aus dem ViewModel. */
export function NewsPage({ container }: { container: Container }) {
  const { viewModel, loading, error } = useNewsViewModel(container);

  return (
    <section className="news-page">
      <p className="label">Auto-Tracker</p>
      <h1>News</h1>
      {viewModel.stand && <p className="news-page__stand label">{viewModel.stand}</p>}
      {error && <FeedbackState kind="error" message={`Fehler: ${error}`} />}
      {loading && !error && <FeedbackState kind="loading" message="Lade News ..." />}

      {viewModel.empty && !loading && !error && (
        <GlassCard className="news-page__empty">
          <Icon name="inbox" size={22} />
          <p>Noch keine News. Die Pipeline schreibt public/data/news.json.</p>
        </GlassCard>
      )}

      <ul className="news-page__list">
        {viewModel.rows.map((row) => (
          <li key={row.id}>
            <GlassCard className="news-page__item">
              <p className="news-page__meta label">
                {row.source} · {row.dateDisplay}
              </p>
              <h2 className="news-page__title">{row.title}</h2>
              {row.summary !== '' && <p className="news-page__summary">{row.summary}</p>}
              {row.carIds.length > 0 && (
                <p className="news-page__cars label">
                  {row.carIds.map((carId) => (
                    <Link key={carId} to={`/car/${carId}`} viewTransition>
                      {carId}
                    </Link>
                  ))}
                </p>
              )}
              <a
                className="news-page__link"
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Artikel lesen <Icon name="search" size={16} />
              </a>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
