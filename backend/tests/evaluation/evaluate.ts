import {
  buildCanonicalCatalog,
  matchDeterministically,
} from '../../src/services/matching.deterministic';
import { EVALUATION_PAIRS } from './dataset';

const catalog = buildCanonicalCatalog();

export interface SetStats {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface PairResult {
  id: string;
  scenario: string;
  extraction: SetStats;
  matchedSkills: { identified: string[]; expected: string[]; correct: boolean };
  missingRequired: { identified: string[]; expected: string[]; correct: boolean };
}

export interface EvaluationMetrics {
  precision: number;
  recall: number;
  f1: number;
  matchedExactMatchRate: number;
  missingPrecision: number;
  missingRecall: number;
  missingAccuracy: number;
  averageLatencyMs: number;
  totalExtracted: number;
  totalGroundTruth: number;
}

export interface EvaluationReport {
  pairs: PairResult[];
  metrics: EvaluationMetrics;
}

function toSet(values: string[]): Set<string> {
  return new Set(values);
}

function difference(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => !right.has(value)).sort();
}

function intersectionSize(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) {
      count += 1;
    }
  }
  return count;
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 1;
  }
  return numerator / denominator;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function runEvaluation(): EvaluationReport {
  const extraction: SetStats = { truePositives: 0, falsePositives: 0, falseNegatives: 0 };
  const missing: SetStats = { truePositives: 0, falsePositives: 0, falseNegatives: 0 };
  let matchedExact = 0;
  let missingExact = 0;
  let totalLatencyMs = 0;
  const pairs: PairResult[] = [];

  for (const pair of EVALUATION_PAIRS) {
    const startedAt = performance.now();
    const result = matchDeterministically(pair.resumeText, pair.jobText, catalog);
    totalLatencyMs += performance.now() - startedAt;

    const extractedResume = new Set(result.resumeSkills.map((skill) => skill.normalizedName));
    const extractedJob = new Set(result.jobSkills.map((skill) => skill.normalizedName));
    const truthResume = toSet(pair.groundTruth.resume);
    const truthJob = toSet(pair.groundTruth.job);

    const pairExtraction: SetStats = { truePositives: 0, falsePositives: 0, falseNegatives: 0 };
    for (const [extracted, truth] of [
      [extractedResume, truthResume],
      [extractedJob, truthJob],
    ] as const) {
      pairExtraction.truePositives += intersectionSize(extracted, truth);
      pairExtraction.falsePositives += difference(extracted, truth).length;
      pairExtraction.falseNegatives += difference(truth, extracted).length;
    }
    extraction.truePositives += pairExtraction.truePositives;
    extraction.falsePositives += pairExtraction.falsePositives;
    extraction.falseNegatives += pairExtraction.falseNegatives;

    const expectedMissing = difference(truthJob, truthResume);
    const identifiedMissing = result.missingRequiredCandidates
      .map((skill) => skill.normalizedName)
      .sort();
    const expectedMatched = difference(truthJob, toSet(expectedMissing));
    const identifiedMatched = result.matchedSkills.map((skill) => skill.normalizedName).sort();

    const expectedMissingSet = toSet(expectedMissing);
    const identifiedMissingSet = toSet(identifiedMissing);
    missing.truePositives += intersectionSize(identifiedMissingSet, expectedMissingSet);
    missing.falsePositives += difference(identifiedMissingSet, expectedMissingSet).length;
    missing.falseNegatives += difference(expectedMissingSet, identifiedMissingSet).length;

    const matchedCorrect =
      expectedMatched.length === identifiedMatched.length &&
      expectedMatched.every((value, index) => value === identifiedMatched[index]);
    const missingCorrect =
      expectedMissing.length === identifiedMissing.length &&
      expectedMissing.every((value, index) => value === identifiedMissing[index]);

    if (matchedCorrect) {
      matchedExact += 1;
    }
    if (missingCorrect) {
      missingExact += 1;
    }

    pairs.push({
      id: pair.id,
      scenario: pair.scenario,
      extraction: pairExtraction,
      matchedSkills: { identified: identifiedMatched, expected: expectedMatched, correct: matchedCorrect },
      missingRequired: {
        identified: identifiedMissing,
        expected: expectedMissing,
        correct: missingCorrect,
      },
    });
  }

  const precision = ratio(
    extraction.truePositives,
    extraction.truePositives + extraction.falsePositives
  );
  const recall = ratio(
    extraction.truePositives,
    extraction.truePositives + extraction.falseNegatives
  );
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const missingPrecision = ratio(
    missing.truePositives,
    missing.truePositives + missing.falsePositives
  );
  const missingRecall = ratio(
    missing.truePositives,
    missing.truePositives + missing.falseNegatives
  );

  const report: EvaluationReport = {
    pairs,
    metrics: {
      precision: round(precision),
      recall: round(recall),
      f1: round(f1),
      matchedExactMatchRate: round(matchedExact / EVALUATION_PAIRS.length),
      missingPrecision: round(missingPrecision),
      missingRecall: round(missingRecall),
      missingAccuracy: round(missingExact / EVALUATION_PAIRS.length),
      averageLatencyMs: round(totalLatencyMs / EVALUATION_PAIRS.length),
      totalExtracted: extraction.truePositives + extraction.falsePositives,
      totalGroundTruth: extraction.truePositives + extraction.falseNegatives,
    },
  };

  printReport(report);
  return report;
}

function printReport(report: EvaluationReport): void {
  const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;

  console.log('\n=== CareerPilot AI — Deterministic Matching Evaluation ===\n');
  console.log('id    | scenario                          | TP | FP | FN | matched | missing');
  console.log('------+-----------------------------------+----+----+----+---------+--------');
  for (const pair of report.pairs) {
    const scenario = pair.scenario.padEnd(33).slice(0, 33);
    const e = pair.extraction;
    console.log(
      `${pair.id.padEnd(5)} | ${scenario} | ${String(e.truePositives).padStart(2)} | ${String(
        e.falsePositives
      ).padStart(2)} | ${String(e.falseNegatives).padStart(2)} | ${
        pair.matchedSkills.correct ? '  yes  ' : '   no  '
      } | ${pair.missingRequired.correct ? '  yes  ' : '   no  '}`
    );
  }

  const m = report.metrics;
  console.log('\n--- Aggregate scorecard ---');
  console.log(`Skill extraction precision : ${pct(m.precision)}  (target >= 90%)`);
  console.log(`Skill extraction recall    : ${pct(m.recall)}  (target >= 85%)`);
  console.log(`Skill extraction F1        : ${pct(m.f1)}`);
  console.log(`Missing-skill accuracy     : ${pct(m.missingAccuracy)}  (target >= 90%)`);
  console.log(`Missing-skill precision    : ${pct(m.missingPrecision)}`);
  console.log(`Missing-skill recall       : ${pct(m.missingRecall)}`);
  console.log(`Matched-skill exact-match  : ${pct(m.matchedExactMatchRate)}`);
  console.log(`Avg deterministic latency  : ${m.averageLatencyMs.toFixed(3)} ms per pair`);
  console.log(`Ground-truth skills total  : ${m.totalGroundTruth} (extracted ${m.totalExtracted})`);
  console.log(
    '\nNote: LLM (Gemini) JSON-schema adherence and qualitative scoring are validated'
  );
  console.log(
    'separately by tests/unit/gemini*.test.ts and tests/unit/ai-response.schema.test.ts.\n'
  );
}
