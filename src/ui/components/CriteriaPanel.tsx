import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { Label } from './Label';
import { PrimaryButton } from './PrimaryButton';
import { CriteriaSlider } from './CriteriaSlider';
import type { CriteriaSliderVM } from '../viewmodels/criteriaPanelViewModel';
import './CriteriaPanel.css';

interface CriteriaPanelProps {
  sliders: CriteriaSliderVM[];
  open: boolean;
  onClose: () => void;
  onWeight: (id: string, weight: number) => void;
  onAdd: () => void;
}

/**
 * Kriterien-Panel (T10.5): Desktop rechts fix sichtbar, mobil als Bottom Sheet.
 * Reines Rendering, Werte und Aenderungen kommen von oben.
 */
export function CriteriaPanel({ sliders, open, onClose, onWeight, onAdd }: CriteriaPanelProps) {
  return (
    <aside className={`criteria-panel${open ? ' criteria-panel--open' : ''}`}>
      <GlassCard className="criteria-panel__card">
        <div className="criteria-panel__head">
          <Label>Kriterien</Label>
          <button
            type="button"
            className="criteria-panel__close"
            onClick={onClose}
            aria-label="Kriterien-Panel schließen"
          >
            <Icon name="chevronDown" size={20} />
          </button>
        </div>

        {sliders.length === 0 ? (
          <p className="criteria-panel__empty">Noch keine Kriterien. Lege welche an.</p>
        ) : (
          <div className="criteria-panel__sliders">
            {sliders.map((slider) => (
              <CriteriaSlider
                key={slider.id}
                slider={slider}
                onWeight={(weight) => onWeight(slider.id, weight)}
              />
            ))}
          </div>
        )}

        <PrimaryButton onClick={onAdd}>Kriterium hinzufügen</PrimaryButton>
      </GlassCard>
    </aside>
  );
}
