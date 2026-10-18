import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import type { ListRoadmapsQuery } from '../schemas/roadmap.schema';
import {
  generateRoadmap,
  getRoadmapDetail,
  listRoadmaps,
  toggleRoadmapTask,
} from '../services/roadmap.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const roadmap = await generateRoadmap(req.user!.id, req.body);
  return sendSuccess(res, roadmap, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listRoadmaps(req.user!.id, req.query as unknown as ListRoadmapsQuery);
  return sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const roadmap = await getRoadmapDetail(req.user!.id, req.params.id);
  return sendSuccess(res, roadmap);
});

export const toggleTask = asyncHandler(async (req: Request, res: Response) => {
  const { isCompleted } = req.body as { isCompleted: boolean };
  const result = await toggleRoadmapTask(req.user!.id, req.params.taskId, isCompleted);
  return sendSuccess(res, result);
});
