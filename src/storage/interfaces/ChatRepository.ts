export interface ChatToolCallRecord {
  readonly id: string;
  readonly toolId: string;
  readonly toolName: string;
  readonly input: Record<string, unknown>;
  readonly output?: unknown;
  readonly error?: string;
  readonly durationMs?: number;
  readonly status: 'running' | 'completed' | 'failed' | 'unavailable';
}

export interface ChatMessageRecord {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly toolCalls?: readonly ChatToolCallRecord[];
  readonly createdAt: string;
  readonly error?: string;
}

export interface ChatSessionRecord {
  readonly id: string;
  readonly agentId: string;
  readonly title: string;
  readonly messages: readonly ChatMessageRecord[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChatRepository {
  listByAgent(agentId: string): Promise<ChatSessionRecord[]>;
  get(chatId: string): Promise<ChatSessionRecord | null>;
  create(agentId: string, title?: string): Promise<ChatSessionRecord>;
  rename(chatId: string, title: string): Promise<ChatSessionRecord>;
  saveMessages(
    chatId: string,
    messages: readonly ChatMessageRecord[]
  ): Promise<ChatSessionRecord>;
  delete(chatId: string): Promise<void>;
}
