import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SaveCredentialInput } from '../../../storage/interfaces/CredentialStore';
import { credentialsService } from '../services/credentials.service';

export function useCredentialsQuery() {
  return useQuery({
    queryKey: ['local-credentials'],
    queryFn: () => credentialsService.list(),
  });
}

export function useCredentialMutations() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (input: SaveCredentialInput) => credentialsService.save(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-credentials'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => credentialsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-credentials'] });
    },
  });

  return {
    saveMutation,
    deleteMutation,
  };
}
