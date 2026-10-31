import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListToolsFilters } from '../../../api/tools.api';
import {
  CreateToolInput,
  CreateToolVersionInput,
  UpdateToolInput,
} from '../../../api/types/tools.types';
import { SandboxRunInput } from '../../../sandbox/protocol';
import { toolsService } from '../services/tools.service';

export function useToolsListQuery(filters?: ListToolsFilters) {
  return useQuery({
    queryKey: ['tools', 'list', filters ?? {}],
    queryFn: () => toolsService.list(filters),
  });
}

export function useToolDetailQuery(toolId: string | undefined) {
  return useQuery({
    queryKey: ['tools', 'detail', toolId],
    queryFn: () => toolsService.getById(toolId!),
    enabled: Boolean(toolId),
  });
}

export function useToolVersionsQuery(toolId: string | undefined) {
  return useQuery({
    queryKey: ['tools', 'versions', toolId],
    queryFn: () => toolsService.listVersions(toolId!),
    enabled: Boolean(toolId),
  });
}

export function useToolVersionDetailQuery(
  toolId: string | undefined,
  version: number | null
) {
  return useQuery({
    queryKey: ['tools', 'version', toolId, version],
    queryFn: () => toolsService.getVersion(toolId!, version!),
    enabled: Boolean(toolId && version !== null),
  });
}

export function useToolDiffQuery(
  toolId: string | undefined,
  fromVersion: number | null,
  toVersion: number | null
) {
  return useQuery({
    queryKey: ['tools', 'diff', toolId, fromVersion, toVersion],
    queryFn: async () => {
      const [diffMeta, vFrom, vTo] = await Promise.all([
        toolsService.diffVersions(toolId!, fromVersion!, toVersion!),
        toolsService.getVersion(toolId!, fromVersion!),
        toolsService.getVersion(toolId!, toVersion!),
      ]);
      return { diffMeta, vFrom, vTo };
    },
    enabled: Boolean(
      toolId &&
        fromVersion !== null &&
        toVersion !== null &&
        fromVersion !== toVersion
    ),
  });
}

export function useToolMutations(toolId?: string) {
  const queryClient = useQueryClient();

  const createToolMutation = useMutation({
    mutationFn: (body: CreateToolInput) => toolsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateToolInput }) =>
      toolsService.updateMetadata(id, body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tools', 'detail', vars.id] });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id: string) => toolsService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: (body: CreateToolVersionInput) =>
      toolsService.createVersion(toolId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'detail', toolId] });
      queryClient.invalidateQueries({ queryKey: ['tools', 'versions', toolId] });
      queryClient.invalidateQueries({ queryKey: ['tools', 'list'] });
    },
  });

  const registerToolMutation = useMutation({
    mutationFn: (inputs?: Record<string, unknown>) =>
      toolsService.registerTool(toolId!, inputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'detail', toolId] });
      queryClient.invalidateQueries({ queryKey: ['tools', 'list'] });
    },
  });

  const sandboxRunMutation = useMutation({
    mutationFn: (input: SandboxRunInput) => toolsService.executeInSandbox(input),
  });

  return {
    createToolMutation,
    updateToolMutation,
    deleteToolMutation,
    createVersionMutation,
    registerToolMutation,
    sandboxRunMutation,
  };
}
