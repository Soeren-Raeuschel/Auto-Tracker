import { estimateTco, type TcoResult } from '../../application/tcoCalculator';
import { getAttributeValue, type Car } from '../../domain/car';

/**
 * Eingaben des Kostenvergleichs (T6.3) als Roh-Strings aus den Feldern.
 * Leere Felder gelten als 0.
 */
export interface TcoInputs {
  kmPerYear: string;
  electricityPriceEurPerKwh: string;
  insuranceEurPerYear: string;
  depreciationEurPerYear: string;
}

export const EMPTY_TCO_INPUTS: TcoInputs = {
  kmPerYear: '',
  electricityPriceEurPerKwh: '',
  insuranceEurPerYear: '',
  depreciationEurPerYear: '',
};

export interface TcoVM {
  /** Zeile je Kostenblock: Label, Wert-Text, Farbe-Flag für die Summe. */
  costRows: { key: string; label: string; value: string; isTotal: boolean }[];
  /** Hinweis-Text unter dem Ergebnis, null wenn alles plausibel ist. */
  hint: string | null;
  /** Ergebnis komplett vorhanden? */
  hasTotal: boolean;
}

function parseNonNegative(input: string, fallback: number): number | null {
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function eur(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function toRows(result: TcoResult): TcoVM['costRows'] {
  const rows: TcoVM['costRows'] = [
    {
      key: 'energy',
      label: 'Stromkosten',
      value: result.energyCostEurPerYear === null ? 'unbekannt' : eur(result.energyCostEurPerYear),
      isTotal: false,
    },
    {
      key: 'insurance',
      label: 'Versicherung',
      value: eur(result.insuranceEurPerYear),
      isTotal: false,
    },
    {
      key: 'depreciation',
      label: 'Wertverlust',
      value: eur(result.depreciationEurPerYear),
      isTotal: false,
    },
  ];
  rows.push({
    key: 'total',
    label: 'Summe pro Jahr',
    value:
      result.totalEurPerYear === null
        ? 'unbekannt'
        : `${eur(result.totalEurPerYear)} (${eur(result.totalEurPerMonth ?? 0)}/Monat)`,
    isTotal: true,
  });
  return rows;
}

/** Reine Logik der TCO-Karte auf der Detailseite (T6.3). Das UI rendert nur. */
export function toTcoViewModel(car: Car, inputs: TcoInputs): TcoVM {
  const consumption = getAttributeValue(car, 'consumptionKwh100');
  const consumptionKwh100 = typeof consumption === 'number' ? consumption : null;

  const kmPerYear = parseNonNegative(inputs.kmPerYear, 0);
  const electricityPriceEurPerKwh = parseNonNegative(inputs.electricityPriceEurPerKwh, 0);
  const insuranceEurPerYear = parseNonNegative(inputs.insuranceEurPerYear, 0);
  const depreciationEurPerYear = parseNonNegative(inputs.depreciationEurPerYear, 0);

  if (
    kmPerYear === null ||
    electricityPriceEurPerKwh === null ||
    insuranceEurPerYear === null ||
    depreciationEurPerYear === null
  ) {
    return {
      costRows: [],
      hint: 'Bitte nur gültige, nicht negative Zahlen eingeben.',
      hasTotal: false,
    };
  }

  const result = estimateTco({
    kmPerYear,
    electricityPriceEurPerKwh,
    insuranceEurPerYear,
    depreciationEurPerYear,
    consumptionKwh100,
  });
  if (!result) {
    return {
      costRows: [],
      hint: 'Bitte nur gültige, nicht negative Zahlen eingeben.',
      hasTotal: false,
    };
  }

  const hint =
    consumptionKwh100 === null
      ? 'Verbrauch unbekannt, daher keine Stromkosten und keine Summe.'
      : null;

  return {
    costRows: toRows(result),
    hint,
    hasTotal: result.totalEurPerYear !== null,
  };
}
