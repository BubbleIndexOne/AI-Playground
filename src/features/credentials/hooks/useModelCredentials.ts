import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModelCredentialItem } from '../../../api/types/credentials';
import { isModelProvider, ModelProvider } from '../../../domain/providers';
import {
  credentialsService,
  SaveModelCredentialInput,
} from '../services/credentials.service';

export const MODEL_CREDENTIALS_QUERY_KEY = ['credentials', 'models'] as const;

export function useModelCredentials(enabled = true) {
  return useQuery({
    queryKey: MODEL_CREDENTIALS_QUERY_KEY,
    queryFn: () => credentialsService.list(),
    enabled,
  });
}

export function useSaveModelCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveModelCredentialInput) =>
      credentialsService.save(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_CREDENTIALS_QUERY_KEY });
    },
  });
}

export function useDeleteModelCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: ModelProvider) =>
      credentialsService.remove(provider),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_CREDENTIALS_QUERY_KEY });
    },
  });
}

export function useTestModelCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: ModelProvider) => credentialsService.test(provider),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_CREDENTIALS_QUERY_KEY });
    },
  });
}

export interface ProviderCredentialStatus {
  readonly status: 'vault' | 'none' | 'loading';
  readonly credential: ModelCredentialItem | null;
}

export function useProviderCredential(
  provider: string | null | undefined,
  enabled = true
): ProviderCredentialStatus {
  const { data: credentials, isLoading } = useModelCredentials(enabled);

  if (isLoading) {
    return { status: 'loading', credential: null };
  }

  if (!provider || !isModelProvider(provider)) {
    return { status: 'none', credential: null };
  }

  const found = (credentials ?? []).find((c) => c.provider === provider) ?? null;
  return {
    status: found ? 'vault' : 'none',
    credential: found,
  };
}
