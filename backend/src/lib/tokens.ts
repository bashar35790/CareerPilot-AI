import { randomUUID, createHash } from 'crypto';
import { CookieOptions, Response } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types';
import { UnauthorizedError } from './errors';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const TOKEN_ISSUER = 'careerpilot-ai';
const TOKEN_AUDIENCE = 'careerpilot-client';

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface IssuedSessionTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
}

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
};

function cookieOptions(maxAge: number): CookieOptions {
  return { ...BASE_COOKIE_OPTIONS, maxAge };
}

function buildPayload(user: AuthenticatedUser): TokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
}

function signOptions(expiresIn: SignOptions['expiresIn']): SignOptions {
  return {
    expiresIn,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    jwtid: randomUUID(),
  };
}

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    buildPayload(user),
    env.JWT_SECRET,
    signOptions(env.JWT_EXPIRES_IN as SignOptions['expiresIn'])
  );
}

export function signRefreshToken(user: AuthenticatedUser): string {
  return jwt.sign(
    buildPayload(user),
    env.JWT_REFRESH_SECRET,
    signOptions(env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'])
  );
}

function verifyToken(token: string, secret: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw new UnauthorizedError('Invalid authentication token');
    }
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired authentication token', { cause: error });
  }
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyToken(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function setAuthCookies(res: Response, tokens: IssuedSessionTokens): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, cookieOptions(ACCESS_TOKEN_TTL_MS));
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_TOKEN_TTL_MS));
}

export function issueAuthCookies(res: Response, user: AuthenticatedUser): IssuedSessionTokens {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokens: IssuedSessionTokens = {
    accessToken,
    refreshToken,
    refreshTokenHash: hashToken(refreshToken),
  };

  setAuthCookies(res, tokens);

  return tokens;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, BASE_COOKIE_OPTIONS);
  res.clearCookie(REFRESH_TOKEN_COOKIE, BASE_COOKIE_OPTIONS);
}
