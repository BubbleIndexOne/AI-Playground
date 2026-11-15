import {
  AlertTriangle,
  Bot,
  ChevronDown,
  CornerDownLeft,
  KeyRound,
  Laptop,
  Settings,
  ShieldCheck,
  Square,
  Wrench,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ModelPreset } from '../../../api/types/modelPresets.types';
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
  BlobbieAvatar,
  Button,
  ConfirmDialog,
  Drawer,
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

/**
 * ChatPage provides the primary conversation interface for interacting with configured AI agents.
 * Handles chat sessions, model presets, credential checks, and live AI streaming execution.
 */
export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAgentParam = searchParams.get('agentId');

  const { data: agents } = useAgentsQuery();
  const {
    data: credentials,
    isLoading: isCredentialsLoading,
    isError: isCredentialsError,
    error: credentialsError,
  } = useModelCredentials();

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
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
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

  const { data: presets, isLoading: isPresetsLoading } = useModelPresetsQuery(
    undefined,
    true
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

  // Resolve model preset:
  // 1. Matched assigned preset on agent
  // 2. Or fallback to existing preset (preferring one matching configured credentials)
  // 3. Or synthesize a default baseline preset
  const configuredProviders = (credentials ?? [])
    .map((c) => c.provider)
    .filter(isModelProvider);

  const matchedAgentPreset = presets?.find(
    (p) => p.id === selectedAgent?.modelPresetId
  );

  const fallbackExistingPreset =
    presets?.find((p) =>
      configuredProviders.includes(p.provider as ModelProvider)
    ) ?? presets?.[0];

  const defaultProvider: ModelProvider =
    configuredProviders[0] ??
    (hasSessionKey('google')
      ? 'google'
      : hasSessionKey('openai')
        ? 'openai'
        : hasSessionKey('anthropic')
          ? 'anthropic'
          : 'google');

  const defaultModelId =
    defaultProvider === 'google'
      ? 'gemini-3.5-flash'
      : defaultProvider === 'anthropic'
        ? 'claude-3-5-sonnet-latest'
        : 'gpt-4o-mini';

  const defaultSyntheticPreset: ModelPreset = {
    id: 'default-preset',
    name: `Default (${getProviderDisplayName(defaultProvider)})`,
    provider: defaultProvider,
    model_id: defaultModelId,
    params: { temperature: 0.7 },
    hydrated_params: { temperature: 0.7 },
  };

  const activePreset: ModelPreset =
    matchedAgentPreset ??
    fallbackExistingPreset ??
    defaultSyntheticPreset;

  const isUsingDefaultPreset = !matchedAgentPreset;

  const presetProvider =
    activePreset && isModelProvider(activePreset.provider)
      ? (activePreset.provider as ModelProvider)
      : defaultProvider;

  const hasVaultKey =
    Boolean(presetProvider) &&
    (credentials ?? []).some((c) => c.provider === presetProvider);
  const hasActiveSessionKey =
    Boolean(presetProvider) &&
    hasSessionKey(presetProvider as ModelProvider);

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
          ? 'gemini-3.5-flash'
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

  /**
   * Submits the user prompt after verifying agent configuration, preset resolution,
   * and credential readiness. Prevents premature key prompts while credentials load.
   */
  const submitMessage = async () => {
    const trimmed = promptInput.trim();
    if (!selectedAgent || !trimmed || isStreaming) return;
    setRuntimeError(null);

    // Wait until preset and credential queries are resolved
    if (isPresetsLoading || isCredentialsLoading) {
      setRuntimeError(
        new Error(
          'Model configuration and credentials are still loading. Please wait a moment and try again.'
        )
      );
      return;
    }

    // Do not treat credential fetch error as missing key
    if (isCredentialsError) {
      setRuntimeError(
        credentialsError instanceof Error
          ? credentialsError
          : new Error(
              'Failed to load credentials. Please check your connection and try again.'
            )
      );
      return;
    }

    if (!presetProvider || !isModelProvider(presetProvider)) {
      setRuntimeError(
        new Error(
          `Model provider "${activePreset?.provider || 'unknown'}" is unsupported. Supported providers: anthropic, openai, google.`
        )
      );
      return;
    }

    const preferredMode = getPreferredMode(presetProvider, hasVaultKey);

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
        {/* Chat Header with Agent Identity and Status */}
        <div className="px-5 py-3 border-b border-subtle flex flex-wrap items-center justify-between gap-3 bg-raised/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <BlobbieAvatar
              config={selectedAgent?.avatar ?? selectedAgent?.name}
              size="md"
              gazeFocus={isComposerFocused ? 'down' : 'cursor'}
              onClick={() => setIsInspectorOpen(true)}
              title="Click to view Persona Details"
            />
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="text-left cursor-pointer hover:opacity-85 transition-opacity min-w-0"
              title="Click to view Persona Details"
            >
              <div className="text-[14px] font-semibold text-primary truncate leading-tight">
                {selectedAgent?.name ?? 'Select an Agent'}
              </div>
              <div className="text-[11px] text-secondary truncate flex items-center gap-1.5 mt-0.5">
                <span>
                  {activePreset
                    ? `${activePreset.provider} · ${activePreset.model_id}${isUsingDefaultPreset ? ' (default)' : ''}`
                    : isPresetsLoading
                      ? 'Loading preset...'
                      : 'Default model'}
                </span>
                <span>•</span>
                <span>
                  {(resolvedTools ?? []).length}{' '}
                  {(resolvedTools ?? []).length === 1 ? 'tool' : 'tools'} active
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Conditional Key Badge: ONLY shown when there's an issue or key required */}
            {presetProvider &&
              (hasProviderNeedsAttention(presetProvider) ||
                (!hasVaultKey && !hasActiveSessionKey)) && (
                <button
                  type="button"
                  onClick={() => setPendingKeyProvider(presetProvider)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25 transition-all cursor-pointer animate-pulse"
                  title="Configure required API key"
                >
                  <AlertTriangle size={12} />
                  <span>
                    {getProviderDisplayName(presetProvider)}:{' '}
                    {hasProviderNeedsAttention(presetProvider)
                      ? 'Needs attention'
                      : 'Key required'}
                  </span>
                </button>
              )}

            {/* Consolidated Tools Pill */}
            <button
              type="button"
              onClick={() => setIsToolsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-app hover:bg-raised border border-subtle text-primary transition-colors cursor-pointer"
              title="Inspect attached tools & capabilities"
            >
              <Wrench size={13} className="text-secondary" />
              <span>
                {(resolvedTools ?? []).length}{' '}
                {(resolvedTools ?? []).length === 1 ? 'tool' : 'tools'}
              </span>
              <ChevronDown size={11} className="text-muted" />
            </button>

            {/* Persona Details Inspector */}
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-app hover:bg-raised border border-subtle text-primary transition-colors cursor-pointer"
              title="Persona Details & Parameters"
            >
              <Settings size={13} className="text-secondary" />
              <span className="hidden sm:inline">Details</span>
            </button>
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
                  <div className="text-[12px] font-medium text-secondary flex items-center gap-1.5">
                    <BlobbieAvatar
                      config={selectedAgent?.avatar ?? selectedAgent?.name}
                      size="xs"
                      interactive={false}
                    />
                    <span>{selectedAgent?.name ?? 'Assistant'}</span>
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
                onFocus={() => setIsComposerFocused(true)}
                onBlur={() => setIsComposerFocused(false)}
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

      {/* Attached Capabilities Drawer */}
      <Drawer
        open={isToolsDrawerOpen}
        onClose={() => setIsToolsDrawerOpen(false)}
        title="Attached Tools & Capabilities"
        description={`Capabilities equipped on ${selectedAgent?.name ?? 'agent'} for execution in conversation.`}
        width="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-primary">
            <span>
              Client & Sandboxed Tools ({(resolvedTools ?? []).length})
            </span>
            <Link
              to="/tools"
              className="text-accent text-[12px] font-normal hover:underline"
            >
              Manage tools catalog →
            </Link>
          </div>

          {(resolvedTools ?? []).length === 0 ? (
            <p className="text-[13px] text-muted p-4 text-center border border-dashed border-subtle rounded-xl">
              No tools attached to this agent.
            </p>
          ) : (
            <div className="space-y-2.5">
              {(resolvedTools ?? []).map((rt) => (
                <div
                  key={rt.tool.id}
                  className="p-3 rounded-xl border border-subtle bg-app flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-primary font-mono">
                        {rt.tool.name}
                      </span>
                      <Badge variant="neutral" mono>
                        v{rt.version.version}
                      </Badge>
                    </div>
                    <Badge
                      variant={rt.executableInBrowser ? 'success' : 'muted'}
                    >
                      {rt.executableInBrowser
                        ? 'Sandboxed execution'
                        : 'Non-executable'}
                    </Badge>
                  </div>
                  {rt.tool.description && (
                    <p className="text-[12px] text-secondary">
                      {rt.tool.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedAgent?.attachedConnectors &&
            selectedAgent.attachedConnectors.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-subtle">
                <span className="text-[13px] font-semibold text-primary">
                  Connectors ({selectedAgent.attachedConnectors.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.attachedConnectors.map((conn) => (
                    <Badge key={conn} variant="muted" mono>
                      {conn}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>
      </Drawer>

      {/* Persona Details Inspector Drawer */}
      <Drawer
        open={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        title="Agent Persona & Execution Settings"
        description="Inspect persona identity, instructions, credentials, and parameters."
        width="lg"
      >
        <div className="space-y-6">
          {/* Avatar Hero */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-app border border-subtle">
            <BlobbieAvatar
              config={selectedAgent?.avatar ?? selectedAgent?.name}
              size={80}
              interactive={true}
              title="Click to bounce"
            />
            <div className="space-y-1 min-w-0">
              <h3 className="text-[16px] font-semibold text-primary truncate">
                {selectedAgent?.name}
              </h3>
              <p className="text-[12px] text-secondary">
                {selectedAgent?.description || 'No role description provided.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="neutral">
                  Created{' '}
                  {new Date(
                    selectedAgent?.createdAt ?? ''
                  ).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Reasoning Steps */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-primary">
              Execution Control
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl border border-subtle bg-app">
              <div>
                <span className="text-[13px] font-medium text-primary block">
                  Max Reasoning Steps
                </span>
                <span className="text-[11px] text-secondary">
                  Maximum tool iterations allowed per chat turn
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={15}
                value={maxIterations}
                onChange={(e) =>
                  setMaxIterations(Math.max(1, Number(e.target.value) || 5))
                }
                className="w-16 h-8 rounded-md border border-subtle bg-card px-2 text-center font-mono text-[13px] text-primary"
              />
            </div>
          </div>

          {/* Working Instructions */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-primary">
              Working Instructions (System Prompt)
            </h4>
            <div className="p-3.5 rounded-xl border border-subtle bg-app text-[12px] font-mono whitespace-pre-wrap text-secondary max-h-52 overflow-y-auto leading-relaxed">
              {selectedAgent?.systemPrompt}
            </div>
          </div>

          {/* Cognitive Engine & Credentials */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-primary">
              Cognitive Engine & Authentication
            </h4>
            <div className="p-3 rounded-xl border border-subtle bg-app space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-secondary">Model Architecture:</span>
                <span className="font-mono text-primary font-medium">
                  {activePreset
                    ? `${activePreset.provider} · ${activePreset.model_id}`
                    : 'Default model'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-secondary">API Key Status:</span>
                <span>
                  {hasVaultKey ? (
                    <Badge variant="success">Vault Key Verified</Badge>
                  ) : hasActiveSessionKey ? (
                    <Badge variant="info">Session Key Active</Badge>
                  ) : presetProvider ? (
                    <Badge variant="warning">No Key Configured</Badge>
                  ) : (
                    <Badge variant="neutral">Not Required</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

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
