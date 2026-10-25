# Aufgaben (jeweils eine pro Cline-Session, von oben nach unten abarbeiten)
Status: [x] erledigt, [ ] offen. Nach jeder Aufgabe: `npm run typecheck && npm test`.
Die IDs bleiben stabil, weil docs/DESIGN.md und docs/PATTERNS.md darauf verweisen. Reihenfolge = Abhängigkeiten.
Logik zuerst (mit Test), UI danach. Fertig = `npm run check` grün (siehe docs/QUALITY.md).
Jede Seite bekommt ein ViewModel (reine Funktion + Test in `src/ui/viewmodels/`, dazu ein Hook `useXxxViewModel`), die Komponenten rendern nur. Beispiel: `rankingViewModel.ts`. Muster siehe docs/PATTERNS.md, Optik siehe docs/DESIGN.md.

Entfallen: T2.4 (steckt in T10.4), T8.1 (steckt in T10.3 und T10.4), T8.2 (App ist bewusst nur dunkel).

## Phase A: Logik und Daten (kein UI, erledigt)
- [x] T1 Fundament (inkl. Qualitätswerkzeuge, siehe T12.1): Domain, Scoring + Tests, Ports, localStorage/JSON-Adapter, Container, minimale Rangliste, 15 Autos in cars.json
- [x] T2.2 Attribut-Katalog: `src/domain/attributeCatalog.ts` (key, label, kind, unit) für priceEur, panoramaRoof, hud, massageSeats, dcMaxKw plus rangeKm, batteryKwh, consumptionKwh100, acc, regenAdjustable, trunkL, seats.
- [x] T11.4 Statuswechsel tabellengesteuert: `src/domain/statusTransitions.ts` mit `allowedTransitions` und `canTransition(from, to)`, Test.
- [x] T11.5 EventBus: `src/application/eventBus.ts`, typisiert (`subscribe`, `publish`), Events als kleine Objekte (`SettingsChanged`, `NewCarSuggested`), Test.
- [x] T9.2 Zod-Schemas: `zod` (erlaubt). `src/validation/schemas.ts` für Car, NewsItem, CarCandidate (NICHT in domain). Compile-Time-Check, dass der Schema-Output zu den Domain-Typen passt. Tests mit gültigen und ungültigen Beispielen.
- [x] T11.2 Repository-Decorators (direkt nach T9.2, gern in derselben Session): `ValidatingCarRepository` (überspringt ungültige Einträge und loggt, stürzt nie ab) und generischer `CachingRepository`, im Container um die JSON-Repositories gelegt. Validierung nicht in JsonCarRepository einbauen. Fertig, wenn: ein kaputter Eintrag in cars.json die App nicht bricht.
- [x] T2.5 BackupService: `src/application/backupService.ts` (exportJson/importJson für Settings + UserState, Validierung, Test). Die Buttons kommen in T2.3.

## Phase B: Design-Fundament und Shell
- [x] T10.1 Theme-Fundament: `@fontsource-variable/manrope` (erlaubt), `src/ui/theme/tokens.css` und `global.css` laut DESIGN.md (Reset, Hintergrund, Glow, `.label`, `.glass`, `:focus-visible`, Reduced-Motion), in `main.tsx` importieren.
- [ ] T10.2 Basiskomponenten in `src/ui/components/`: GlassCard, Label, ScoreBar, ScoreRing, CarSilhouette, PrimaryButton. Je eine CSS-Datei, typisierte Props, nur Typecheck.
- [ ] T2.1 Routing: `react-router-dom` (erlaubt). Routen: `/` Ranking, `/settings`, `/car/:id`, `/compare`, später `/news`.
- [ ] T10.3 Responsive Layout-Shell (braucht T2.1): `AppShell` mit Sidebar (Desktop), schwebender TabBar (Mobil), Tablet-Variante. Breakpoints per CSS, Safe Areas beachten. Tabs: Ranking, News, Vergleich, Watchlist.
- [ ] T10.8 Icon-Set (braucht T10.2): `lucide-react` (erlaubt, Lizenz kurz prüfen; Alternative `@phosphor-icons/react`). `src/ui/components/Icon.tsx` mit `IconName`-Union und Map auf einzelne Named Imports (Tree-Shaking), Props `size` (16/20/22), `aria-hidden`. Inline-SVGs in TabBar, Sidebar und Buttons ersetzen. Regeln siehe DESIGN.md, Abschnitt Icons. ESLint-Regel `no-restricted-imports` ergänzen, damit nur `Icon.tsx` das Icon-Paket importieren darf. Fertig, wenn: `npm run check` grün und kein Icon-Import außerhalb von `Icon.tsx`.

