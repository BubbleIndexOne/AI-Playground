import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectorType } from '../../../domain/enums';

// Mock agentsApi
const agentsApiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exportAll: vi.fn(),
  importAgents: vi.fn(),
}));

vi.mock('../../../api/agents.api', () => ({
  agentsApi: agentsApiMocks,
}));

// Mock chatsApi
const chatsApiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  addMessages: vi.fn(),
  deleteMessage: vi.fn(),
}));

vi.mock('../../../api/chats.api', () => ({
  chatsApi: chatsApiMocks,
}));

import { RemoteAgentRepository } from '../RemoteAgentRepository';
import { RemoteChatRepository } from '../RemoteChatRepository';

const mockBlobbie = {
  sides: 0,
  round: 0.85,
  bumps: 0.04,
  point: 0.3,
  pa: -2.3,
  sx: 1.0,
  sy: 1.0,
  rot: 0.0,
  color: '#00a590',
  es: 1.0,
  tilt: 0.0,
  sp: 0.35,
  fx: 0.0,
  fy: -0.15,
};

const sampleAgentResponse = {
  id: 'e4b2d184-722a-4632-a5e2-040212a42167',
  name: 'Dr. Elena Vance',
  description: 'Senior Quant Specialist',
  system_prompt: 'Analyze formulas rigorously.',
  source_preset_id: 'preset-uuid-1',
  model_provider: 'google',
  model_id: 'gemini-2.5-flash',
  model_params: { temperature: 0.2 },
  avatar: mockBlobbie,
  attached_tools: [
    {
      tool_id: 'tool-uuid-1',
      name: 'math_calculator',
      pinned_version: 1,
      current_version: 2,
      status: 'verified',
      type: 'client' as const,
    },
  ],
  attached_connectors: ['postgres' as const],
  is_archived: false,
  created_at: '2026-11-15T09:00:00.000Z',
  updated_at: '2026-11-15T09:00:00.000Z',
};

const sampleChatDetail = {
  id: 'chat-uuid-1',
  agent_id: 'e4b2d184-722a-4632-a5e2-040212a42167',
  title: 'Math Analysis',
  message_count: 2,
  is_archived: false,
  created_at: '2026-11-15T09:05:00.000Z',
  updated_at: '2026-11-15T09:10:00.000Z',
  messages: [
    {
      id: 'msg-uuid-1',
      chat_id: 'chat-uuid-1',
      role: 'user' as const,
      content: 'Compute 42 * 17',
      tool_calls: [],
      created_at: '2026-11-15T09:05:00.000Z',
    },
    {
      id: 'msg-uuid-2',
      chat_id: 'chat-uuid-1',
      role: 'assistant' as const,
      content: 'Result is 714',
      tool_calls: [
        {
          id: 'call-1',
          tool_id: 'tool-uuid-1',
          tool_name: 'math_calculator',
          input: { expression: '42 * 17' },
          output: { result: 714 },
          duration_ms: 12,
          status: 'completed' as const,
        },
      ],
      created_at: '2026-11-15T09:05:02.000Z',
    },
  ],
};

