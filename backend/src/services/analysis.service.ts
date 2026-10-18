import { MatchType, Prisma, SkillRelevance } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { generateResumeAnalysis } from '../lib/gemini';
import type { CreateAnalysisInput, ListAnalysesQuery } from '../schemas/analysis.schema';
import { runDeterministicMatching } from './matching.deterministic';
import { reconcileAnalysis, type ReconciledSkill } from './matching.reconciliation';

export const ANALYSIS_MODEL_VERSION = 'hybrid-v1:gemini-2.5-flash';

const DEFAULT_PAGE_SIZE = 10;

interface ResolvedResume {
  id?: string;
  title: string;
  content: string;
}

function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9+#]/g, '');
}

async function resolveResume(userId: string, input: CreateAnalysisInput): Promise<ResolvedResume> {
  if (input.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: input.resumeId, userId },
      select: { id: true, title: true, content: true },
    });
    if (!resume) {
      throw new NotFoundError('Resume not found');
    }
    return resume;
  }

  return {
    title: `${input.jobTitle} (inline submission)`,
    content: input.resumeContent as string,
  };
}

async function resolveSkillId(
  tx: Prisma.TransactionClient,
  skill: ReconciledSkill
): Promise<string | null> {
  if (skill.skillId && !skill.skillId.startsWith('canonical:')) {
    const existing = await tx.skill.findUnique({
      where: { id: skill.skillId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
  }

  const normalizedName = normalizeSkillName(skill.name);
  if (!normalizedName) {
    return null;
  }

  const persisted = await tx.skill.upsert({
    where: { normalizedName },
    update: {},
    create: { name: skill.name, normalizedName, category: skill.category },
    select: { id: true },
  });

  return persisted.id;
}

async function persistAnalysisSkills(
  tx: Prisma.TransactionClient,
  analysisId: string,
  skills: ReconciledSkill[]
): Promise<void> {
  const rows = new Map<
    string,
    {
      skillId: string;
      matchType: MatchType;
      relevance: SkillRelevance;
      contextualNote: string | null;
    }
  >();

  for (const skill of skills) {
    const skillId = await resolveSkillId(tx, skill);
    if (!skillId || rows.has(skillId)) {
      continue;
    }
    rows.set(skillId, {
      skillId,
      matchType: skill.matchType,
      relevance: skill.relevance,
      contextualNote: skill.contextualNote ?? null,
    });
  }

  if (rows.size === 0) {
    return;
  }

  await tx.analysisSkill.createMany({
    data: [...rows.values()].map((row) => ({ analysisId, ...row })),
    skipDuplicates: true,
  });
}

type AnalysisDetail = Prisma.ResumeAnalysisGetPayload<{
  include: {
    jobDescription: true;
    resume: { select: { id: true; title: true } };
    analysisSkills: { include: { skill: true } };
  };
}>;

interface SkillBadge {
  name: string;
  category: string;
  relevance: string;
  contextualNote?: string;
}

function serializeAnalysis(record: AnalysisDetail) {
  const matchedSkills: SkillBadge[] = [];
  const missingRequiredSkills: SkillBadge[] = [];
  const missingPreferredSkills: SkillBadge[] = [];

  for (const analysisSkill of record.analysisSkills) {
    const badge: SkillBadge = {
      name: analysisSkill.skill.name,
      category: analysisSkill.skill.category,
      relevance: analysisSkill.relevance,
      ...(analysisSkill.contextualNote ? { contextualNote: analysisSkill.contextualNote } : {}),
    };

    if (analysisSkill.matchType === 'MATCHED') {
      matchedSkills.push(badge);
    } else if (analysisSkill.matchType === 'MISSING_REQUIRED') {
      missingRequiredSkills.push(badge);
    } else {
      missingPreferredSkills.push(badge);
    }
  }

  return {
    id: record.id,
    resumeId: record.resumeId,
    jobDescriptionId: record.jobDescriptionId,
    overallScore: record.overallScore,
    skillScore: record.skillScore,
    experienceScore: record.experienceScore,
    summary: record.summary,
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    recommendations: record.recommendations,
    modelVersion: record.modelVersion,
    resume: { id: record.resume.id, title: record.resume.title },
    jobDescription: {
      id: record.jobDescription.id,
      title: record.jobDescription.title,
      company: record.jobDescription.company,
      experienceLevel: record.jobDescription.experienceLevel,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getAnalysisDetail(userId: string, analysisId: string) {
  const record = await prisma.resumeAnalysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      jobDescription: true,
      resume: { select: { id: true, title: true } },
      analysisSkills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!record) {
    throw new NotFoundError('Analysis not found');
  }

  return serializeAnalysis(record);
}

export async function createAnalysis(userId: string, input: CreateAnalysisInput) {
  const resume = await resolveResume(userId, input);

  const deterministic = await runDeterministicMatching(resume.content, input.jobDescriptionText);
  const llm = await generateResumeAnalysis({
    resumeText: resume.content,
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescriptionText: input.jobDescriptionText,
    experienceLevel: input.experienceLevel,
  });
  const reconciled = reconcileAnalysis({
    resumeText: resume.content,
    deterministic,
    llm,
  });

  const analysisId = await prisma.$transaction(async (tx) => {
    let resumeId = resume.id;
    if (!resumeId) {
      const createdResume = await tx.resume.create({
        data: {
          userId,
          title: resume.title,
          content: resume.content,
          targetRole: input.jobTitle,
        },
        select: { id: true },
      });
      resumeId = createdResume.id;
    }

    const job = await tx.jobDescription.create({
      data: {
        userId,
        title: input.jobTitle,
        company: input.company,
        experienceLevel: input.experienceLevel ?? 'MID',
        rawText: input.jobDescriptionText,
      },
      select: { id: true },
    });

    const analysis = await tx.resumeAnalysis.create({
      data: {
        userId,
        resumeId,
        jobDescriptionId: job.id,
        overallScore: reconciled.scores.overallScore,
        skillScore: reconciled.scores.skillScore,
        experienceScore: reconciled.scores.experienceScore,
        summary: reconciled.summary,
        recommendations: reconciled.recommendations as unknown as Prisma.InputJsonValue,
        modelVersion: ANALYSIS_MODEL_VERSION,
      },
      select: { id: true },
    });

    await persistAnalysisSkills(tx, analysis.id, reconciled.skills);

    return analysis.id;
  });

  return getAnalysisDetail(userId, analysisId);
}

export async function listAnalyses(userId: string, query: ListAnalysesQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;

  const [total, records] = await Promise.all([
    prisma.resumeAnalysis.count({ where: { userId } }),
    prisma.resumeAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        jobDescription: { select: { id: true, title: true, company: true } },
      },
    }),
  ]);

  return {
    analyses: records.map((record) => ({
      id: record.id,
      resumeId: record.resumeId,
      jobDescriptionId: record.jobDescriptionId,
      overallScore: record.overallScore,
      skillScore: record.skillScore,
      experienceScore: record.experienceScore,
      summary: record.summary,
      modelVersion: record.modelVersion,
      jobDescription: record.jobDescription,
      createdAt: record.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteAnalysis(userId: string, analysisId: string): Promise<void> {
  const existing = await prisma.resumeAnalysis.findFirst({
    where: { id: analysisId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Analysis not found');
  }

  await prisma.resumeAnalysis.delete({ where: { id: analysisId } });
}
