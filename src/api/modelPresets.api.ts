import { z } from 'zod';
import { apiRequest } from './http/client';
import {
  CreateModelPresetInput,
  ModelPreset,
  ModelPresetDefaults,
  ModelPresetDefaultsSchema,
  ModelPresetSchema,
  UpdateModelPresetInput,
} from './types/modelPresets.types';

const ModelPresetListResponseSchema = z.union([
  z.array(ModelPresetSchema),
  z.object({ items: z.array(ModelPresetSchema) }).transform((v) => v.items),
  z.object({ data: z.array(ModelPresetSchema) }).transform((v) => v.data),
  z.object({ presets: z.array(ModelPresetSchema) }).transform((v) => v.presets),
]);

export interface ListModelPresetsFilters {
  readonly provider?: string;
  readonly model_id?: string;
}

export const modelPresetsApi = {
  getDefaults(): Promise<ModelPresetDefaults> {
    return apiRequest({
      method: 'GET',
      path: '/model-presets/defaults',
      security: 'bearer',
      schema: ModelPresetDefaultsSchema,
    });
  },

  list(filters?: ListModelPresetsFilters): Promise<ModelPreset[]> {
    return apiRequest({
      method: 'GET',
      path: '/model-presets',
      query: {
        provider: filters?.provider,
        model_id: filters?.model_id,
      },
      security: 'bearer',
      schema: ModelPresetListResponseSchema,
    });
  },

  getById(id: string): Promise<ModelPreset> {
    return apiRequest({
      method: 'GET',
      path: `/model-presets/${encodeURIComponent(id)}`,
      security: 'bearer',
      schema: ModelPresetSchema,
    });
  },

  create(body: CreateModelPresetInput): Promise<ModelPreset> {
    return apiRequest({
      method: 'POST',
      path: '/model-presets',
      body,
      security: 'bearer',
      schema: ModelPresetSchema,
    });
  },

  update(id: string, body: UpdateModelPresetInput): Promise<ModelPreset> {
    return apiRequest({
      method: 'PATCH',
      path: `/model-presets/${encodeURIComponent(id)}`,
      body,
      security: 'bearer',
      schema: ModelPresetSchema,
    });
  },

  delete(id: string, purge = false): Promise<unknown> {
    return apiRequest({
      method: 'DELETE',
      path: `/model-presets/${encodeURIComponent(id)}`,
      query: purge ? { purge: true } : undefined,
      security: 'bearer',
    });
  },
};
