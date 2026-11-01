import {
  APICallError,
  jsonSchema,
  ModelMessage,
  streamText,
  tool,
  ToolSet,
} from 'ai';
import { ModelPresetParams } from '../../api/types/modelPresets.types';
import { getProviderDisplayName, ModelProvider } from '../../domain/providers';
import { ProxyRuntimeError } from './authFetch';
import {
  CredentialExecutionMode,
  getLanguageModel,
} from './getLanguageModel';
import { getSessionKey } from './sessionKeyStore';

export interface ProviderToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export interface ProviderToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface ProviderMessage {
  readonly role: 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly toolCalls?: readonly ProviderToolCall[];
  readonly toolCallId?: string;
  readonly toolName?: string;
}

export interface StreamTurnRequest {
  readonly mode: CredentialExecutionMode;
  readonly modelId: string;
  readonly systemPrompt: string;
  readonly params: ModelPresetParams;
  readonly tools: readonly ProviderToolDefinition[];
  readonly messages: readonly ProviderMessage[];
  readonly onTextDelta?: (delta: string) => void;
}

export interface StreamTurnResponse {
  readonly text: string;
  readonly toolCalls: readonly ProviderToolCall[];
}

export interface ChatProvider {
  streamTurn(request: StreamTurnRequest): Promise<StreamTurnResponse>;
}

function redactSecret(text: string, secret?: string | null): string {
  if (!secret || secret.length < 4) return text;
  return text.split(secret).join('[REDACTED]');
}

function toSdkMessages(messages: readonly ProviderMessage[]): ModelMessage[] {
  return messages.map((msg): ModelMessage => {
    if (msg.role === 'user') {
      return {
        role: 'user',
        content: msg.content,
      };
    }

    if (msg.role === 'assistant') {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: [
            ...(msg.content
              ? [{ type: 'text' as const, text: msg.content }]
              : []),
            ...msg.toolCalls.map((tc) => ({
              type: 'tool-call' as const,
              toolCallId: tc.id,
              toolName: tc.name,
              input: tc.arguments,
            })),
          ],
        };
      }
      return {
        role: 'assistant',
        content: msg.content || '',
      };
    }

    return {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: msg.toolCallId ?? 'tool-call',
          toolName: msg.toolName ?? 'tool',
          output: {
            type: 'text',
            value: msg.content,
          },
        },
      ],
    };
  });
}

function toSdkTools(tools: readonly ProviderToolDefinition[]): ToolSet {
  const toolSet: ToolSet = {};
  for (const def of tools) {
    const schemaObj: Record<string, unknown> = {
      type: 'object',
      ...def.inputSchema,
    };
    toolSet[def.name] = tool({
      description: def.description,
      inputSchema: jsonSchema(schemaObj),
    });
  }
  return toolSet;
}

function mapProviderError(
  err: unknown,
  provider: ModelProvider,
  mode: CredentialExecutionMode,
  sessionKey?: string | null
): Error {
  if (err instanceof ProxyRuntimeError) {
    return err;
  }

  if (mode === 'vault' && APICallError.isInstance(err)) {
    const providerLabel = getProviderDisplayName(provider);
    if (err.statusCode === 404) {
      return new ProxyRuntimeError({
        code: 'NO_VAULT_KEY',
        status: 404,
        message: `No key saved for ${providerLabel}`,
      });
    }
    if (err.statusCode === 403) {
      return new ProxyRuntimeError({
        code: 'PATH_NOT_ALLOWED',
        status: 403,
        message: "This request path isn't allowed by the proxy",
        details: err.responseBody || err.message,
      });
    }
    if (err.statusCode === 401) {
      return new ProxyRuntimeError({
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Session expired. Please sign in again.',
      });
    }
  }

  const rawMsg =
    err instanceof Error ? err.message : 'Upstream model request failed';
  return new Error(redactSecret(rawMsg, sessionKey));
}

export async function executeProviderStreamTurn(
  provider: ModelProvider,
  request: StreamTurnRequest
): Promise<StreamTurnResponse> {
  const { mode, modelId, systemPrompt, params, tools, messages, onTextDelta } =
    request;

  const sessionKey = mode === 'session' ? getSessionKey(provider) : undefined;
  const model = getLanguageModel({
    provider,
    modelId,
    mode,
    sessionKey: sessionKey ?? undefined,
  });

  const sdkMessages = toSdkMessages(messages);
  const sdkTools = toSdkTools(tools);

  let fullText = '';
  const toolCalls: ProviderToolCall[] = [];

  try {
    const result = streamText({
      model,
      ...(systemPrompt.trim() ? { system: systemPrompt } : {}),
      messages: sdkMessages,
      ...(tools.length > 0 ? { tools: sdkTools } : {}),
      ...(params.temperature !== undefined && params.temperature !== null
        ? { temperature: params.temperature }
        : {}),
      ...(params.topP !== undefined && params.topP !== null
        ? { topP: params.topP }
        : {}),
      ...(params.topK !== undefined && params.topK !== null
        ? { topK: params.topK }
        : {}),
      ...(params.presencePenalty !== undefined &&
      params.presencePenalty !== null
        ? { presencePenalty: params.presencePenalty }
        : {}),
      ...(params.frequencyPenalty !== undefined &&
      params.frequencyPenalty !== null
        ? { frequencyPenalty: params.frequencyPenalty }
        : {}),
      ...(params.maxOutputTokens !== undefined &&
      params.maxOutputTokens !== null
        ? { maxOutputTokens: params.maxOutputTokens }
        : {}),
      ...(params.seed !== undefined && params.seed !== null
        ? { seed: params.seed }
        : {}),
      ...(params.stopSequences && params.stopSequences.length > 0
        ? { stopSequences: [...params.stopSequences] }
        : {}),
    });

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        fullText += part.text;
        onTextDelta?.(part.text);
      } else if (part.type === 'tool-call') {
        const inputArgs =
          part.input && typeof part.input === 'object'
            ? (part.input as Record<string, unknown>)
            : {};
        toolCalls.push({
          id: part.toolCallId,
          name: part.toolName,
          arguments: inputArgs,
        });
      } else if (part.type === 'error') {
        throw mapProviderError(part.error, provider, mode, sessionKey);
      }
    }
  } catch (err) {
    throw mapProviderError(err, provider, mode, sessionKey);
  }

  return { text: fullText, toolCalls };
}
