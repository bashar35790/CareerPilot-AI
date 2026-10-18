import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import { getUserProfile, updateUserProfile } from '../services/users.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getUserProfile(req.user!.id);
  return sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserProfile(req.user!.id, req.body);
  return sendSuccess(res, { user });
});
