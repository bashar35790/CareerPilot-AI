import { z } from 'zod';

export const skillCategorySchema = z.enum([
  'LANGUAGE',
  'FRAMEWORK',
  'DATABASE',
  'DEVOPS',
  'CONCEPT',
  'TOOL',
]);

export const skillRelevanceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const matchedSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: skillCategorySchema,
  relevance: skillRelevanceSchema,
  evidenceFromResume: z.string().min(1).max(500),
});

export const missingSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: skillCategorySchema,
  relevance: skillRelevanceSchema,
  contextualNote: z.string().min(1).max(500),
});

export const recommendationSchema = z.object({
  category: z.enum(['SKILL_INTEGRATION', 'BULLET_POINT_REWRITE', 'EXPERIENCE_FRAMING']),
  priority: skillRelevanceSchema,
  original: z.string().max(500).optional(),
  improved: z.string().min(1).max(1000),
  rationale: z.string().min(1).max(1000),
});

export const resumeAnalysisResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  skillScore: z.number().int().min(0).max(100),
  experienceScore: z.number().int().min(0).max(100),
  summary: z.string().min(20).max(1000),
  matchedSkills: z.array(matchedSkillSchema),
  missingRequiredSkills: z.array(missingSkillSchema),
  missingPreferredSkills: z.array(missingSkillSchema),
  recommendations: z.array(recommendationSchema),
});

export type SkillCategoryValue = z.infer<typeof skillCategorySchema>;
export type SkillRelevanceValue = z.infer<typeof skillRelevanceSchema>;
export type MatchedSkill = z.infer<typeof matchedSkillSchema>;
export type MissingSkill = z.infer<typeof missingSkillSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ResumeAnalysisResponse = z.infer<typeof resumeAnalysisResponseSchema>;
