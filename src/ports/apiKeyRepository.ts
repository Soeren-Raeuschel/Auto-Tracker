/** Stores a secret API key (e.g. Groq) in the browser. Never hardcode keys. */
export interface ApiKeyRepository {
  get(): string | null;
  set(key: string): void;
}
