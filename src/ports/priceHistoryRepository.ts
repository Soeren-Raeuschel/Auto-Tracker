/** Ein Preis-Schnappschuss an einem Tag (ISO-Datum, z. B. "2026-10-26"). */
export interface PricePoint {
  date: string;
  priceEur: number;
}

/** Preis-Historie pro Auto-ID, aufsteigend nach Datum sortiert. */
export type PriceHistory = Record<string, PricePoint[]>;

export interface PriceHistoryRepository {
  /** Fehlende Datei = leere Historie, die App bricht nie. */
  list(): Promise<PriceHistory>;
}
