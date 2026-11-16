import { z } from 'zod';
import { apiRequest } from './http/client';
import {
  ChatMessage,
  ChatMessageInput,
  ChatMessageSchema,
  ChatSessionDetail,
  ChatSessionSummary,
  ListChatsResponseSchema,
  SingleChatResponseSchema,
  UpdateChatSessionInput,
} from './types/chats.types';

const AddMessagesResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  messages: z.array(ChatMessageSchema),
});

export const chatsApi = {
  async list(agentId?: string, limit?: number, offset?: number): Promise<ChatSessionSummary[]> {
    const res = await apiRequest({
      method: 'GET',
      path: '/chats',
      query: {
        agent_id: agentId || undefined,
        limit,
        offset,
      },
      security: 'bearer',
      schema: ListChatsResponseSchema,
    });
    return res.chats;
  },

  async getById(id: string, limit?: number, before?: string): Promise<ChatSessionDetail> {
    const res = await apiRequest({
      method: 'GET',
      path: `/chats/${encodeURIComponent(id)}`,
      query: {
        limit,
        before,
      },
      security: 'bearer',
      schema: SingleChatResponseSchema,
    });
    return res.chat;
  },

  async create(agentId: string, title?: string, id?: string): Promise<ChatSessionDetail> {
    const res = await apiRequest({
      method: 'POST',
      path: '/chats',
      body: {
        id,
        agent_id: agentId,
        title,
      },
      security: 'bearer',
      schema: SingleChatResponseSchema,
    });
    return res.chat;
  },

  async update(id: string, body: UpdateChatSessionInput): Promise<{ id: string; title: string; updated_at?: string }> {
    const res = await apiRequest<{ success: boolean; chat: { id: string; title: string; updated_at: string } }>({
      method: 'PATCH',
      path: `/chats/${encodeURIComponent(id)}`,
      body,
      security: 'bearer',
    });
    return res.chat;
  },

  delete(id: string): Promise<void> {
    return apiRequest({
      method: 'DELETE',
      path: `/chats/${encodeURIComponent(id)}`,
      security: 'bearer',
    });
  },

  async addMessages(id: string, messages: readonly ChatMessageInput[]): Promise<ChatMessage[]> {
    const res = await apiRequest({
      method: 'POST',
      path: `/chats/${encodeURIComponent(id)}/messages`,
      body: { messages },
      security: 'bearer',
      schema: AddMessagesResponseSchema,
    });
    return res.messages;
  },

  deleteMessage(chatId: string, messageId: string): Promise<void> {
    return apiRequest({
      method: 'DELETE',
      path: `/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`,
      security: 'bearer',
    });
  },
};
