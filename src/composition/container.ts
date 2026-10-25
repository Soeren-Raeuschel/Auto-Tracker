// The ONLY place that knows concrete classes. Everything else depends on interfaces.
import { BackupService } from '../application/backupService';
import { EventBus } from '../application/eventBus';
import type { Car } from '../domain/car';
import { CachingListRepository } from '../infrastructure/cachingListRepository';
import { JsonCarRepository } from '../infrastructure/jsonCarRepository';
import { LocalStorageSettingsRepository } from '../infrastructure/localStorageSettingsRepository';
import { LocalStorageUserStateRepository } from '../infrastructure/localStorageUserStateRepository';
import { ValidatingCarRepository } from '../infrastructure/validatingCarRepository';
import { defaultEvaluators } from '../scoring/evaluators';
import { ScoringEngine } from '../scoring/scoringEngine';
import { defaultSettings } from './defaultSettings';

export function createContainer() {
  const settingsRepository = new LocalStorageSettingsRepository(
    window.localStorage,
    defaultSettings,
  );
  const userStateRepository = new LocalStorageUserStateRepository(window.localStorage);

  // Decorator chain: cache( validate( json ) )
  const carRepository = new CachingListRepository<Car>(
    new ValidatingCarRepository(new JsonCarRepository(`${import.meta.env.BASE_URL}data/cars.json`)),
  );

  return {
    carRepository,
    settingsRepository,
    userStateRepository,
    scoringEngine: new ScoringEngine(defaultEvaluators()),
    eventBus: new EventBus(),
    backupService: new BackupService(settingsRepository, userStateRepository),
  };
}

export type Container = ReturnType<typeof createContainer>;
