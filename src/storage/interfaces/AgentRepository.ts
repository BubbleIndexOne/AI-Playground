import { ConnectorType } from '../../domain/enums';

export interface AttachedAgentTool {
  readonly toolId: string;
  readonly pinnedVersion?: number | null;
}

export interface AgentRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly modelPresetId: string;
  readonly credentialId: string;
  readonly attachedTools: readonly AttachedAgentTool[];
  readonly attachedConnectors: readonly ConnectorType[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SaveAgentInput {
  readonly id?: string;
  readonly name: string;
  readonly description?: string;
  readonly systemPrompt: string;
  readonly modelPresetId: string;
  readonly credentialId: string;
  readonly attachedTools: readonly AttachedAgentTool[];
  readonly attachedConnectors: readonly ConnectorType[];
}

export interface AgentRepository {
  list(): Promise<AgentRecord[]>;
  get(id: string): Promise<AgentRecord | null>;
  save(input: SaveAgentInput): Promise<AgentRecord>;
  delete(id: string): Promise<void>;
  exportAll(): Promise<string>;
  importFromJson(jsonText: string): Promise<AgentRecord[]>;
}
