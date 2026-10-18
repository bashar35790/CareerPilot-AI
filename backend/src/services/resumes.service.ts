import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { CreateResumeInput, UpdateResumeInput } from '../schemas/resume.schema';

export async function listResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      targetRole: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getResumeById(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) {
    throw new NotFoundError('Resume not found');
  }
  return resume;
}

export async function createResume(userId: string, input: CreateResumeInput) {
  const isPrimary = input.isPrimary ?? false;

  return prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.resume.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return tx.resume.create({
      data: {
        userId,
        title: input.title,
        content: input.content,
        isPrimary,
        ...(input.targetRole ? { targetRole: input.targetRole } : {}),
      },
    });
  });
}

export async function updateResume(userId: string, resumeId: string, input: UpdateResumeInput) {
  const existing = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!existing) {
    throw new NotFoundError('Resume not found');
  }

  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.resume.updateMany({
        where: { userId, isPrimary: true, NOT: { id: resumeId } },
        data: { isPrimary: false },
      });
    }

    return tx.resume.update({
      where: { id: resumeId },
      data: { ...input },
    });
  });
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const existing = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!existing) {
    throw new NotFoundError('Resume not found');
  }

  await prisma.resume.delete({ where: { id: resumeId } });
}
