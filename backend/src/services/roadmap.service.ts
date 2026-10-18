import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { generateCareerRoadmap } from '../lib/gemini';
import type { RoadmapPhase, SkillCategoryValue, SkillRelevanceValue } from '../schemas/ai-response.schema';
import type {
  CreateRoadmapInput,
  ListRoadmapsQuery,
  RoadmapTimeframe,
} from '../schemas/roadmap.schema';

const DEFAULT_PAGE_SIZE = 10;

export const ROADMAP_MODEL_VERSION = 'roadmap-v1:gemini-2.5-flash';

export const TIMEFRAME_LABELS: Record<RoadmapTimeframe, string> = {
  '3_MONTHS': '3 Months',
  '6_MONTHS': '6 Months',
  '12_MONTHS': '12 Months',
};

export interface RoadmapGapSkill {
  name: string;
  category: SkillCategoryValue;
  relevance: SkillRelevanceValue;
  contextualNote?: string;
}

export interface RoadmapGenerationContext {
  experienceLevel?: string;
  jobTitle?: string;
  summary?: string;
  missingRequiredSkills: RoadmapGapSkill[];
  missingPreferredSkills: RoadmapGapSkill[];
}

export interface FlattenedRoadmapTask {
  phaseNumber: number;
  phaseTitle: string;
  title: string;
  description: string;
  orderIndex: number;
}

export interface RoadmapTaskView {
  id: string;
  phaseNumber: number;
  phaseTitle: string;
  title: string;
  description: string;
  isCompleted: boolean;
  orderIndex: number;
}

interface RoadmapPhaseView {
  phaseNumber: number;
  phaseTitle: string;
  tasks: RoadmapTaskView[];
}

type RoadmapWithTasks = Prisma.CareerRoadmapGetPayload<{ include: { tasks: true } }>;

export function computeCompletionPercentage(completedTasks: number, totalTasks: number): number {
  if (totalTasks <= 0) {
    return 0;
  }
  return Math.round((completedTasks / totalTasks) * 1000) / 10;
}

export function flattenRoadmapPhases(phases: RoadmapPhase[]): FlattenedRoadmapTask[] {
  return [...phases]
    .sort((a, b) => a.phaseNumber - b.phaseNumber)
    .flatMap((phase, phaseIndex) =>
      phase.tasks.map((task, taskIndex) => ({
        phaseNumber: phaseIndex + 1,
        phaseTitle: phase.phaseTitle.trim(),
        title: task.title.trim(),
        description: task.description.trim(),
        orderIndex: taskIndex + 1,
      }))
    );
}

function serializeRoadmap(record: RoadmapWithTasks) {
  const phaseMap = new Map<number, RoadmapPhaseView>();

  for (const task of record.tasks) {
    let phase = phaseMap.get(task.phaseNumber);
    if (!phase) {
      phase = { phaseNumber: task.phaseNumber, phaseTitle: task.phaseTitle, tasks: [] };
      phaseMap.set(task.phaseNumber, phase);
    }
    phase.tasks.push({
      id: task.id,
      phaseNumber: task.phaseNumber,
      phaseTitle: task.phaseTitle,
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      orderIndex: task.orderIndex,
    });
  }

  const phases = [...phaseMap.values()].sort((a, b) => a.phaseNumber - b.phaseNumber);

  return {
    id: record.id,
    userId: record.userId,
    analysisId: record.analysisId,
    targetRole: record.targetRole,
    timeframe: record.timeframe,
    totalTasks: record.totalTasks,
    completedTasks: record.completedTasks,
    completionPercentage: computeCompletionPercentage(record.completedTasks, record.totalTasks),
    phases,
    modelVersion: ROADMAP_MODEL_VERSION,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getRoadmapDetail(userId: string, roadmapId: string) {
  const record = await prisma.careerRoadmap.findFirst({
    where: { id: roadmapId, userId },
    include: {
      tasks: { orderBy: [{ phaseNumber: 'asc' }, { orderIndex: 'asc' }] },
    },
  });

  if (!record) {
    throw new NotFoundError('Roadmap not found');
  }

  return serializeRoadmap(record);
}

async function loadGenerationContext(
  userId: string,
  analysisId: string
): Promise<RoadmapGenerationContext> {
  const analysis = await prisma.resumeAnalysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      jobDescription: {
        select: { title: true, company: true, experienceLevel: true },
      },
      analysisSkills: {
        include: { skill: { select: { name: true, category: true } } },
      },
    },
  });

  if (!analysis) {
    throw new NotFoundError('Analysis not found');
  }

  const missingRequiredSkills: RoadmapGapSkill[] = [];
  const missingPreferredSkills: RoadmapGapSkill[] = [];

  for (const entry of analysis.analysisSkills) {
    if (entry.matchType === 'MATCHED') {
      continue;
    }

    const gap: RoadmapGapSkill = {
      name: entry.skill.name,
      category: entry.skill.category,
      relevance: entry.relevance,
      ...(entry.contextualNote ? { contextualNote: entry.contextualNote } : {}),
    };

    if (entry.matchType === 'MISSING_REQUIRED') {
      missingRequiredSkills.push(gap);
    } else {
      missingPreferredSkills.push(gap);
    }
  }

  return {
    experienceLevel: analysis.jobDescription.experienceLevel,
    jobTitle: analysis.jobDescription.title,
    summary: analysis.summary,
    missingRequiredSkills,
    missingPreferredSkills,
  };
}

