import { ModelPresetParams } from '../../api/types/modelPresets.types';

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
  readonly apiKey: string;
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
