import { useEffect, useMemo, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import type { SuggestionService } from '../../application/suggestionService';
import { carLabel, type Car } from '../../domain/car';
import type { Settings } from '../../domain/settings';
import type { UserCarState } from '../../domain/userState';
import type { CarRepository } from '../../ports/carRepository';
import type { SettingsRepository } from '../../ports/settingsRepository';
import type { UserStateRepository } from '../../ports/userStateRepository';
import type { ScoringEngine } from '../../scoring/scoringEngine';
import { toSuggestionsViewModel, type SuggestionsVM } from './suggestionViewModel';

export interface SuggestionDeps {
  carRepository: CarRepository;
  settingsRepository: SettingsRepository;
  userStateRepository: UserStateRepository;
  scoringEngine: ScoringEngine;
  eventBus: EventBus;
  suggestionService: SuggestionService;
}

/**
 * ViewModel-Hook fuer den Vorschlags-Block auf `/` (T4.2): scoret die Autos wie
 * das Ranking, filtert per SuggestionService-Logik und publiziert dabei
 * `NewCarSuggested` fuer Neuzugaenge.
 */
export function useSuggestionViewModel(deps: SuggestionDeps) {
  const {
    carRepository,
    settingsRepository,
    userStateRepository,
    scoringEngine,
    eventBus,
    suggestionService,
  } = deps;
  const [cars, setCars] = useState<Car[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [states, setStates] = useState<UserCarState[]>([]);
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
    const unsubscribeUserState = eventBus.subscribe('UserStateChanged', () => {
      userStateRepository
        .list()
        .then((loaded) => {
          if (active) setStates(loaded);
        })
        .catch(() => {
          /* keep last known states */
        });
    });
    return () => {
      active = false;
      unsubscribeSettings();
      unsubscribeUserState();
    };
  }, [carRepository, settingsRepository, userStateRepository, eventBus]);

  const viewModel = useMemo<SuggestionsVM | null>(() => {
    if (!settings) return null;
    const ranking = scoringEngine.rank(cars, settings.criteria);
    suggestionService.sync(ranking, states, settings);
    return toSuggestionsViewModel(ranking, states, settings, (id) => {
      const car = cars.find((c) => c.id === id);
      return car ? carLabel(car) : id;
    });
  }, [cars, settings, states, scoringEngine, suggestionService]);

  return { viewModel, error };
}
