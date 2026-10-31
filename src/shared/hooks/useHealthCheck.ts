import { useMutation } from '@tanstack/react-query';
import { healthService } from '../services/health.service';

export function useHealthCheckMutation() {
  return useMutation({
    mutationFn: () => healthService.runCheck(),
  });
}
