import { useEffect, useMemo, useState } from 'react';
import type { Car } from '../../domain/car';
import type { ModelRef } from '../../ports/modelProvider';
import type { Container } from '../../composition/container';
import { hotspotsForCar, type CarHotspotVM } from './carViewerViewModel';

/**
 * ViewModel-Hook der 3D-Ansicht (T5.3): laedt das Modell ueber den ModelProvider
 * und registriert das <model-viewer> Custom Element erst bei Bedarf (dynamischer
 * import, wie bei lottie-web - damit der Start schnell bleibt).
 */
export function useCarViewerViewModel(
  container: Container,
  car: Car | null,
): { model: ModelRef | null; loading: boolean; hotspots: CarHotspotVM[] } {
  const { modelProvider } = container;
  const [model, setModel] = useState<ModelRef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!car) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    modelProvider
      .getModel(car)
      .then((ref) => {
        if (!active) return;
        setModel(ref);
        if (ref) void import('@google/model-viewer');
      })
      .catch(() => {
        // Kein Modell ist kein Fehler: Platzhalter reicht (T5.2).
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [modelProvider, car]);

  const hotspots = useMemo(() => (car ? hotspotsForCar(car) : []), [car]);
  return { model, loading, hotspots };
}
