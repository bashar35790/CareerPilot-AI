import { describe, expect, it } from 'vitest';
import {
  roadmapGenerationResponseSchema,
} from '../../src/schemas/ai-response.schema';
import {
  createRoadmapSchema,
  roadmapTaskIdParamSchema,
  updateRoadmapTaskSchema,
} from '../../src/schemas/roadmap.schema';

const validAnalysisId = 'c3e98b4b-326e-4c12-a7d1-9257e8fa10b9';

describe('createRoadmapSchema', () => {
  it('accepts a valid payload and applies the default timeframe', () => {
    const parsed = createRoadmapSchema.safeParse({
      analysisId: validAnalysisId,
      targetRole: 'Backend Engineer',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.timeframe).toBe('6_MONTHS');
    }
  });

  it('rejects a non-uuid analysis id', () => {
    const parsed = createRoadmapSchema.safeParse({
      analysisId: 'not-a-uuid',
      targetRole: 'Backend Engineer',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects an unsupported timeframe', () => {
    const parsed = createRoadmapSchema.safeParse({
      analysisId: validAnalysisId,
      targetRole: 'Backend Engineer',
      timeframe: '24_MONTHS',
    });

    expect(parsed.success).toBe(false);
  });
});

describe('updateRoadmapTaskSchema', () => {
  it('requires a boolean isCompleted flag', () => {
    expect(updateRoadmapTaskSchema.safeParse({ isCompleted: true }).success).toBe(true);
    expect(updateRoadmapTaskSchema.safeParse({ isCompleted: 'yes' }).success).toBe(false);
  });

  it('validates the roadmap task id param', () => {
    expect(roadmapTaskIdParamSchema.safeParse({ taskId: validAnalysisId }).success).toBe(true);
    expect(roadmapTaskIdParamSchema.safeParse({ taskId: '123' }).success).toBe(false);
  });
});

describe('roadmapGenerationResponseSchema', () => {
  const valid = {
    phases: [
      {
        phaseNumber: 1,
        phaseTitle: 'Phase 1: Foundations',
        tasks: [{ title: 'Learn Prisma', description: 'Build a CRUD app with Prisma.' }],
      },
    ],
  };

  it('accepts a well-formed roadmap', () => {
    expect(roadmapGenerationResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty phases array', () => {
    expect(roadmapGenerationResponseSchema.safeParse({ phases: [] }).success).toBe(false);
  });

  it('rejects a phase without tasks', () => {
    const parsed = roadmapGenerationResponseSchema.safeParse({
      phases: [{ phaseNumber: 1, phaseTitle: 'Phase 1: Foundations', tasks: [] }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a task missing its description', () => {
    const parsed = roadmapGenerationResponseSchema.safeParse({
      phases: [
        {
          phaseNumber: 1,
          phaseTitle: 'Phase 1: Foundations',
          tasks: [{ title: 'Learn Prisma' }],
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
