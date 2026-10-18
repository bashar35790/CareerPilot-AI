import { describe, expect, it } from 'vitest';
import {
  SCORE_WEIGHTS,
  buildXyzRewrite,
  clampScore,
  computeCompletenessScore,
  computeOverallScore,
  formatRecommendations,
  isXyzFormatted,
  reconcileAnalysis,
} from '../../src/services/matching.reconciliation';
import type {
  DeterministicMatchResult,
  ExtractedSkill,
} from '../../src/services/matching.deterministic';
import type { ResumeAnalysisResponse } from '../../src/schemas/ai-response.schema';

function skill(
  name: string,
  normalizedName: string,
  category: ExtractedSkill['category']
): ExtractedSkill {
  return { id: `skill:${normalizedName}`, name, normalizedName, category, occurrences: 1 };
}

const deterministic = {
  resumeSkills: [],
  jobSkills: [],
  matchedSkills: [skill('React', 'react', 'FRAMEWORK'), skill('Node.js', 'nodejs', 'FRAMEWORK')],
  missingRequiredCandidates: [skill('Kubernetes', 'kubernetes', 'DEVOPS')],
  additionalResumeSkills: [skill('Docker', 'docker', 'DEVOPS')],
  deterministicSkillScore: 67,
} as unknown as DeterministicMatchResult;

const llm = {
  overallScore: 70,
  skillScore: 65,
  experienceScore: 72,
  summary: 'A solid backend profile that aligns well with the core requirements of the role.',
  matchedSkills: [
    {
      name: 'React',
      category: 'FRAMEWORK',
      relevance: 'HIGH',
      evidenceFromResume: 'Built production dashboards with React.',
    },
    {
      name: 'TypeScript',
      category: 'LANGUAGE',
      relevance: 'HIGH',
      evidenceFromResume: 'Wrote the entire API layer in TypeScript.',
    },
  ],
  missingRequiredSkills: [
    {
      name: 'Kubernetes',
      category: 'DEVOPS',
      relevance: 'HIGH',
      contextualNote: 'Required for orchestrating the platform services.',
    },
    {
      name: 'Redis',
      category: 'DATABASE',
      relevance: 'MEDIUM',
      contextualNote: 'Used for caching frequently requested data.',
    },
  ],
  missingPreferredSkills: [
    {
      name: 'AWS',
      category: 'DEVOPS',
      relevance: 'LOW',
      contextualNote: 'Preferred cloud provider for this team.',
    },
  ],
  recommendations: [
    {
      category: 'SKILL_INTEGRATION',
      priority: 'LOW',
      improved: 'Learn AWS',
      rationale: 'Broadens deployment options.',
    },
    {
      category: 'BULLET_POINT_REWRITE',
      priority: 'HIGH',
      original: 'Did some work on APIs',
      improved: '- Accomplished X for 40% faster responses',
      rationale: 'Adds measurable impact.',
    },
    {
      category: 'SKILL_INTEGRATION',
      priority: 'MEDIUM',
      improved: 'learn aws',
      rationale: 'Duplicate entry.',
    },
  ],
} as unknown as ResumeAnalysisResponse;

const richResume = [
  'John Doe  johndoe@example.com',
  'Summary: Backend engineer focused on reliable APIs.',
  'Experience: 5 years building services.',
  'Projects: built a payments API.',
  'Education: B.S. Computer Science.',
  'Skills: Node.js, PostgreSQL.',
  'Reduced latency by 40% across 10000 requests per day.',
].join('\n');

function run(text = richResume) {
  return reconcileAnalysis({ resumeText: text, deterministic, llm });
}

