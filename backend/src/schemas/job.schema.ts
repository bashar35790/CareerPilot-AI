import { z } from 'zod';

export const experienceLevelSchema = z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']);

export const createJobSchema = z.object({
  title: z.string().trim().min(2, 'Job title must be at least 2 characters').max(150),
  company: z.string().trim().min(2, 'Company name must be at least 2 characters').max(150),
  experienceLevel: experienceLevelSchema.optional(),
  rawText: z
    .string()
    .min(100, 'Job description must contain at least 100 characters')
    .max(20000, 'Job description must not exceed 20,000 characters'),
});

export const updateJobSchema = createJobSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const jobIdParamSchema = z.object({
  id: z.string().uuid('Invalid job identifier'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
