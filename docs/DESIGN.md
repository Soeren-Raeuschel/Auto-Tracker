# Design-Spezifikation (für Cline)

Ablage im Projekt: `docs/DESIGN.md`. Ergänzt `docs/SPEC.md` und `docs/TASKS.md`.
Look: dunkel und edel, ein Akzent, Auto-Konfigurator-Gefühl (große Flächen, Glasoptik, ruhige Bewegung).
Referenzentwurf (nur zur Ansicht, Cline braucht ihn nicht): https://claude.ai/artifact/C2kGG1BwYy5frUurGCNUKY

## Regeln
- Alle Farben, Abstände, Radien, Zeiten kommen aus Tokens (`src/ui/theme/tokens.css`). Keine Hex-Werte in Komponenten.
- Plain CSS mit CSS-Variablen, eine CSS-Datei pro Komponente (`Component.css`), keine neue Styling-Library.
- Komponenten in `src/ui/components/`, Seiten in `src/ui/pages/`. Keine Logik in Komponenten (siehe `.clinerules`).
- Nur `transform` und `opacity` animieren, nie Layout-Eigenschaften. Ausnahme: `stroke-dashoffset` an SVG-Elementen (ScoreRing) ist erlaubt, es löst nur ein Repaint aus.
- Touch-Ziele mindestens 44x44 px. Echte `<button>`, `<a>`, `<label>`. Icon-Buttons mit `aria-label`.
- Nur Dark Mode (bewusste Entscheidung). `color-scheme: dark` setzen.
- Code-Blöcke in dieser Datei sind reines ASCII: Anführungszeichen `"`, Bindestriche `-`, CSS-Variablen beginnen mit zwei ASCII-Bindestrichen `--`. Beim Kopieren nicht durch Textprogramme autokorrigieren lassen.

## Tokens (`tokens.css`)
```css
:root {
  color-scheme: dark;
  --bg: #08090B;
  --text: #F5F6F8;
  --text-2: #B4B9C2;
  --muted: #7C828C;          /* Kontrast auf --bg ca. 5:1 */
  --accent: #5BE0C0;
  --accent-deep: #2FAE91;
  --accent-glow: rgba(91, 224, 192, 0.18);
  --glass-top: rgba(255, 255, 255, 0.05);
  --glass-bottom: rgba(255, 255, 255, 0.015);
  --hairline: rgba(255, 255, 255, 0.08);
  --hairline-soft: rgba(255, 255, 255, 0.06);
  --track: rgba(255, 255, 255, 0.10);
  --hover: rgba(255, 255, 255, 0.07);

  --danger: #FF6B6B;
  --glass-nav: rgba(20, 22, 26, 0.82);
  --glow-floor: rgba(91, 224, 192, 0.35);
  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  --shadow-btn: 0 8px 28px rgba(91, 224, 192, 0.28);
  --shadow-knob: 0 2px 8px rgba(0, 0, 0, 0.5);

  --font: "Manrope Variable", system-ui, sans-serif;
  --r-sm: 12px; --r-md: 20px; --r-lg: 30px; --r-xl: 36px; --r-pill: 999px;
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 20px; --s-6: 28px; --s-7: 36px;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --t-fast: 200ms; --t-base: 350ms; --t-slow: 800ms;
}
```
Globaler Hintergrund-Schimmer: radialer Verlauf in `--accent-glow` oben links, hinter dem Inhalt (`z-index: 0`), `pointer-events: none`.

## Typografie
- Font: Manrope, selbst gehostet über `@fontsource-variable/manrope` (erlaubt; wichtig für Offline-PWA, kein Google-Fonts-Link).
- Seitentitel: 36 px mobil / 38 px Desktop, Gewicht 800, `letter-spacing: -0.03em`.
- Hero-Zahl: mobil keine große Zahl, sondern der ScoreRing (64 px) mit 20-px-Zahl im Ring (Gewicht 800). Desktop: 120 px, Gewicht 300, `-0.05em`.
- Label (Klasse `.label`): 11 px, 700, `letter-spacing: 0.14em`, Großbuchstaben, `--muted`.
- Fließtext 14–15 px, Zahlen in Listen 20 px / 700.

## Grundbausteine
- **GlassCard** (`.glass`): `background: linear-gradient(180deg, var(--glass-top), var(--glass-bottom)); border: 1px solid var(--hairline); box-shadow: var(--inset-highlight);`
  Schwebende Elemente (Tab-Leiste): Hintergrund `--glass-nav` und `backdrop-filter: blur(20px)` immer zusammen mit `-webkit-backdrop-filter: blur(20px)`; ohne Unterstützung (`@supports not`) deckender Hintergrund statt Blur.
