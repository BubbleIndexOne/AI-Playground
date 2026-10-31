import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AIProvider } from '../../../domain/providers';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  ChatMessageRecord,
  ChatSessionRecord,
} from '../../../storage/interfaces/ChatRepository';
import { useAgentsQuery } from '../../agents/hooks/useAgents';
import { useCredentialsQuery } from '../../credentials/hooks/useCredentials';
import { useModelPresetsQuery } from '../../presets/hooks/useModelPresets';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatToolCallCard } from '../components/ChatToolCallCard';
import {
  useAgentChatsQuery,
  useChatMutations,
  useResolvedAgentToolsQuery,
} from '../hooks/useChat';
import { chatService } from '../services/chat.service';

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const initialAgentParam = searchParams.get('agentId');

  const { data: agents } = useAgentsQuery();
  const { data: presets } = useModelPresetsQuery();
  const { data: credentials } = useCredentialsQuery();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    initialAgentParam
  );
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [maxIterations, setMaxIterations] = useState(5);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDraft, setStreamingDraft] =
    useState<ChatMessageRecord | null>(null);
  const [runtimeError, setRuntimeError] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionRecord | null>(
    null
  );

  useEffect(() => {
    if (!selectedAgentId && agents && agents.length > 0) {
      setSelectedAgentId(initialAgentParam ?? agents[0].id);
    }
  }, [agents, selectedAgentId, initialAgentParam]);

  const selectedAgent =
    agents?.find((a) => a.id === selectedAgentId) ?? null;

  const { data: chats } = useAgentChatsQuery(selectedAgentId);
  const { data: resolvedTools } = useResolvedAgentToolsQuery(selectedAgent);
  const {
    createChatMutation,
    renameChatMutation,
    saveMessagesMutation,
    deleteChatMutation,
  } = useChatMutations(selectedAgentId);

  useEffect(() => {
    if (chats && chats.length > 0) {
      if (!selectedChatId || !chats.some((c) => c.id === selectedChatId)) {
        setSelectedChatId(chats[0].id);
      }
    } else {
      setSelectedChatId(null);
    }
  }, [chats, selectedChatId]);

  const activeChat = chats?.find((c) => c.id === selectedChatId) ?? null;

  const handleCreateChat = async () => {
    if (!selectedAgentId) return;
    const created = await createChatMutation.mutateAsync(undefined);
    setSelectedChatId(created.id);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !promptInput.trim() || isStreaming) return;
    setRuntimeError(null);

    const credential = credentials?.find(
      (c) => c.id === selectedAgent.credentialId
    );
    if (!credential) {
      setRuntimeError(
        new Error(
          'This agent does not have a valid BYOK API Key assigned. Configure one in API Keys and attach it in Agents.'
        )
      );
      return;
    }

    const preset = presets?.find((p) => p.id === selectedAgent.modelPresetId);
    const modelId =
      preset?.model_id ??
      (credential.provider === AIProvider.Anthropic
        ? 'claude-3-5-sonnet-latest'
        : credential.provider === AIProvider.Google
          ? 'gemini-2.5-flash'
          : 'gpt-4o-mini');

    let chatSession = activeChat;
    if (!chatSession) {
      chatSession = await createChatMutation.mutateAsync(
        promptInput.trim().slice(0, 40)
      );
      setSelectedChatId(chatSession.id);
    }

    const userMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'user',
      content: promptInput.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...chatSession.messages, userMessage];
    setPromptInput('');
    await saveMessagesMutation.mutateAsync({
      chatId: chatSession.id,
      messages: nextHistory,
    });

    setIsStreaming(true);
    setStreamingDraft(null);

    try {
      const assistantMessage = await chatService.runLoop({
        agent: selectedAgent,
        provider: credential.provider,
        modelId,
        apiKey: credential.apiKey,
        presetParams: preset?.hydrated_params ?? preset?.params ?? {},
        resolvedTools: resolvedTools ?? [],
        history: nextHistory,
        maxIterations,
        onPartialUpdate: (draft) => setStreamingDraft(draft),
      });

      await saveMessagesMutation.mutateAsync({
        chatId: chatSession.id,
        messages: [...nextHistory, assistantMessage],
      });
    } catch (err) {
      setRuntimeError(err);
    } finally {
      setIsStreaming(false);
      setStreamingDraft(null);
    }
  };

  if (!agents || agents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          title="No agents configured"
          description="Create an agent with a prompt, model preset, BYOK API key, and tools before starting a chat."
        />
        <div className="text-center mt-4">
          <Link
            to="/agents"
            className="text-xs font-medium text-slate-900 dark:text-slate-100 underline"
          >
            Go to Agents
          </Link>
        </div>
      </div>
    );
  }

  const displayedMessages = [
    ...(activeChat?.messages ?? []),
    ...(streamingDraft ? [streamingDraft] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <ChatSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => {
          setSelectedAgentId(id || null);
          setSelectedChatId(null);
        }}
        chats={chats ?? []}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onCreateChat={handleCreateChat}
        onRenameChat={(chatId, title) =>
          renameChatMutation.mutate({ chatId, title })
        }
        onRequestDeleteChat={setDeleteTarget}
      />

      <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-[560px]">
        {selectedAgent && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedAgent.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {(resolvedTools ?? []).map((rt) => (
                  <span key={rt.tool.id} className="font-mono">
                    {rt.tool.name} (v{rt.version.version}
                    {rt.executableInBrowser
                      ? ' · executable'
                      : ` · non-executable: ${rt.nonExecutableReason}`}
                    )
                  </span>
                ))}
                {selectedAgent.attachedConnectors.map((conn) => (
                  <span key={conn} className="font-mono text-amber-600 dark:text-amber-400">
                    connector:{conn} (non-executable in browser)
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500">Max tool iterations:</label>
              <input
                type="number"
                min={1}
                max={15}
                value={maxIterations}
                onChange={(e) =>
                  setMaxIterations(Math.max(1, Number(e.target.value) || 5))
                }
                className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {runtimeError !== null && (
            <ErrorBanner
              error={runtimeError}
              title="Agent runtime error"
              onDismiss={() => setRuntimeError(null)}
            />
          )}

          {displayedMessages.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Send a message below to run the agent loop directly in your browser.
            </div>
          ) : (
            displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-4 space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-slate-100 dark:bg-slate-800/80 ml-8'
                    : 'border border-slate-200 dark:border-slate-800 mr-8'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                    {msg.role}
                  </span>
                </div>

                {msg.content && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                    {msg.content}
                  </p>
                )}

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.toolCalls.map((tc) => (
                      <ChatToolCallCard key={tc.id} toolCall={tc} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isStreaming || !selectedAgent}
            placeholder="Message your agent..."
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={isStreaming || !promptInput.trim() || !selectedAgent}
            className="px-4 py-2.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isStreaming ? 'Running...' : 'Send'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete conversation "${deleteTarget?.title ?? ''}"?`}
        description="Removes this chat session from local storage."
        confirmLabel="Delete Chat"
        isDestructive
        isPending={deleteChatMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteChatMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
