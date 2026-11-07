import {
  AlertTriangle,
  Bot,
  CornerDownLeft,
  KeyRound,
  Laptop,
  ShieldCheck,
  Square,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getProviderDisplayName,
  isModelProvider,
  ModelProvider,
} from '../../../domain/providers';
import { ProxyRuntimeError } from '../../../runtime/providers/authFetch';
import {
  CredentialExecutionMode,
  selectExecutionMode,
} from '../../../runtime/providers/getLanguageModel';
import {
  getPreferredMode,
  hasProviderNeedsAttention,
  hasSessionKey,
  markProviderNeedsAttention,
  subscribeSessionKeys,
} from '../../../runtime/providers/sessionKeyStore';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Select,
  Textarea,
  toast,
} from '../../../shared/ui';
import {
  ChatMessageRecord,
  ChatSessionRecord,
} from '../../../storage/interfaces/ChatRepository';
import { useAgentsQuery } from '../../agents/hooks/useAgents';
import { useModelCredentials } from '../../credentials/hooks/useModelCredentials';
import { useModelPresetsQuery } from '../../presets/hooks/useModelPresets';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatToolCallCard } from '../components/ChatToolCallCard';
import { ComposerKeyPrompt } from '../components/ComposerKeyPrompt';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import {
  useAgentChatsQuery,
  useChatMutations,
  useResolvedAgentToolsQuery,
} from '../hooks/useChat';
import { chatService } from '../services/chat.service';

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAgentParam = searchParams.get('agentId');

  const { data: agents } = useAgentsQuery();
  const { data: credentials } = useModelCredentials();

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
  const [pendingKeyProvider, setPendingKeyProvider] =
    useState<ModelProvider | null>(null);
  const [, setSessionKeyTick] = useState(0);

  const stopRequestedRef = useRef(false);

  useEffect(() => {
    return subscribeSessionKeys(() => {
      setSessionKeyTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    if (!selectedAgentId && agents && agents.length > 0) {
      setSelectedAgentId(initialAgentParam ?? agents[0].id);
    }
  }, [agents, selectedAgentId, initialAgentParam]);

  const selectedAgent =
    agents?.find((a) => a.id === selectedAgentId) ?? null;

  const { data: presets } = useModelPresetsQuery(
    undefined,
    Boolean(selectedAgent?.modelPresetId)
  );
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
  const activePreset = presets?.find(
    (p) => p.id === selectedAgent?.modelPresetId
  );

  const presetProvider = activePreset?.provider ?? null;
  const hasVaultKey =
    Boolean(presetProvider) &&
    isModelProvider(presetProvider) &&
    (credentials ?? []).some((c) => c.provider === presetProvider);
  const hasActiveSessionKey =
    Boolean(presetProvider) &&
    isModelProvider(presetProvider) &&
    hasSessionKey(presetProvider);

  const handleCreateChat = async () => {
    if (!selectedAgentId) return;
    const created = await createChatMutation.mutateAsync(undefined);
    setSelectedChatId(created.id);
  };

  const executeRun = async (
    provider: ModelProvider,
    mode: CredentialExecutionMode,
    userPromptText: string
  ) => {
    if (!selectedAgent) return;
    setRuntimeError(null);
    stopRequestedRef.current = false;

    const modelId =
      activePreset?.model_id ??
      (provider === 'anthropic'
        ? 'claude-3-5-sonnet-latest'
        : provider === 'google'
          ? 'gemini-2.5-flash'
          : 'gpt-4o-mini');

    let chatSession = activeChat;
    if (!chatSession) {
      chatSession = await createChatMutation.mutateAsync(
        userPromptText.slice(0, 42)
      );
      setSelectedChatId(chatSession.id);
    }

    const userMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userPromptText,
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
        provider,
        mode,
        modelId,
        presetParams:
          activePreset?.hydrated_params ?? activePreset?.params ?? {},
        resolvedTools: resolvedTools ?? [],
        history: nextHistory,
        maxIterations,
        onPartialUpdate: (draft) => {
          if (!stopRequestedRef.current) {
            setStreamingDraft(draft);
          }
        },
      });

      await saveMessagesMutation.mutateAsync({
        chatId: chatSession.id,
        messages: [...nextHistory, assistantMessage],
      });
    } catch (err) {
      if (err instanceof ProxyRuntimeError && err.code === 'UNAUTHORIZED') {
        navigate('/auth/login', { replace: true });
        return;
      }
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const isRejected =
        errMsg.includes('api key') ||
        errMsg.includes('invalid_api_key') ||
        errMsg.includes('incorrect api key') ||
        errMsg.includes('unauthorized') ||
        errMsg.includes('authentication') ||
        (err instanceof ProxyRuntimeError && (err.status === 401 || err.status === 400));

      if (isRejected && provider) {
        markProviderNeedsAttention(provider);
      }
      setRuntimeError(err);
    } finally {
      setIsStreaming(false);
      setStreamingDraft(null);
    }
  };

  const submitMessage = async () => {
    const trimmed = promptInput.trim();
    if (!selectedAgent || !trimmed || isStreaming) return;
    setRuntimeError(null);

    const preferredMode = presetProvider
      ? getPreferredMode(presetProvider, hasVaultKey)
      : undefined;

    const modeSelection = selectExecutionMode({
      provider: presetProvider,
      hasVaultKey,
      hasSessionKey: hasActiveSessionKey,
      preferredMode,
    });

    if (modeSelection.status === 'unsupported_provider') {
      setRuntimeError(new Error(modeSelection.message));
      return;
    }

    if (modeSelection.status === 'needs_key') {
      setPendingKeyProvider(modeSelection.provider);
      return;
    }

    setPendingKeyProvider(null);
    await executeRun(modeSelection.provider, modeSelection.mode, trimmed);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  if (!agents || agents.length === 0) {
    return (
      <EmptyState
        icon={<Bot size={20} />}
        title="No agents available"
        description="Create an agent with a system prompt and model preset before starting a conversation."
        actionLabel="Create agent"
        onAction={() => navigate('/agents')}
      />
    );
  }

  const displayedMessages = [
    ...(activeChat?.messages ?? []),
    ...(streamingDraft ? [streamingDraft] : []),
  ];

  const renderRuntimeError = () => {
    if (runtimeError === null) return null;

    if (runtimeError instanceof ProxyRuntimeError) {
      if (runtimeError.code === 'NO_VAULT_KEY') {
        return (
          <div className="rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 text-[13px] text-primary flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-danger shrink-0" />
              <span>{runtimeError.message}</span>
            </div>
            <Link
              to="/credentials"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <KeyRound size={13} />
              Go to API Keys
            </Link>
          </div>
        );
      }

      if (runtimeError.code === 'PATH_NOT_ALLOWED') {
        return (
          <div className="rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 text-[13px] text-primary space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{runtimeError.message}</span>
              <button
                type="button"
                onClick={() => setRuntimeError(null)}
                className="text-[12px] text-secondary hover:text-primary cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            {runtimeError.details && (
              <p className="font-mono text-[12px] text-secondary break-all">
                {runtimeError.details}
              </p>
            )}
          </div>
        );
      }
    }

    return (
      <ErrorBanner
        error={runtimeError}
        title="Agent execution error"
        onDismiss={() => setRuntimeError(null)}
      />
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-5rem)] min-h-[540px]">
      <ChatSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => {
          setSelectedAgentId(id || null);
          setSelectedChatId(null);
          setPendingKeyProvider(null);
          setRuntimeError(null);
        }}
        chats={chats ?? []}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onCreateChat={handleCreateChat}
        onRenameChat={(chatId, title) => {
          renameChatMutation.mutate({ chatId, title });
          toast.success('Conversation renamed');
        }}
        onRequestDeleteChat={setDeleteTarget}
      />

      {/* Right Conversation Pane */}
      <div className="flex-1 rounded-xl border border-subtle bg-card shadow-card flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header with Agent Selector and Model Info */}
        <div className="px-5 py-3 border-b border-subtle flex flex-wrap items-center justify-between gap-3 bg-raised/30 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="w-48">
              <Select
                value={selectedAgentId ?? ''}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value || null);
                  setSelectedChatId(null);
                  setPendingKeyProvider(null);
                  setRuntimeError(null);
                }}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            {activePreset ? (
              <Badge variant="neutral" mono>
                {activePreset.provider} · {activePreset.model_id}
              </Badge>
            ) : (
              <Badge variant="warning">No preset selected</Badge>
            )}

            {presetProvider && hasProviderNeedsAttention(presetProvider) ? (
              <Badge
                variant="warning"
                className="cursor-pointer"
                onClick={() => setPendingKeyProvider(presetProvider)}
              >
                <AlertTriangle size={12} className="mr-1" />
                {getProviderDisplayName(presetProvider)}: needs attention
              </Badge>
            ) : hasVaultKey ? (
              <Badge variant="neutral">
                <ShieldCheck size={12} className="mr-1" />
                Account key
              </Badge>
            ) : hasActiveSessionKey ? (
              <Badge variant="neutral">
                <Laptop size={12} className="mr-1" />
                Session key
              </Badge>
            ) : presetProvider ? (
              <Badge
                variant="warning"
                className="cursor-pointer"
                onClick={() => setPendingKeyProvider(presetProvider)}
              >
                {getProviderDisplayName(presetProvider)}: no key saved
              </Badge>
            ) : null}

            {(resolvedTools ?? []).map((rt) => (
              <Badge
                key={rt.tool.id}
                mono
                variant={rt.executableInBrowser ? 'info' : 'muted'}
              >
                {rt.tool.name} v{rt.version.version}
                {!rt.executableInBrowser ? ' (non-executable)' : ''}
              </Badge>
            ))}

            {selectedAgent?.attachedConnectors.map((conn) => (
              <Badge key={conn} mono variant="muted">
                {conn} (non-executable)
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[12px] text-secondary shrink-0">
            <span>Max steps</span>
            <input
              type="number"
              min={1}
              max={15}
              value={maxIterations}
              onChange={(e) =>
                setMaxIterations(Math.max(1, Number(e.target.value) || 5))
              }
              className="w-14 h-7 rounded-md border border-subtle bg-app px-2 text-center font-mono text-[12px] text-primary"
            />
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {renderRuntimeError()}

          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-1.5">
              <p className="text-[14px] font-medium text-primary">
                Start a conversation with {selectedAgent?.name}
              </p>
              <p className="text-[13px] text-secondary max-w-sm">
                Press Enter to send a message, or Shift + Enter for a new line.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-xl rounded-xl border border-subtle bg-raised px-4 py-2.5 text-[14px] text-primary whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="w-full space-y-3">
                  <div className="text-[12px] font-medium text-secondary">
                    {selectedAgent?.name ?? 'Assistant'}
                  </div>

                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      {msg.toolCalls.map((tc) => (
                        <ChatToolCallCard key={tc.id} toolCall={tc} />
                      ))}
                    </div>
                  )}

                  {msg.content && <MarkdownRenderer content={msg.content} />}
                </div>
              )
            )
          )}
        </div>

        {/* Fixed Rounded Composer at Bottom */}
        <div className="p-4 border-t border-subtle bg-card shrink-0">
          {pendingKeyProvider && (
            <ComposerKeyPrompt
              provider={pendingKeyProvider}
              onResolved={async (resolvedMode) => {
                const targetProvider = pendingKeyProvider;
                setPendingKeyProvider(null);
                const trimmed = promptInput.trim();
                if (trimmed) {
                  await executeRun(targetProvider, resolvedMode, trimmed);
                }
              }}
              onCancel={() => setPendingKeyProvider(null)}
            />
          )}

          <form onSubmit={handleFormSubmit}>
            <div className="flex items-end gap-2 rounded-xl border border-subtle focus-within:border-accent bg-app p-2 transition-colors">
              <Textarea
                autoGrow
                rows={1}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                disabled={isStreaming || !selectedAgent}
                placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                className="border-0 bg-transparent focus-visible:outline-none px-2 py-1 min-h-[36px]"
              />

              {isStreaming ? (
                <Button
                  variant="danger"
                  size="md"
                  icon={<Square size={13} />}
                  onClick={() => {
                    stopRequestedRef.current = true;
                    setIsStreaming(false);
                  }}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={<CornerDownLeft size={14} />}
                  disabled={!promptInput.trim() || !selectedAgent}
                >
                  Send
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        description="This conversation will be removed from this browser."
        confirmLabel="Delete chat"
        isDestructive
        isPending={deleteChatMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteChatMutation.mutateAsync(deleteTarget.id);
          toast.success('Conversation deleted');
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
