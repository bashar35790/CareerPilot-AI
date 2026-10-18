import { z } from 'zod';

export const roadmapTimeframeSchema = z.enum(['3_MONTHS', '6_MONTHS', '12_MONTHS']);

export const createRoadmapSchema = z.object({
  analysisId: z.string().uuid('Invalid analysis identifier'),
  targetRole: z.string().trim().min(2, 'Target role must be at least 2 characters').max(100),
  timeframe: roadmapTimeframeSchema.default('6_MONTHS'),
});

export const roadmapIdParamSchema = z.object({
  id: z.string().uuid('Invalid roadmap identifier'),
});

export const roadmapTaskIdParamSchema = z.object({
  taskId: z.string().uuid('Invalid roadmap task identifier'),
});

export const updateRoadmapTaskSchema = z.object({
  isCompleted: z.boolean(),
});

export const listRoadmapsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RoadmapTimeframe = z.infer<typeof roadmapTimeframeSchema>;
export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
export type UpdateRoadmapTaskInput = z.infer<typeof updateRoadmapTaskSchema>;
export type ListRoadmapsQuery = z.infer<typeof listRoadmapsQuerySchema>;
