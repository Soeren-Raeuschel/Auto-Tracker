# Muster-Zuordnung (Vorlesung 02, Design Patterns / OO-Patterns)

Ablage im Projekt: `docs/PATTERNS.md`. Ergänzt `docs/SPEC.md`, `docs/TASKS.md`, `docs/DESIGN.md`.
Quelle: Folien "Design Patterns - Object-Oriented Patterns" (131 Seiten). Die Folien nutzen Kotlin, das Projekt TypeScript. Die Muster sind 1:1 übertragbar. Kotlin-Mittel (`object`, `data class`, `companion object`, Scope-Funktionen) werden durch TS-Mittel ersetzt (Modul, Interface/Typ, Objekt-Literal, Spread).

## Regeln für Cline
- Ein Muster nur einsetzen, wenn es ein konkretes Problem löst (KISS). Kein Muster "auf Vorrat".
- Im Klassenkommentar eine Zeile: `Pattern: Decorator (Vorlesung 02, S. 70)`.
- Decorator, Adapter und Proxy halten den Vertrag des Interfaces ein (Liskov Substitution, Folien 10 bis 11).
- Anti-Patterns laut Folien vermeiden: Singleton als globaler Zugriffspunkt, Polling statt Observer, direkte Abhängigkeit einer hohen auf eine niedrige Ebene (Folie 92, Dependency Inversion).

## Zuordnung
| Muster (Folien) | Einsatz im Projekt | Status |
|---|---|---|
| Strategy (117-122) | `CriterionEvaluator` pro Kriterientyp; Sortier-/Filterstrategien im Ranking als einfache Funktionen (Lambda, Folie 122) | vorhanden |
| Dependency Injection, IoC, DIP (22-27) | Konstruktor-Injektion, konkrete Klassen nur in `composition/container.ts` | vorhanden |
| Factory Method (6-13) | `CarFactory`: Kandidat -> `Car` (ID, Defaults, confidence) an genau einer Stelle | erledigt (T11.1) |
| Template-Hook (14-15) | `PipelineStep`: fester Ablauf (laden, `execute()`, Fehler, Log, schreiben), Hook `execute()` | T11.3 |
| Decorator (69-73) | Repositories kombinierbar: `ValidatingCarRepository` (Zod), `CachingRepository`, optional Logging | erledigt (T11.2) |
| Adapter (63-68) | News-Feeds -> `NewsItem`, `GroqCarExtractor`, Portale -> Such-Link (Objekt-Adapter per Delegation) | Ports vorhanden |
| Proxy (78-80) | Cache- oder Lazy-Zugriff, z. B. 3D-Modelle erst bei Bedarf laden | optional (T5) |
| Observer (91-95) | Änderungen an Einstellungen/Status/Daten melden; Event-Objekte wie auf Folie 95 (`ChangeEvent`) | erledigt (T11.5) |
| MVVM (Zusatz, nicht aus den Folien) | ViewModel pro Seite in `src/ui/viewmodels/`: reine Funktion + Hook, View rendert nur | vorhanden (Ranking) |
| State, tabellengesteuert (123-131) | Statuswechsel von `CarStatus` als Tabelle statt Klassenhaufen (Alternative von Folie 129, wegen der Nachteile auf Folie 127) | erledigt (T11.4) |
| Prototype (55-58) | Kopieren statt Mutieren: `structuredClone` oder Spread bei Einstellungsänderungen | Regel |
| Builder (29-45) | Nicht nötig, TS-Objekt-Literale mit optionalen Feldern genügen. Nur für Tests: `makeCar(overrides)` | Tests |
| Singleton (46-54) | NICHT verwenden. Genau eine Instanz entsteht im Container (DI), das ist testbar und frei von Thread-Problemen (Folie 50) | Verbot |
| Abstract Factory (16-21) | Nur bei Wechsel auf ein Backend (Familie von Repositories). Bis dahin reicht der Container | später |
| Composite (74-77) | Optional: Kriteriengruppen (z. B. "Komfort" = HUD + Massage + Pano), Gruppe ist selbst ein Kriterium | später |
| Command (97-103) | Optional: Undo/Redo für Kriterien und Status (`execute`/`undo`) | später |
| Visitor (104-116) | Nicht nötig: Discriminated Unions mit `kind` und die Evaluator-Map ersetzen ihn | nicht nötig |
| Flyweight (81-88) | Nicht nötig (three.js teilt Geometrien bereits) | nicht nötig |

