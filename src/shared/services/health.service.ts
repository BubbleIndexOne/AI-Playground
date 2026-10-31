import { healthApi } from '../../api/health.api';
import { HealthResponse } from '../../api/types/health.types';

export const healthService = {
  runCheck(): Promise<HealthResponse> {
    return healthApi.check();
  },
};
