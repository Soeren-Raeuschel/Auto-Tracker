import { useMemo, useState } from 'react';
import type { Car } from '../../domain/car';
import { toTripViewModel, type TripPlannerVM } from './tripViewModel';

/** Hook der Ladestopps-Karte (T6.2): haelt die Distanz-Eingabe, rechnet rein im ViewModel. */
export function useTripViewModel(car: Car | null) {
  const [distanceInput, setDistanceInput] = useState('');
  const viewModel: TripPlannerVM | null = useMemo(
    () => (car ? toTripViewModel(car, distanceInput) : null),
    [car, distanceInput],
  );
  return { viewModel, distanceInput, setDistanceInput };
}
