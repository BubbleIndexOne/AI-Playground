import { z } from 'zod';
import { apiRequest } from './http/client';
import {
  AgentListResponseSchema,
  AgentResponse,
  AgentResponseSchema,
  CreateAgentInput,
  ExportAgentsResponse,
  UpdateAgentInput,
} from './types/agents.types';

export interface ListAgentsFilters {
  readonly includeArchived?: boolean;
  readonly search?: string;
}

const ImportResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  agents: z.array(AgentResponseSchema),
});

export const agentsApi = {
  async list(filters?: ListAgentsFilters): Promise<AgentResponse[]> {
    const res = await apiRequest({
      method: 'GET',
      path: '/agents',
      query: {
        include_archived: filters?.includeArchived ? 'true' : undefined,
        search: filters?.search || undefined,
      },
      security: 'bearer',
      schema: AgentListResponseSchema,
    });
    return res.agents;
  },

  getById(id: string): Promise<AgentResponse> {
    return apiRequest({
      method: 'GET',
      path: `/agents/${encodeURIComponent(id)}`,
      security: 'bearer',
      schema: AgentResponseSchema,
    });
  },

  create(body: CreateAgentInput): Promise<AgentResponse> {
    return apiRequest({
      method: 'POST',
      path: '/agents',
      body,
      security: 'bearer',
      schema: AgentResponseSchema,
    });
  },

  update(id: string, body: UpdateAgentInput): Promise<AgentResponse> {
    return apiRequest({
      method: 'PATCH',
      path: `/agents/${encodeURIComponent(id)}`,
      body,
      security: 'bearer',
      schema: AgentResponseSchema,
    });
  },

  delete(id: string, hard: boolean = false): Promise<void> {
    return apiRequest({
      method: 'DELETE',
      path: `/agents/${encodeURIComponent(id)}`,
      query: hard ? { hard: 'true' } : undefined,
      security: 'bearer',
    });
  },

  exportAll(): Promise<ExportAgentsResponse> {
    return apiRequest({
      method: 'POST',
      path: '/agents/export',
      security: 'bearer',
    });
  },

  async importAgents(agents: readonly CreateAgentInput[]): Promise<AgentResponse[]> {
    const res = await apiRequest({
      method: 'POST',
      path: '/agents/import',
      body: { agents },
      security: 'bearer',
      schema: ImportResponseSchema,
    });
    return res.agents;
  },
};
