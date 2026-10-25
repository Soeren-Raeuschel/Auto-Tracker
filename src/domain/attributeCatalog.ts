import type { CriterionKind } from './criterion';

export interface AttributeDefinition {
  key: string;
  label: string;
  kind: CriterionKind;
  unit?: string;
}

/** Known car attributes. Criteria in the settings can only refer to these keys. */
export const attributeCatalog: readonly AttributeDefinition[] = [
  { key: 'priceEur', label: 'Preis', kind: 'number', unit: 'EUR' },
  { key: 'panoramaRoof', label: 'Panoramadach', kind: 'boolean' },
  { key: 'hud', label: 'Head-up-Display', kind: 'boolean' },
  { key: 'massageSeats', label: 'Massagesitze', kind: 'boolean' },
  { key: 'acc', label: 'Adaptiver Tempomat', kind: 'boolean' },
  { key: 'regenAdjustable', label: 'Einstellbare Rekuperation', kind: 'boolean' },
  { key: 'dcMaxKw', label: 'DC-Ladeleistung', kind: 'number', unit: 'kW' },
  { key: 'rangeKm', label: 'Reichweite', kind: 'number', unit: 'km' },
  { key: 'batteryKwh', label: 'Batteriekapazität', kind: 'number', unit: 'kWh' },
  { key: 'consumptionKwh100', label: 'Verbrauch', kind: 'number', unit: 'kWh/100 km' },
  { key: 'trunkL', label: 'Kofferraum', kind: 'number', unit: 'l' },
  { key: 'seats', label: 'Sitzplätze', kind: 'number' },
];

export function findAttribute(key: string): AttributeDefinition | undefined {
  return attributeCatalog.find((attribute) => attribute.key === key);
}
