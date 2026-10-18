import { CareerLevel, User, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { UpdateProfileInput } from '../schemas/user.schema';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  targetRole: string | null;
  careerLevel: CareerLevel;
  createdAt: Date;
}

export interface ProfileStats {
  totalResumes: number;
  totalAnalyses: number;
  averageMatchScore: number | null;
}

export interface UserProfileSummary {
  user: UserProfile;
  stats: ProfileStats;
}

function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    targetRole: user.targetRole,
    careerLevel: user.careerLevel,
    createdAt: user.createdAt,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfileSummary> {
  const [user, totalResumes, totalAnalyses, scoreAggregate] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.resume.count({ where: { userId } }),
    prisma.resumeAnalysis.count({ where: { userId } }),
    prisma.resumeAnalysis.aggregate({ where: { userId }, _avg: { overallScore: true } }),
  ]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const average = scoreAggregate._avg.overallScore;

  return {
    user: toUserProfile(user),
    stats: {
      totalResumes,
      totalAnalyses,
      averageMatchScore: average === null ? null : Math.round(average),
    },
  };
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.targetRole !== undefined ? { targetRole: input.targetRole } : {}),
      ...(input.careerLevel !== undefined ? { careerLevel: input.careerLevel } : {}),
    },
  });

  return toUserProfile(user);
}
