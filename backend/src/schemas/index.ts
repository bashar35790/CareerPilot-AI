import { z } from 'zod';

export const healthCheckSchema = z.object({
  status: z.literal('healthy'),
});
