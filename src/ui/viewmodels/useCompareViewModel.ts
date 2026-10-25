import { useEffect, useMemo, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import { carLabel, type Car } from '../../domain/car';
import type { Settings } from '../../domain/settings';
import type { CarRepository } from '../../ports/carRepository';
import type { SettingsRepository } from '../../ports/settingsRepository';
import type { ScoringEngine } from '../../scoring/scoringEngine';
import {
  toCompareSelectionVM,
  toCompareViewModel,
  type CompareSlotVM,
  type CompareVM,
} from './compareViewModel';

export interface CompareDeps {
  carRepository: CarRepository;
  settingsRepository: SettingsRepository;
  scoringEngine: ScoringEngine;
  eventBus: EventBus;
}

const EMPTY: CompareVM = { columns: [], attributeRows: [], criteriaRows: [] };

/** ViewModel-Hook der Vergleichsseite (T3.3): laedt Daten, scoret die gewaehlten Autos. */
export function useCompareViewModel(
  { carRepository, settingsRepository, scoringEngine, eventBus }: CompareDeps,
  ids: string[],
) {
  const [cars, setCars] = useState<Car[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([carRepository.list(), settingsRepository.load()])
      .then(([loadedCars, loadedSettings]) => {
        if (!active) return;
        setCars(loadedCars);
        setSettings(loadedSettings);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    const unsubscribe = eventBus.subscribe('SettingsChanged', (event) =>
      setSettings(event.settings),
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [carRepository, settingsRepository, eventBus]);

  const byId = useMemo(() => new Map(cars.map((car) => [car.id, car])), [cars]);

  const viewModel = useMemo<CompareVM>(() => {
    if (!settings) return EMPTY;
    return toCompareViewModel(
      ids
        .map((id) => byId.get(id))
        .filter((car): car is Car => car !== undefined)
        .map((car) => scoringEngine.score(car, settings.criteria)),
      settings.criteria,
    );
  }, [ids, byId, settings, scoringEngine]);

  const selection = useMemo<CompareSlotVM[]>(
    () =>
      toCompareSelectionVM(
        cars.map((car) => ({ id: car.id, label: carLabel(car) })),
        ids,
      ),
    [cars, ids],
  );

  return { viewModel, selection, error, loading: settings === null && error === null };
}
