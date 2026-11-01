import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListModelPresetsFilters } from '../../../api/modelPresets.api';
import {
  CreateModelPresetInput,
  UpdateModelPresetInput,
} from '../../../api/types/modelPresets.types';
import { modelPresetsService } from '../services/modelPresets.service';

export function useModelPresetsQuery(
  filters?: ListModelPresetsFilters,
  enabled = true
) {
  return useQuery({
    queryKey: ['model-presets', filters ?? {}],
    queryFn: () => modelPresetsService.list(filters),
    enabled,
  });
}

export function useModelPresetDefaultsQuery(enabled = true) {
  return useQuery({
    queryKey: ['model-presets', 'defaults'],
    queryFn: () => modelPresetsService.getDefaults(),
    enabled,
    staleTime: Infinity,
  });
}

export function useModelPresetMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: CreateModelPresetInput) => modelPresetsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-presets'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateModelPresetInput }) =>
      modelPresetsService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-presets'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => modelPresetsService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-presets'] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (id: string) => modelPresetsService.purge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-presets'] });
    },
  });

  return {
    createMutation,
    updateMutation,
    archiveMutation,
    purgeMutation,
  };
}
