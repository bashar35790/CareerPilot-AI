import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import { createJob, deleteJob, getJobById, listJobs } from '../services/jobs.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await listJobs(req.user!.id);
  return sendSuccess(res, { jobs });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const job = await getJobById(req.user!.id, req.params.id);
  return sendSuccess(res, { job });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const job = await createJob(req.user!.id, req.body);
  return sendSuccess(res, { job }, 201);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteJob(req.user!.id, req.params.id);
  return sendSuccess(res, { message: 'Job description deleted' });
});
