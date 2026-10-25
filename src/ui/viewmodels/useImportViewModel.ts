import { useCallback, useEffect, useState } from 'react';
import type { Car } from '../../domain/car';
import type { ApiKeyRepository } from '../../ports/apiKeyRepository';
import type { CarExtractor } from '../../ports/carExtractor';
import type { CarRepository } from '../../ports/carRepository';
import type { ImportedCarRepository } from '../../ports/importedCarRepository';
import type { PageFetcher } from '../../ports/pageFetcher';
import {
  buildCarsJsonExport,
  mergeImported,
  toImportableCars,
} from '../../application/importService';
import { toCarPreviewVM, type CarPreviewVM } from './importViewModel';

export interface ImportDeps {
  carExtractor: CarExtractor;
  pageFetcher: PageFetcher;
  apiKeyRepository: ApiKeyRepository;
  carRepository: CarRepository;
  importedCarRepository: ImportedCarRepository;
}

export type ImportStatus = 'idle' | 'fetching' | 'extracting' | 'ready' | 'error';

export interface ImportedCarVM {
  label: string;
  id: string;
}

export function useImportViewModel(deps: ImportDeps) {
  const { carExtractor, pageFetcher, apiKeyRepository, carRepository, importedCarRepository } =
    deps;
  const [url, setUrl] = useState('');
  const [apiKey, setApiKeyInput] = useState(apiKeyRepository.get() ?? '');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<CarPreviewVM[]>([]);
  const [pending, setPending] = useState<Car[]>([]);
  const [imported, setImported] = useState<Car[]>([]);
  const [baseCount, setBaseCount] = useState(0);

  const refresh = useCallback(async () => {
    const [stored, all] = await Promise.all([importedCarRepository.list(), carRepository.list()]);
    setImported(stored);
    setBaseCount(all.length);
  }, [carRepository, importedCarRepository]);

  useEffect(() => {
    refresh().catch(() => setError('Importierte Autos konnten nicht geladen werden.'));
  }, [refresh]);

  const saveApiKey = useCallback(() => {
    apiKeyRepository.set(apiKey);
  }, [apiKey, apiKeyRepository]);

  const analyze = useCallback(async () => {
    const trimmed = url.trim();
    if (trimmed === '') {
      setError('Bitte eine URL eingeben.');
      setStatus('error');
      return;
    }
    setError(null);
    setStatus('fetching');
    try {
      const pageText = await pageFetcher.fetchPageText(trimmed);
      setStatus('extracting');
      const candidates = await carExtractor.extract(pageText, trimmed);
      const cars = toImportableCars(candidates);
      setPending(cars);
      setPreviews(cars.map(toCarPreviewVM));
      setStatus('ready');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler beim Import.');
      setStatus('error');
    }
  }, [carExtractor, pageFetcher, url]);

  const addToGarage = useCallback(async () => {
    const stored = await importedCarRepository.list();
    const { added, skipped } = mergeImported(stored, pending);
    await importedCarRepository.save([...stored, ...added]);
    setPending([]);
    setPreviews([]);
    setStatus('idle');
    await refresh();
    return { added: added.length, skipped: skipped.length };
  }, [importedCarRepository, pending, refresh]);

  const removeImported = useCallback(
    async (id: string) => {
      const stored = await importedCarRepository.list();
      await importedCarRepository.save(stored.filter((car) => car.id !== id));
      await refresh();
    },
    [importedCarRepository, refresh],
  );

  const buildExport = useCallback(async () => {
    const [base] = await Promise.all([carRepository.list()]);
    return buildCarsJsonExport(base, imported);
  }, [carRepository, imported]);

  const importedVMs: ImportedCarVM[] = imported.map((car) => ({
    label: [car.brand, car.model, car.variant].filter(Boolean).join(' '),
    id: car.id,
  }));

  return {
    url,
    setUrl,
    apiKey,
    setApiKey: setApiKeyInput,
    saveApiKey,
    status,
    error,
    previews,
    pending,
    importedVMs,
    baseCount,
    analyze,
    addToGarage,
    removeImported,
    buildExport,
  };
}
