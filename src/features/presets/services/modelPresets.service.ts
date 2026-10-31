import {
  ListModelPresetsFilters,
  modelPresetsApi,
} from '../../../api/modelPresets.api';
import {
  CreateModelPresetInput,
  ModelPreset,
  ModelPresetDefaults,
  UpdateModelPresetInput,
} from '../../../api/types/modelPresets.types';

export const modelPresetsService = {
  getDefaults(): Promise<ModelPresetDefaults> {
    return modelPresetsApi.getDefaults();
  },

  list(filters?: ListModelPresetsFilters): Promise<ModelPreset[]> {
    return modelPresetsApi.list(filters);
  },

  getById(id: string): Promise<ModelPreset> {
    return modelPresetsApi.getById(id);
  },

  create(body: CreateModelPresetInput): Promise<ModelPreset> {
    return modelPresetsApi.create(body);
  },

  update(id: string, body: UpdateModelPresetInput): Promise<ModelPreset> {
    return modelPresetsApi.update(id, body);
  },

  archive(id: string): Promise<unknown> {
    return modelPresetsApi.delete(id, false);
  },

  purge(id: string): Promise<unknown> {
    return modelPresetsApi.delete(id, true);
  },
};
