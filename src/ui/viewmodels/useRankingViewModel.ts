import { useEffect, useMemo, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import type { Car } from '../../domain/car';
import type { Settings } from '../../domain/settings';
import type { UserCarState } from '../../domain/userState';
import type { CarRepository } from '../../ports/carRepository';
import type { SettingsRepository } from '../../ports/settingsRepository';
import type { UserStateRepository } from '../../ports/userStateRepository';
import type { ScoringEngine } from '../../scoring/scoringEngine';
import {
  toRankingViewModel,
  applyRankingFilters,
  DEFAULT_RANKING_FILTERS,
  type RankingFilters,
  type RankingVM,
} from './rankingViewModel';

export interface RankingDeps {
  carRepository: CarRepository;
  settingsRepository: SettingsRepository;
  userStateRepository: UserStateRepository;
  scoringEngine: ScoringEngine;
  eventBus: EventBus;
}

const EMPTY: RankingVM = { hero: null, rest: [] };

/** ViewModel hook: loads data, reacts to settings/user-state changes, hands the view ready-made rows. */
export function useRankingViewModel({
  carRepository,
  settingsRepository,
  userStateRepository,
  scoringEngine,
  eventBus,
}: RankingDeps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [states, setStates] = useState<UserCarState[]>([]);
  const [filters, setFilters] = useState<RankingFilters>(DEFAULT_RANKING_FILTERS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([carRepository.list(), settingsRepository.load(), userStateRepository.list()])
      .then(([loadedCars, loadedSettings, loadedStates]) => {
        if (!active) return;
        setCars(loadedCars);
        setSettings(loadedSettings);
        setStates(loadedStates);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    const unsubscribeSettings = eventBus.subscribe('SettingsChanged', (event) =>
      setSettings(event.settings),
    );
    const unsubscribeUserState = eventBus.subscribe('UserStateChanged', (event) => {
      userStateRepository
        .list()
        .then((loaded) => {
          if (active) setStates(loaded);
        })
        .catch(() => {
          /* keep last known states */
        });
      void event;
    });
    return () => {
      active = false;
      unsubscribeSettings();
      unsubscribeUserState();
    };
  }, [carRepository, settingsRepository, userStateRepository, eventBus]);

  const viewModel = useMemo<RankingVM>(() => {
    if (!settings) return EMPTY;
    const ranking = scoringEngine.rank(cars, settings.criteria);
    const filtered = applyRankingFilters(ranking, states, filters);
    return toRankingViewModel(filtered, settings.criteria);
  }, [cars, settings, states, filters, scoringEngine]);

  const updateFilters = (next: Partial<RankingFilters>) =>
    setFilters((current) => ({ ...current, ...next }));

  return { viewModel, filters, updateFilters, error, loading: settings === null && error === null };
}
