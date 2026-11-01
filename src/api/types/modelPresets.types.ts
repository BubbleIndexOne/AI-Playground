import { z } from 'zod';

export const ModelPresetParamsSchema = z
  .object({
    temperature: z.number().min(0).max(2).nullish(),
    topP: z.number().min(0).max(1).nullish(),
    topK: z.number().int().min(1).nullish(),
    presencePenalty: z.number().min(-2).max(2).nullish(),
    frequencyPenalty: z.number().min(-2).max(2).nullish(),
    maxOutputTokens: z.number().int().min(1).nullish(),
    seed: z.number().int().nullish(),
    stopSequences: z.array(z.string()).nullish(),
    reasoning: z
      .union([
        z.string(),
        z.boolean(),
        z
          .object({
            effort: z.string().optional(),
            budgetTokens: z.number().optional(),
          })
          .passthrough(),
      ])
      .nullish(),
    toolChoice: z
      .union([
        z.enum(['auto', 'none', 'required', 'any']),
        z.string(),
        z.record(z.string(), z.unknown()),
      ])
      .nullish(),
  })
  .passthrough();

export type ModelPresetParams = z.infer<typeof ModelPresetParamsSchema>;

const RawModelPresetSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    provider: z.string(),
    model_id: z.string(),
    params: ModelPresetParamsSchema.nullish().transform((v) => v ?? {}),
    hydrated_params: ModelPresetParamsSchema.nullish(),
    is_archived: z.boolean().optional(),
    archived_at: z.string().nullish(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const ModelPresetSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>;
    if (
      rec.preset &&
      typeof rec.preset === 'object' &&
      !Array.isArray(rec.preset)
    ) {
      return rec.preset;
    }
    if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      return rec.data;
    }
  }
  return val;
}, RawModelPresetSchema);

export type ModelPreset = z.infer<typeof ModelPresetSchema>;

export const ModelPresetDefaultsSchema = z.record(z.string(), z.unknown());

export type ModelPresetDefaults = z.infer<typeof ModelPresetDefaultsSchema>;

export const CreateModelPresetSchema = z.object({
  name: z.string().min(1, 'Preset name is required'),
  description: z.string().optional(),
  provider: z.string().min(1, 'Provider is required'),
  model_id: z.string().min(1, 'Model ID is required'),
  params: ModelPresetParamsSchema,
});

export type CreateModelPresetInput = z.infer<typeof CreateModelPresetSchema>;

export const UpdateModelPresetSchema = CreateModelPresetSchema.partial();

export type UpdateModelPresetInput = z.infer<typeof UpdateModelPresetSchema>;
