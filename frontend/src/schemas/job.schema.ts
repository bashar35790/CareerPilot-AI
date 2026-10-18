import { z } from 'zod';

export const createJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Job title must be at least 2 characters')
    .max(150, 'Job title must not exceed 150 characters'),
  company: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(150, 'Company name must not exceed 150 characters'),
  experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']).default('ENTRY'),
  rawText: z
    .string()
    .min(100, 'Job description must contain at least 100 characters')
    .max(20000, 'Job description must not exceed 20,000 characters'),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;
