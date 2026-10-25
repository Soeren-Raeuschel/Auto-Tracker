import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import { EMPTY_TCO_INPUTS, toTcoViewModel } from './tcoViewModel';

function car(attributes: Car['attributes']): Car {
  return {
    id: 'test-car',
    brand: 'Test',
    model: 'Auto',
    bodyType: 'suv',
    powertrain: 'bev',
    attributes,
  };
}

const sourced = (value: number | null) => ({
  value,
  confidence: 'estimated' as const,
  updatedAt: '2026-10-25',
});

const inputs = {
  kmPerYear: '12000',
  electricityPriceEurPerKwh: '0.3',
  insuranceEurPerYear: '600',
  depreciationEurPerYear: '4000',
};

describe('toTcoViewModel', () => {
  it('summiert Strom, Versicherung und Wertverlust mit de-DE-Format', () => {
    const vm = toTcoViewModel(car({ consumptionKwh100: sourced(18) }), inputs);
    expect(vm.hint).toBeNull();
    expect(vm.hasTotal).toBe(true);
    const energy = vm.costRows.find((row) => row.key === 'energy');
    expect(energy?.value).toBe('648\xa0€');
    const total = vm.costRows.find((row) => row.key === 'total');
    expect(total?.value).toContain('5.248\xa0€');
    expect(total?.value).toContain('/Monat');
  });

  it('laesst leere Felder als 0 gelten', () => {
    const vm = toTcoViewModel(car({ consumptionKwh100: sourced(18) }), EMPTY_TCO_INPUTS);
    expect(vm.hasTotal).toBe(true);
    const insurance = vm.costRows.find((row) => row.key === 'insurance');
    expect(insurance?.value).toBe('0\xa0€');
  });

  it('zeigt Summe nicht ohne bekannten Verbrauch', () => {
    const vm = toTcoViewModel(car({ consumptionKwh100: sourced(null) }), inputs);
    expect(vm.hasTotal).toBe(false);
    expect(vm.hint).toContain('Verbrauch unbekannt');
    expect(vm.costRows.find((row) => row.key === 'total')?.value).toBe('unbekannt');
  });

  it('lehnt negative und ungueltige Eingaben ab', () => {
    const vm = toTcoViewModel(car({ consumptionKwh100: sourced(18) }), {
      ...inputs,
      kmPerYear: '-5',
    });
    expect(vm.hasTotal).toBe(false);
    expect(vm.costRows).toEqual([]);
    expect(vm.hint).toContain('nicht negative Zahlen');
  });
});
