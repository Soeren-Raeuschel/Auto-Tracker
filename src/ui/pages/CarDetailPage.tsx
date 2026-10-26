import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Container } from '../../composition/container';
import { GlassCard } from '../components/GlassCard';
import { CarViewer } from '../components/CarViewer';
import { Icon } from '../components/Icon';
import { Label } from '../components/Label';
import { useCarDetailViewModel } from '../viewmodels/useCarDetailViewModel';
import { useCarViewerViewModel } from '../viewmodels/useCarViewerViewModel';
import { useTripViewModel } from '../viewmodels/useTripViewModel';
import { useTcoViewModel } from '../viewmodels/useTcoViewModel';
import { useNewsViewModel } from '../viewmodels/useNewsViewModel';
import { usePriceHistoryViewModel } from '../viewmodels/usePriceHistoryViewModel';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { newsForCar } from '../viewmodels/newsViewModel';
import { FeedbackState } from '../components/FeedbackState';
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
  const trip = useTripViewModel(car);
  const tco = useTcoViewModel(car);
  const news = useNewsViewModel(container);
  const price = usePriceHistoryViewModel(container, id ?? '');
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
      {error && <FeedbackState kind="error" message={`Fehler: ${error}`} />}
      {loading && !error && <FeedbackState kind="loading" message="Lade Daten ..." />}
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

          {trip.viewModel && (
            <GlassCard className="car-detail__card">
              <Label>Ladestopps schätzen</Label>
              <div className="car-detail__filter">
                <span>Distanz (km)</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={trip.distanceInput}
                  onChange={(e) => trip.setDistanceInput(e.target.value)}
                  aria-label="Distanz in Kilometern"
                />
              </div>
              {trip.viewModel.resultText && (
                <p className="car-detail__trip-result">{trip.viewModel.resultText}</p>
              )}
              <p className="car-detail__trip-hint label">{trip.viewModel.hint}</p>
            </GlassCard>
          )}

          {tco.viewModel && (
            <GlassCard className="car-detail__card">
              <Label>Kosten pro Jahr</Label>
              <div className="car-detail__filters">
                <label className="car-detail__filter">
                  <span>Km pro Jahr</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={tco.inputs.kmPerYear}
                    onChange={(e) => tco.updateInput('kmPerYear', e.target.value)}
                    aria-label="Kilometer pro Jahr"
                  />
                </label>
                <label className="car-detail__filter">
                  <span>Strompreis (EUR/kWh)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={tco.inputs.electricityPriceEurPerKwh}
                    onChange={(e) => tco.updateInput('electricityPriceEurPerKwh', e.target.value)}
                    aria-label="Strompreis in Euro pro kWh"
                  />
                </label>
                <label className="car-detail__filter">
                  <span>Versicherung (EUR/Jahr)</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={tco.inputs.insuranceEurPerYear}
                    onChange={(e) => tco.updateInput('insuranceEurPerYear', e.target.value)}
                    aria-label="Versicherung in Euro pro Jahr"
                  />
                </label>
                <label className="car-detail__filter">
                  <span>Wertverlust (EUR/Jahr)</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={tco.inputs.depreciationEurPerYear}
                    onChange={(e) => tco.updateInput('depreciationEurPerYear', e.target.value)}
                    aria-label="Wertverlust in Euro pro Jahr"
                  />
                </label>
              </div>
              <ul className="car-detail__tco-rows">
                {tco.viewModel.costRows.map((row) => (
                  <li
                    key={row.key}
                    className="car-detail__tco-row"
                    data-total={row.isTotal || undefined}
                  >
                    <span className="car-detail__tco-label">{row.label}</span>
                    <span className="car-detail__tco-value">{row.value}</span>
                  </li>
                ))}
              </ul>
              {tco.viewModel.hint && (
                <p className="car-detail__trip-hint label">{tco.viewModel.hint}</p>
              )}
            </GlassCard>
          )}

          <GlassCard className="car-detail__card">
            <Label>Preis-Historie</Label>
            {price.stand && <p className="label">{price.stand}</p>}
            {price.error ? (
              <FeedbackState kind="error" message={`Fehler: ${price.error}`} />
            ) : price.viewModel ? (
              <PriceHistoryChart viewModel={price.viewModel} />
            ) : (
              <FeedbackState kind="loading" message="Lade Preis-Historie ..." />
            )}
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

          {viewModel && newsForCar(news.items, viewModel.id).rows.length > 0 && (
            <GlassCard className="car-detail__card">
              <Label>News zu diesem Auto</Label>
              {news.viewModel.stand && (
                <p className="car-detail__trip-hint label">{news.viewModel.stand}</p>
              )}
              <ul className="car-detail__news">
                {newsForCar(news.items, viewModel.id, news.viewModel.stand).rows.map((row) => (
                  <li key={row.id} className="car-detail__news-item">
                    <span className="label">
                      {row.source} · {row.dateDisplay}
                    </span>
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                      {row.title}
                    </a>
                    {row.summary !== '' && <p>{row.summary}</p>}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

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
