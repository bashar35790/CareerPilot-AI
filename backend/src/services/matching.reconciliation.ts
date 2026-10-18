import type {
  Recommendation,
  ResumeAnalysisResponse,
  SkillCategoryValue,
  SkillRelevanceValue,
} from '../schemas/ai-response.schema';
import type { DeterministicMatchResult, ExtractedSkill } from './matching.deterministic';

export type MatchType = 'MATCHED' | 'MISSING_REQUIRED' | 'MISSING_PREFERRED';
export type ReconciliationSource = 'DETERMINISTIC' | 'LLM' | 'HYBRID';

export interface ScoreWeights {
  skill: number;
  experience: number;
  completeness: number;
}

export const SCORE_WEIGHTS: ScoreWeights = {
  skill: 0.55,
  experience: 0.35,
  completeness: 0.1,
};

export interface ScoreBreakdown {
  skillScore: number;
  experienceScore: number;
  completenessScore: number;
  overallScore: number;
}

export interface ReconciledSkill {
  skillId?: string;
  name: string;
  category: SkillCategoryValue;
  relevance: SkillRelevanceValue;
  matchType: MatchType;
  source: ReconciliationSource;
  evidenceFromResume?: string;
  contextualNote?: string;
}

export interface ReconciliationStats {
  requiredTotal: number;
  matchedTotal: number;
  missingRequiredTotal: number;
  missingPreferredTotal: number;
}

export interface ReconciledAnalysis {
  scores: ScoreBreakdown;
  summary: string;
  matchedSkills: ReconciledSkill[];
  missingRequiredSkills: ReconciledSkill[];
  missingPreferredSkills: ReconciledSkill[];
  skills: ReconciledSkill[];
  recommendations: Recommendation[];
  stats: ReconciliationStats;
}

export interface ReconcileInput {
  resumeText: string;
  deterministic: DeterministicMatchResult;
  llm: ResumeAnalysisResponse;
}

const PRIORITY_ORDER: Record<SkillRelevanceValue, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

interface CompletenessSignal {
  label: string;
  pattern: RegExp;
}

