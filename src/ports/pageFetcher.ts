/** Loads the readable text of a web page (e.g. via a CORS proxy in the browser). */
export interface PageFetcher {
  fetchPageText(url: string): Promise<string>;
}
