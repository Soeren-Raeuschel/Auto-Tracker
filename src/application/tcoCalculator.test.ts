import { describe, expect, it } from 'vitest';
import { estimateTco } from './tcoCalculator';

const base = {
  kmPerYear: 12000,
  electricityPriceEurPerKwh: 0.3,
  insuranceEurPerYear: 600,
  depreciationEurPerYear: 4000,
  consumptionKwh100: 18,
};

describe('estimateTco', () => {
  it('summiert Energie, Versicherung und Wertverlust', () => {
    // 12000 km * 18 kWh/100 km = 2160 kWh * 0,30 EUR = 648 EUR.
    const result = estimateTco(base);
    expect(result).toEqual({
      energyCostEurPerYear: 648,
      insuranceEurPerYear: 600,
      depreciationEurPerYear: 4000,
      totalEurPerYear: 5248,
      totalEurPerMonth: 5248 / 12,
    });
  });

  it('rechnet auch ohne Verbrauch, dann ohne Gesamtsumme', () => {
    const result = estimateTco({ ...base, consumptionKwh100: null });
    expect(result?.energyCostEurPerYear).toBeNull();
    expect(result?.totalEurPerYear).toBeNull();
    expect(result?.totalEurPerMonth).toBeNull();
  });

  it('allowt null Verbrauch und 0 kWh/100 km als Randfall', () => {
    const zero = estimateTco({ ...base, consumptionKwh100: 0 });
    expect(zero?.energyCostEurPerYear).toBe(0);
    expect(zero?.totalEurPerYear).toBe(4600);
  });

  it('gibt null bei negativen Eingaben zurück', () => {
    expect(estimateTco({ ...base, kmPerYear: -1 })).toBeNull();
    expect(estimateTco({ ...base, electricityPriceEurPerKwh: -0.1 })).toBeNull();
    expect(estimateTco({ ...base, insuranceEurPerYear: -1 })).toBeNull();
    expect(estimateTco({ ...base, depreciationEurPerYear: -1 })).toBeNull();
  });

  it('behandelt ungueltigen Verbrauch wie unbekannt', () => {
    const result = estimateTco({ ...base, consumptionKwh100: Number.POSITIVE_INFINITY });
    expect(result?.energyCostEurPerYear).toBeNull();
    expect(result?.totalEurPerYear).toBeNull();
  });

  it('rechnet mit 0 km/Jahr', () => {
    const result = estimateTco({ ...base, kmPerYear: 0 });
    expect(result?.energyCostEurPerYear).toBe(0);
    expect(result?.totalEurPerYear).toBe(4600);
  });
});
