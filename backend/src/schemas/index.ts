import { z } from 'zod';

export * from './auth.schema';
export * from './resume.schema';
export * from './job.schema';
export * from './user.schema';
export * from './ai-response.schema';

export const healthCheckSchema = z.object({
  status: z.literal('healthy'),
});
