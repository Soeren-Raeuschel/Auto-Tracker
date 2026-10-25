import { attributeCatalog, findAttribute } from '../../domain/attributeCatalog';
import { getAttributeValue, type Car } from '../../domain/car';

/** Eine Zeile der Vorschau: bekanntes Attribut oder offen. */
export interface AttributeRowVM {
  key: string;
  label: string;
  display: string;
  missing: boolean;
}

export interface CarPreviewVM {
  label: string;
  id: string;
  rows: AttributeRowVM[];
  missingCount: number;
}

/** Format-Regeln: Boolean ja/nein/unbekannt, Zahlen mit Einheit. */
export function formatAttributeValue(
  key: string,
  value: ReturnType<typeof getAttributeValue>,
): string {
  const attribute = findAttribute(key);
  if (value === null) return 'unbekannt';
  if (typeof value === 'boolean') return value ? 'ja' : 'nein';
  const unit = attribute?.unit;
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

/** Reine Funktion: Vorschau-Zeilen für ein extrahiertes Auto. */
export function toCarPreviewVM(car: Car): CarPreviewVM {
  const rows = attributeCatalog.map((attribute) => {
    const value = getAttributeValue(car, attribute.key);
    return {
      key: attribute.key,
      label: attribute.label,
      display: formatAttributeValue(attribute.key, value),
      missing: value === null,
    };
  });
  return {
    label: [car.brand, car.model, car.variant].filter(Boolean).join(' '),
    id: car.id,
    rows,
    missingCount: rows.filter((row) => row.missing).length,
  };
}
