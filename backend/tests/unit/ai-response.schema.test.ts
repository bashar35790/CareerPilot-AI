import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  matchedSkillSchema,
  missingSkillSchema,
  recommendationSchema,
  resumeAnalysisResponseSchema,
  skillCategorySchema,
  skillRelevanceSchema,
} from '../../src/schemas/ai-response.schema';

const validAnalysis = {
  overallScore: 82,
  skillScore: 85,
  experienceScore: 78,
  summary: 'Strong alignment with the target role across core backend engineering skills.',
  matchedSkills: [
    {
      name: 'PostgreSQL',
      category: 'DATABASE',
      relevance: 'HIGH',
      evidenceFromResume: 'Built REST APIs backed by PostgreSQL.',
    },
  ],
  missingRequiredSkills: [
    {
      name: 'Kubernetes',
      category: 'DEVOPS',
      relevance: 'HIGH',
      contextualNote: 'Required for deploying containerized services.',
    },
  ],
  missingPreferredSkills: [
    {
      name: 'AWS',
      category: 'DEVOPS',
      relevance: 'LOW',
      contextualNote: 'Preferred cloud provider for the team.',
    },
  ],
  recommendations: [
    {
      category: 'BULLET_POINT_REWRITE',
      priority: 'HIGH',
      original: 'Worked on APIs.',
      improved: 'Accomplished X as measured by Y by doing Z.',
      rationale: 'Quantifies engineering impact.',
    },
  ],
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function firstIssue(result: z.SafeParseReturnType<unknown, unknown>) {
  if (result.success) {
    throw new Error('Expected the payload to fail validation');
  }
  return result.error.issues[0];
}

function issuePaths(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) {
    throw new Error('Expected the payload to fail validation');
  }
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('skillCategorySchema & skillRelevanceSchema', () => {
  it('accepts every documented skill category', () => {
    for (const category of ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'DEVOPS', 'CONCEPT', 'TOOL']) {
      expect(skillCategorySchema.safeParse(category).success).toBe(true);
    }
  });

  it('rejects unknown skill categories', () => {
    expect(skillCategorySchema.safeParse('CLOUD').success).toBe(false);
    expect(skillCategorySchema.safeParse('language').success).toBe(false);
    expect(skillCategorySchema.safeParse('').success).toBe(false);
  });

  it('accepts every documented relevance level', () => {
    for (const relevance of ['HIGH', 'MEDIUM', 'LOW']) {
      expect(skillRelevanceSchema.safeParse(relevance).success).toBe(true);
    }
  });

  it('rejects unlisted relevance levels', () => {
    expect(skillRelevanceSchema.safeParse('CRITICAL').success).toBe(false);
    expect(skillRelevanceSchema.safeParse('high').success).toBe(false);
  });
});

