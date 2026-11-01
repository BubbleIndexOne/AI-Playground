import { z } from 'zod';
import {
  ConnectorType,
  SandboxTestStatus,
  ToolStatus,
  ToolType,
} from '../../domain/enums';

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

const RawToolVersionSchema = z
  .object({
    id: z.string().optional(),
    tool_id: z.string().optional(),
    version: z.coerce.number().optional(),
    version_number: z.coerce.number().optional(),
    code: z.string().nullish(),
    code_hash: z.string().nullish(),
    schema_json: z
      .record(z.string(), z.unknown())
      .nullish()
      .transform((v) => v ?? {}),
    capabilities_json: z.array(z.string()).nullish(),
    test_results_json: ToolTestResultsSchema.nullish(),
    created_at: z.string().optional(),
  })
  .passthrough()
  .transform((val) => {
    const resolvedVersion = val.version ?? val.version_number ?? 1;
    return {
      ...val,
      version: resolvedVersion,
      version_number: resolvedVersion,
    };
  });

export const ToolVersionSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>;
    if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      return rec.data;
    }
    if (
      rec.version &&
      typeof rec.version === 'object' &&
      !Array.isArray(rec.version)
    ) {
      return rec.version;
    }
    if (
      rec.tool_version &&
      typeof rec.tool_version === 'object' &&
      !Array.isArray(rec.tool_version)
    ) {
      return rec.tool_version;
    }
  }
  return val;
}, RawToolVersionSchema);

export type ToolVersion = z.infer<typeof ToolVersionSchema>;

const RawToolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    type: z.nativeEnum(ToolType),
    status: z.nativeEnum(ToolStatus),
    connector_type: z.nativeEnum(ConnectorType).nullish(),
    is_public: z
      .boolean()
      .nullish()
      .transform((v) => Boolean(v)),
    allow_client_execution: z
      .boolean()
      .nullish()
      .transform((v) => Boolean(v)),
    rejection_reason: z.string().nullish(),
    reason: z.string().nullish(),
    owner_id: z.string().optional(),
    current_version_id: z.string().nullish(),
    current_version: z.preprocess((cv) => {
      if (typeof cv === 'number') {
        return { version: cv, version_number: cv, schema_json: {} };
      }
      return cv;
    }, ToolVersionSchema.nullish()),
    versions: z.array(ToolVersionSchema).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const ToolSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>;
    if (rec.tool && typeof rec.tool === 'object' && !Array.isArray(rec.tool)) {
      return rec.tool;
    }
    if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      return rec.data;
    }
  }
  return val;
}, RawToolSchema);

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

const RawToolVersionDiffSchema = z
  .object({
    from_version: z.coerce.number().optional(),
    to_version: z.coerce.number().optional(),
    code_changed: z.boolean().optional().default(false),
    schema_changed: z.boolean().optional().default(false),
  })
  .passthrough();

export const ToolVersionDiffSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>;
    if (rec.diff && typeof rec.diff === 'object' && !Array.isArray(rec.diff)) {
      return rec.diff;
    }
    if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      return rec.data;
    }
  }
  return val;
}, RawToolVersionDiffSchema);

export type ToolVersionDiff = z.infer<typeof ToolVersionDiffSchema>;

export const ToolRegistrationResponseSchema = z
  .object({
    status: z.string().optional().default('registered'),
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

export type ToolRegistrationResponse = z.infer<
  typeof ToolRegistrationResponseSchema
>;
