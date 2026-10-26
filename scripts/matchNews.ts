// T7.2: Pipeline-Schritt — ordnet News aus news-raw.json Autos per Aliasen zu und
// schreibt public/data/news.json (nur Titel/Link/Quelle/Datum/carIds/Kurzfassung).
// Bei Fehler bleibt der letzte Stand (T11.3). Reine Logik in matchNewsLogic.ts.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PipelineStep } from './pipelineStep';
import type { RawNewsItem } from './fetchNewsLogic';
import { matchNews, type CarAlias } from './matchNewsLogic';

const root = fileURLToPath(new URL('..', import.meta.url));
const INPUT = `${root}public/data/news-raw.json`;
const ALIASES = `${root}scripts/aliases.json`;
const OUTPUT = `${root}public/data/news.json`;

export interface MatchNewsPaths {
  input?: string;
  aliases?: string;
  output?: string;
}

export class MatchNewsStep extends PipelineStep {
  readonly name = 'matchNews';

  // T12.3: Pfade injizierbar (Integrationstest mit temporaeren Dateien), Default wie bisher.
  constructor(paths: MatchNewsPaths = {}) {
    super();
    this.inputPath = paths.input ?? INPUT;
    this.aliasesPath = paths.aliases ?? ALIASES;
    this.outputPath = paths.output ?? OUTPUT;
  }

  private readonly inputPath: string;
  private readonly aliasesPath: string;
  private readonly outputPath: string;

  protected async execute(): Promise<void> {
    const [raw, aliases] = await Promise.all([
      readFile(this.inputPath, 'utf8'),
      readFile(this.aliasesPath, 'utf8'),
    ]);
    const items = matchNews(JSON.parse(raw) as RawNewsItem[], JSON.parse(aliases) as CarAlias[]);
    await writeFile(this.outputPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  }
}
