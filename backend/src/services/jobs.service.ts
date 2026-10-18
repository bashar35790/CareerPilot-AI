import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { CreateJobInput } from '../schemas/job.schema';

export async function listJobs(userId: string) {
  return prisma.jobDescription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      company: true,
      experienceLevel: true,
      createdAt: true,
    },
  });
}

export async function getJobById(userId: string, jobId: string) {
  const job = await prisma.jobDescription.findFirst({ where: { id: jobId, userId } });
  if (!job) {
    throw new NotFoundError('Job description not found');
  }
  return job;
}

export async function createJob(userId: string, input: CreateJobInput) {
  return prisma.jobDescription.create({
    data: {
      userId,
      title: input.title,
      company: input.company,
      rawText: input.rawText,
      ...(input.experienceLevel ? { experienceLevel: input.experienceLevel } : {}),
    },
  });
}

export async function deleteJob(userId: string, jobId: string): Promise<void> {
  const existing = await prisma.jobDescription.findFirst({ where: { id: jobId, userId } });
  if (!existing) {
    throw new NotFoundError('Job description not found');
  }

  await prisma.jobDescription.delete({ where: { id: jobId } });
}
