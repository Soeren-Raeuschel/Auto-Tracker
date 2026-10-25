import { useMemo, useState } from 'react';
import type { Car } from '../../domain/car';
import { EMPTY_TCO_INPUTS, toTcoViewModel, type TcoInputs, type TcoVM } from './tcoViewModel';

/** Hook der TCO-Karte (T6.3): haelt die Eingaben, rechnet rein im ViewModel. */
export function useTcoViewModel(car: Car | null) {
  const [inputs, setInputs] = useState<TcoInputs>(EMPTY_TCO_INPUTS);
  const viewModel: TcoVM | null = useMemo(
    () => (car ? toTcoViewModel(car, inputs) : null),
    [car, inputs],
  );
  const updateInput = (key: keyof TcoInputs, value: string) =>
    setInputs((prev) => ({ ...prev, [key]: value }));
  return { viewModel, inputs, updateInput };
}
