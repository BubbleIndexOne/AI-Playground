import { toolsApi } from '../api/tools.api';
import { ModelPresetParams } from '../api/types/modelPresets.types';
import { ToolType } from '../domain/enums';
import { AIProvider } from '../domain/providers';
import { AgentRecord } from '../storage/interfaces/AgentRepository';
import {
  ChatMessageRecord,
  ChatToolCallRecord,
} from '../storage/interfaces/ChatRepository';
import { mcpToolExecutor } from './executors/McpToolExecutor';
import { sandboxToolExecutor } from './executors/SandboxToolExecutor';
import { ResolvedExecutableTool } from './executors/ToolExecutor';
import { AnthropicProvider } from './providers/AnthropicProvider';
import {
  ChatProvider,
  ProviderMessage,
  ProviderToolDefinition,
} from './providers/ChatProvider';
import { GoogleGeminiProvider } from './providers/GoogleGeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';

const providers: Record<AIProvider, ChatProvider> = {
  [AIProvider.Anthropic]: new AnthropicProvider(),
  [AIProvider.OpenAI]: new OpenAIProvider(),
  [AIProvider.Google]: new GoogleGeminiProvider(),
};

export async function resolveAgentTools(
  agent: AgentRecord
): Promise<ResolvedExecutableTool[]> {
  const resolved: ResolvedExecutableTool[] = [];

  for (const attached of agent.attachedTools) {
    try {
      const tool = await toolsApi.getById(attached.toolId, 'bearer');
      const version =
        attached.pinnedVersion !== undefined && attached.pinnedVersion !== null
          ? await toolsApi.getVersion(
              attached.toolId,
              attached.pinnedVersion,
              'bearer'
            )
          : tool.current_version ??
            (await toolsApi.listVersions(attached.toolId, 'bearer'))[0];

      if (!version) continue;

      const isMcp = tool.type === ToolType.Mcp;
      const hasConnector = Boolean(tool.connector_type);
      const canRunClient =
        !isMcp && !hasConnector && Boolean(tool.allow_client_execution);

      let nonExecutableReason: string | undefined;
      if (isMcp) {
        nonExecutableReason = 'MCP tool (not available yet in browser)';
      } else if (hasConnector) {
        nonExecutableReason = `Connector (${tool.connector_type}) not available yet in browser`;
      } else if (!tool.allow_client_execution) {
        nonExecutableReason = 'allow_client_execution is false';
      }

      resolved.push({
        tool,
        version,
        executableInBrowser: canRunClient,
        nonExecutableReason,
      });
    } catch {
      // Skip tools that could not be fetched
    }
  }

  return resolved;
}

export interface RunAgentLoopInput {
  readonly agent: AgentRecord;
  readonly provider: AIProvider;
  readonly modelId: string;
  readonly apiKey: string;
  readonly presetParams: ModelPresetParams;
  readonly resolvedTools: readonly ResolvedExecutableTool[];
  readonly history: readonly ChatMessageRecord[];
  readonly maxIterations?: number;
  readonly onPartialUpdate?: (assistantDraft: ChatMessageRecord) => void;
}

export async function runAgentLoop(
  input: RunAgentLoopInput
): Promise<ChatMessageRecord> {
  const {
    agent,
    provider,
    modelId,
    apiKey,
    presetParams,
    resolvedTools,
    history,
    maxIterations = 5,
    onPartialUpdate,
  } = input;

  const adapter = providers[provider] ?? providers[AIProvider.OpenAI];

  const toolMap = new Map<string, ResolvedExecutableTool>();
  const toolDefinitions: ProviderToolDefinition[] = [];

  for (const rt of resolvedTools) {
    const safeName = rt.tool.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    toolMap.set(safeName, rt);
    toolDefinitions.push({
      name: safeName,
      description: rt.tool.description ?? rt.tool.name,
      inputSchema: rt.version.schema_json ?? {},
    });
  }

  const providerMessages: ProviderMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const assistantMsgId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  let accumulatedText = '';
  const allToolCallRecords: ChatToolCallRecord[] = [];

  const emitDraft = () => {
    onPartialUpdate?.({
      id: assistantMsgId,
      role: 'assistant',
      content: accumulatedText,
      toolCalls: [...allToolCallRecords],
      createdAt,
    });
  };

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let stepText = '';
    const turnResult = await adapter.streamTurn({
      apiKey,
      modelId,
      systemPrompt: agent.systemPrompt,
      params: presetParams,
      tools: toolDefinitions,
      messages: providerMessages,
      onTextDelta: (delta) => {
        stepText += delta;
        accumulatedText += delta;
        emitDraft();
      },
    });

    if (turnResult.toolCalls.length === 0) {
      break;
    }

    providerMessages.push({
      role: 'assistant',
      content: stepText,
      toolCalls: turnResult.toolCalls,
    });

    for (const tc of turnResult.toolCalls) {
      const resolvedTool = toolMap.get(tc.name);
      const recordId = tc.id || crypto.randomUUID();

      const initialRecord: ChatToolCallRecord = {
        id: recordId,
        toolId: resolvedTool?.tool.id ?? tc.name,
        toolName: resolvedTool?.tool.name ?? tc.name,
        input: tc.arguments,
        status: 'running',
      };
      allToolCallRecords.push(initialRecord);
      emitDraft();

      let execResult;
      if (!resolvedTool) {
        execResult = {
          ok: false,
          status: 'failed' as const,
          error: `Tool "${tc.name}" is not attached to this agent.`,
          durationMs: 0,
        };
      } else if (
        resolvedTool.tool.type === ToolType.Mcp ||
        resolvedTool.tool.connector_type
      ) {
        execResult = await mcpToolExecutor.execute(resolvedTool, tc.arguments);
      } else {
        execResult = await sandboxToolExecutor.execute(
          resolvedTool,
          tc.arguments
        );
      }

      const idx = allToolCallRecords.findIndex((r) => r.id === recordId);
      if (idx !== -1) {
        allToolCallRecords[idx] = {
          ...initialRecord,
          output: execResult.output,
          error: execResult.error,
          durationMs: execResult.durationMs,
          status: execResult.status,
        };
      }
      emitDraft();

      providerMessages.push({
        role: 'tool',
        toolCallId: tc.id,
        toolName: tc.name,
        content: JSON.stringify(
          execResult.ok
            ? execResult.output
            : { error: execResult.error, details: execResult.output }
        ),
      });
    }
  }

  return {
    id: assistantMsgId,
    role: 'assistant',
    content: accumulatedText,
    toolCalls: allToolCallRecords,
    createdAt,
  };
}