## Phase C: Ranking und Kriterien (Meilenstein 1: nutzbare Kernfunktion)
- [ ] T10.4 Ranking-Seite neu (baut auf `RankingViewModel` und `useRankingViewModel` auf, Anzeige-Logik dort erweitern, nicht in der Komponente): HeroCard (Platz 1) und RankRow auf `/`. RankRow aufklappbar mit Einzelscores pro Kriterium, Badge für confidence "estimated"/"ai-extracted", "unbekannt" sichtbar, K.-o. als Text. Daten aus der ScoringEngine, keine Logik in den Komponenten.
- [ ] T2.3 Einstellungsseite `src/ui/pages/SettingsPage.tsx` + `CriterionEditor.tsx` (braucht T2.2): Kriterium hinzufügen/entfernen (aus Katalog), Gewicht 0 bis 5, K.-o.-Schalter, bei Zahl: Richtung/min/max, Backup-Buttons (T2.5). Speichern über settingsRepository, Änderung publiziert `SettingsChanged`. Fertig, wenn: Änderung bleibt nach Reload und das Ranking sortiert sich live neu.
- [ ] T10.5 Kriterien-Panel: CriteriaSlider und Panel (Desktop rechts, Mobil als Bottom Sheet) als Oberfläche für T2.3, Live-Sortierung.

## Phase D: Autos, Watchlist, Vorschläge, Links (Meilenstein 2: komplette Kern-App)
- [ ] T3.1 UserState-Service/Hook: Status (nutzt `canTransition`), Notizen, Checkliste (hud, massage, acc, regen) über userStateRepository.
- [ ] T3.2 Detailseite `/car/:id`: alle Attribute mit confidence/source, Status, Notizen, Probefahrt-Checkliste.
- [ ] T3.3 Vergleich `/compare`: 2 bis 3 Autos nebeneinander, Auswahl per `?ids=a,b,c`.
- [ ] T3.4 Filter im Ranking: Status, Powertrain, "nur Watchlist", rejected ausblenden.
- [ ] T4.1 SuggestionService `src/application/suggestionService.ts`: Autos über `settings.suggestionThreshold`, nicht rejected, nicht watching/interested; publiziert `NewCarSuggested`. Test.
- [ ] T4.2 UI "Vorschläge" auf `/`, Schwellwert in `/settings`.
- [ ] T4.3 Such-Links: `src/infrastructure/listings/{mobileDe,autoScout24,kleinanzeigen}Provider.ts` (ListingSearchProvider, Adapter-Muster). URL-Muster zentral in `listings/urlTemplates.ts` mit Kommentar "im Browser verifizieren". Parameter nie raten, bei Unsicherheit Freitextsuche. Test pro Provider. Button "Gebrauchte suchen" auf der Detailseite (Filter: Preis, km, Baujahr).