describe('resumeAnalysisResponseSchema: happy path', () => {
  it('parses a fully populated analysis payload', () => {
    const result = resumeAnalysisResponseSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({
      overallScore: 82,
      skillScore: 85,
      experienceScore: 78,
    });
  });

  it('parses the canonical API specification example', () => {
    const example = {
      overallScore: 78,
      skillScore: 82,
      experienceScore: 70,
      summary:
        'Strong alignment with core backend technologies (Node.js, Express, PostgreSQL). Gaps identified in containerization (Docker) and caching mechanisms.',
      matchedSkills: [
        { name: 'Node.js', category: 'FRAMEWORK', relevance: 'HIGH', evidenceFromResume: 'Built APIs with Node.js.' },
        { name: 'PostgreSQL', category: 'DATABASE', relevance: 'HIGH', evidenceFromResume: 'Modelled relations in PostgreSQL.' },
        { name: 'REST APIs', category: 'CONCEPT', relevance: 'HIGH', evidenceFromResume: 'Designed REST endpoints.' },
      ],
      missingRequiredSkills: [
        {
          name: 'Prisma',
          category: 'TOOL',
          relevance: 'HIGH',
          contextualNote: 'Required for ORM data layer',
        },
      ],
      missingPreferredSkills: [
        {
          name: 'Docker',
          category: 'DEVOPS',
          relevance: 'MEDIUM',
          contextualNote: 'Bonus qualification in posting',
        },
      ],
      recommendations: [
        {
          category: 'SKILL_INTEGRATION',
          priority: 'HIGH',
          improved: 'Highlight Prisma ORM experience in projects section.',
          rationale: 'Addresses an explicit requirement.',
        },
        {
          category: 'BULLET_POINT_REWRITE',
          priority: 'HIGH',
          original: 'Built backend APIs for web application using Express and SQL database.',
          improved: 'Accomplished a 25% query latency reduction by architecting Express endpoints over PostgreSQL.',
          rationale: 'Incorporates exact job keywords and quantifies engineering impact.',
        },
      ],
    };

    const result = resumeAnalysisResponseSchema.safeParse(example);
    expect(result.success).toBe(true);
  });

  it('accepts empty skill and recommendation arrays', () => {
    const result = resumeAnalysisResponseSchema.safeParse({
      ...clone(validAnalysis),
      matchedSkills: [],
      missingRequiredSkills: [],
      missingPreferredSkills: [],
      recommendations: [],
    });
    expect(result.success).toBe(true);
  });

  it('strips unknown top-level keys instead of failing', () => {
    const result = resumeAnalysisResponseSchema.safeParse({
      ...clone(validAnalysis),
      unexpectedField: 'should be ignored',
    });
    expect(result.success).toBe(true);
    expect(result.success && (result.data as Record<string, unknown>).unexpectedField).toBeUndefined();
  });
});

describe('resumeAnalysisResponseSchema: score bounds', () => {
  it('accepts the inclusive 0 and 100 boundaries', () => {
    for (const field of ['overallScore', 'skillScore', 'experienceScore']) {
      expect(
        resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), [field]: 0 }).success
      ).toBe(true);
      expect(
        resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), [field]: 100 }).success
      ).toBe(true);
    }
  });

  it('rejects scores above 100 or below 0', () => {
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), overallScore: 101 }).success).toBe(false);
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), skillScore: -1 }).success).toBe(false);
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), experienceScore: 150 }).success).toBe(false);
  });

  it('rejects non-integer and non-numeric scores', () => {
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), overallScore: 82.5 }).success).toBe(false);
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), skillScore: '85' }).success).toBe(false);
    expect(resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), experienceScore: null }).success).toBe(false);
  });
});

describe('resumeAnalysisResponseSchema: summary constraints', () => {
  it('enforces the 20 to 1000 character window', () => {
    const base = clone(validAnalysis);
    expect(resumeAnalysisResponseSchema.safeParse({ ...base, summary: 'a'.repeat(19) }).success).toBe(false);
    expect(resumeAnalysisResponseSchema.safeParse({ ...base, summary: 'a'.repeat(20) }).success).toBe(true);
    expect(resumeAnalysisResponseSchema.safeParse({ ...base, summary: 'a'.repeat(1000) }).success).toBe(true);
    expect(resumeAnalysisResponseSchema.safeParse({ ...base, summary: 'a'.repeat(1001) }).success).toBe(false);
  });

  it('rejects a missing summary and flags the correct path', () => {
    const payload: Record<string, unknown> = clone(validAnalysis);
    delete payload.summary;
    const result = resumeAnalysisResponseSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('summary');
  });
});

