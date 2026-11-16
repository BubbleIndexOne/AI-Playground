import { z } from 'zod';
import { ConnectorType } from '../../domain/enums';
import { BlobbieConfig } from '../../shared/blobbies';

export const BlobbieConfigSchema = z.object({
  sides: z.number(),
  round: z.number(),
  bumps: z.number(),
  point: z.number(),
  pa: z.number(),
  sx: z.number(),
  sy: z.number(),
  rot: z.number(),
  color: z.string(),
  es: z.number(),
  tilt: z.number(),
  sp: z.number(),
  fx: z.number(),
  fy: z.number(),
});

export const AttachedToolInputSchema = z.object({
  tool_id: z.string().uuid(),
  pinned_version: z.number().int().nullable().optional(),
});

export type AttachedToolInput = z.infer<typeof AttachedToolInputSchema>;

export const AttachedToolDetailSchema = z.object({
  tool_id: z.string(),
  name: z.string(),
  pinned_version: z.number().nullable(),
  current_version: z.number(),
  status: z.string(),
  type: z.enum(['client', 'mcp']),
});

export type AttachedToolDetail = z.infer<typeof AttachedToolDetailSchema>;

export const AgentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().default(''),
  system_prompt: z.string().default(''),
  source_preset_id: z.string().nullable().optional(),
  model_provider: z.string(),
  model_id: z.string(),
  model_params: z.record(z.string(), z.unknown()).default({}),
  avatar: BlobbieConfigSchema,
  attached_tools: z.array(AttachedToolDetailSchema).default([]),
  attached_connectors: z.array(z.nativeEnum(ConnectorType)).default([]),
  is_archived: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export const AgentListResponseSchema = z.object({
  success: z.boolean(),
  agents: z.array(AgentResponseSchema),
});

export interface CreateAgentInput {
  readonly id?: string;
  readonly name: string;
  readonly description?: string;
  readonly system_prompt: string;
  readonly source_preset_id?: string | null;
  readonly model_provider?: string;
  readonly model_id?: string;
  readonly model_params?: Record<string, unknown>;
  readonly avatar?: BlobbieConfig;
  readonly attached_tools?: readonly AttachedToolInput[];
  readonly attached_connectors?: readonly ConnectorType[];
}

export interface UpdateAgentInput {
  readonly name?: string;
  readonly description?: string;
  readonly system_prompt?: string;
  readonly source_preset_id?: string | null;
  readonly model_provider?: string;
  readonly model_id?: string;
  readonly model_params?: Record<string, unknown>;
  readonly avatar?: BlobbieConfig;
  readonly attached_tools?: readonly AttachedToolInput[];
  readonly attached_connectors?: readonly ConnectorType[];
  readonly is_archived?: boolean;
}

export interface ExportAgentsResponse {
  readonly version: number;
  readonly exported_at: string;
  readonly agents: AgentResponse[];
}
