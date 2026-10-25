# Qualitätssicherung

## Qualitätsmerkmale (ISO/IEC 25010) und wie sie hier abgesichert werden
| Merkmal | Maßnahme |
|---|---|
| Funktionale Tauglichkeit | Scoring-Engine mit Unit-Tests, E2E-Smoke-Tests (T12.2) |
| Zuverlässigkeit | Zod-Validierung als Decorator, PipelineStep behält letzten Stand, unbekannt = null |
| Leistungseffizienz | Caching-Decorator, Bewegung nur über transform/opacity, Lighthouse-Prüfung (T12.5) |
| Benutzerfreundlichkeit | DESIGN.md: Touch-Ziele, Fokus-Stil, Kontrast, Reduced Motion |
| Sicherheit | Keine Keys im Frontend, Dependabot, `npm audit`, CSP (T12.4), News nur als Link und Kurzfassung |
| Wartbarkeit | Schichten per `npm run arch` erzwungen, Muster (PATTERNS.md), kleine Dateien, Prettier + ESLint |
| Übertragbarkeit | Statisches Hosting, Storage hinter Ports, PWA |

## Testpyramide
- Unit (Basis, schnell): domain, scoring, application, validation, ViewModels. Coverage-Schwelle: 80 % Zeilen/Funktionen, 70 % Branches.
- Integration: Adapter mit Fake-Storage/Fake-fetch (vorhanden), Pipeline-Schritte mit Test-Feeds ohne Netzwerk (T12.3).
- E2E (wenige, nur Kernpfade): Playwright (T12.2).

## Werkzeuge und Befehle
- `npm run check`: Lint, Format-Prüfung, Typecheck, Architekturprüfung, Tests mit Coverage.
- `npm run format`: Prettier. `npm run lint`: ESLint (typescript-eslint, react-hooks, jsx-a11y).
- `npm run arch`: dependency-cruiser prüft die Schichtregeln und Zyklen.
- CI (`.github/workflows/ci.yml`) führt dieselben Schritte plus Build und `npm audit` aus.

## Definition of Done (pro Aufgabe)
1. `npm run check` grün.
2. Neue Logik hat Tests, neue UI hat ein ViewModel mit Test.
3. Keine neue Dependency ohne Nennung in der Aufgabe.
4. Diff selbst gesichtet (Ersatz fürs Vier-Augen-Prinzip), Checkbox in docs/TASKS.md abgehakt.
5. Bei Datenänderungen: Quelle und confidence gesetzt, nichts erfunden.

## Arbeitsablauf
Pro Aufgabe ein Branch, Pull Request, CI grün, dann mergen. Refactoring nur als eigene Aufgabe, nie nebenbei.
