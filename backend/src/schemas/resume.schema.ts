import { z } from 'zod';

export const createResumeSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  targetRole: z.string().trim().min(2).max(100).optional(),
  content: z
    .string()
    .min(100, 'Resume must contain at least 100 characters')
    .max(20000, 'Resume must not exceed 20,000 characters'),
  isPrimary: z.boolean().optional(),
});

export const updateResumeSchema = createResumeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const resumeIdParamSchema = z.object({
  id: z.string().uuid('Invalid resume identifier'),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
