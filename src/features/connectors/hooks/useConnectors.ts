import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConnectorCredentials } from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';
import { connectorsService } from '../services/connectors.service';

export function useConnectorsQuery() {
  return useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorsService.list(),
  });
}

export function useConnectorMutations() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: ({
      type,
      credentials,
      verify,
    }: {
      type: ConnectorType;
      credentials: ConnectorCredentials;
      verify: boolean;
    }) => connectorsService.save(type, credentials, verify),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({
      type,
      credentials,
    }: {
      type: ConnectorType;
      credentials?: ConnectorCredentials;
    }) => connectorsService.test(type, credentials),
  });

  const deleteMutation = useMutation({
    mutationFn: (type: ConnectorType) => connectorsService.delete(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
    },
  });

  return {
    saveMutation,
    testMutation,
    deleteMutation,
  };
}
