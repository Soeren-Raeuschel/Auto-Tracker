import type { CSSProperties } from 'react';
import type { CriteriaSliderVM } from '../viewmodels/criteriaPanelViewModel';
import './CriteriaSlider.css';

interface CriteriaSliderProps {
  slider: CriteriaSliderVM;
  onWeight: (weight: number) => void;
}

/**
 * Slider fuer ein Kriterium (T10.5). Reines Rendering, Werte kommen von oben.
 * Track 4 px mit Fuellung, runder Griff 16 px, 44 px Trefferflaeche.
 */
export function CriteriaSlider({ slider, onWeight }: CriteriaSliderProps) {
  return (
    <div className="criteria-slider">
      <div className="criteria-slider__head">
        <span className="criteria-slider__label">{slider.label}</span>
        <span className="criteria-slider__weight">
          {slider.knockoutLabel && (
            <span className="criteria-slider__ko">{slider.knockoutLabel}</span>
          )}
          {slider.weightLabel}
        </span>
      </div>
      <input
        type="range"
        className="criteria-slider__input"
        min={0}
        max={5}
        step={1}
        value={slider.weight}
        onChange={(e) => onWeight(Number(e.target.value))}
        style={{ '--fill-percent': `${slider.fillPercent}%` } as CSSProperties}
        aria-label={`Gewicht für ${slider.label}`}
      />
    </div>
  );
}
