import type { ModelRef } from '../../ports/modelProvider';
import { CarSilhouette } from './CarSilhouette';
import type { CarHotspotVM } from '../viewmodels/carViewerViewModel';
import { placeholderHint } from '../viewmodels/carViewerViewModel';
import './CarViewer.css';

/**
 * 3D-Ansicht auf der Detailseite (T5.3). Rendert nur: model-viewer mit
 * Hotspots oder Platzhalter mit Silhouette, wenn keine GLB hinterlegt ist.
 */
export interface CarViewerProps {
  model: ModelRef | null;
  loading: boolean;
  hotspots: CarHotspotVM[];
  alt: string;
  bodyType: string;
}

export function CarViewer({ model, loading, hotspots, alt, bodyType }: CarViewerProps) {
  if (loading || !model) {
    return (
      <div className="car-viewer">
        <CarSilhouette bodyType={bodyType} />
        {!loading && (
          <p className="car-viewer__hint" role="note">
            {placeholderHint(bodyType)}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="car-viewer">
      <model-viewer
        className="car-viewer__model"
        src={model.url}
        alt={alt}
        camera-controls
        auto-rotate
        rotation-per-second="8deg"
        shadow-intensity="1"
      >
        {hotspots.map((hotspot) => (
          <button
            key={hotspot.key}
            slot={hotspot.key}
            className="car-viewer__hotspot"
            data-position={hotspot.position}
            aria-label={`${hotspot.label}: ${hotspot.valueText}`}
            type="button"
          >
            <span className="car-viewer__hotspot-dot" aria-hidden="true" />
            <span className="car-viewer__hotspot-label">
              {hotspot.label}: {hotspot.valueText}
            </span>
          </button>
        ))}
      </model-viewer>
    </div>
  );
}