- **Label**: siehe Typografie.
- **ScoreBar**: Track 3 px hoch (`--track`), Füllung Verlauf `--accent-deep` zu `--accent`, `transform-origin: left`.
- **ScoreRing**: SVG 64x64, r=28, Umfang 176 (`stroke-dasharray: 176`, `stroke-dashoffset = 176 * (1 - score/100)`), Zahl mittig, Start oben (`rotate(-90)`).
- **CarSilhouette** (Platzhalter bis zur 3D-Ansicht, Prop `bodyType`, vorerst überall dieselbe Form): viewBox `0 0 252 84`
  ```svg
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BE0C0" stop-opacity=".28"/><stop offset="1" stop-color="#5BE0C0" stop-opacity=".02"/></linearGradient>
  <path d="M6 60 C10 54 28 51 48 46 C66 32 92 25 130 25 C160 25 188 31 206 46 C224 50 240 54 246 60 L247 68 L6 68 Z" fill="url(#b)" stroke="#5BE0C0" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M72 44 C86 32 108 29 130 29 L152 29 C172 30 188 36 200 46 Z" fill="none" stroke="#5BE0C0" stroke-width="1" opacity=".55"/>
  <g fill="#08090B" stroke="#5BE0C0" stroke-width="1.4"><circle cx="58" cy="68" r="12"/><circle cx="198" cy="68" r="12"/></g>
  ```
  Darunter ein weicher Boden-Glow (Ellipse in `--glow-floor`, Blur 6 bis 10 px).
- **HeroCard**: Auto auf Platz 1. Radius `--r-lg` (mobil) / `--r-xl` (Desktop). Inhalt: Label "Beste Eignung" in `--accent`, CarSilhouette, Name (24/32 px, 700), Score (mobil: ScoreRing 64 px mit 20-px-Zahl, Desktop: große 120-px-Zahl), Kennzahlenzeile mit 3 Werten (Preis, Laden in kW, Stopps) getrennt durch Haarlinie.
- **RankRow**: GlassCard, Radius `--r-md`, Höhe 60 px. Spalten mobil: Rang (Label) | Name + ScoreBar | Score. Desktop: Rang | Name | Preis | Laden | ScoreBar | Score. Hover: `translateY(-2px)` (mobil) bzw. `translateX(4px)` (Desktop) und `--hover`-Hintergrund, nur unter `@media (hover: hover)`.
- **CriteriaSlider**: Name links, Gewicht rechts (`--muted`), Track 4 px mit Füllung, runder Griff 16 px (`--text`, Schatten `--shadow-knob`). Griff tippbar mit 44 px Trefferfläche.
- **Primärbutton**: Pille, Höhe 48 px, Hintergrund `--accent`, Text `--bg`, Schatten `--shadow-btn`.
- **Fehler und leere Zustände**: Fehlertexte und Warnhinweise in `--danger` (immer mit Text und Icon, nie nur Farbe). Leerer Zustand (z. B. K.-o. blendet alles aus): freundlicher Text mit Aktion "Kriterien anpassen".
- **Unbekannt/geschätzt** (aus Datenmodell): kleines Label "geschätzt" bzw. "unbekannt" in `--muted`, nie in `--accent`.

## Layouts
Breakpoints: Mobil unter 768 px, Tablet 768–1023 px, Desktop ab 1024 px.

**iPhone (Mobil)**
- Eine Spalte, Seitenrand 20 px, oben Safe Area (`env(safe-area-inset-top)`).
- Kopf: Label "Auto-Tracker", Titel, rechts runder 44-px-Button "Kriterien".
- Darunter HeroCard (Höhe ca. 318 px), dann RankRows mit 6 px Abstand.
- **TabBar** schwebt unten: links/rechts 16 px, unten 24 px + `env(safe-area-inset-bottom)`, Höhe 64 px, Pillenform, Glas mit Blur. Tabs: Ranking, News, Vergleich, Watchlist. Aktiv in `--accent`. Labels 10 px direkt unter den 22-px-Icons. Inhalt bekommt unten 100 px Padding, damit nichts verdeckt wird.
- Kriterien öffnen als Bottom Sheet (Seite `/settings` mobil als Vollbild-Sheet).

