import { chatsApi } from '../../api/chats.api';
import {
  ChatMessage,
  ChatMessageInput,
  ChatSessionDetail,
} from '../../api/types/chats.types';
import { ApiError } from '../../api/http/errors';
import {
  ChatMessageRecord,
  ChatRepository,
  ChatSessionRecord,
  ChatToolCallRecord,
} from '../interfaces/ChatRepository';

function mapChatMessageToRecord(msg: ChatMessage): ChatMessageRecord {
  const toolCalls: ChatToolCallRecord[] = (msg.tool_calls || []).map((tc) => ({
    id: tc.id,
    toolId: tc.tool_id,
    toolName: tc.tool_name,
    input: tc.input,
    output: tc.output,
    error: tc.error,
    durationMs: tc.duration_ms,
    status: tc.status,
  }));

  return {
    id: msg.id,
    role: msg.role === 'system' ? 'assistant' : msg.role,
    content: msg.content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    createdAt: msg.created_at,
    error: msg.error ?? undefined,
  };
}

function mapChatDetailToRecord(detail: ChatSessionDetail): ChatSessionRecord {
  return {
    id: detail.id,
    agentId: detail.agent_id,
    title: detail.title,
    messages: (detail.messages || []).map(mapChatMessageToRecord),
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
  };
}

export class RemoteChatRepository implements ChatRepository {
  async listByAgent(agentId: string): Promise<ChatSessionRecord[]> {
    const summaries = await chatsApi.list(agentId);
    if (!summaries || summaries.length === 0) {
      return [];
    }

    const fullSessions = await Promise.all(
      summaries.map(async (s) => {
        try {
          const detail = await chatsApi.getById(s.id);
          return mapChatDetailToRecord(detail);
        } catch {
          return {
            id: s.id,
            agentId: s.agent_id,
            title: s.title,
            messages: [],
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          };
        }
      })
    );

    return fullSessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(chatId: string): Promise<ChatSessionRecord | null> {
    try {
      const detail = await chatsApi.getById(chatId);
      return mapChatDetailToRecord(detail);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async create(agentId: string, title?: string, id?: string): Promise<ChatSessionRecord> {
    const detail = await chatsApi.create(agentId, title, id);
    return mapChatDetailToRecord(detail);
  }

  async rename(chatId: string, title: string): Promise<ChatSessionRecord> {
    await chatsApi.update(chatId, { title: title.trim() });
    const updated = await this.get(chatId);
    if (!updated) {
      throw new Error('Chat session not found after rename');
    }
    return updated;
  }

  async saveMessages(
    chatId: string,
    messages: readonly ChatMessageRecord[]
  ): Promise<ChatSessionRecord> {
    const messageInputs: ChatMessageInput[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      tool_calls: (m.toolCalls || []).map((tc) => ({
        id: tc.id,
        tool_id: tc.toolId,
        tool_name: tc.toolName,
        input: tc.input,
        output: tc.output,
        error: tc.error,
        duration_ms: tc.durationMs,
        status: tc.status,
      })),
      error: m.error || null,
      created_at: m.createdAt,
    }));

    if (messageInputs.length > 0) {
      await chatsApi.addMessages(chatId, messageInputs);
    }

    const updated = await this.get(chatId);
    if (!updated) {
      throw new Error('Chat session not found');
    }
    return updated;
  }

  async delete(chatId: string): Promise<void> {
    await chatsApi.delete(chatId);
  }
}

export const remoteChatRepository: ChatRepository = new RemoteChatRepository();