## Konkrete Vorgaben

**Repository-Decorators (statt Zod im JsonCarRepository)**
```ts
// Pattern: Decorator (Vorlesung 02, S. 70)
export class ValidatingCarRepository implements CarRepository {
  constructor(private readonly inner: CarRepository) {}
  async list(): Promise<Car[]> {
    const cars = await this.inner.list();
    return cars.filter(isValidCar); // invalid entries are skipped and logged
  }
}
// container.ts: new ValidatingCarRepository(new JsonCarRepository(url))
```

**PipelineStep (Template-Hook)**
```ts
// Pattern: Template-Hook (Vorlesung 02, S. 14)
export abstract class PipelineStep {
  abstract readonly name: string;
  protected abstract execute(): Promise<void>; // hook
  async run(): Promise<boolean> {              // template
    const start = Date.now();
    try {
      await this.execute();
      console.log(`${this.name} ok (${Date.now() - start} ms)`);
      return true;
    } catch (error) {
      console.error(`${this.name} failed, keeping last data`, error);
      return false;
    }
  }
}
```

**Statuswechsel tabellengesteuert**
```ts
export const allowedTransitions: Record<CarStatus, CarStatus[]> = {
  watching: ['interested', 'rejected'],
  interested: ['test-drive-planned', 'watching', 'rejected'],
  'test-drive-planned': ['interested', 'rejected'],
  rejected: ['watching'],
};
```

**Observer / Events**: typisierter `EventBus` mit `subscribe(type, handler)` und `publish(event)`; Events sind kleine Objekte (z. B. `SettingsChanged`, `NewCarSuggested`). Komponenten abonnieren, sie rufen sich nicht gegenseitig auf.

## Neue Aufgaben für `docs/TASKS.md` (Abschnitt T11)
- [x] T11.1 `src/application/carFactory.ts`: `createCarFromCandidate(candidate): Car` (Slug-ID, confidence "ai-extracted" setzen, fehlende Werte `null`) mit Test. Vor T7.5.
- [x] T11.2 Repository-Decorators: `ValidatingCarRepository` (nutzt die Schemas aus T9.2) und generischer `CachingRepository`. Im Container verketten. Validierung dadurch NICHT in `JsonCarRepository` einbauen (T9.2 entsprechend umsetzen).
- [ ] T11.3 `scripts/pipelineStep.ts` (siehe oben), alle Pipeline-Schritte aus T7 erben davon. Vor T7.1.
- [x] T11.4 `src/domain/statusTransitions.ts` mit Tabelle und Funktion `canTransition(from, to)`, Test. Genutzt in T3.1.
- [x] T11.5 `src/application/eventBus.ts` (typisiert, mit Test); Settings-/Status-Änderungen publizieren Events, T4.1 und T7.7 nutzen sie.
- [ ] T11.6 Optional: Command-Muster für Undo/Redo bei Kriterien-Änderungen (nur auf ausdrücklichen Wunsch).

## Hinweis
Die folgenden Regeln stehen bereits in `.clinerules`. Umsetzung: `ValidatingCarRepository` und `CachingListRepository` in `src/infrastructure/`, `EventBus` und `createCarFromCandidate` in `src/application/`, `canTransition` in `src/domain/statusTransitions.ts`.

## Zusatz für `.clinerules` (bereits übernommen)
```
## Muster
- Siehe docs/PATTERNS.md. Singleton nicht verwenden, Instanzen entstehen nur in composition/container.ts.
- Cross-cutting (Validierung, Cache, Logging) als Decorator um ein Repository, nicht in die Implementierung einbauen.
- Pipeline-Schritte erben von PipelineStep.
```
