import { z } from 'zod';

export const careerLevelSchema = z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR']);

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    targetRole: z.string().trim().min(2).max(100).nullable(),
    careerLevel: careerLevelSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
