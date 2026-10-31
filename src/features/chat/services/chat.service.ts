import {
  resolveAgentTools,
  runAgentLoop,
  RunAgentLoopInput,
} from '../../../runtime/agentRunner';
import { ResolvedExecutableTool } from '../../../runtime/executors/ToolExecutor';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import {
  ChatMessageRecord,
  ChatSessionRecord,
} from '../../../storage/interfaces/ChatRepository';
import { chatRepository } from '../../../storage/local/IndexedDbChatRepository';

export const chatService = {
  listByAgent(agentId: string): Promise<ChatSessionRecord[]> {
    return chatRepository.listByAgent(agentId);
  },

  getChat(chatId: string): Promise<ChatSessionRecord | null> {
    return chatRepository.get(chatId);
  },

  createChat(agentId: string, title?: string): Promise<ChatSessionRecord> {
    return chatRepository.create(agentId, title);
  },

  renameChat(chatId: string, title: string): Promise<ChatSessionRecord> {
    return chatRepository.rename(chatId, title);
  },

  saveMessages(
    chatId: string,
    messages: readonly ChatMessageRecord[]
  ): Promise<ChatSessionRecord> {
    return chatRepository.saveMessages(chatId, messages);
  },

  deleteChat(chatId: string): Promise<void> {
    return chatRepository.delete(chatId);
  },

  resolveTools(agent: AgentRecord): Promise<ResolvedExecutableTool[]> {
    return resolveAgentTools(agent);
  },

  runLoop(input: RunAgentLoopInput): Promise<ChatMessageRecord> {
    return runAgentLoop(input);
  },
};
