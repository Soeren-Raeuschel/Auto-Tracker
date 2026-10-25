import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Container } from '../../composition/container';
import { GlassCard } from '../components/GlassCard';
import { CarViewer } from '../components/CarViewer';
import { Icon } from '../components/Icon';
import { Label } from '../components/Label';
import { useCarDetailViewModel } from '../viewmodels/useCarDetailViewModel';
import { useCarViewerViewModel } from '../viewmodels/useCarViewerViewModel';
import {
  confidenceLabel,
  listingLinks,
  toPositiveFilterValue,
} from '../viewmodels/carDetailViewModel';
import './CarDetailPage.css';

const STATUS_LABELS: Record<string, string> = {
  watching: 'Beobachten',
  interested: 'Interessant',
  'test-drive-planned': 'Probefahrt geplant',
  rejected: 'Abgelehnt',
};

/** Detailseite auf `/car/:id` (T3.2). Rendert nur, alle Werte aus dem ViewModel. */
export function CarDetailPage({ container }: { container: Container }) {
  const { id } = useParams<{ id: string }>();
  const { car, viewModel, loading, error, changeStatus, changeNotes, changeChecklistItem } =
    useCarDetailViewModel(container, id);
  const viewer = useCarViewerViewModel(container, car);
  const [maxPrice, setMaxPrice] = useState('');
  const [maxKm, setMaxKm] = useState('');
  const [minYear, setMinYear] = useState('');

  const searchFilters = {
    maxPriceEur: toPositiveFilterValue(maxPrice),
    maxMileageKm: toPositiveFilterValue(maxKm),
    minYear: toPositiveFilterValue(minYear),
  };

  return (
    <section className="car-detail">
      <p className="label">Auto-Tracker</p>
      <h1>{viewModel ? viewModel.label : 'Auto-Details'}</h1>
      {error && <p role="alert">Fehler: {error}</p>}
      {loading && <p>Lade Daten ...</p>}
      {viewModel && (
        <>
          <GlassCard className="car-detail__card">
            <Label>3D-Ansicht</Label>
            <CarViewer
              model={viewer.model}
              loading={viewer.loading}
              hotspots={viewer.hotspots}
              alt={`3D-Modell: ${viewModel.label}`}
              bodyType={car?.bodyType ?? 'other'}
            />
          </GlassCard>

          <GlassCard className="car-detail__card">
            <Label>Status</Label>
            <div className="car-detail__status" role="group" aria-label="Status">
              {viewModel.statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="car-detail__status-button"
                  data-current={status === viewModel.status}
                  aria-pressed={status === viewModel.status}
                  onClick={() => changeStatus(viewModel.id, status)}
                >
                  {STATUS_LABELS[status] ?? status}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="car-detail__card">
            <Label>Attribute</Label>
            <ul className="car-detail__attributes">
              {viewModel.attributeRows.map((row) => (
                <li key={row.key} className="car-detail__attribute">
                  <span className="car-detail__attribute-label">{row.label}</span>
                  <span className="car-detail__attribute-value">
                    {row.value}
                    {confidenceLabel(row.confidence) && (
                      <span className="car-detail__confidence label">
                        {confidenceLabel(row.confidence)}
                      </span>
                    )}
                    {row.source && <span className="car-detail__source label">{row.source}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="car-detail__card">
            <Label>Gebrauchte suchen</Label>
            <div className="car-detail__listing-filters">
              <label className="car-detail__filter">
                <span>Preis bis (EUR)</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="Preis bis"
                />
              </label>
              <label className="car-detail__filter">
                <span>Km bis</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={maxKm}
                  onChange={(e) => setMaxKm(e.target.value)}
                  aria-label="Kilometerstand bis"
                />
              </label>
              <label className="car-detail__filter">
                <span>Baujahr ab</span>
                <input
                  type="number"
                  min={1950}
                  inputMode="numeric"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  aria-label="Baujahr ab"
                />
              </label>
            </div>
            <div className="car-detail__listing-links">
              {car &&
                listingLinks(car, searchFilters, container.listingProviders).map((link) => (
                  <a
                    key={link.portal}
                    className="car-detail__listing-link"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="search" />
                    {link.portal}
                  </a>
                ))}
            </div>
          </GlassCard>

          <GlassCard className="car-detail__card">
            <Label>Probefahrt-Checkliste</Label>
            <ul className="car-detail__checklist">
              {viewModel.checklist.map((item) => (
                <li key={item.key} className="car-detail__checklist-item">
                  <label className="car-detail__check">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) =>
                        changeChecklistItem(viewModel.id, item.key, e.target.checked)
                      }
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="car-detail__card">
            <Label>Notizen</Label>
            <textarea
              className="car-detail__notes"
              value={viewModel.notes}
              onChange={(e) => changeNotes(viewModel.id, e.target.value)}
              rows={4}
              aria-label="Notizen zu diesem Auto"
            />
          </GlassCard>
        </>
      )}
    </section>
  );
}
