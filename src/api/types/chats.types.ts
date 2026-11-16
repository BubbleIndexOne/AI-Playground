import { z } from 'zod';

export const ChatToolCallSchema = z.object({
  id: z.string(),
  tool_id: z.string(),
  tool_name: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration_ms: z.number().optional(),
  status: z.enum(['running', 'completed', 'failed', 'unavailable']),
});

export type ChatToolCall = z.infer<typeof ChatToolCallSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  tool_calls: z.array(ChatToolCallSchema).default([]),
  error: z.string().nullable().optional(),
  created_at: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSessionSummarySchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  title: z.string(),
  message_count: z.number(),
  last_message_preview: z.string().optional(),
  is_archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ChatSessionSummary = z.infer<typeof ChatSessionSummarySchema>;

export const ChatSessionDetailSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  title: z.string(),
  message_count: z.number(),
  last_message_preview: z.string().optional(),
  messages: z.array(ChatMessageSchema).default([]),
  is_archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ChatSessionDetail = z.infer<typeof ChatSessionDetailSchema>;

export const ListChatsResponseSchema = z.object({
  success: z.boolean(),
  chats: z.array(ChatSessionSummarySchema),
  total: z.number().optional(),
});

export const SingleChatResponseSchema = z.object({
  success: z.boolean(),
  chat: ChatSessionDetailSchema,
});

export interface CreateChatSessionInput {
  readonly id?: string;
  readonly agent_id: string;
  readonly title?: string;
}

export interface UpdateChatSessionInput {
  readonly title?: string;
  readonly is_archived?: boolean;
}

export interface ChatMessageInput {
  readonly id?: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly tool_calls?: readonly ChatToolCall[];
  readonly error?: string | null;
  readonly created_at?: string;
}

export interface AddMessagesInput {
  readonly messages: readonly ChatMessageInput[];
}
