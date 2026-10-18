import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import {
  createResume,
  deleteResume,
  getResumeById,
  listResumes,
  updateResume,
} from '../services/resumes.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const resumes = await listResumes(req.user!.id);
  return sendSuccess(res, { resumes });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const resume = await getResumeById(req.user!.id, req.params.id);
  return sendSuccess(res, { resume });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const resume = await createResume(req.user!.id, req.body);
  return sendSuccess(res, { resume }, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const resume = await updateResume(req.user!.id, req.params.id, req.body);
  return sendSuccess(res, { resume });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteResume(req.user!.id, req.params.id);
  return sendSuccess(res, { message: 'Resume deleted' });
});