describe('RemoteAgentRepository', () => {
  let repo: RemoteAgentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new RemoteAgentRepository();
  });

  it('lists agents and maps snake_case properties to camelCase', async () => {
    agentsApiMocks.list.mockResolvedValueOnce([sampleAgentResponse]);

    const result = await repo.list();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(sampleAgentResponse.id);
    expect(result[0].name).toBe('Dr. Elena Vance');
    expect(result[0].systemPrompt).toBe('Analyze formulas rigorously.');
    expect(result[0].modelPresetId).toBe('preset-uuid-1');
    expect(result[0].attachedTools[0].toolId).toBe('tool-uuid-1');
    expect(result[0].attachedTools[0].pinnedVersion).toBe(1);
    expect(result[0].avatar?.color).toBe('#00a590');
  });

  it('saves a new agent via agentsApi.create when no id is provided', async () => {
    agentsApiMocks.create.mockResolvedValueOnce(sampleAgentResponse);

    const saved = await repo.save({
      name: 'Dr. Elena Vance',
      description: 'Senior Quant Specialist',
      systemPrompt: 'Analyze formulas rigorously.',
      modelPresetId: 'preset-uuid-1',
      attachedTools: [{ toolId: 'tool-uuid-1', pinnedVersion: 1 }],
      attachedConnectors: [ConnectorType.Postgres],
      avatar: mockBlobbie,
    });

    expect(agentsApiMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dr. Elena Vance',
        system_prompt: 'Analyze formulas rigorously.',
        source_preset_id: 'preset-uuid-1',
      })
    );
    expect(saved.id).toBe(sampleAgentResponse.id);
  });

  it('updates an existing agent via agentsApi.update when id is provided', async () => {
    agentsApiMocks.update.mockResolvedValueOnce(sampleAgentResponse);

    const updated = await repo.save({
      id: sampleAgentResponse.id,
      name: 'Dr. Elena Vance',
      systemPrompt: 'Updated prompt',
      modelPresetId: 'preset-uuid-1',
      attachedTools: [],
      attachedConnectors: [],
    });

    expect(agentsApiMocks.update).toHaveBeenCalledWith(
      sampleAgentResponse.id,
      expect.objectContaining({
        system_prompt: 'Updated prompt',
      })
    );
    expect(updated.id).toBe(sampleAgentResponse.id);
  });

  it('deletes an agent via agentsApi.delete', async () => {
    agentsApiMocks.delete.mockResolvedValueOnce(undefined);

    await repo.delete('agent-123');
    expect(agentsApiMocks.delete).toHaveBeenCalledWith('agent-123', false);
  });
});

describe('RemoteChatRepository', () => {
  let repo: RemoteChatRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new RemoteChatRepository();
  });

  it('lists chat sessions for an agent and populates full messages', async () => {
    chatsApiMocks.list.mockResolvedValueOnce([
      {
        id: sampleChatDetail.id,
        agent_id: sampleChatDetail.agent_id,
        title: sampleChatDetail.title,
        message_count: 2,
        is_archived: false,
        created_at: sampleChatDetail.created_at,
        updated_at: sampleChatDetail.updated_at,
      },
    ]);
    chatsApiMocks.getById.mockResolvedValueOnce(sampleChatDetail);

    const sessions = await repo.listByAgent(sampleChatDetail.agent_id);

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('chat-uuid-1');
    expect(sessions[0].title).toBe('Math Analysis');
    expect(sessions[0].messages).toHaveLength(2);
    expect(sessions[0].messages[1].toolCalls?.[0].toolName).toBe('math_calculator');
    expect(sessions[0].messages[1].toolCalls?.[0].status).toBe('completed');
  });

  it('creates a new chat session via chatsApi.create', async () => {
    chatsApiMocks.create.mockResolvedValueOnce(sampleChatDetail);

    const created = await repo.create('agent-123', 'New Chat');

    expect(chatsApiMocks.create).toHaveBeenCalledWith('agent-123', 'New Chat', undefined);
    expect(created.id).toBe('chat-uuid-1');
  });

  it('saves messages and tool calls via chatsApi.addMessages', async () => {
    chatsApiMocks.addMessages.mockResolvedValueOnce(sampleChatDetail.messages);
    chatsApiMocks.getById.mockResolvedValueOnce(sampleChatDetail);

    const result = await repo.saveMessages(sampleChatDetail.id, [
      {
        id: 'msg-uuid-1',
        role: 'user',
        content: 'Compute 42 * 17',
        createdAt: '2026-11-15T09:05:00.000Z',
      },
    ]);

    expect(chatsApiMocks.addMessages).toHaveBeenCalledWith(
      sampleChatDetail.id,
      expect.arrayContaining([
        expect.objectContaining({
          id: 'msg-uuid-1',
          role: 'user',
          content: 'Compute 42 * 17',
        }),
      ])
    );
    expect(result.id).toBe(sampleChatDetail.id);
  });
});
