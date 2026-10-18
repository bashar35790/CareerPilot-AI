import { z } from 'zod';
import { experienceLevelSchema } from './job.schema';

export const createAnalysisSchema = z
  .object({
    resumeId: z.string().uuid('Invalid resume identifier').optional(),
    resumeContent: z
      .string()
      .min(100, 'Resume must contain at least 100 characters')
      .max(20000, 'Resume must not exceed 20,000 characters')
      .optional(),
    jobTitle: z.string().trim().min(2, 'Job title must be at least 2 characters').max(150),
    company: z.string().trim().min(2, 'Company name must be at least 2 characters').max(150),
    jobDescriptionText: z
      .string()
      .min(100, 'Job description must contain at least 100 characters')
      .max(20000, 'Job description must not exceed 20,000 characters'),
    experienceLevel: experienceLevelSchema.optional(),
  })
  .refine((data) => Boolean(data.resumeId) || Boolean(data.resumeContent), {
    message: 'Either resumeId or resumeContent must be provided',
    path: ['resumeId'],
  });

export const analysisIdParamSchema = z.object({
  id: z.string().uuid('Invalid analysis identifier'),
});

export const listAnalysesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type ListAnalysesQuery = z.infer<typeof listAnalysesQuerySchema>;
