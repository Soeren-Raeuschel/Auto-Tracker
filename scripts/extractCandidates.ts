// T7.4: Pipeline-Schritt — schickt nur NEUE Artikel (Cache processed-ids.json)
// an Groq, validiert die Antworten und haengt Kandidaten an candidates.json an.
// Bei Fehler bleibt der letzte Stand (T11.3). Reine Logik in groqCarExtractor.ts.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PipelineStep } from './pipelineStep';
import type { RawNewsItem } from './fetchNewsLogic';
import type { CarCandidate } from '../src/domain/carCandidate';
import {
  callGroq,
  mergeCandidates,
  validateCandidates,
  type GroqCall,
} from './groqCarExtractor';

const root = fileURLToPath(new URL('..', import.meta.url));
const NEWS = `${root}public/data/news-raw.json`;
const PROCESSED = `${root}public/data/processed-ids.json`;
const OUTPUT = `${root}public/data/candidates.json`;

// T12.3: Pfade injizierbar (Integrationstest mit temporaeren Dateien), Default wie bisher.
export interface ExtractPaths {
  news?: string;
  processed?: string;
  output?: string;
}

export class ExtractCandidatesStep extends PipelineStep {
  readonly name = 'extractCandidates';

  private readonly call: GroqCall;
  private readonly newsPath: string;
  private readonly processedPath: string;
  private readonly outputPath: string;

  constructor(call?: GroqCall, paths: ExtractPaths = {}) {
    super();
    this.newsPath = paths.news ?? NEWS;
    this.processedPath = paths.processed ?? PROCESSED;
    this.outputPath = paths.output ?? OUTPUT;
    this.call = call ?? {
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      fetchFn: (url, init) => fetch(url, init),
    };
  }

  protected async execute(): Promise<void> {
    if (this.call.apiKey === '') {
      throw new Error('GROQ_API_KEY ist nicht gesetzt (env).');
    }
    const news = JSON.parse(await readFile(this.newsPath, 'utf8')) as RawNewsItem[];
    let processed: string[] = [];
    try {
      processed = JSON.parse(await readFile(this.processedPath, 'utf8')) as string[];
    } catch {
      // Cache fehlt (erster Lauf) — alle Artikel gelten als neu.
    }
    const processedSet = new Set(processed);
    const fresh = news.filter((item) => !processedSet.has(item.id));
    const existing = await this.readCandidates();
    let candidates = existing;
    for (const item of fresh) {
      try {
        const extracted = await callGroq(item.title, item.url, this.call);
        const valid = validateCandidates(extracted, (message) => {
          console.error(`Ungueltige Groq-Antwort verworfen (${item.id}): ${message}`);  
        });
        candidates = mergeCandidates(candidates, valid);
        processedSet.add(item.id); // Erfolg: nie erneut schicken
      } catch (error) {
        // Artikel bleibt unverarbeitet und wird beim naechsten Lauf erneut versucht.
        console.error(`Groq-Aufruf fehlgeschlagen (${item.id}), wird wiederholt:`, error);  
      }
    }
    await writeFile(this.outputPath, `${JSON.stringify(candidates, null, 2)}\n`, 'utf8');
    await writeFile(this.processedPath, `${JSON.stringify([...processedSet], null, 2)}\n`, 'utf8');
  }

  private async readCandidates(): Promise<CarCandidate[]> {
    try {
      return JSON.parse(await readFile(this.outputPath, 'utf8')) as CarCandidate[];
    } catch {
      return []; // Datei existiert noch nicht (erster Lauf).
    }
  }
}
