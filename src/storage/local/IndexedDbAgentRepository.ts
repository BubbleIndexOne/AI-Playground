import { z } from 'zod';
import { ConnectorType } from '../../domain/enums';
import {
  AgentRecord,
  AgentRepository,
  SaveAgentInput,
} from '../interfaces/AgentRepository';
import { runTransaction, STORES } from './idbHelper';

const AgentImportSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(''),
  systemPrompt: z.string().default(''),
  modelPresetId: z.string().default(''),
  attachedTools: z
    .array(
      z.object({
        toolId: z.string().min(1),
        pinnedVersion: z.number().int().nullable().optional(),
      })
    )
    .default([]),
  attachedConnectors: z.array(z.nativeEnum(ConnectorType)).default([]),
});

function sanitizeAgentRecord(raw: AgentRecord & Record<string, unknown>): AgentRecord {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    systemPrompt: raw.systemPrompt ?? '',
    modelPresetId: raw.modelPresetId ?? '',
    attachedTools: Array.isArray(raw.attachedTools) ? [...raw.attachedTools] : [],
    attachedConnectors: Array.isArray(raw.attachedConnectors)
      ? [...raw.attachedConnectors]
      : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class IndexedDbAgentRepository implements AgentRepository {
  async list(): Promise<AgentRecord[]> {
    const items = await runTransaction<Array<AgentRecord & Record<string, unknown>>>(
      STORES.AGENTS,
      'readonly',
      (store) => store.getAll()
    );
    return (items ?? [])
      .map(sanitizeAgentRecord)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<AgentRecord | null> {
    const item = await runTransaction<
      (AgentRecord & Record<string, unknown>) | undefined
    >(STORES.AGENTS, 'readonly', (store) => store.get(id));
    return item ? sanitizeAgentRecord(item) : null;
  }

  async save(input: SaveAgentInput): Promise<AgentRecord> {
    const now = new Date().toISOString();
    const existing = input.id ? await this.get(input.id) : null;

    const record: AgentRecord = {
      id: existing?.id ?? input.id ?? crypto.randomUUID(),
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
      systemPrompt: input.systemPrompt,
      modelPresetId: input.modelPresetId,
      attachedTools: [...input.attachedTools],
      attachedConnectors: [...input.attachedConnectors],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await runTransaction(STORES.AGENTS, 'readwrite', (store) =>
      store.put(record)
    );
    return record;
  }

  async delete(id: string): Promise<void> {
    await runTransaction(STORES.AGENTS, 'readwrite', (store) =>
      store.delete(id)
    );
  }

  async exportAll(): Promise<string> {
    const all = await this.list();
    return JSON.stringify(all, null, 2);
  }

  async importFromJson(jsonText: string): Promise<AgentRecord[]> {
    const raw: unknown = JSON.parse(jsonText);
    const list = Array.isArray(raw) ? raw : [raw];
    const imported: AgentRecord[] = [];
    for (const entry of list) {
      const parsed = AgentImportSchema.parse(entry);
      const saved = await this.save({
        name: parsed.name,
        description: parsed.description,
        systemPrompt: parsed.systemPrompt,
        modelPresetId: parsed.modelPresetId,
        attachedTools: parsed.attachedTools,
        attachedConnectors: parsed.attachedConnectors,
      });
      imported.push(saved);
    }
    return imported;
  }
}

export const agentRepository: AgentRepository = new IndexedDbAgentRepository();
