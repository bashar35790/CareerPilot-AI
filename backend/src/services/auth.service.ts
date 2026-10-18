import { Prisma, User } from '@prisma/client';
import { ConflictError, UnauthorizedError } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import {
  IssuedSessionTokens,
  REFRESH_TOKEN_TTL_MS,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/tokens';
import { AuthenticatedUser } from '../types';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

export const DEMO_EMAIL = 'demo@careerpilot.internal';
export const DEMO_PASSWORD = 'DemoPassword123!';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  targetRole: string | null;
  careerLevel: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR';
  createdAt: Date;
}

export interface AuthSession {
  user: PublicUser;
  tokens: IssuedSessionTokens;
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return { id: user.id, email: user.email, role: user.role };
}

function toPublicUser(user: User): PublicUser {
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

function buildSession(user: AuthenticatedUser): IssuedSessionTokens {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return {
    accessToken,
    refreshToken,
    refreshTokenHash: hashToken(refreshToken),
  };
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function persistRefreshToken(userId: string, tokenHash: string): Promise<void> {
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt: refreshTokenExpiry() },
  });
}

export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const passwordHash = await hashPassword(input.password);

  let user: User;
  try {
    user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        ...(input.targetRole ? { targetRole: input.targetRole } : {}),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Email already registered');
    }
    throw error;
  }

  const tokens = buildSession(toAuthenticatedUser(user));
  await persistRefreshToken(user.id, tokens.refreshTokenHash);

  return { user: toPublicUser(user), tokens };
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordValid = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = buildSession(toAuthenticatedUser(user));
  await persistRefreshToken(user.id, tokens.refreshTokenHash);

  return { user: toPublicUser(user), tokens };
}

export async function demoLogin(): Promise<AuthSession> {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    try {
      user = await prisma.user.create({
        data: {
          email: DEMO_EMAIL,
          passwordHash,
          fullName: 'Demo Reviewer',
          targetRole: 'Junior Full-Stack Developer',
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    }
  }

  if (!user) {
    throw new UnauthorizedError('Unable to provision the demo account');
  }

  const tokens = buildSession(toAuthenticatedUser(user));
  await persistRefreshToken(user.id, tokens.refreshTokenHash);

  return { user: toPublicUser(user), tokens };
}

export async function refreshSession(refreshToken: unknown): Promise<AuthSession> {
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    throw new UnauthorizedError('Refresh token is required');
  }

  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash, isRevoked: false, expiresAt: { gt: new Date() } },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Invalid or revoked refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError('Account no longer exists');
  }

  const tokens = buildSession(toAuthenticatedUser(user));

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: refreshTokenExpiry(),
      },
    }),
  ]);

  return { user: toPublicUser(user), tokens };
}

export async function logoutUser(refreshToken: unknown): Promise<void> {
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return;
  }

  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, isRevoked: false },
    data: { isRevoked: true },
  });
}
