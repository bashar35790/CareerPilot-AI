import { z } from 'zod';

export * from './auth.schema';

export const healthCheckSchema = z.object({
  status: z.literal('healthy'),
});
