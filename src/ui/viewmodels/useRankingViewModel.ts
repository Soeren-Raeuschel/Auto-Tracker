import { useEffect, useMemo, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import type { Car } from '../../domain/car';
import type { Settings } from '../../domain/settings';
import type { CarRepository } from '../../ports/carRepository';
import type { SettingsRepository } from '../../ports/settingsRepository';
import type { ScoringEngine } from '../../scoring/scoringEngine';
import { toRankingViewModel, type RankingVM } from './rankingViewModel';

export interface RankingDeps {
  carRepository: CarRepository;
  settingsRepository: SettingsRepository;
  scoringEngine: ScoringEngine;
  eventBus: EventBus;
}

const EMPTY: RankingVM = { hero: null, rest: [] };

/** ViewModel hook: loads data, reacts to settings changes, hands the view ready-made rows. */
export function useRankingViewModel({
  carRepository,
  settingsRepository,
  scoringEngine,
  eventBus,
}: RankingDeps) {
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

  const viewModel = useMemo<RankingVM>(
    () => (settings ? toRankingViewModel(scoringEngine.rank(cars, settings.criteria)) : EMPTY),
    [cars, settings, scoringEngine],
  );

  return { viewModel, error, loading: settings === null && error === null };
}
