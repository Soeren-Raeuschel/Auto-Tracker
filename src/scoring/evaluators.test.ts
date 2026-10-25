import { describe, expect, it } from 'vitest';
import type { Criterion } from '../domain/criterion';
import { BooleanEvaluator, ChoiceEvaluator, NumberEvaluator } from './evaluators';

const base = { id: 'c', label: 'L', attributeKey: 'k', weight: 1, knockout: false };

describe('evaluators', () => {
  it('ChoiceEvaluator maps options to scores and returns null for unknown options', () => {
    const criterion: Criterion = { ...base, kind: 'choice', scores: { gut: 1, mittel: 0.5 } };
    const evaluator = new ChoiceEvaluator();
    expect(evaluator.evaluate(criterion, 'mittel')).toBe(0.5);
    expect(evaluator.evaluate(criterion, 'schlecht')).toBeNull();
    expect(evaluator.evaluate(criterion, null)).toBeNull();
  });

  it('NumberEvaluator handles higher-better and a degenerate range', () => {
    const higher: Criterion = {
      ...base,
      kind: 'number',
      direction: 'higher-better',
      min: 100,
      max: 300,
    };
    const flat: Criterion = {
      ...higher,
      kind: 'number',
      direction: 'higher-better',
      min: 5,
      max: 5,
    };
    const evaluator = new NumberEvaluator();
    expect(evaluator.evaluate(higher, 200)).toBe(0.5);
    expect(evaluator.evaluate(flat, 6)).toBe(1);
    expect(evaluator.evaluate(flat, 4)).toBe(0);
  });

  it('an evaluator rejects a criterion of the wrong kind', () => {
    const criterion: Criterion = { ...base, kind: 'boolean' };
    expect(() => new NumberEvaluator().evaluate(criterion, 1)).toThrow(/received criterion/);
    expect(new BooleanEvaluator().evaluate(criterion, 'ja')).toBeNull();
  });
});
