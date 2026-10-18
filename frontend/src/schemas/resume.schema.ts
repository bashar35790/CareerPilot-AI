import { z } from 'zod';

export const createResumeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must not exceed 150 characters'),
  targetRole: z
    .string()
    .trim()
    .max(100, 'Target role must not exceed 100 characters')
    .optional(),
  content: z
    .string()
    .min(100, 'Resume must contain at least 100 characters')
    .max(20000, 'Resume must not exceed 20,000 characters'),
  isPrimary: z.boolean().optional(),
});

export type CreateResumeFormData = z.infer<typeof createResumeSchema>;
