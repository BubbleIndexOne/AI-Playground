import {
  ChatMessageRecord,
  ChatRepository,
  ChatSessionRecord,
} from '../interfaces/ChatRepository';
import { runTransaction, STORES } from './idbHelper';

export class IndexedDbChatRepository implements ChatRepository {
  async listByAgent(agentId: string): Promise<ChatSessionRecord[]> {
    const all = await runTransaction<ChatSessionRecord[]>(
      STORES.CHATS,
      'readonly',
      (store) => store.getAll()
    );
    return (all ?? [])
      .filter((c) => c.agentId === agentId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(chatId: string): Promise<ChatSessionRecord | null> {
    const item = await runTransaction<ChatSessionRecord | undefined>(
      STORES.CHATS,
      'readonly',
      (store) => store.get(chatId)
    );
    return item ?? null;
  }

  async create(agentId: string, title?: string): Promise<ChatSessionRecord> {
    const now = new Date().toISOString();
    const record: ChatSessionRecord = {
      id: crypto.randomUUID(),
      agentId,
      title: title?.trim() || 'New Conversation',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    await runTransaction(STORES.CHATS, 'readwrite', (store) =>
      store.put(record)
    );
    return record;
  }

  async rename(chatId: string, title: string): Promise<ChatSessionRecord> {
    const existing = await this.get(chatId);
    if (!existing) {
      throw new Error('Chat session not found');
    }
    const updated: ChatSessionRecord = {
      ...existing,
      title: title.trim() || existing.title,
      updatedAt: new Date().toISOString(),
    };
    await runTransaction(STORES.CHATS, 'readwrite', (store) =>
      store.put(updated)
    );
    return updated;
  }

  async saveMessages(
    chatId: string,
    messages: readonly ChatMessageRecord[]
  ): Promise<ChatSessionRecord> {
    const existing = await this.get(chatId);
    if (!existing) {
      throw new Error('Chat session not found');
    }
    const updated: ChatSessionRecord = {
      ...existing,
      messages: [...messages],
      updatedAt: new Date().toISOString(),
    };
    await runTransaction(STORES.CHATS, 'readwrite', (store) =>
      store.put(updated)
    );
    return updated;
  }

  async delete(chatId: string): Promise<void> {
    await runTransaction(STORES.CHATS, 'readwrite', (store) =>
      store.delete(chatId)
    );
  }
}

export const chatRepository: ChatRepository = new IndexedDbChatRepository();
