import type { ExperienceLevel } from './job';

export type SkillCategory =
  | 'LANGUAGE'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'DEVOPS'
  | 'CONCEPT'
  | 'TOOL';

export type SkillRelevance = 'HIGH' | 'MEDIUM' | 'LOW';

export type MatchType = 'MATCHED' | 'MISSING_REQUIRED' | 'MISSING_PREFERRED';

export type RecommendationCategory =
  | 'SKILL_INTEGRATION'
  | 'BULLET_POINT_REWRITE'
  | 'EXPERIENCE_FRAMING';

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnalysisSkillBadge {
  name: string;
  category: SkillCategory;
  relevance: SkillRelevance;
  contextualNote?: string;
}

export interface Recommendation {
  category: RecommendationCategory;
  priority: RecommendationPriority;
  improved: string;
  rationale: string;
  original?: string;
}

export interface AnalysisJobDescription {
  id: string;
  title: string;
  company: string;
  experienceLevel?: ExperienceLevel;
}

export interface AnalysisSummary {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  summary: string;
  modelVersion: string;
  jobDescription: AnalysisJobDescription;
  createdAt: string;
}

export interface AnalysisDetail {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  summary: string;
  matchedSkills: AnalysisSkillBadge[];
  missingRequiredSkills: AnalysisSkillBadge[];
  missingPreferredSkills: AnalysisSkillBadge[];
  recommendations: Recommendation[];
  modelVersion: string;
  resume: { id: string; title: string };
  jobDescription: AnalysisJobDescription;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysesListResponse {
  analyses: AnalysisSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAnalysisPayload {
  resumeId?: string;
  resumeContent?: string;
  jobTitle: string;
  company: string;
  jobDescriptionText: string;
  experienceLevel?: ExperienceLevel;
}
