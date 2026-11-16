import { agentsApi } from '../../api/agents.api';
import { AgentResponse, CreateAgentInput, UpdateAgentInput } from '../../api/types/agents.types';
import { ApiError } from '../../api/http/errors';
import { ConnectorType } from '../../domain/enums';
import { fromSeed } from '../../shared/blobbies';
import {
  AgentRecord,
  AgentRepository,
  AttachedAgentTool,
  SaveAgentInput,
} from '../interfaces/AgentRepository';

function mapAgentResponseToRecord(apiAgent: AgentResponse): AgentRecord {
  const avatar = apiAgent.avatar || fromSeed(apiAgent.name || apiAgent.id);
  const attachedTools: AttachedAgentTool[] = (apiAgent.attached_tools || []).map((t) => ({
    toolId: t.tool_id,
    pinnedVersion: t.pinned_version ?? null,
  }));

  return {
    id: apiAgent.id,
    name: apiAgent.name,
    description: apiAgent.description ?? '',
    systemPrompt: apiAgent.system_prompt ?? '',
    modelPresetId: apiAgent.source_preset_id ?? '',
    attachedTools,
    attachedConnectors: (apiAgent.attached_connectors as ConnectorType[]) ?? [],
    avatar,
    createdAt: apiAgent.created_at,
    updatedAt: apiAgent.updated_at,
  };
}

export class RemoteAgentRepository implements AgentRepository {
  async list(): Promise<AgentRecord[]> {
    const list = await agentsApi.list({ includeArchived: false });
    return list.map(mapAgentResponseToRecord);
  }

  async get(id: string): Promise<AgentRecord | null> {
    try {
      const res = await agentsApi.getById(id);
      return mapAgentResponseToRecord(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async save(input: SaveAgentInput): Promise<AgentRecord> {
    const attachedTools = input.attachedTools.map((t) => ({
      tool_id: t.toolId,
      pinned_version: t.pinnedVersion ?? null,
    }));

    if (input.id) {
      // Check if updating an existing record
      try {
        const updatePayload: UpdateAgentInput = {
          name: input.name.trim(),
          description: (input.description ?? '').trim(),
          system_prompt: input.systemPrompt,
          source_preset_id: input.modelPresetId ? input.modelPresetId : null,
          avatar: input.avatar ?? fromSeed(input.name.trim()),
          attached_tools: attachedTools,
          attached_connectors: input.attachedConnectors,
        };
        const updated = await agentsApi.update(input.id, updatePayload);
        return mapAgentResponseToRecord(updated);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // If not found on backend (e.g. migration with pre-allocated UUID), create with that ID
          const createPayload: CreateAgentInput = {
            id: input.id,
            name: input.name.trim(),
            description: (input.description ?? '').trim(),
            system_prompt: input.systemPrompt,
            source_preset_id: input.modelPresetId ? input.modelPresetId : null,
            avatar: input.avatar ?? fromSeed(input.name.trim()),
            attached_tools: attachedTools,
            attached_connectors: input.attachedConnectors,
          };
          const created = await agentsApi.create(createPayload);
          return mapAgentResponseToRecord(created);
        }
        throw err;
      }
    }

    // New agent without specified ID
    const createPayload: CreateAgentInput = {
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
      system_prompt: input.systemPrompt,
      source_preset_id: input.modelPresetId ? input.modelPresetId : null,
      avatar: input.avatar ?? fromSeed(input.name.trim()),
      attached_tools: attachedTools,
      attached_connectors: input.attachedConnectors,
    };
    const created = await agentsApi.create(createPayload);
    return mapAgentResponseToRecord(created);
  }

  async delete(id: string): Promise<void> {
    await agentsApi.delete(id, false);
  }

  async exportAll(): Promise<string> {
    const exported = await agentsApi.exportAll();
    return JSON.stringify(exported, null, 2);
  }

  async importFromJson(jsonText: string): Promise<AgentRecord[]> {
    const parsed = JSON.parse(jsonText);
    const rawList: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.agents)
      ? parsed.agents
      : [];

    if (rawList.length === 0) {
      return [];
    }

    const createInputs: CreateAgentInput[] = rawList.map((item) => ({
      id: item.id || undefined,
      name: item.name || 'Imported Agent',
      description: item.description || '',
      system_prompt: item.systemPrompt || item.system_prompt || '',
      source_preset_id: item.modelPresetId || item.source_preset_id || null,
      avatar: item.avatar || fromSeed(item.name || 'agent'),
      attached_tools: (item.attachedTools || item.attached_tools || []).map((t: any) => ({
        tool_id: t.toolId || t.tool_id,
        pinned_version: t.pinnedVersion ?? t.pinned_version ?? null,
      })),
      attached_connectors: item.attachedConnectors || item.attached_connectors || [],
    }));

    const imported = await agentsApi.importAgents(createInputs);
    return imported.map(mapAgentResponseToRecord);
  }
}

export const remoteAgentRepository: AgentRepository = new RemoteAgentRepository();
