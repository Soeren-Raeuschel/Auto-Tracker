import { useCallback, useEffect, useState } from 'react';
import type { EventBus } from '../../application/eventBus';
import type { CarStatus, UserCarState } from '../../domain/userState';
import type { UserStateRepository } from '../../ports/userStateRepository';
import { stateFor, withChecklistItem, withNotes, withStatus } from './userStateViewModel';

export interface UserStateDeps {
  userStateRepository: UserStateRepository;
  eventBus: EventBus;
}

/** ViewModel-Hook: laedt den UserState, jede Aenderung wird gespeichert und publiziert. */
export function useUserStateViewModel({ userStateRepository, eventBus }: UserStateDeps) {
  const [states, setStates] = useState<UserCarState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    userStateRepository
      .list()
      .then((loaded) => {
        if (active) setStates(loaded);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, [userStateRepository]);

  const persist = useCallback(
    async (next: UserCarState) => {
      try {
        await userStateRepository.save(next);
        setStates((current) => [...current.filter((s) => s.carId !== next.carId), next]);
        eventBus.publish({ type: 'UserStateChanged', carId: next.carId });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [userStateRepository, eventBus],
  );

  const changeStatus = useCallback(
    (carId: string, to: CarStatus) => {
      const current = stateFor(states, carId);
      const next = withStatus(current, to);
      if (next) void persist(next);
    },
    [states, persist],
  );

  const changeNotes = useCallback(
    (carId: string, notes: string) => {
      void persist(withNotes(stateFor(states, carId), notes));
    },
    [states, persist],
  );

  const changeChecklistItem = useCallback(
    (carId: string, key: string, checked: boolean) => {
      void persist(withChecklistItem(stateFor(states, carId), key, checked));
    },
    [states, persist],
  );

  return {
    states,
    error,
    stateFor: useCallback((carId: string) => stateFor(states, carId), [states]),
    changeStatus,
    changeNotes,
    changeChecklistItem,
    clearError: () => setError(null),
  };
}
