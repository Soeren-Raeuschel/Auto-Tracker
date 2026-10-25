import type { AttributeDefinition } from '../../domain/attributeCatalog';
import type { ListingFilters, ListingSearchProvider } from '../../ports/listingSearchProvider';
import { attributeCatalog } from '../../domain/attributeCatalog';

import {
  carLabel,
  getAttributeValue,
  type AttributeValue,
  type Car,
  type Confidence,
} from '../../domain/car';
import type { CarStatus } from '../../domain/userState';
import { allowedTargets, checklistCatalog } from './userStateViewModel';

/** Eine Zeile der Attributliste auf der Detailseite (T3.2). */
export interface AttributeRowVM {
  key: string;
  label: string;
  value: string;
  confidence: Confidence;
  /** Menschenlesbare Quelle, z. B. "Herstellerdaten" - optional. */
  source: string | null;
  unknown: boolean;
}

export interface ChecklistRowVM {
  key: string;
  label: string;
  checked: boolean;
}

export interface CarDetailVM {
  id: string;
  label: string;
  status: CarStatus;
  attributeRows: AttributeRowVM[];
  statusOptions: CarStatus[];
  notes: string;
  checklist: ChecklistRowVM[];
}

export function confidenceLabel(confidence: Confidence): string | null {
  if (confidence === 'estimated') return 'geschätzt';
  if (confidence === 'ai-extracted') return 'KI-extrahiert';
  return null;
}

function formatValue(definition: AttributeDefinition, value: AttributeValue): string {
  if (definition.kind === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'number') {
    const formatted = new Intl.NumberFormat('de-DE').format(value);
    return definition.unit ? `${formatted} ${definition.unit}` : formatted;
  }
  return String(value);
}

function toRow(car: Car, definition: AttributeDefinition): AttributeRowVM {
  const entry = car.attributes[definition.key];
  const value = getAttributeValue(car, definition.key);
  return {
    key: definition.key,
    label: definition.label,
    value: value === null ? 'unbekannt' : formatValue(definition, value),
    confidence: entry?.confidence ?? 'verified',
    source: entry?.source ?? null,
    unknown: value === null,
  };
}

/** Alle Attribute des Katalogs, in Katalog-Reihenfolge, inklusive unbekannter. */
export function attributeRows(car: Car): AttributeRowVM[] {
  return attributeCatalog.map((definition) => toRow(car, definition));
}

export function checklistRows(checklist: Record<string, boolean>): ChecklistRowVM[] {
  return checklistCatalog.map((item) => ({
    key: item.key,
    label: item.label,
    checked: checklist[item.key] ?? false,
  }));
}

export interface ListingLinkVM {
  portal: string;
  url: string;
}

/** Such-Links der Portale fuer die Detailseite (T4.3), reine Funktion. */
export function listingLinks(
  car: Car,
  filters: ListingFilters,
  providers: readonly ListingSearchProvider[],
): ListingLinkVM[] {
  return providers.map((provider) => ({
    portal: provider.portal,
    url: provider.buildSearchUrl(car, filters),
  }));
}

/** Rundet Eingaben auf ganze Zahlen, negatives oder nicht-numerisches wird verworfen. */
export function toPositiveFilterValue(raw: string): number | undefined {
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

// Pattern: MVVM. Pure function = easy to test without a browser.

export function toCarDetailViewModel(
  car: Car,
  state: {
    status: CarStatus;
    notes: string;
    checklist: Record<string, boolean>;
  },
): CarDetailVM {
  return {
    id: car.id,
    label: carLabel(car),
    status: state.status,
    attributeRows: attributeRows(car),
    statusOptions: allowedTargets(state.status),
    notes: state.notes,
    checklist: checklistRows(state.checklist),
  };
}
