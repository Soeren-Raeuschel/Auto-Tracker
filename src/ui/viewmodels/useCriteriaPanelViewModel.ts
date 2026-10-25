import { useEffect, useMemo, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import type { Settings } from '../../domain/settings';
import type { SettingsRepository } from '../../ports/settingsRepository';
import { withWeight } from './settingsViewModel';
import { toCriteriaSliderVMs, type CriteriaSliderVM } from './criteriaPanelViewModel';

export interface CriteriaPanelDeps {
  settingsRepository: SettingsRepository;
  eventBus: EventBus;
}

/** ViewModel-Hook: Gewichte aendern, jede Aenderung wird gespeichert und publiziert (Live-Sortierung). */
export function useCriteriaPanelViewModel({ settingsRepository, eventBus }: CriteriaPanelDeps) {
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
    const unsubscribe = eventBus.subscribe('SettingsChanged', (event) =>
      setSettings(event.settings),
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [settingsRepository, eventBus]);

  const setWeight = (id: string, weight: number) => {
    if (!settings) return;
    const next: Settings = {
      ...settings,
      criteria: withWeight(settings.criteria, id, weight),
    };
    Promise.resolve(settingsRepository.save(next))
      .then(() => {
        setSettings(next);
        eventBus.publish({ type: 'SettingsChanged', settings: next });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  };

  const sliders = useMemo<CriteriaSliderVM[]>(
    () => (settings ? toCriteriaSliderVMs(settings.criteria) : []),
    [settings],
  );

  return { sliders, error, setWeight };
}