describe('matchedSkillSchema', () => {
  const valid = validAnalysis.matchedSkills[0];

  it('requires a non-empty name and evidence', () => {
    expect(matchedSkillSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(matchedSkillSchema.safeParse({ ...valid, evidenceFromResume: '' }).success).toBe(false);
  });

  it('enforces the 500 character evidence ceiling', () => {
    expect(
      matchedSkillSchema.safeParse({ ...valid, evidenceFromResume: 'a'.repeat(500) }).success
    ).toBe(true);
    expect(
      matchedSkillSchema.safeParse({ ...valid, evidenceFromResume: 'a'.repeat(501) }).success
    ).toBe(false);
  });

  it('rejects a missing evidence field', () => {
    const { evidenceFromResume, ...withoutEvidence } = valid;
    void evidenceFromResume;
    const result = matchedSkillSchema.safeParse(withoutEvidence);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('evidenceFromResume');
  });

  it('rejects invalid category and relevance enums', () => {
    expect(matchedSkillSchema.safeParse({ ...valid, category: 'CLOUD' }).success).toBe(false);
    expect(matchedSkillSchema.safeParse({ ...valid, relevance: 'CRITICAL' }).success).toBe(false);
  });
});

describe('missingSkillSchema', () => {
  const valid = validAnalysis.missingRequiredSkills[0];

  it('requires a contextual note rather than evidence', () => {
    expect(missingSkillSchema.safeParse(valid).success).toBe(true);
    expect(missingSkillSchema.safeParse({ ...valid, contextualNote: '' }).success).toBe(false);
    const { contextualNote, ...withoutNote } = valid;
    void contextualNote;
    const result = missingSkillSchema.safeParse(withoutNote);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('contextualNote');
  });

  it('rejects an evidence field that is not part of the contract', () => {
    const result = missingSkillSchema.safeParse({
      ...valid,
      evidenceFromResume: 'not part of the missing-skills contract',
    });
    expect(result.success).toBe(true);
    expect(
      result.success && (result.data as Record<string, unknown>).evidenceFromResume
    ).toBeUndefined();
  });

  it('enforces the contextual note ceiling', () => {
    expect(missingSkillSchema.safeParse({ ...valid, contextualNote: 'a'.repeat(501) }).success).toBe(false);
  });
});

describe('recommendationSchema', () => {
  const valid = validAnalysis.recommendations[0];

  it('accepts all documented recommendation categories', () => {
    for (const category of ['SKILL_INTEGRATION', 'BULLET_POINT_REWRITE', 'EXPERIENCE_FRAMING']) {
      expect(recommendationSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('rejects unknown recommendation categories', () => {
    expect(recommendationSchema.safeParse({ ...valid, category: 'COVER_LETTER' }).success).toBe(false);
  });

  it('treats original as optional but requires improved and rationale', () => {
    const { original, ...withoutOriginal } = valid;
    void original;
    expect(recommendationSchema.safeParse(withoutOriginal).success).toBe(true);
    expect(recommendationSchema.safeParse({ ...valid, improved: '' }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...valid, rationale: '' }).success).toBe(false);
  });

  it('rejects a missing improved field and flags the path', () => {
    const { improved, ...withoutImproved } = valid;
    void improved;
    const result = recommendationSchema.safeParse(withoutImproved);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('improved');
  });

  it('enforces the improved and rationale ceilings', () => {
    expect(recommendationSchema.safeParse({ ...valid, improved: 'a'.repeat(1001) }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...valid, rationale: 'a'.repeat(1001) }).success).toBe(false);
  });
});

describe('resumeAnalysisResponseSchema: structural integrity', () => {
  it('rejects an analysis where a nested skill violates the contract', () => {
    const payload = clone(validAnalysis);
    payload.matchedSkills[0].category = 'NOT_A_CATEGORY' as never;
    const result = resumeAnalysisResponseSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('matchedSkills.0.category');
  });

  it('rejects arrays replaced by a non-array value', () => {
    expect(
      resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), matchedSkills: {} }).success
    ).toBe(false);
  });

  it('produces the first issue for the offending field', () => {
    const issue = firstIssue(
      resumeAnalysisResponseSchema.safeParse({ ...clone(validAnalysis), overallScore: 999 })
    );
    expect(issue.path.join('.')).toBe('overallScore');
  });
});
