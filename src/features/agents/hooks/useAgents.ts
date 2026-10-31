import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SaveAgentInput } from '../../../storage/interfaces/AgentRepository';
import { agentsService } from '../services/agents.service';

export function useAgentsQuery() {
  return useQuery({
    queryKey: ['local-agents'],
    queryFn: () => agentsService.list(),
  });
}

export function useAgentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['local-agents'] });
  };

  const saveAgentMutation = useMutation({
    mutationFn: (input: SaveAgentInput) => agentsService.save(input),
    onSuccess: invalidate,
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => agentsService.delete(id),
    onSuccess: invalidate,
  });

  const importAgentsMutation = useMutation({
    mutationFn: (jsonText: string) => agentsService.importFromJson(jsonText),
    onSuccess: invalidate,
  });

  const attachToolMutation = useMutation({
    mutationFn: ({
      agentId,
      toolId,
      pinnedVersion,
    }: {
      agentId: string;
      toolId: string;
      pinnedVersion?: number | null;
    }) => agentsService.attachToolToAgent(agentId, toolId, pinnedVersion),
    onSuccess: invalidate,
  });

  return {
    saveAgentMutation,
    deleteAgentMutation,
    importAgentsMutation,
    attachToolMutation,
  };
}
