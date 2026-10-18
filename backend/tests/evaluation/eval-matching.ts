import './load-env';
import { disconnectDatabase } from '../../src/lib/prisma';
import { runEvaluation } from './evaluate';

const PRECISION_TARGET = 0.9;
const RECALL_TARGET = 0.85;
const MISSING_ACCURACY_TARGET = 0.9;

async function main(): Promise<void> {
  const report = runEvaluation();
  const { precision, recall, missingAccuracy } = report.metrics;

  const passed =
    precision >= PRECISION_TARGET &&
    recall >= RECALL_TARGET &&
    missingAccuracy >= MISSING_ACCURACY_TARGET;

  console.log(
    passed
      ? 'RESULT: PASS — all deterministic matching thresholds met.'
      : 'RESULT: FAIL — one or more deterministic matching thresholds missed.'
  );

  await disconnectDatabase();
  process.exitCode = passed ? 0 : 1;
}

void main().catch(async (error) => {
  console.error('Evaluation runner crashed:', error);
  await disconnectDatabase();
  process.exitCode = 1;
});
