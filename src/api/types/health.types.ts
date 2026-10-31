import { z } from 'zod';

export const HealthResponseSchema = z
  .object({
    status: z.string().optional(),
    timestamp: z.string().optional(),
    uptime: z.number().optional(),
  })
  .passthrough();

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
