/** Lokale Entscheidungen zu Kandidaten (uebernommen/verworfen), client-only. */
export interface CandidateDecisionRepository {
  listDismissed(): Promise<string[]>;
  dismiss(candidateId: string): Promise<void>;
}
