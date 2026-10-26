// T7.1: Pipeline-Schritt — holt die Feeds aus sources.json, dedupliziert und
// schreibt public/data/news-raw.json. Bei Fehler bleibt der letzte Stand (T11.3).
// Reine Logik in fetchNewsLogic.ts, hier nur Node I/O und der Template-Hook.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PipelineStep } from './pipelineStep';
import { collectNews, type SourceFeed } from './fetchNewsLogic';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCES = `${root}scripts/sources.json`;
const OUTPUT = `${root}public/data/news-raw.json`;

export class FetchNewsStep extends PipelineStep {
  readonly name = 'fetchNews';

  constructor(
    // T12.3: Test-Feeds ueber Fake-fetch und Pfade injizierbar, Default wie bisher.
    private readonly fetchLike: (url: string) => Promise<Response> = (url) => fetch(url),
    private readonly sourcesPath: string = SOURCES,
    private readonly outputPath: string = OUTPUT,
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    const sources = JSON.parse(await readFile(this.sourcesPath, 'utf8')) as {
      feeds: SourceFeed[];
    };
    const items = await collectNews(sources.feeds, this.fetchLike);
    await writeFile(this.outputPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  }
}
