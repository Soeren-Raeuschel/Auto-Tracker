// The ONLY place that knows concrete classes. Everything else depends on interfaces.
import { BackupService } from '../application/backupService';
import { EventBus } from '../application/eventBus';
import type { Car } from '../domain/car';
import { CachingListRepository } from '../infrastructure/cachingListRepository';
import { JsonCarRepository } from '../infrastructure/jsonCarRepository';
import { LocalStorageSettingsRepository } from '../infrastructure/localStorageSettingsRepository';
import { LocalStorageUserStateRepository } from '../infrastructure/localStorageUserStateRepository';
import { ValidatingCarRepository } from '../infrastructure/validatingCarRepository';
import { AutoScout24Provider } from '../infrastructure/listings/autoScout24Provider';
import { KleinanzeigenProvider } from '../infrastructure/listings/kleinanzeigenProvider';
import { MobileDeProvider } from '../infrastructure/listings/mobileDeProvider';
import type { ListingSearchProvider } from '../ports/listingSearchProvider';
import type { ModelProvider } from '../ports/modelProvider';
import {
  FetchModelFileChecker,
  GenericModelProvider,
} from '../infrastructure/models/genericModelProvider';
import { SpecificModelProvider } from '../infrastructure/models/specificModelProvider';

import { defaultEvaluators } from '../scoring/evaluators';
import { ScoringEngine } from '../scoring/scoringEngine';
import { SuggestionService } from '../application/suggestionService';
import { defaultSettings } from './defaultSettings';

export function createContainer() {
  const settingsRepository = new LocalStorageSettingsRepository(
    window.localStorage,
    defaultSettings,
  );
  const userStateRepository = new LocalStorageUserStateRepository(window.localStorage);
  const eventBus = new EventBus();

  // Decorator chain: cache( validate( json ) )
  const carRepository = new CachingListRepository<Car>(
    new ValidatingCarRepository(new JsonCarRepository(`${import.meta.env.BASE_URL}data/cars.json`)),
  );

  return {
    carRepository,
    settingsRepository,
    userStateRepository,
    scoringEngine: new ScoringEngine(defaultEvaluators()),
    eventBus,
    backupService: new BackupService(settingsRepository, userStateRepository),
    suggestionService: new SuggestionService(eventBus),
    listingProviders: [
      new MobileDeProvider(),
      new AutoScout24Provider(),
      new KleinanzeigenProvider(),
    ] satisfies ListingSearchProvider[],
    // T5.4: bevorzugt GLB pro Auto (public/models/cars/<id>.glb), sonst
    // generisches Modell per bodyType aus public/models/<bodyType>.glb (T5.2).
    modelProvider: new SpecificModelProvider(
      import.meta.env.BASE_URL,
      new FetchModelFileChecker(),
      new GenericModelProvider(import.meta.env.BASE_URL, new FetchModelFileChecker()),
    ) satisfies ModelProvider,
  };
}

export type Container = ReturnType<typeof createContainer>;
