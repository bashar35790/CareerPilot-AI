import { describe, expect, it } from 'vitest';
import { runEvaluation } from './evaluate';

describe('AI deterministic matching evaluation harness', () => {
  const report = runEvaluation();
  const { precision, recall, missingAccuracy, matchedExactMatchRate } = report.metrics;

  it('meets or exceeds the skill extraction precision target (>= 90%)', () => {
    expect(precision).toBeGreaterThanOrEqual(0.9);
  });

  it('meets or exceeds the skill extraction recall target (>= 85%)', () => {
    expect(recall).toBeGreaterThanOrEqual(0.85);
  });

  it('meets or exceeds the missing-skill accuracy target (>= 90%)', () => {
    expect(missingAccuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('identifies the matched-skill set for every benchmark pair', () => {
    expect(matchedExactMatchRate).toBe(1);
  });
});