**Mac (Desktop)**
- 3-Spalten-Grid: Sidebar 232 px | Hauptbereich (`minmax(0, 1fr)`) | Kriterien-Panel 300 px, Trennlinien `--hairline-soft`.
- Sidebar: Logo, Navigation (Ranking, Vorschläge, News, Vergleich, Watchlist), unten "Stand <Datum>" (Format `Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })`). Navi-Eintrag Höhe 44 px, aktiv mit leichtem Hintergrund und `--accent`.
- Hauptbereich: Titel mit Suchfeld (Pille, Tastenkürzel Cmd+K bzw. Strg+K fokussiert die Suche: `(e.metaKey || e.ctrlKey) && e.key === 'k'` mit `preventDefault`), HeroCard zweispaltig (Auto links, Daten rechts, Mindesthöhe 400 px), darunter Tabellenkopf (Labels, sticky mit Unterkante `--hairline-soft`) und RankRows.
- Kriterien-Panel mit CriteriaSliders, unten Primärbutton "Kriterium hinzufügen". Änderungen sortieren das Ranking sofort neu.
- Tablet: Sidebar nur Icons (72 px), Panel als einblendbarer Drawer von rechts.

## Bewegung
- Easing immer `--ease`. Dauern: Hover/Toggles `--t-fast`/`--t-base`, Einblendungen 700–800 ms, nichts über 1,2 s.
- **Einblenden (`rise`)**: `opacity 0 -> 1` und `translateY(14px) -> 0`, `animation-fill-mode: backwards` (nicht `both`, damit danach `transform` frei bleibt). Hero zuerst, RankRows gestaffelt mit 100 ms Abstand (max. 5 Stufen, danach ohne Verzögerung).
- **Füllen**: ScoreBar per `scaleX(0) -> 1` (1 s, 300 ms Verzögerung), ScoreRing per `stroke-dashoffset` von 176 zum Zielwert (1,2 s).
- **Umsortieren**: Beim Ändern der Gewichte wandern RankRows an ihre neue Position (FLIP-Technik mit `transform`, 400 ms). Kein Springen. Läuft noch eine Einblend-Animation, wird sie vorher beendet (`animation: none` auf dem Element), damit nicht zwei Systeme `transform` steuern.
- **Glow**: Hintergrund-Schimmer "atmet" (Deckkraft-Wechsel, 5 s, endlos, sehr dezent).
- **Seitenübergänge**: View Transitions API (`document.startViewTransition`) mit Überblendung 250 ms, Fallback ohne Animation, wenn nicht unterstützt.
- **Reduzierte Bewegung**: `@media (prefers-reduced-motion: reduce)` schaltet alle Animationen und Übergänge ab (`animation: none; transition: none`).
- Ladezustand: Skeleton-Karten (Glas) mit Shimmer als schmaler Gradienten-Streifen, der per `translateX` über die Karte läuft (kein `background-position`). Kein Spinner.

## Icons
- Set: `lucide-react` (Alternative `@phosphor-icons/react`), nur Linien-Icons, passend zum Entwurf. Lizenz vor der Nutzung kurz prüfen.
- Zugriff nur über die Komponente `Icon` (`src/ui/components/Icon.tsx`) mit eigener Namensliste (`IconName`). Außerhalb davon kein Import des Icon-Pakets (ESLint-Regel). Neue Icons = ein Eintrag in der Map.
- Größen: 16 px (inline), 20 px (Buttons, Sidebar), 22 px (TabBar). Strichstärke 2, Farbe `currentColor`, Ecken rund.
- Icons sind dekorativ (`aria-hidden="true"`), der Name steht im sichtbaren Text oder im `aria-label` des Buttons.
- Aktiv: `--accent`, inaktiv: `--muted`. Keine Farbverläufe und keine Mehrfarb-Icons.
- Keine Icons von Anbietern, die nur Bitmaps oder Namensnennung für kostenlose Nutzung liefern (z. B. Icons8 im Gratis-Tarif).

## Lottie-Animationen (LottieFlow)
Nur für wenige Highlights, nie für Standard-Bewegung (die läuft über CSS, siehe Bewegung).
- Quelle: Dateien aus dem LottieFlow-Account des Nutzers. Ablage `src/assets/animations/<id>.json`, Quelle und Lizenz je Datei in `src/assets/animations/LICENSES.md`. Nutzungsbedingungen vor dem Commit prüfen (Dateien im Repo erlaubt?). Falls Namensnennung nötig ist, auf der Seite "Über" nennen.
- Katalog (typisiert, eine Stelle):
  ```ts
  export type AnimationId = 'success' | 'empty' | 'error' | 'watchlistToggle' | 'loadingHero';

  export interface AnimationDefinition {
    id: AnimationId;
    file: string; // path inside src/assets/animations
    loop: boolean;
    fallbackIcon: IconName;
    source: string; // e.g. "LottieFlow"
  }
  ```
