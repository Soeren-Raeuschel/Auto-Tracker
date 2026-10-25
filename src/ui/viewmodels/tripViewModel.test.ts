import { describe, expect, it } from 'vitest';
import type { Car } from '../../domain/car';
import { DEFAULT_TRIP_DISTANCE_KM, toTripViewModel } from './tripViewModel';

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

describe('toTripViewModel', () => {
  it('ist nicht verfuegbar ohne Reichweite', () => {
    const vm = toTripViewModel(car({ dcMaxKw: sourced(200) }), '');
    expect(vm.available).toBe(false);
    expect(vm.resultText).toBeNull();
    expect(vm.hint).toContain('Reichweite unbekannt');
  });

  it('nutzt die Beispielstrecke Kassel–Budapest als Standard', () => {
    const vm = toTripViewModel(
      car({ rangeKm: sourced(400), dcMaxKw: sourced(200), batteryKwh: sourced(80) }),
      '',
    );
    expect(vm.available).toBe(true);
    expect(vm.hint).toContain('Distanz vor Nutzung prüfen');
    // 1020 km mit 10 % Puffer: erster Abschnitt 240 km, Rest 780/240 -> 4 Stopps.
    expect(vm.resultText).toContain('4 Ladestopps');
    expect(vm.resultText).toContain('min Ladezeit');
  });

  it('rechnet mit eingegebener Distanz und erkennt gueltige Eingabe', () => {
    const vm = toTripViewModel(
      car({ rangeKm: sourced(400), dcMaxKw: sourced(200), batteryKwh: sourced(80) }),
      ' 235 ',
    );
    // Mit 10 % Puffer reicht der erste Abschnitt bis 240 km.
    expect(vm.resultText).toContain('Kein Ladestopp');
  });

  it('mahnt bei ungueltiger Eingabe', () => {
    const vm = toTripViewModel(car({ rangeKm: sourced(400) }), 'abc');
    expect(vm.resultText).toBeNull();
    expect(vm.hint).toContain('gültige Distanz');
  });

  it('nennt fehlende Zeit, wenn DC-Leistung fehlt', () => {
    const vm = toTripViewModel(car({ rangeKm: sourced(400), batteryKwh: sourced(80) }), '1500');
    expect(vm.resultText).toContain('Ladezeit unbekannt');
  });
});

// Der Standardwert ist Teil des Vertrags mit dem UI.
it('DEFAULT_TRIP_DISTANCE_KM ist die Kassel–Budapest-Naeherung', () => {
  expect(DEFAULT_TRIP_DISTANCE_KM).toBe(1020);
});