## Phase E: Bewegung und Offline
- [ ] T10.6 Bewegung: gestaffeltes Einblenden, Füll-Animationen, FLIP-Umsortierung, View Transitions beim Routenwechsel, Skeleton-Ladezustand, Reduced-Motion manuell prüfen.
- [ ] T13.1 Lottie-Grundlage (braucht T10.6, T10.8): `lottie-web` (erlaubt). `src/ui/animations/animationCatalog.ts` (typisierte Liste laut DESIGN.md), Hook `useReducedMotion`, Komponente `LottieAnimation`: lädt `lottie-web/build/player/lottie_light` per dynamischem `import()` erst bei Bedarf, JSON aus `src/assets/animations/` (keine externen URLs, wegen CSP und Offline). Bei Reduced Motion oder Ladefehler: statisches Ersatz-Icon (`fallbackIcon`). Reine Logik `shouldAnimate(prefersReducedMotion, definition)` mit Test. Fertig, wenn: ohne vorhandene Animationsdatei erscheint nur das Ersatz-Icon und nichts bricht.
- [ ] T13.2 Erste LottieFlow-Animationen (braucht T13.1): Slots `success` (Speichern/Backup), `empty` (leere Liste/Filter), `error`, `watchlistToggle`, optional `loadingHero`. Der Nutzer lädt die JSON-Dateien aus seinem LottieFlow-Account nach `src/assets/animations/` und trägt Quelle und Lizenz in `src/assets/animations/LICENSES.md` ein. Cline legt KEINE Animationsdateien an, nur die Slots mit Ersatz-Icon. Vorab Nutzungsbedingungen prüfen: sind die Dateien im Repo erlaubt? Sonst Repo privat halten oder die Dateien aus dem Repo ausnehmen. Grenzen: höchstens 30 KB pro Datei, höchstens 2 gleichzeitig pro Ansicht.
- [ ] T9.3 PWA: `vite-plugin-pwa` (erlaubt). Manifest (Name, Kurzname, lang "de", theme_color, einfache Platzhalter-Icons), Service Worker: App-Shell vorab cachen, `public/data/*.json` mit stale-while-revalidate. Fertig, wenn: Build erzeugt Manifest und Service Worker und die App startet nach dem ersten Laden offline (manuell prüfen). "Stand"-Zeitstempel der Daten bleibt sichtbar.

## Phase F: 3D und Rechner
- [ ] T5.1 `@google/model-viewer` installieren (erlaubt), TS-Typdeklaration anlegen.
- [ ] T5.2 GenericModelProvider (ModelProvider-Port): Modell pro bodyType aus `public/models/<bodyType>.glb`. Fehlt die Datei, Platzhalter-Hinweis. Keine GLB-Dateien selbst anlegen, der Nutzer legt sie ab (Lizenz in `public/models/LICENSES.md`).
- [ ] T5.3 CarViewer auf der Detailseite: drehen/zoomen, Hotspots aus Attributen (Pano, HUD, Massage, Laden).
- [ ] T5.4 Optional: SpecificModelProvider, bevorzugt pro Auto-ID eine eigene GLB, sonst generisch.
- [ ] T6.1 Attribute rangeKm, batteryKwh, consumptionKwh100 in Katalog und cars.json (nur belegte Werte, sonst null).
- [ ] T6.2 `src/application/tripPlanner.ts`: `estimateChargingStops({rangeKm, dcMaxKw, distanceKm, usableFromPct, usableToPct})` als reine Funktion mit Tests, Annahmen als Parameter. UI auf der Detailseite: Kassel nach Budapest (Distanz vor Nutzung prüfen).
- [ ] T6.3 Einfacher Kostenvergleich (TCO): Eingaben des Nutzers (km/Jahr, Strompreis, Versicherung, Wertverlust), reine Funktion + Test.

