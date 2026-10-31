import {
  AgentRecord,
  SaveAgentInput,
} from '../../../storage/interfaces/AgentRepository';
import { agentRepository } from '../../../storage/local/IndexedDbAgentRepository';

export const agentsService = {
  list(): Promise<AgentRecord[]> {
    return agentRepository.list();
  },

  get(id: string): Promise<AgentRecord | null> {
    return agentRepository.get(id);
  },

  save(input: SaveAgentInput): Promise<AgentRecord> {
    return agentRepository.save(input);
  },

  delete(id: string): Promise<void> {
    return agentRepository.delete(id);
  },

  exportAll(): Promise<string> {
    return agentRepository.exportAll();
  },

  importFromJson(jsonText: string): Promise<AgentRecord[]> {
    return agentRepository.importFromJson(jsonText);
  },

  async attachToolToAgent(
    agentId: string,
    toolId: string,
    pinnedVersion?: number | null
  ): Promise<AgentRecord> {
    const existing = await agentRepository.get(agentId);
    if (!existing) {
      throw new Error('Agent not found');
    }
    const filtered = existing.attachedTools.filter((t) => t.toolId !== toolId);
    return agentRepository.save({
      ...existing,
      attachedTools: [
        ...filtered,
        { toolId, pinnedVersion: pinnedVersion ?? null },
      ],
    });
  },
};