export async function generateRoadmap(userId: string, input: CreateRoadmapInput) {
  const context = await loadGenerationContext(userId, input.analysisId);
  const timeframeLabel = TIMEFRAME_LABELS[input.timeframe];

  const generated = await generateCareerRoadmap({
    targetRole: input.targetRole,
    timeframe: timeframeLabel,
    experienceLevel: context.experienceLevel,
    jobTitle: context.jobTitle,
    summary: context.summary,
    missingRequiredSkills: context.missingRequiredSkills,
    missingPreferredSkills: context.missingPreferredSkills,
  });

  const tasks = flattenRoadmapPhases(generated.phases);

  const roadmapId = await prisma.$transaction(async (tx) => {
    const roadmap = await tx.careerRoadmap.create({
      data: {
        userId,
        analysisId: input.analysisId,
        targetRole: input.targetRole,
        timeframe: timeframeLabel,
        totalTasks: tasks.length,
        completedTasks: 0,
      },
      select: { id: true },
    });

    if (tasks.length > 0) {
      await tx.roadmapTask.createMany({
        data: tasks.map((task) => ({
          roadmapId: roadmap.id,
          phaseNumber: task.phaseNumber,
          phaseTitle: task.phaseTitle,
          title: task.title,
          description: task.description,
          orderIndex: task.orderIndex,
        })),
      });
    }

    return roadmap.id;
  });

  return getRoadmapDetail(userId, roadmapId);
}

export async function listRoadmaps(userId: string, query: ListRoadmapsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;

  const [total, records] = await Promise.all([
    prisma.careerRoadmap.count({ where: { userId } }),
    prisma.careerRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    roadmaps: records.map((record) => ({
      id: record.id,
      analysisId: record.analysisId,
      targetRole: record.targetRole,
      timeframe: record.timeframe,
      totalTasks: record.totalTasks,
      completedTasks: record.completedTasks,
      completionPercentage: computeCompletionPercentage(
        record.completedTasks,
        record.totalTasks
      ),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function toggleRoadmapTask(
  userId: string,
  taskId: string,
  isCompleted: boolean
) {
  const task = await prisma.roadmapTask.findFirst({
    where: { id: taskId, roadmap: { userId } },
    select: { id: true, roadmapId: true },
  });

  if (!task) {
    throw new NotFoundError('Roadmap task not found');
  }

  const progress = await prisma.$transaction(async (tx) => {
    await tx.roadmapTask.update({
      where: { id: task.id },
      data: { isCompleted },
    });

    const [totalTasks, completedTasks] = await Promise.all([
      tx.roadmapTask.count({ where: { roadmapId: task.roadmapId } }),
      tx.roadmapTask.count({ where: { roadmapId: task.roadmapId, isCompleted: true } }),
    ]);

    await tx.careerRoadmap.update({
      where: { id: task.roadmapId },
      data: { totalTasks, completedTasks },
    });

    return { totalTasks, completedTasks };
  });

  return {
    taskId: task.id,
    isCompleted,
    roadmapProgress: {
      completedTasks: progress.completedTasks,
      totalTasks: progress.totalTasks,
      completionPercentage: computeCompletionPercentage(
        progress.completedTasks,
        progress.totalTasks
      ),
    },
  };
}