## Phase G: Pipeline (Meilenstein 3: News, KI-Kandidaten, Preise)
Node-Skripte in `scripts/`. Läuft per GitHub Action, Free-Tier-Limits beachten.
- [ ] T9.1 Typen teilen: `tsx` als devDependency (erlaubt), `scripts/tsconfig.json` bindet `src/domain` ein, Skripte importieren Typen direkt, keine Kopien. Domain bleibt frei von Node- und Browser-APIs. npm-Skript `"pipeline": "tsx scripts/run.ts"`. Fertig, wenn: `scripts/hello.ts` importiert `Car` und läuft mit `npx tsx`.
- [ ] T11.3 `scripts/pipelineStep.ts` (Template-Hook, siehe PATTERNS.md): `run()` fängt Fehler, loggt, behält bei Fehler den letzten Stand; Hook `execute()`. Alle Schritte unten erben davon.
- [x] T11.1 `src/application/carFactory.ts`: `createCarFromCandidate(candidate): Car` (Slug-ID, confidence "ai-extracted", fehlende Werte null), Test.
- [ ] T7.1 `scripts/sources.json` (RSS-Feeds, Nutzer pflegt) und `scripts/fetchNews.ts`: holt Feeds, dedupliziert, schreibt `public/data/news-raw.json`. Ein ausgefallener Feed bricht den Lauf nicht ab.
- [ ] T7.2 `scripts/matchNews.ts`: ordnet News Autos per Marken-/Modell-Aliasen zu (`scripts/aliases.json`), schreibt `public/data/news.json` (Titel, Link, Quelle, Datum, carIds, eigene Kurzfassung, nie Volltext).
- [ ] T7.3 News-Ansicht `/news` und News-Block auf der Detailseite (NewsRepository über news.json, mit Decorator aus T11.2). Hinweis "Stand: <Zeitstempel>".
- [ ] T7.4 GroqCarExtractor (CarExtractor-Port) in `scripts/`: Chat-Completions-API von Groq per fetch, Key aus env `GROQ_API_KEY`, Modell aus env `GROQ_MODEL` (aktuelle ID in der Groq-Doku prüfen, nicht erfinden). Prompt: nur JSON, fehlende Werte null. Nur NEUE Artikel schicken (Cache `public/data/processed-ids.json`). Ergebnis nach `public/data/candidates.json`. Schema-Validierung (T9.2), ungültige Antworten verwerfen.
- [ ] T7.5 Kandidaten-Freigabe in der UI: prüfen, bearbeiten, übernehmen (über CarFactory, landet als Ergänzung in localStorage, cars.json bleibt Repo-Daten) oder verwerfen.
- [ ] T7.6 Preis-Historie: `scripts/snapshotPrices.ts` hängt priceEur pro Auto mit Datum an `public/data/price-history.json`; kleines SVG-Diagramm auf der Detailseite, ohne Chart-Library.
- [ ] T7.7 `.github/workflows/update-data.yml`: täglicher Cron, führt die Skripte aus, committet nur bei Änderungen, bei Fehler bleibt der letzte Stand. Bei neuen Vorschlägen oder Preisfall ein GitHub Issue als Benachrichtigung.
- [ ] T7.8 Deploy-Workflow nach GitHub Pages (läuft erst nach grünem CI). Die CI selbst (`.github/workflows/ci.yml`) existiert bereits.

## Phase H: Politur
- [ ] T8.3 Fehler- und Leerzustände überall (inkl. `--danger`), Ladeanzeige, "Stand"-Zeitstempel bei Repo-Daten.
- [ ] T10.7 Feinschliff: Fokus-/Hover-Zustände, Kontrast, Layout bei 390 px und 1440 px Breite prüfen (nur auf Nachfrage mit Screenshot).
- [ ] T11.6 Optional, nur auf Wunsch: Command-Muster für Undo/Redo bei Kriterien-Änderungen.

## Phase Q: Qualität (laufend, siehe docs/QUALITY.md)
- [x] T12.1 Werkzeuge: ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, dependency-cruiser (Schichtregeln), Coverage-Schwellen, CI, Dependabot, `npm run check`.
- [ ] T12.2 E2E-Smoke-Tests (nach Phase D): `@playwright/test` (erlaubt), 3 Kernpfade: Ranking lädt, Gewicht ändern sortiert um, Auto zur Watchlist hinzufügen. Läuft in der CI gegen den Preview-Build.
- [ ] T12.3 Integrationstests für die Pipeline (zusammen mit Phase G): Schritte mit Test-Feeds und Fake-fetch, kein Netzwerk. Groq-Antworten: gültig, ungültig, leer.
- [ ] T12.4 Sicherheit (zusammen mit T9.3): Content-Security-Policy per Meta-Tag, keine Inline-Skripte, `npm audit` prüfen, nirgends Secrets im Repo.
- [ ] T12.5 Lighthouse-Prüfung nach Phase E (manuell): Performance und Accessibility je mindestens 90, Ergebnis kurz in docs/QUALITY.md notieren.

