// The ONLY place that knows concrete classes. Everything else depends on interfaces.
import { BackupService } from '../application/backupService';
import { EventBus } from '../application/eventBus';
import type { Car } from '../domain/car';
import type { CarCandidate } from '../domain/carCandidate';
import type { NewsItem } from '../domain/news';
import { CachingListRepository } from '../infrastructure/cachingListRepository';
import { JsonCarRepository } from '../infrastructure/jsonCarRepository';
import { JsonNewsRepository } from '../infrastructure/jsonNewsRepository';
import { JsonCandidateRepository } from '../infrastructure/jsonCandidateRepository';
import { LocalStorageCandidateDecisionRepository } from '../infrastructure/localStorageCandidateDecisionRepository';
import { LocalStorageSettingsRepository } from '../infrastructure/localStorageSettingsRepository';
import { LocalStorageUserStateRepository } from '../infrastructure/localStorageUserStateRepository';
import type { NewsRepository } from '../ports/newsRepository';
import { JsonPriceHistoryRepository } from '../infrastructure/jsonPriceHistoryRepository';
import { ValidatingCarRepository } from '../infrastructure/validatingCarRepository';
import { ValidatingListRepository } from '../infrastructure/validatingListRepository';
import { LocalStorageApiKeyRepository } from '../infrastructure/localStorageApiKeyRepository';
import { LocalStorageImportedCarsRepository } from '../infrastructure/localStorageImportedCarsRepository';
import { MergedCarRepository } from '../infrastructure/mergedCarRepository';
import { createBrowserPageFetcher } from '../infrastructure/extraction/pageFetcher';
import { GroqCarExtractor } from '../infrastructure/extraction/groqCarExtractor';
import { AutoScout24Provider } from '../infrastructure/listings/autoScout24Provider';
import { KleinanzeigenProvider } from '../infrastructure/listings/kleinanzeigenProvider';
import { MobileDeProvider } from '../infrastructure/listings/mobileDeProvider';
import type { CandidateRepository } from '../ports/candidateRepository';
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
import { carCandidateSchema, newsItemSchema } from '../validation/schemas';
import { defaultSettings } from './defaultSettings';

export function createContainer() {
  const settingsRepository = new LocalStorageSettingsRepository(
    window.localStorage,
    defaultSettings,
  );
  const userStateRepository = new LocalStorageUserStateRepository(window.localStorage);
  const eventBus = new EventBus();
  const apiKeyRepository = new LocalStorageApiKeyRepository(window.localStorage);
  const importedCarRepository = new LocalStorageImportedCarsRepository(window.localStorage);

  // Decorator chain: cache( validate( merge( json, imported ) ) )
  const carRepository = new CachingListRepository<Car>(
    new ValidatingCarRepository(
      new MergedCarRepository(
        new JsonCarRepository(`${import.meta.env.BASE_URL}data/cars.json`),
        importedCarRepository,
      ),
    ),
  );

  // News (T7.3): Decorator-Kette cache(validate(json)); fehlende Datei = leere Liste.
  const jsonNewsRepository = new JsonNewsRepository(`${import.meta.env.BASE_URL}data/news.json`);
  const newsRepository: NewsRepository = new CachingListRepository<NewsItem>(
    new ValidatingListRepository<NewsItem>(jsonNewsRepository, newsItemSchema),
  );

  // KI-Kandidaten (T7.5): gleiche Decorator-Kette, plus lokale Entscheidungen.
  const candidateRepository: CandidateRepository = new CachingListRepository<CarCandidate>(
    new ValidatingListRepository<CarCandidate>(
      new JsonCandidateRepository(`${import.meta.env.BASE_URL}data/candidates.json`),
      carCandidateSchema,
    ),
  );
  const candidateDecisionRepository = new LocalStorageCandidateDecisionRepository(
    window.localStorage,
  );

  return {
    carRepository,
    newsRepository,
    candidateRepository,
    newsUpdatedAt: () => jsonNewsRepository.getUpdatedAt(),
    // Preis-Historie (T7.6): public/data/price-history.json, fehlende Datei = leer.
    priceHistoryRepository: new JsonPriceHistoryRepository(
      `${import.meta.env.BASE_URL}data/price-history.json`,
    ),
    candidateDecisionRepository,
    settingsRepository,
    userStateRepository,
    scoringEngine: new ScoringEngine(defaultEvaluators()),
    eventBus,
    backupService: new BackupService(settingsRepository, userStateRepository),
    suggestionService: new SuggestionService(eventBus),
    // URL-Import: Seite laden (Proxy) + per Groq extrahieren.
    apiKeyRepository,
    importedCarRepository,
    pageFetcher: createBrowserPageFetcher(),
    carExtractor: new GroqCarExtractor({ apiKeyRepository }),
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
