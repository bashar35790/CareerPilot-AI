import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import type { ListAnalysesQuery } from '../schemas/analysis.schema';
import {
  createAnalysis,
  deleteAnalysis,
  getAnalysisDetail,
  listAnalyses,
} from '../services/analysis.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const analysis = await createAnalysis(req.user!.id, req.body);
  return sendSuccess(res, analysis, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAnalyses(req.user!.id, req.query as unknown as ListAnalysesQuery);
  return sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const analysis = await getAnalysisDetail(req.user!.id, req.params.id);
  return sendSuccess(res, analysis);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteAnalysis(req.user!.id, req.params.id);
  return sendSuccess(res, { message: 'Analysis deleted' });
});
