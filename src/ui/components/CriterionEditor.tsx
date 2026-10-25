import type { Criterion } from '../../domain/criterion';
import { GlassCard } from './GlassCard';
import { Label } from './Label';
import './CriterionEditor.css';

interface CriterionEditorProps {
  criterion: Criterion;
  onWeight: (weight: number) => void;
  onKnockout: (knockout: boolean) => void;
  onNumber: (patch: {
    direction?: 'higher-better' | 'lower-better';
    min?: number;
    max?: number;
  }) => void;
  onRemove: () => void;
}

/** Editor fuer ein Kriterium. Reines Rendering, Werte kommen von oben. */
export function CriterionEditor({
  criterion,
  onWeight,
  onKnockout,
  onNumber,
  onRemove,
}: CriterionEditorProps) {
  return (
    <GlassCard className="criterion-editor">
      <div className="criterion-editor__head">
        <span>{criterion.label}</span>
        <button type="button" className="criterion-editor__remove" onClick={onRemove}>
          Entfernen
        </button>
      </div>

      <label className="criterion-editor__field">
        <Label>Gewicht ({criterion.weight})</Label>
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={criterion.weight}
          onChange={(e) => onWeight(Number(e.target.value))}
          aria-label={`Gewicht für ${criterion.label}`}
        />
      </label>

      <label className="criterion-editor__toggle">
        <input
          type="checkbox"
          checked={criterion.knockout}
          onChange={(e) => onKnockout(e.target.checked)}
          aria-label={`K.-o.-Kriterium ${criterion.label}`}
        />
        <span>K.-o.: erfüllt das Auto das nicht, fliegt es raus</span>
      </label>

      {criterion.kind === 'number' && (
        <div className="criterion-editor__number">
          <label>
            <Label>Richtung</Label>
            <select
              value={criterion.direction}
              onChange={(e) =>
                onNumber({ direction: e.target.value as 'higher-better' | 'lower-better' })
              }
              aria-label={`Richtung für ${criterion.label}`}
            >
              <option value="higher-better">höher ist besser</option>
              <option value="lower-better">niedriger ist besser</option>
            </select>
          </label>
          <label>
            <Label>Minimum</Label>
            <input
              type="number"
              value={criterion.min}
              onChange={(e) => onNumber({ min: Number(e.target.value) })}
              aria-label={`Minimum für ${criterion.label}`}
            />
          </label>
          <label>
            <Label>Maximum</Label>
            <input
              type="number"
              value={criterion.max}
              onChange={(e) => onNumber({ max: Number(e.target.value) })}
              aria-label={`Maximum für ${criterion.label}`}
            />
          </label>
        </div>
      )}
    </GlassCard>
  );
}