const COMPLETENESS_SIGNALS: CompletenessSignal[] = [
  { label: 'contact', pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { label: 'summary', pattern: /\b(summary|objective|profile|about me)\b/i },
  { label: 'experience', pattern: /\b(experience|employment|work history|professional background)\b/i },
  { label: 'projects', pattern: /\bprojects?\b/i },
  {
    label: 'education',
    pattern: /\b(education|degree|bachelor|master|b\.?s\.?|b\.?tech|m\.?s\.?|university|college)\b/i,
  },
  { label: 'skills', pattern: /\b(skills|technologies|tech stack|competencies|technical proficiencies)\b/i },
  {
    label: 'metrics',
    pattern:
      /(\b\d+\s*%|[$€£]\s?\d|\b\d+\+?\s*(years?|yrs?|users?|customers?|clients?|projects?|requests?|hours?|months?)\b)/i,
  },
];

export function evaluateCompleteness(resumeText: string): string[] {
  const text = typeof resumeText === 'string' ? resumeText : '';
  return COMPLETENESS_SIGNALS.filter((signal) => signal.pattern.test(text)).map(
    (signal) => signal.label
  );
}

export function computeCompletenessScore(resumeText: string): number {
  const found = evaluateCompleteness(resumeText).length;
  return clampScore((found / COMPLETENESS_SIGNALS.length) * 100);
}

export function computeOverallScore(
  skillScore: number,
  experienceScore: number,
  completenessScore: number
): number {
  const weighted =
    SCORE_WEIGHTS.skill * clampScore(skillScore) +
    SCORE_WEIGHTS.experience * clampScore(experienceScore) +
    SCORE_WEIGHTS.completeness * clampScore(completenessScore);
  return clampScore(weighted);
}

function skillKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanBulletText(text: string): string {
  return text
    .trim()
    .replace(/^[-*•]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildXyzRewrite(parts: {
  accomplishment: string;
  metric: string;
  method: string;
}): string {
  return `Accomplished ${parts.accomplishment} as measured by ${parts.metric}, by ${parts.method}.`;
}

export function isXyzFormatted(text: string): boolean {
  return /^accomplished\b/i.test(text.trim());
}

export function formatRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();

  return recommendations
    .map((recommendation) => ({
      category: recommendation.category,
      priority: recommendation.priority,
      improved: cleanBulletText(recommendation.improved),
      rationale: cleanBulletText(recommendation.rationale),
      ...(recommendation.original ? { original: cleanBulletText(recommendation.original) } : {}),
    }))
    .filter((recommendation) => {
      const key = recommendation.improved.toLowerCase();
      if (key.length === 0 || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

function toReconciledSkill(
  skill: ExtractedSkill,
  matchType: MatchType,
  source: ReconciliationSource
): ReconciledSkill {
  return {
    skillId: skill.id,
    name: skill.name,
    category: skill.category,
    relevance: 'HIGH',
    matchType,
    source,
  };
}

function mergeSkill(
  bucket: Map<string, ReconciledSkill>,
  key: string,
  skill: ReconciledSkill
): void {
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, skill);
    return;
  }
  bucket.set(key, {
    ...existing,
    source: 'HYBRID',
    relevance: existing.relevance ?? skill.relevance,
    evidenceFromResume: existing.evidenceFromResume ?? skill.evidenceFromResume,
    contextualNote: existing.contextualNote ?? skill.contextualNote,
  });
}

export function reconcileAnalysis(input: ReconcileInput): ReconciledAnalysis {
  const { resumeText, deterministic, llm } = input;

  const matched = new Map<string, ReconciledSkill>();
  const missingRequired = new Map<string, ReconciledSkill>();
  const missingPreferred = new Map<string, ReconciledSkill>();

  // 1. Deterministic exact matches carry the highest confidence.
  for (const skill of deterministic.matchedSkills) {
    mergeSkill(matched, skillKey(skill.name), toReconciledSkill(skill, 'MATCHED', 'DETERMINISTIC'));
  }

  // 2. LLM semantic matches.
  for (const skill of llm.matchedSkills) {
    const key = skillKey(skill.name);
    if (missingRequired.has(key) || missingPreferred.has(key)) {
      continue;
    }
    mergeSkill(matched, key, {
      name: skill.name,
      category: skill.category,
      relevance: skill.relevance,
      matchType: 'MATCHED',
      source: 'LLM',
      evidenceFromResume: skill.evidenceFromResume,
    });
  }

  // 3. Missing required candidates: deterministic gaps first, then LLM.
  for (const skill of deterministic.missingRequiredCandidates) {
    const key = skillKey(skill.name);
    if (matched.has(key)) {
      continue;
    }
    mergeSkill(
      missingRequired,
      key,
      toReconciledSkill(skill, 'MISSING_REQUIRED', 'DETERMINISTIC')
    );
  }

  for (const skill of llm.missingRequiredSkills) {
    const key = skillKey(skill.name);
    if (matched.has(key)) {
      continue;
    }
    mergeSkill(missingRequired, key, {
      name: skill.name,
      category: skill.category,
      relevance: skill.relevance,
      matchType: 'MISSING_REQUIRED',
      source: 'LLM',
      contextualNote: skill.contextualNote,
    });
  }

  // 4. Missing preferred (bonus) skills from the LLM only.
  for (const skill of llm.missingPreferredSkills) {
    const key = skillKey(skill.name);
    if (matched.has(key) || missingRequired.has(key)) {
      continue;
    }
    mergeSkill(missingPreferred, key, {
      name: skill.name,
      category: skill.category,
      relevance: skill.relevance,
      matchType: 'MISSING_PREFERRED',
      source: 'LLM',
      contextualNote: skill.contextualNote,
    });
  }

  const matchedSkills = [...matched.values()];
  const missingRequiredSkills = [...missingRequired.values()];
  const missingPreferredSkills = [...missingPreferred.values()];

  const requiredTotal = matchedSkills.length + missingRequiredSkills.length;
  const skillScore =
    requiredTotal === 0 ? 0 : clampScore((matchedSkills.length / requiredTotal) * 100);
  const experienceScore = clampScore(llm.experienceScore);
  const completenessScore = computeCompletenessScore(resumeText);
  const overallScore = computeOverallScore(skillScore, experienceScore, completenessScore);

  return {
    scores: { skillScore, experienceScore, completenessScore, overallScore },
    summary: llm.summary.trim(),
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    skills: [...matchedSkills, ...missingRequiredSkills, ...missingPreferredSkills],
    recommendations: formatRecommendations(llm.recommendations),
    stats: {
      requiredTotal,
      matchedTotal: matchedSkills.length,
      missingRequiredTotal: missingRequiredSkills.length,
      missingPreferredTotal: missingPreferredSkills.length,
    },
  };
}
