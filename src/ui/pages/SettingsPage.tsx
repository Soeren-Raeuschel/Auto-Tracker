import type { Container } from '../../composition/container';
import { CriterionEditor } from '../components/CriterionEditor';
import { Label } from '../components/Label';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSettingsViewModel } from '../viewmodels/useSettingsViewModel';
import './SettingsPage.css';

function downloadBackup(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'auto-tracker-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

/** Einstellungs-Seite auf `/settings` (T2.3). Rendert nur, Logik im ViewModel-Hook. */
export function SettingsPage({ container }: { container: Container }) {
  const {
    settings,
    error,
    available,
    add,
    remove,
    update,
    withWeight,
    withKnockout,
    withNumberBounds,
    setThreshold,
    exportBackup,
    importBackup,
  } = useSettingsViewModel(container);

  return (
    <section className="settings">
      <p className="label">Auto-Tracker</p>
      <h1>Einstellungen</h1>
      {error && (
        <p role="alert" className="settings__error">
          {error}
        </p>
      )}
      {settings && (
        <>
          <div className="settings__criteria">
            {settings.criteria.map((criterion) => (
              <CriterionEditor
                key={criterion.id}
                criterion={criterion}
                onWeight={(weight) => update(withWeight(settings.criteria, criterion.id, weight))}
                onKnockout={(knockout) =>
                  update(withKnockout(settings.criteria, criterion.id, knockout))
                }
                onNumber={(patch) =>
                  update(withNumberBounds(settings.criteria, criterion.id, patch))
                }
                onRemove={() => remove(criterion.id)}
              />
            ))}
          </div>

          {available.length > 0 && (
            <div className="settings__add">
              <Label>Kriterium hinzufügen</Label>
              <div className="settings__add-buttons">
                {available.map((attribute) => (
                  <button
                    key={attribute.key}
                    type="button"
                    className="settings__add-button"
                    onClick={() => add(attribute.key)}
                  >
                    {attribute.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="settings__threshold">
            <Label>Vorschläge</Label>
            <label className="settings__threshold-row">
              <span>Schwellwert (Score ab dem ein Auto vorgeschlagen wird)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.suggestionThreshold}
                onChange={(e) => {
                  const value = e.target.valueAsNumber;
                  if (Number.isFinite(value)) setThreshold(value);
                }}
                aria-label="Vorschlags-Schwellwert"
              />
            </label>
          </div>

          <div className="settings__backup">
            <Label>Backup</Label>
            <div className="settings__backup-buttons">
              <PrimaryButton
                onClick={() => {
                  void exportBackup().then(downloadBackup);
                }}
              >
                Backup exportieren
              </PrimaryButton>
              <label className="settings__import">
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void file.text().then((text) => void importBackup(text));
                    e.target.value = '';
                  }}
                  aria-label="Backup-Datei importieren"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
