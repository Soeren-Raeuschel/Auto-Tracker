# Auto-Tracker

Persönliche E-Auto-Vergleichs-App (Einzelnutzer), komplett kostenlos hostbar (GitHub Pages / Netlify).

## Start
```bash
npm install
npm run dev          # Entwicklung
npm run check        # Lint, Format, Typecheck, Architektur, Tests mit Coverage
```

## Wo steht was
- `docs/SPEC.md`: Entscheidungen und Architektur
- `docs/TASKS.md`: Aufgaben in Reihenfolge (eine pro Cline-Session)
- `docs/DESIGN.md`: Optik, Bewegung, Layouts (iPhone und Mac)
- `docs/PATTERNS.md`: Muster aus der Vorlesung und ihr Einsatz
- `docs/QUALITY.md`: Qualitätsziele, Testpyramide, Definition of Done
- `.clinerules`: Regeln, die Cline automatisch liest

## Stand
Phase A (Logik und Daten) ist umgesetzt und getestet. Als Nächstes Phase B (Design-Fundament und Shell), siehe docs/TASKS.md.
