import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import {
  ChatMessageRecord,
  ChatSessionRecord,
} from '../../../storage/interfaces/ChatRepository';
import { chatService } from '../services/chat.service';

export function useAgentChatsQuery(agentId: string | null) {
  return useQuery({
    queryKey: ['local-chats', agentId],
    queryFn: () => chatService.listByAgent(agentId!),
    enabled: Boolean(agentId),
  });
}

export function useResolvedAgentToolsQuery(agent: AgentRecord | null) {
  return useQuery({
    queryKey: [
      'agent-resolved-tools',
      agent?.id,
      agent?.attachedTools,
    ],
    queryFn: () => chatService.resolveTools(agent!),
    enabled: Boolean(agent && agent.attachedTools.length > 0),
  });
}

export function useChatMutations(agentId: string | null) {
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (title?: string) => chatService.createChat(agentId!, title),
    onSuccess: (created) => {
      queryClient.setQueryData<ChatSessionRecord[]>(
        ['local-chats', agentId],
        (old) => [created, ...(old ?? [])]
      );
    },
  });

  const renameChatMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      chatService.renameChat(chatId, title),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChatSessionRecord[]>(
        ['local-chats', agentId],
        (old) => (old ?? []).map((c) => (c.id === updated.id ? updated : c))
      );
    },
  });

  const saveMessagesMutation = useMutation({
    mutationFn: ({
      chatId,
      messages,
    }: {
      chatId: string;
      messages: readonly ChatMessageRecord[];
    }) => chatService.saveMessages(chatId, messages),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChatSessionRecord[]>(
        ['local-chats', agentId],
        (old) => (old ?? []).map((c) => (c.id === updated.id ? updated : c))
      );
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => chatService.deleteChat(chatId),
    onSuccess: (_data, deletedChatId) => {
      queryClient.setQueryData<ChatSessionRecord[]>(
        ['local-chats', agentId],
        (old) => (old ?? []).filter((c) => c.id !== deletedChatId)
      );
    },
  });

  return {
    createChatMutation,
    renameChatMutation,
    saveMessagesMutation,
    deleteChatMutation,
  };
}
