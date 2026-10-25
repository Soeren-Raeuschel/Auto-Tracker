# Spezifikation (kompakt)

## Ziel
Autos nach eigenen Kriterien bewerten und sortieren, Watchlist, News zu Autos, Vorschläge neuer Autos, 3D-Ansicht, Gebrauchtwagen-Suchlinks. Nutzer: nur ich. Alles kostenlos.

## Nutzungskontext (für Standardwerte)
Alltag unter 80 km/Tag, Kassel nach Budapest 2x im Jahr (ca. 1000 km, vor Nutzung prüfen), Familienauto. Wichtig: ACC, einstellbare Rekuperation, HUD, Pano, Massagesitze, Schnellladen.

## Entscheidungen
- Stack: TypeScript, Vite, React, Vitest, Zod. Hosting: GitHub Pages oder Netlify. Nur dunkles Design (siehe DESIGN.md).
- Nutzerdaten (Kriterien, Watchlist, Notizen, Status): localStorage plus JSON-Export/Import (BackupService). Kein Login.
- Gemeinsame Daten (cars.json, news.json, candidates.json, price-history.json): Dateien in public/data, geschrieben von einer GitHub Action (Cron).
- KI (Groq, Free Tier) nur in der Action, Key als GitHub Secret. Ergebnis sind Kandidaten mit confidence "ai-extracted", manuelle Freigabe.
- Gebrauchtpreise: KEIN Scraping, nur vorgefilterte Such-Links (mobile.de, AutoScout24, Kleinanzeigen).
- 3D: generische glTF-Modelle pro Karosserieform mit Hotspots, spezifische Modelle später austauschbar.
- Benachrichtigung: GitHub Issue oder E-Mail aus der Action.
- Offline: PWA (App-Shell und JSON-Daten gecacht).

## Architektur
```
src/
  domain/          Typen, Attribut-Katalog, Statuswechsel-Tabelle (keine Imports aus anderen Schichten)
  scoring/         ScoringEngine + CriterionEvaluator (Strategy)
  validation/      Zod-Schemas, parseValid
  ports/           Interfaces (Repositories, ListingSearchProvider, ModelProvider, CarExtractor)
  application/     EventBus (Observer), BackupService, CarFactory
  infrastructure/  JSON-/localStorage-Adapter, Decorators (Validating, Caching)
  composition/     container.ts = einzige Stelle mit konkreten Klassen
  ui/              React: Komponenten (dumm), viewmodels/ (MVVM), Seiten
scripts/           Pipeline-Skripte (Node, teilen sich src/domain)
```
Abhängigkeitsrichtung: domain <- scoring / ports / validation <- application / infrastructure <- composition <- ui. Die Regeln stehen in `.dependency-cruiser.cjs` und werden in der CI geprüft.

MVVM nur für die UI-Schicht: View (Komponente) zeigt an, ViewModel (reine Funktion + Hook) bereitet Daten auf, Model sind Domain und Services. Kein SSR, kein Framework-Wechsel, kein eigenes Backend.

## Datenmodell
- Car: id, brand, model, variant?, bodyType, powertrain, attributes: Record<key, Sourced<value>>
- Attribut-Keys: siehe src/domain/attributeCatalog.ts
- Criterion: boolean | number | choice, mit weight, knockout, attributeKey
- Unbekannt (null) zählt im Score weder positiv noch negativ; K.-o. nur bei Score exakt 0.

## Erweiterungspunkte
| Neu | Umsetzung |
|---|---|
| Kriterientyp | CriterionEvaluator + Registrierung in defaultEvaluators |
| Portal für Links | ListingSearchProvider-Implementierung |
| 3D-Quelle | ModelProvider-Implementierung |
| KI-Anbieter | CarExtractor-Implementierung |
| Speicher | Repository-Implementierung (z. B. Supabase) |
| Querschnittsfunktion | Decorator um ein Repository |
