import { z } from 'zod';
import { ToolStatus, ToolType } from '../domain/enums';
import { apiRequest, SecurityScheme } from './http/client';
import {
  CreateToolInput,
  CreateToolVersionInput,
  Tool,
  ToolRegistrationResponse,
  ToolRegistrationResponseSchema,
  ToolSchema,
  ToolVersion,
  ToolVersionDiff,
  ToolVersionDiffSchema,
  ToolVersionSchema,
  UpdateToolInput,
} from './types/tools.types';

const ToolListResponseSchema = z
  .union([
    z.array(ToolSchema),
    z.object({ items: z.array(ToolSchema) }).transform((v) => v.items),
    z.object({ data: z.array(ToolSchema) }).transform((v) => v.data),
    z.object({ tools: z.array(ToolSchema) }).transform((v) => v.tools),
  ]);

const ToolVersionListResponseSchema = z
  .union([
    z.array(ToolVersionSchema),
    z.object({ items: z.array(ToolVersionSchema) }).transform((v) => v.items),
    z.object({ data: z.array(ToolVersionSchema) }).transform((v) => v.data),
    z.object({ versions: z.array(ToolVersionSchema) }).transform((v) => v.versions),
  ]);

export interface ListToolsFilters {
  readonly type?: ToolType;
  readonly status?: ToolStatus;
  readonly include_public?: boolean;
}

export const toolsApi = {
  list(filters?: ListToolsFilters, security: SecurityScheme = 'bearer'): Promise<Tool[]> {
    return apiRequest({
      method: 'GET',
      path: '/tools',
      query: {
        type: filters?.type,
        status: filters?.status,
        include_public: filters?.include_public,
      },
      security,
      schema: ToolListResponseSchema,
    });
  },

  getById(id: string, security: SecurityScheme = 'bearer'): Promise<Tool> {
    return apiRequest({
      method: 'GET',
      path: `/tools/${encodeURIComponent(id)}`,
      security,
      schema: ToolSchema,
    });
  },

  create(body: CreateToolInput): Promise<Tool> {
    return apiRequest({
      method: 'POST',
      path: '/tools',
      body,
      security: 'bearer',
      schema: ToolSchema,
    });
  },

  update(
    id: string,
    body: UpdateToolInput,
    security: SecurityScheme = 'bearer'
  ): Promise<Tool> {
    return apiRequest({
      method: 'PATCH',
      path: `/tools/${encodeURIComponent(id)}`,
      body,
      security,
      schema: ToolSchema,
    });
  },

  delete(
    id: string,
    options?: { purge?: boolean; security?: SecurityScheme }
  ): Promise<unknown> {
    return apiRequest({
      method: 'DELETE',
      path: `/tools/${encodeURIComponent(id)}`,
      query: options?.purge ? { purge: true } : undefined,
      security: options?.security ?? 'bearer',
    });
  },

  createVersion(toolId: string, body: CreateToolVersionInput): Promise<ToolVersion> {
    return apiRequest({
      method: 'POST',
      path: `/tools/${encodeURIComponent(toolId)}/versions`,
      body,
      security: 'bearer',
      schema: ToolVersionSchema,
    });
  },

  listVersions(
    toolId: string,
    security: SecurityScheme = 'bearer'
  ): Promise<ToolVersion[]> {
    return apiRequest({
      method: 'GET',
      path: `/tools/${encodeURIComponent(toolId)}/versions`,
      security,
      schema: ToolVersionListResponseSchema,
    });
  },

  getVersion(
    toolId: string,
    version: number,
    security: SecurityScheme = 'bearer'
  ): Promise<ToolVersion> {
    return apiRequest({
      method: 'GET',
      path: `/tools/${encodeURIComponent(toolId)}/versions/${encodeURIComponent(version)}`,
      security,
      schema: ToolVersionSchema,
    });
  },

  diffVersions(
    toolId: string,
    fromVersion: number,
    toVersion: number,
    security: SecurityScheme = 'bearer'
  ): Promise<ToolVersionDiff> {
    return apiRequest({
      method: 'GET',
      path: `/tools/${encodeURIComponent(toolId)}/versions/diff`,
      query: {
        from: fromVersion,
        to: toVersion,
        v1: fromVersion,
        v2: toVersion,
      },
      security,
      schema: ToolVersionDiffSchema,
    });
  },

  register(
    toolId: string,
    inputs?: Record<string, unknown>
  ): Promise<ToolRegistrationResponse> {
    return apiRequest({
      method: 'POST',
      path: `/tools/${encodeURIComponent(toolId)}/register`,
      body: inputs && Object.keys(inputs).length > 0 ? { inputs } : {},
      security: 'bearer',
      schema: ToolRegistrationResponseSchema,
    });
  },
};
