import { apiRequest } from './http/client';
import { HealthResponse, HealthResponseSchema } from './types/health.types';

export const healthApi = {
  check(): Promise<HealthResponse> {
    return apiRequest({
      method: 'GET',
      path: '/health',
      security: 'none',
      schema: HealthResponseSchema,
    });
  },
};
