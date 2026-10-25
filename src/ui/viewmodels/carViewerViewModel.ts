import type { Car } from '../../domain/car';
import { getAttributeValue, type AttributeValue } from '../../domain/car';

/**
 * T5.3: Hotspots der 3D-Ansicht, abgeleitet aus den Attributen des Autos.
 * Reine Funktion (kein Browser-Zugriff), damit sie ohne model-viewer testbar ist.
 */

export interface CarHotspotVM {
  key: CarHotspotKey;
  label: string;
  valueText: string;
  /** Position fuer <model-viewer data-position="x y z"> - fuer die generischen Modelle, im Browser verifizieren. */
  position: string;
}

export type CarHotspotKey = 'panoramaRoof' | 'hud' | 'massageSeats' | 'charging';

interface HotspotDefinition {
  key: CarHotspotKey;
  /** Attribut-Schluessel im Auto (kann vom Hotspot-Key abweichen). */
  attributeKey: string;
  label: string;
  position: string;
}

// Positionen gelten fuer die generischen GLB-Modelle pro Karosserieform.
const HOTSPOT_CATALOG: HotspotDefinition[] = [
  {
    key: 'panoramaRoof',
    attributeKey: 'panoramaRoof',
    label: 'Panoramadach',
    position: '0m 1.15m 0m',
  },
  { key: 'hud', attributeKey: 'hud', label: 'Head-up-Display', position: '0m 1.05m 1.35m' },
  {
    key: 'massageSeats',
    attributeKey: 'massageSeats',
    label: 'Massage-Sitze',
    position: '0.35m 0.95m -0.2m',
  },
  { key: 'charging', attributeKey: 'dcMaxKw', label: 'Ladeleistung', position: '0.9m 0.7m -1.9m' },
];

function formatHotspotValue(value: AttributeValue): string {
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'number') return `${new Intl.NumberFormat('de-DE').format(value)} kW`;
  return String(value);
}

/** Ein Hotspot ist nur sichtbar, wenn das Attribut belegt ist und zutrifft. */
function isHotspotActive(value: AttributeValue | null): boolean {
  if (value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return value.length > 0;
}

/** Aktive Hotspots (Pano, HUD, Massage, Laden) in Katalog-Reihenfolge. */
export function hotspotsForCar(car: Car): CarHotspotVM[] {
  return HOTSPOT_CATALOG.flatMap((definition) => {
    const value = getAttributeValue(car, definition.attributeKey);
    if (value === null || !isHotspotActive(value)) return [];
    return [
      {
        key: definition.key,
        label: definition.label,
        position: definition.position,
        valueText: formatHotspotValue(value),
      },
    ];
  });
}

/** Hinweistext, wenn kein Modell hinterlegt ist (T5.2/T5.3). */
export function placeholderHint(bodyType: string): string {
  return `Kein 3D-Modell hinterlegt (public/models/${bodyType}.glb). Drehen und Zoomen sind nach dem Ablegen der Datei moeglich.`;
}
