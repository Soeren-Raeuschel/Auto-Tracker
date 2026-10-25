import type { PageFetcher } from '../../ports/pageFetcher';

/**
 * Laedt den Text einer Website über den Lese-Proxy r.jina.ai (kostenlos,
 * setzt CORS-Header). Der Browser darf fremde Seiten nicht direkt abfragen.
 */
export const CORS_PROXY = 'https://r.jina.ai/';

const MAX_PAGE_CHARS = 60_000;
const TIMEOUT_MS = 30_000;

export function createBrowserPageFetcher(fetchFn: typeof fetch = fetch): PageFetcher {
  return {
    async fetchPageText(url: string): Promise<string> {
      let response: Response;
      try {
        response = await fetchFn(`${CORS_PROXY}${url}`, {
          headers: { Accept: 'text/plain' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        throw new Error(`Seite konnte nicht geladen werden: ${url}`);
      }
      if (!response.ok) {
        throw new Error(`Seite nicht erreichbar (HTTP ${response.status}): ${url}`);
      }
      const text = (await response.text()).slice(0, MAX_PAGE_CHARS).trim();
      if (text.length === 0) {
        throw new Error('Seite enthält keinen auswertbaren Text (vermutlich JavaScript-Rendite).');
      }
      return text;
    },
  };
}
