import { useEffect, useRef } from 'react';
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

/** Engeres FOV zoomt das Modell groesser in die Box. */
const FIELD_OF_VIEW = '18deg';

interface ModelViewerElement extends HTMLElement {
  jumpCameraToGoal?: () => void;
}

export function CarViewer({ model, loading, hotspots, alt, bodyType }: CarViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);

  // Nach dem Laden FOV anwenden (Attribut allein greift erst nach
  // jumpCameraToGoal) - damit das Modell gross und zentriert startet.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !model) return;
    const onLoad = () => {
      viewer.setAttribute('field-of-view', FIELD_OF_VIEW);
      viewer.setAttribute('camera-target', 'auto auto auto');
      viewer.jumpCameraToGoal?.();
    };
    viewer.addEventListener('load', onLoad);
    return () => viewer.removeEventListener('load', onLoad);
  }, [model]);

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
        ref={viewerRef}
        class="car-viewer__model"
        src={model.url}
        alt={alt}
        camera-controls
        auto-rotate
        rotation-per-second="8deg"
        shadow-intensity="1"
        field-of-view={FIELD_OF_VIEW}
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
