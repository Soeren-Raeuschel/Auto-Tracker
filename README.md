# Auto-Tracker

Persönliche E-Auto-Vergleichs-App (Einzelnutzer), komplett kostenlos hostbar (GitHub Pages / Netlify).

## Start
```bash
npm install
npm run dev          # Entwicklung (Vite)
npm run build        # Production-Build (Typecheck + Vite)
npm run preview      # Build lokal ansehen
npm run check        # Lint, Format, Typecheck, Architektur, Tests mit Coverage
npm test             # Tests (Vitest)
```

## Wo steht was
- `docs/SPEC.md`: Entscheidungen und Architektur
- `docs/TASKS.md`: Aufgaben in Reihenfolge (eine pro Cline-Session)
- `docs/DESIGN.md`: Optik, Bewegung, Layouts (iPhone und Mac)
- `docs/PATTERNS.md`: Muster aus der Vorlesung und ihr Einsatz
- `docs/QUALITY.md`: Qualitätsziele, Testpyramide, Definition of Done
- `.clinerules`: Regeln, die Cline automatisch liest

## Tech-Stack
- **Frontend:** React 18, TypeScript, Vite, react-router-dom
- **Styling:** Manrope (fontsource), handgeschriebenes CSS mit Design-Tokens (`src/ui/theme/`)
- **Icons:** lucide-react (nur über `src/ui/components/Icon.tsx`)
- **Validierung:** zod (Schemas in `src/validation/`)
- **Tests/Qualität:** Vitest + Coverage-v8, ESLint, Prettier, dependency-cruiser

## Struktur
- `src/domain/` – Kernlogik (Car, Scoring, Kriterien, Statuswechsel), frei von Frameworks
- `src/application/` – Services (EventBus, BackupService, CarFactory), Ports
- `src/infrastructure/` – Adapter (localStorage, JSON-Repository, Validierungs- und Caching-Decorators)
- `src/validation/` – Zod-Schemas
- `src/composition/` – Container/Dependency-Wiring
- `src/ui/` – Seiten, ViewModels (reine Logik + Tests), Komponenten, Theme
- `public/data/cars.json` – Fahrzeugdaten (15 Autos)

## Stand
Phase A (Logik und Daten), Phase B (Design-Fundament und Shell) und Phase C (Ranking und Kriterien – Meilenstein 1) sind umgesetzt und getestet; die Kernfunktionen Ranking mit Einzelscores, Einstellungsseite und Kriterien-Panel sind nutzbar. Als Nächstes Phase D (Autos, Watchlist, Vorschläge, Such-Links – Meilenstein 2), beginnend mit T3.1, siehe docs/TASKS.md.