describe('score weights & math', () => {
  it('uses the documented 55/35/10 weighting', () => {
    expect(SCORE_WEIGHTS).toEqual({ skill: 0.55, experience: 0.35, completeness: 0.1 });
    expect(computeOverallScore(80, 70, 90)).toBe(78);
    expect(computeOverallScore(60, 72, 100)).toBe(68);
  });

  it('clamps values into the 0-100 range', () => {
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(Number.NaN)).toBe(0);
    expect(computeOverallScore(100, 100, 100)).toBe(100);
    expect(computeOverallScore(0, 0, 0)).toBe(0);
  });

  it('never produces out-of-range scores even with hostile input', () => {
    const hostile = { ...llm, experienceScore: 250 } as unknown as ResumeAnalysisResponse;
    const result = reconcileAnalysis({ resumeText: richResume, deterministic, llm: hostile });
    for (const value of Object.values(result.scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('exposes weights that sum to a full 100%', () => {
    const total = SCORE_WEIGHTS.skill + SCORE_WEIGHTS.experience + SCORE_WEIGHTS.completeness;
    expect(total).toBeCloseTo(1, 10);
  });

  it('rounds the weighted result to the nearest integer', () => {
    // 0.55*55 + 0.35*35 + 0.10*10 = 43.5 -> 44
    expect(computeOverallScore(55, 35, 10)).toBe(44);
    // 0.55*54 + 0.35*54 + 0.10*54 = 54
    expect(computeOverallScore(54, 54, 54)).toBe(54);
  });

  it('treats a missing completeness score as a zero contribution', () => {
    expect(computeOverallScore(100, 100, 0)).toBe(90);
  });

  it('yields a zero skill score when the job exposes no skills', () => {
    const emptyDeterministic = {
      resumeSkills: [],
      jobSkills: [],
      matchedSkills: [],
      missingRequiredCandidates: [],
      additionalResumeSkills: [],
      deterministicSkillScore: 0,
    } as unknown as DeterministicMatchResult;
    const noSkills = {
      ...llm,
      matchedSkills: [],
      missingRequiredSkills: [],
      missingPreferredSkills: [],
    } as unknown as ResumeAnalysisResponse;

    const result = reconcileAnalysis({
      resumeText: richResume,
      deterministic: emptyDeterministic,
      llm: noSkills,
    });

    expect(result.scores.skillScore).toBe(0);
    expect(result.stats.requiredTotal).toBe(0);
    expect(result.scores.overallScore).toBe(35);
  });

  it('promotes a deterministic gap to matched when the LLM evidences the skill', () => {
    const llmWithKubernetes = {
      ...llm,
      matchedSkills: [
        ...llm.matchedSkills,
        {
          name: 'Kubernetes',
          category: 'DEVOPS',
          relevance: 'MEDIUM',
          evidenceFromResume: 'Operated a managed Kubernetes cluster.',
        },
      ],
    } as unknown as ResumeAnalysisResponse;

    const result = reconcileAnalysis({
      resumeText: richResume,
      deterministic,
      llm: llmWithKubernetes,
    });

    expect(result.matchedSkills.map((s) => s.name)).toContain('Kubernetes');
    expect(result.missingRequiredSkills.map((s) => s.name)).not.toContain('Kubernetes');
    expect(result.skills.find((s) => s.name === 'Kubernetes')?.source).toBe('LLM');
  });

  it('recomputes the skill score from reconciled counts, not the deterministic estimate', () => {
    const result = run();
    const expected = Math.round(
      (result.stats.matchedTotal / result.stats.requiredTotal) * 100
    );
    expect(result.scores.skillScore).toBe(expected);
    expect(result.scores.skillScore).not.toBe(deterministic.deterministicSkillScore);
  });
});

describe('completeness scoring', () => {
  it('scores a fully populated resume at 100', () => {
    expect(computeCompletenessScore(richResume)).toBe(100);
  });

  it('scores an empty resume at 0', () => {
    expect(computeCompletenessScore('')).toBe(0);
  });

  it('awards partial credit for individual sections', () => {
    expect(computeCompletenessScore('reach me at jane@example.com')).toBe(
      Math.round((1 / 7) * 100)
    );
  });
});

describe('skill reconciliation', () => {
  it('merges deterministic exact matches with LLM semantic matches', () => {
    const result = run();
    const names = result.matchedSkills.map((s) => s.name).sort();
    expect(names).toEqual(['Node.js', 'React', 'TypeScript']);
    expect(result.matchedSkills.find((s) => s.name === 'React')?.source).toBe('HYBRID');
    expect(result.matchedSkills.find((s) => s.name === 'Node.js')?.source).toBe('DETERMINISTIC');
    expect(result.matchedSkills.find((s) => s.name === 'TypeScript')?.source).toBe('LLM');
  });

  it('classifies missing skills into required and preferred badges', () => {
    const result = run();
    expect(result.missingRequiredSkills.map((s) => s.name).sort()).toEqual([
      'Kubernetes',
      'Redis',
    ]);
    expect(result.missingPreferredSkills.map((s) => s.name)).toEqual(['AWS']);
    expect(result.missingRequiredSkills.every((s) => s.matchType === 'MISSING_REQUIRED')).toBe(true);
    expect(result.missingPreferredSkills.every((s) => s.matchType === 'MISSING_PREFERRED')).toBe(
      true
    );
  });

  it('keeps every skill in exactly one bucket', () => {
    const result = run();
    const keys = result.skills.map((s) => s.name.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    expect(result.skills).toHaveLength(6);
  });

  it('derives the skill score from matched vs required counts', () => {
    const result = run();
    expect(result.stats).toEqual({
      requiredTotal: 5,
      matchedTotal: 3,
      missingRequiredTotal: 2,
      missingPreferredTotal: 1,
    });
    expect(result.scores.skillScore).toBe(60);
  });

  it('produces the reconciled weighted breakdown', () => {
    const result = run();
    expect(result.scores).toEqual({
      skillScore: 60,
      experienceScore: 72,
      completenessScore: 100,
      overallScore: 68,
    });
    expect(result.summary).toContain('backend profile');
  });
});

describe('recommendation formatting', () => {
  it('sorts by priority, strips bullets, and removes duplicates', () => {
    const formatted = formatRecommendations(llm.recommendations);
    expect(formatted).toHaveLength(2);
    expect(formatted.map((r) => r.priority)).toEqual(['HIGH', 'LOW']);
    expect(formatted[0].improved).toBe('Accomplished X for 40% faster responses');
  });

  it('exposes XYZ helpers', () => {
    const rewrite = buildXyzRewrite({
      accomplishment: 'API reliability improvements',
      metric: 'a 40% latency reduction',
      method: 'introducing Redis caching',
    });
    expect(rewrite).toBe(
      'Accomplished API reliability improvements as measured by a 40% latency reduction, by introducing Redis caching.'
    );
    expect(isXyzFormatted(rewrite)).toBe(true);
    expect(isXyzFormatted('Did some work')).toBe(false);
  });
});
