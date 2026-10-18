import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import { REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from '../lib/tokens';
import {
  demoLogin,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await registerUser(req.body);
  setAuthCookies(res, tokens);
  return sendSuccess(res, { user }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await loginUser(req.body);
  setAuthCookies(res, tokens);
  return sendSuccess(res, { user });
});

export const demo = asyncHandler(async (_req: Request, res: Response) => {
  const { user, tokens } = await demoLogin();
  setAuthCookies(res, tokens);
  return sendSuccess(res, { user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await refreshSession(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  setAuthCookies(res, tokens);
  return sendSuccess(res, { user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await logoutUser(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Successfully logged out' });
});
