import { z } from 'zod';

export const createRoadmapSchema = z.object({
  analysisId: z.string().uuid('Select a valid match analysis'),
  targetRole: z
    .string()
    .trim()
    .min(2, 'Target role must be at least 2 characters')
    .max(100, 'Target role must not exceed 100 characters'),
  timeframe: z.enum(['3_MONTHS', '6_MONTHS', '12_MONTHS']).default('6_MONTHS'),
});

export type CreateRoadmapFormData = z.infer<typeof createRoadmapSchema>;
