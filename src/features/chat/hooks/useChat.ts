import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import { ChatMessageRecord } from '../../../storage/interfaces/ChatRepository';
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
    enabled: Boolean(agent),
  });
}

export function useChatMutations(agentId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['local-chats', agentId] });
  };

  const createChatMutation = useMutation({
    mutationFn: (title?: string) => chatService.createChat(agentId!, title),
    onSuccess: invalidate,
  });

  const renameChatMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      chatService.renameChat(chatId, title),
    onSuccess: invalidate,
  });

  const saveMessagesMutation = useMutation({
    mutationFn: ({
      chatId,
      messages,
    }: {
      chatId: string;
      messages: readonly ChatMessageRecord[];
    }) => chatService.saveMessages(chatId, messages),
    onSuccess: invalidate,
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => chatService.deleteChat(chatId),
    onSuccess: invalidate,
  });

  return {
    createChatMutation,
    renameChatMutation,
    saveMessagesMutation,
    deleteChatMutation,
  };
}
