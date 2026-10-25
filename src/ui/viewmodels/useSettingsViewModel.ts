import { useEffect, useMemo, useState } from 'react';
import type { BackupService } from '../../application/backupService';
import type { EventBus } from '../../application/eventBus';
import { attributeCatalog } from '../../domain/attributeCatalog';
import type { Criterion } from '../../domain/criterion';
import type { Settings } from '../../domain/settings';
import type { SettingsRepository } from '../../ports/settingsRepository';
import {
  availableAttributes,
  createCriterion,
  removeCriterion,
  withKnockout,
  withNumberBounds,
  withWeight,
} from './settingsViewModel';

export interface SettingsDeps {
  settingsRepository: SettingsRepository;
  eventBus: EventBus;
  backupService: BackupService;
}

/** ViewModel-Hook: laedt die Einstellungen, jede Aenderung wird gespeichert und publiziert. */
export function useSettingsViewModel({
  settingsRepository,
  eventBus,
  backupService,
}: SettingsDeps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    settingsRepository
      .load()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, [settingsRepository]);

  const persist = async (criteria: Criterion[], threshold?: number) => {
    const next: Settings = {
      ...(settings as Settings),
      criteria,
      ...(threshold !== undefined ? { suggestionThreshold: threshold } : {}),
    };
    try {
      await settingsRepository.save(next);
      setSettings(next);
      eventBus.publish({ type: 'SettingsChanged', settings: next });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const add = (attributeKey: string) => {
    if (!settings) return;
    const attribute = attributeCatalog.find((a) => a.key === attributeKey);
    if (!attribute) return;
    const criterion = createCriterion(attribute, settings.criteria);
    if (criterion) void persist([...settings.criteria, criterion]);
  };

  const update = (criteria: Criterion[]) => {
    if (settings) void persist(criteria);
  };

  const remove = (id: string) => {
    if (settings) void persist(removeCriterion(settings.criteria, id));
  };

  /** Schwellwert fuer Vorschlaege (T4.2), geklemmt auf 0-100. */
  const setThreshold = (threshold: number) => {
    if (!settings) return;
    const clamped = Math.max(0, Math.min(100, Math.round(threshold)));
    void persist(settings.criteria, clamped);
  };

  const exportBackup = () => backupService.exportJson();
  const importBackup = async (json: string) => {
    try {
      await backupService.importJson(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
    setSettings(await settingsRepository.load());
    return true;
  };

  const available = useMemo(
    () => (settings ? availableAttributes(attributeCatalog, settings.criteria) : []),
    [settings],
  );

  return {
    settings,
    error,
    available,
    add,
    remove,
    update,
    withWeight,
    withKnockout,
    withNumberBounds,
    setThreshold,
    exportBackup,
    importBackup,
    clearError: () => setError(null),
  };
}
