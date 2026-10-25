import { useEffect, useMemo, useState } from 'react';
import type { Car } from '../../domain/car';
import type { Container } from '../../composition/container';
import { useUserStateViewModel } from './useUserStateViewModel';
import { toCarDetailViewModel, type CarDetailVM } from './carDetailViewModel';

/** ViewModel-Hook der Detailseite (T3.2): laedt das Auto und den UserState dazu. */
export function useCarDetailViewModel(container: Container, id: string | undefined) {
  const { carRepository } = container;
  const userState = useUserStateViewModel(container);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    carRepository
      .list()
      .then((cars) => {
        if (!active) return;
        setCar(cars.find((candidate) => candidate.id === id) ?? null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [carRepository, id]);

  const current = useMemo(() => (car ? userState.stateFor(car.id) : null), [car, userState]);
  const viewModel: CarDetailVM | null = useMemo(
    () =>
      car && current
        ? toCarDetailViewModel(car, {
            status: current.status,
            notes: current.notes,
            checklist: current.checklist,
          })
        : null,
    [car, current],
  );

  return {
    viewModel,
    loading: loading && !error,
    error: error ?? userState.error,
    changeStatus: userState.changeStatus,
    changeNotes: userState.changeNotes,
    changeChecklistItem: userState.changeChecklistItem,
  };
}
