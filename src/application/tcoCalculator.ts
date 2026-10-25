/**
 * Einfacher Kostenvergleich (TCO) pro Jahr (T6.3).
 * Reine Funktion, keine Annahmen im Code: alle Werte kommen vom Nutzer
 * (km/Jahr, Strompreis, Versicherung, Wertverlust), der Verbrauch kommt
 * aus dem Auto (null = unbekannt).
 */
export interface TcoInput {
  kmPerYear: number;
  /** Strompreis in Euro pro kWh. */
  electricityPriceEurPerKwh: number;
  /** Versicherung in Euro pro Jahr. */
  insuranceEurPerYear: number;
  /** Wertverlust in Euro pro Jahr. */
  depreciationEurPerYear: number;
  /** Verbrauch in kWh/100 km; null = unbekannt. */
  consumptionKwh100: number | null;
}

export interface TcoResult {
  /** Energiekosten pro Jahr; null, wenn der Verbrauch unbekannt ist. */
  energyCostEurPerYear: number | null;
  insuranceEurPerYear: number;
  depreciationEurPerYear: number;
  /** Summe pro Jahr; null, wenn eine Komponente unbekannt ist. */
  totalEurPerYear: number | null;
  /** Summe pro Monat; null wie totalEurPerYear. */
  totalEurPerMonth: number | null;
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Summiert Energie-, Versicherungs- und Wertverlustkosten pro Jahr.
 * Gibt null zurück, wenn die Eingaben unplausibel sind (negativ, keine Zahl).
 */
export function estimateTco(input: TcoInput): TcoResult | null {
  const { kmPerYear, electricityPriceEurPerKwh, insuranceEurPerYear, depreciationEurPerYear } =
    input;
  if (
    !isNonNegative(kmPerYear) ||
    !isNonNegative(electricityPriceEurPerKwh) ||
    !isNonNegative(insuranceEurPerYear) ||
    !isNonNegative(depreciationEurPerYear)
  ) {
    return null;
  }

  const { consumptionKwh100 } = input;
  const consumptionValid = consumptionKwh100 !== null && isNonNegative(consumptionKwh100);
  const energyCostEurPerYear =
    consumptionValid && consumptionKwh100 !== null
      ? (kmPerYear / 100) * consumptionKwh100 * electricityPriceEurPerKwh
      : null;

  const totalEurPerYear =
    energyCostEurPerYear === null
      ? null
      : energyCostEurPerYear + insuranceEurPerYear + depreciationEurPerYear;

  return {
    energyCostEurPerYear,
    insuranceEurPerYear,
    depreciationEurPerYear,
    totalEurPerYear,
    totalEurPerMonth: totalEurPerYear === null ? null : totalEurPerYear / 12,
  };
}
