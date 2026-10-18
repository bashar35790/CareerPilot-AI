import { z } from 'zod';

export const createAnalysisSchema = z
  .object({
    resumeId: z.string().optional(),
    resumeContent: z.string().optional(),
    jobTitle: z
      .string()
      .trim()
      .min(2, 'Job title must be at least 2 characters')
      .max(150, 'Job title must not exceed 150 characters'),
    company: z
      .string()
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .max(150, 'Company name must not exceed 150 characters'),
    jobDescriptionText: z
      .string()
      .min(100, 'Job description must contain at least 100 characters')
      .max(20000, 'Job description must not exceed 20,000 characters'),
    experienceLevel: z
      .enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.resumeId && !data.resumeContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a saved resume or paste resume content.',
        path: ['resumeId'],
      });
    }

    if (data.resumeContent) {
      if (data.resumeContent.length < 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Resume must contain at least 100 characters',
          path: ['resumeContent'],
        });
      }
      if (data.resumeContent.length > 20000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Resume must not exceed 20,000 characters',
          path: ['resumeContent'],
        });
      }
    }
  });

export type CreateAnalysisFormData = z.infer<typeof createAnalysisSchema>;