- Slots: `success` (nach Speichern/Backup, einmalig), `empty` (leere Liste oder Filter, ruhig loopen), `error` (einmalig), `watchlistToggle` (bei Klick, einmalig), `loadingHero` (optional, statt Spinner im Hero).
- Laden: `lottie-web` in der Light-Variante, per dynamischem `import()` erst beim ersten Bedarf, damit der Start schnell bleibt. Keine externen URLs (CSP, Offline-PWA). Dateien ohne Expressions verwenden.
- Grenzen: höchstens 30 KB pro Datei, höchstens 2 gleichzeitig sichtbar, keine Endlosschleife in Listen oder Tabellen, Pausieren außerhalb des Sichtbereichs und bei verstecktem Tab.
- Reduced Motion: statt der Animation das Ersatz-Icon bzw. das letzte Bild zeigen (`shouldAnimate` entscheidet, reine Funktion mit Test).
- Farben: an `--accent` (#5BE0C0) und `--text` anpassen, entweder im Quell-Editor oder per CSS-Variablen auf den SVG-Elementen. Auf dunklem Grund prüfen.
- Barrierefreiheit: dekorativ mit `aria-hidden="true"`. Trägt die Animation eine Aussage (z. B. Fehler), steht dieselbe Aussage zusätzlich als Text daneben.
- Fehlt eine Datei oder schlägt das Laden fehl, erscheint das Ersatz-Icon, nie ein leerer Platz oder ein Fehler.

## Barrierefreiheit
- Text auf `--bg` mindestens 4,5:1 (`--muted` erfüllt das knapp, nicht kleiner als 11 px verwenden).
- Fokus sichtbar nur für Tastatur: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` und `:focus:not(:focus-visible) { outline: none; }`.
- Farbe nie als einziger Informationsträger (K.-o. zusätzlich als Text "K.-o.").
- Dekorative SVGs `aria-hidden="true"`, Ring und Balken mit Textalternative (`aria-label="Eignung 81 von 100"`).

## Aufgaben für `docs/TASKS.md` (neuer Abschnitt T10)
Reihenfolge: T10.1 und T10.2 direkt nach T2.1, der Rest passend zu den genannten Aufgaben.

- [ ] T10.1 Theme-Fundament: `@fontsource-variable/manrope` (erlaubt) installieren, `src/ui/theme/tokens.css` und `global.css` (Reset, Hintergrund, Glow, `.label`, `.glass`, `:focus-visible`-Stil, Reduced-Motion-Regel) laut dieser Datei anlegen, in `main.tsx` importieren.
- [ ] T10.2 Basiskomponenten in `src/ui/components/`: GlassCard, Label, ScoreBar, ScoreRing, CarSilhouette, PrimaryButton. Je eine CSS-Datei, Props typisiert, kleine Rendering-Tests entfallen, nur Typecheck.
- [ ] T10.3 Responsive Layout-Shell (nach T2.1): `AppShell` mit Sidebar (Desktop), TabBar (Mobil), Tablet-Variante; Breakpoints per CSS, nicht per JS. Safe Areas beachten.
- [ ] T10.4 Ranking-Seite neu (nach T2.4): HeroCard und RankRow bauen, Seite `/` damit ersetzen. Daten weiter aus der ScoringEngine, keine Logik in den Komponenten.
- [ ] T10.5 Kriterien-Panel (nach T2.3): CriteriaSlider und Panel (Desktop rechts, Mobil als Bottom Sheet), Live-Sortierung.
- [ ] T10.6 Bewegung: Einblenden mit Staffelung, Füll-Animationen, FLIP-Umsortierung, View Transitions beim Routenwechsel, Skeleton-Ladezustand, Reduced-Motion getestet (manuell).
- [ ] T10.7 Politur: Fokus-/Hover-Zustände prüfen, Kontrast prüfen, Layout auf 390 px und 1440 px Breite kontrollieren (manuell, nur auf Nachfrage mit Screenshot).
- [ ] T10.8 Icon-Set einbinden (siehe Abschnitt Icons) und T13.1/T13.2 Lottie-Grundlage und erste Animationen (siehe Abschnitt Lottie-Animationen). Die genauen Aufgabentexte stehen in docs/TASKS.md.
