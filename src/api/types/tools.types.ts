import { z } from 'zod';
import { ConnectorType, SandboxTestStatus, ToolStatus, ToolType } from '../../domain/enums';

export const ObservedCallSchema = z
  .object({
    capability: z.string(),
    target: z.string().optional(),
    method: z.string().optional(),
    allowed: z.boolean().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

export type ObservedCall = z.infer<typeof ObservedCallSchema>;

export const ToolTestResultsSchema = z
  .object({
    status: z.enum([SandboxTestStatus.Passed, SandboxTestStatus.Failed]),
    result: z.unknown().optional(),
    observedCalls: z.array(ObservedCallSchema).optional(),
    durationMs: z.number().optional(),
    inputsUsed: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string().optional(),
    reason: z.string().optional(),
    details: z.unknown().optional(),
  })
  .passthrough();

export type ToolTestResults = z.infer<typeof ToolTestResultsSchema>;

export const ToolVersionSchema = z
  .object({
    id: z.string().optional(),
    tool_id: z.string().optional(),
    version: z.number(),
    code: z.string().nullish(),
    schema_json: z.record(z.string(), z.unknown()).default({}),
    capabilities_json: z.array(z.string()).nullish(),
    test_results_json: ToolTestResultsSchema.nullish(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type ToolVersion = z.infer<typeof ToolVersionSchema>;

export const ToolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    type: z.nativeEnum(ToolType),
    status: z.nativeEnum(ToolStatus),
    connector_type: z.nativeEnum(ConnectorType).nullish(),
    is_public: z.boolean().default(false),
    allow_client_execution: z.boolean().default(false),
    rejection_reason: z.string().nullish(),
    reason: z.string().nullish(),
    owner_id: z.string().optional(),
    current_version: ToolVersionSchema.nullish(),
    versions: z.array(ToolVersionSchema).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export type Tool = z.infer<typeof ToolSchema>;

export const CreateToolSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ToolType),
  connector_type: z.nativeEnum(ConnectorType).nullable().optional(),
  is_public: z.boolean().default(false),
  allow_client_execution: z.boolean().default(true),
});

export type CreateToolInput = z.infer<typeof CreateToolSchema>;

export const UpdateToolSchema = z.object({
  name: z.string().min(1, 'Tool name is required').optional(),
  description: z.string().nullable().optional(),
  connector_type: z.nativeEnum(ConnectorType).nullable().optional(),
  is_public: z.boolean().optional(),
  allow_client_execution: z.boolean().optional(),
  status: z.nativeEnum(ToolStatus).optional(),
  rejection_reason: z.string().optional(),
  reason: z.string().optional(),
});

export type UpdateToolInput = z.infer<typeof UpdateToolSchema>;

export const CreateToolVersionSchema = z.object({
  code: z.string().nullable().optional(),
  schema_json: z.record(z.string(), z.unknown()),
  capabilities_json: z.array(z.string()).optional(),
  test_results_json: ToolTestResultsSchema.nullable().optional(),
});

export type CreateToolVersionInput = z.infer<typeof CreateToolVersionSchema>;

export const ToolVersionDiffSchema = z
  .object({
    from_version: z.number().optional(),
    to_version: z.number().optional(),
    code_changed: z.boolean(),
    schema_changed: z.boolean(),
  })
  .passthrough();

export type ToolVersionDiff = z.infer<typeof ToolVersionDiffSchema>;

export const ToolRegistrationResponseSchema = z
  .object({
    status: z.string(),
    result: z.unknown().optional(),
    observedCalls: z.array(ObservedCallSchema).optional(),
    durationMs: z.number().optional(),
    inputsUsed: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string().optional(),
    reason: z.string().optional(),
    details: z.unknown().optional(),
    tool: ToolSchema.optional(),
  })
  .passthrough();

export type ToolRegistrationResponse = z.infer<typeof ToolRegistrationResponseSchema>;
