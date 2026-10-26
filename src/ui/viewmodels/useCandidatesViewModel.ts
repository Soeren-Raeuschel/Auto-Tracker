import { useCallback, useEffect, useState } from 'react';
import type { Car } from '../../domain/car';
import type { CarCandidate } from '../../domain/carCandidate';
import type { Container } from '../../composition/container';
import { createCarFromCandidate } from '../../application/carFactory';
import { mergeImported } from '../../application/importService';
import { candidateKey, type CandidatesVM } from './candidatesViewModel';
import { toCandidatesViewModel } from './candidatesViewModel';

/** ViewModel-Hook der Kandidaten-Freigabe (T7.5): laden, uebernehmen, verwerfen. */
export function useCandidatesViewModel(container: Container) {
  const { candidateRepository, candidateDecisionRepository, importedCarRepository } = container;
  const [candidates, setCandidates] = useState<CarCandidate[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([candidateRepository.list(), candidateDecisionRepository.listDismissed()])
      .then(([loaded, decided]) => {
        if (!active) return;
        setCandidates(loaded);
        setDismissed(decided);
        setError(null);
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
  }, [candidateRepository, candidateDecisionRepository]);

  const approve = useCallback(
    async (candidate: CarCandidate): Promise<void> => {
      // Ueber CarFactory (T11.1): Slug-ID, confidence ai-extracted, Provenance.
      const car: Car = createCarFromCandidate(candidate);
      const stored = await importedCarRepository.list();
      const { added, skipped } = mergeImported(stored, [car]);
      await importedCarRepository.save([...stored, ...added]);
      await candidateDecisionRepository.dismiss(car.id);
      setDismissed((previous) => (previous.includes(car.id) ? previous : [...previous, car.id]));
      setMessage(
        skipped.length > 0
          ? 'Auto existiert bereits — Kandidat geschlossen.'
          : `${car.id} übernommen — jetzt im Ranking sichtbar.`,
      );
    },
    [importedCarRepository, candidateDecisionRepository],
  );

  const dismiss = useCallback(
    async (candidate: CarCandidate): Promise<void> => {
      const id = candidateKey(candidate);
      await candidateDecisionRepository.dismiss(id);
      setDismissed((previous) => (previous.includes(id) ? previous : [...previous, id]));
    },
    [candidateDecisionRepository],
  );

  const viewModel: CandidatesVM = toCandidatesViewModel(candidates, dismissed);

  return { viewModel, loading, error, message, approve, dismiss };
}
