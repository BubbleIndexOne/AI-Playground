import { z } from 'zod';
import { MODEL_PROVIDERS } from '../../domain/providers';

export const ModelProviderSchema = z.enum(MODEL_PROVIDERS);

export const ModelCredentialItemSchema = z.object({
  id: z.string().uuid(),
  provider: ModelProviderSchema,
  preview: z.string().nullable(),
  key_version: z.number().int(),
  last_verified_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ModelCredentialItem = z.infer<typeof ModelCredentialItemSchema>;

export const ListModelCredentialsResponseSchema = z.object({
  success: z.literal(true),
  credentials: z.array(ModelCredentialItemSchema),
});

export type ListModelCredentialsResponse = z.infer<
  typeof ListModelCredentialsResponseSchema
>;

export const SaveModelCredentialRequestSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type SaveModelCredentialRequest = z.infer<
  typeof SaveModelCredentialRequestSchema
>;

export const SaveModelCredentialResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  credential: ModelCredentialItemSchema,
});

export type SaveModelCredentialResponse = z.infer<
  typeof SaveModelCredentialResponseSchema
>;

export const DeleteModelCredentialResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export type DeleteModelCredentialResponse = z.infer<
  typeof DeleteModelCredentialResponseSchema
>;

export const TestModelCredentialDetailsSchema = z
  .object({
    provider: ModelProviderSchema.optional(),
    latencyMs: z.number().optional(),
  })
  .passthrough();

export type TestModelCredentialDetails = z.infer<
  typeof TestModelCredentialDetailsSchema
>;

export const TestModelCredentialResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  details: TestModelCredentialDetailsSchema.optional(),
});

export type TestModelCredentialResponse = z.infer<
  typeof TestModelCredentialResponseSchema
>;

export const TestModelCredentialFailureSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

export type TestModelCredentialFailure = z.infer<
  typeof TestModelCredentialFailureSchema
>;
