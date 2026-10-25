import { describe, expect, it } from 'vitest';
import { estimateChargingStops } from './tripPlanner';

const base = {
  rangeKm: 400,
  dcMaxKw: 100,
  usableFromPct: 10,
  usableToPct: 80,
};

describe('estimateChargingStops', () => {
  it('braucht keinen Stopp, wenn die Distanz in die erste Ladung passt', () => {
    // Erster Abschnitt: 400 km * (80 - 10) % = 280 km.
    const result = estimateChargingStops({ ...base, distanceKm: 280 });
    expect(result).toEqual({ chargingStops: 0, chargingTimeMin: 0 });
  });

  it('berechnet Stopps und Zeit aus dem nutzbaren SoC-Fenster', () => {
    // 800 km: erster Abschnitt 280 km, Rest 520 km / 280 km = 2 Stopps.
    // Zeit: 60 kWh * 0.7 = 42 kWh pro Stopp bei 60 kW im Mittel = 42 min.
    const result = estimateChargingStops({ ...base, distanceKm: 800 }, { batteryKwh: 60 });
    expect(result).toEqual({ chargingStops: 2, chargingTimeMin: Math.ceil(42 * 2) });
  });

  it('nutzt den Start-SoC als Annahme', () => {
    // Start bei 50 %: erster Abschnitt 400 * (50 - 10) % = 160 km.
    const result = estimateChargingStops({ ...base, distanceKm: 300 }, { startSocPct: 50 });
    expect(result?.chargingStops).toBe(1);
  });

  it('zieht die Sicherheitsreserve pro Abschnitt ab', () => {
    // Ohne Puffer: 800 km -> erster Abschnitt 280, Rest 520/280 -> 2 Stopps.
    expect(estimateChargingStops({ ...base, distanceKm: 800 })?.chargingStops).toBe(2);
    // Mit 10 % Puffer: Abschnitte 240 km, Rest 560/240 -> 3 Stopps.
    expect(
      estimateChargingStops({ ...base, distanceKm: 800 }, { bufferPct: 10 })?.chargingStops,
    ).toBe(3);
  });

  it('liefert keine Zeit ohne Batterie- oder DC-Daten', () => {
    expect(estimateChargingStops({ ...base, distanceKm: 800 })?.chargingTimeMin).toBeNull();
    expect(
      estimateChargingStops({ ...base, dcMaxKw: null, distanceKm: 800 }, { batteryKwh: 60 })
        ?.chargingTimeMin,
    ).toBeNull();
  });

  it('addiert den Overhead pro Stopp', () => {
    const result = estimateChargingStops(
      { ...base, distanceKm: 800 },
      { batteryKwh: 60, stopOverheadMin: 5 },
    );
    expect(result?.chargingTimeMin).toBe(Math.ceil((42 + 5) * 2));
  });

  it('gibt null bei unbekannter Reichweite zurück', () => {
    expect(estimateChargingStops({ ...base, rangeKm: null, distanceKm: 800 })).toBeNull();
  });

  it('gibt null bei ungültigen SoC-Grenzen zurück', () => {
    expect(
      estimateChargingStops({ ...base, distanceKm: 800, usableFromPct: 80, usableToPct: 80 }),
    ).toBeNull();
    expect(estimateChargingStops({ ...base, distanceKm: 800, usableToPct: 110 })).toBeNull();
    expect(estimateChargingStops({ ...base, distanceKm: 800, usableFromPct: -5 })).toBeNull();
    expect(estimateChargingStops({ ...base, distanceKm: 800 }, { startSocPct: 5 })).toBeNull();
  });
});
