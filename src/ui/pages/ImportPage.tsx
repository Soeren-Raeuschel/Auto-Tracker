import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/PrimaryButton';
import type { Container } from '../../composition/container';
import { useImportViewModel } from '../viewmodels/useImportViewModel';
import './ImportPage.css';

/** URL-Import (Phase D): Seite laden, per Groq extrahieren, Vorschau, Übernehmen. */
export function ImportPage({ container }: { container: Container }) {
  const viewModel = useImportViewModel(container);
  const [exportText, setExportText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const busy = viewModel.status === 'fetching' || viewModel.status === 'extracting';

  const onExport = async () => {
    const text = await viewModel.buildExport();
    setExportText(text);
    setCopied(false);
  };

  const onCopy = async () => {
    if (exportText === null) return;
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
  };

  const onDownload = () => {
    if (exportText === null) return;
    const blob = new Blob([exportText], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cars.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const onTake = async () => {
    const { added, skipped } = await viewModel.addToGarage();
    setResult(
      skipped > 0
        ? `${added} Auto(s) übernommen, ${skipped} Duplikat(e) übersprungen.`
        : `${added} Auto(s) übernommen – jetzt im Ranking sichtbar.`,
    );
  };

  return (
    <section className="import-page">
      <h1 className="label">Auto importieren</h1>
      <p className="import-page__hint">
        <Link to="/candidates">KI-Kandidaten aus der News-Pipeline prüfen →</Link>
        Website-URL einfügen (Test, Preisliste, Hersteller). Die App lädt den Seitentext über einen
        Lese-Proxy und Groq extrahiert die Fahrzeugdaten. Fehlende Werte ergänzt Groq aus eigenem
        Wissen – alle Werte sind mit <code>ai-extracted</code> markiert.
      </p>

      <GlassCard className="import-page__card">
        <label className="import-page__field">
          <span className="label">Groq API-Key (kostenlos auf console.groq.com)</span>
          <div className="import-page__key-row">
            <input
              type="password"
              value={viewModel.apiKey}
              onChange={(e) => viewModel.setApiKey(e.target.value)}
              placeholder="gsk_..."
              autoComplete="off"
            />
            <PrimaryButton onClick={viewModel.saveApiKey}>Speichern</PrimaryButton>
          </div>
        </label>
      </GlassCard>

      <GlassCard className="import-page__card">
        <label className="import-page__field">
          <span className="label">Website-URL</span>
          <div className="import-page__key-row">
            <input
              type="url"
              value={viewModel.url}
              onChange={(e) => viewModel.setUrl(e.target.value)}
              placeholder="https://www.adac.de/.../fahrbericht/"
            />
            <PrimaryButton onClick={viewModel.analyze} disabled={busy}>
              {busy ? (
                <>
                  <Icon name="loader" size={16} /> Analysiere…
                </>
              ) : (
                <>
                  <Icon name="search" size={16} /> Analysieren
                </>
              )}
            </PrimaryButton>
          </div>
        </label>
        {viewModel.error !== null && (
          <p className="import-page__error" role="alert">
            <Icon name="alert" size={16} /> {viewModel.error}
          </p>
        )}
        {result !== null && (
          <p className="import-page__success" role="status">
            <Icon name="check" size={16} /> {result}
          </p>
        )}
      </GlassCard>

      {viewModel.previews.length > 0 && (
        <div className="import-page__previews">
          <p className="import-page__selection-hint" role="status">
            {viewModel.previews.length > 1
              ? 'Mehrere Autos gefunden. Wähle aus, welche importiert werden sollen.'
              : 'Auto gefunden. Auswahl für Import prüfen.'}{' '}
            {viewModel.selectedCount} von {viewModel.previews.length} ausgewählt.
          </p>
          {viewModel.previews.map((preview) => (
            <GlassCard key={preview.id} className="import-page__preview">
              <label className="import-page__selection">
                <input
                  type="checkbox"
                  checked={viewModel.selectedIds.has(preview.id)}
                  onChange={() => viewModel.toggleSelection(preview.id)}
                />
                <span className="label">{preview.label}</span>
              </label>
              <ul className="import-page__rows">
                {preview.rows.map((row) => (
                  <li key={row.key} className={row.missing ? 'import-page__row--missing' : ''}>
                    <span>{row.label}</span>
                    <span>{row.display}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      )}

      {viewModel.pending.length > 0 && (
        <PrimaryButton onClick={onTake} disabled={viewModel.selectedCount === 0}>
          <Icon name="check" size={16} /> {viewModel.selectedCount} Auto(s) übernehmen (sofort in
          der App sichtbar)
        </PrimaryButton>
      )}

      {viewModel.importedVMs.length > 0 && (
        <GlassCard className="import-page__card">
          <h2 className="label">Importierte Autos ({viewModel.importedVMs.length})</h2>
          <p className="import-page__hint">
            Gesamt in der App: {viewModel.baseCount} Autos ({viewModel.importedVMs.length} davon
            lokal importiert).
          </p>
          <ul className="import-page__imported">
            {viewModel.importedVMs.map((car) => (
              <li key={car.id}>
                <span>{car.label}</span>
                <button
                  type="button"
                  className="import-page__remove"
                  onClick={() => viewModel.removeImported(car.id)}
                  aria-label={`${car.label} entfernen`}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
          <PrimaryButton onClick={onExport}>
            <Icon name="inbox" size={16} /> cars.json-Export erzeugen
          </PrimaryButton>
          {exportText !== null && (
            <div className="import-page__export">
              <textarea readOnly value={exportText} rows={10} />
              <PrimaryButton onClick={onCopy}>{copied ? 'Kopiert!' : 'Kopieren'}</PrimaryButton>
              <PrimaryButton onClick={onDownload}>Herunterladen</PrimaryButton>
            </div>
          )}
        </GlassCard>
      )}
    </section>
  );
}
