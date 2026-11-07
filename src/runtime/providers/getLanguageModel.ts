import { LanguageModel } from 'ai';
import { isModelProvider, ModelProvider } from '../../domain/providers';
import {
  createAnthropicModel,
  ProviderModelConfigOptions,
} from './anthropicConfig';
import { createGoogleModel } from './googleConfig';
import { createOpenAIModel } from './openaiConfig';

export type CredentialExecutionMode = 'vault' | 'session';

export type ModeSelectionResult =
  | {
      readonly status: 'ready';
      readonly provider: ModelProvider;
      readonly mode: CredentialExecutionMode;
    }
  | {
      readonly status: 'needs_key';
      readonly provider: ModelProvider;
    }
  | {
      readonly status: 'unsupported_provider';
      readonly provider: string;
      readonly message: string;
    };

export interface SelectExecutionModeInput {
  readonly provider: string | null | undefined;
  readonly hasVaultKey: boolean;
  readonly hasSessionKey: boolean;
  readonly preferredMode?: 'vault' | 'account' | 'session';
}

export function selectExecutionMode(
  input: SelectExecutionModeInput
): ModeSelectionResult {
  const rawProvider = (input.provider ?? '').trim();
  if (!isModelProvider(rawProvider)) {
    const display = rawProvider || 'unknown';
    return {
      status: 'unsupported_provider',
      provider: display,
      message: `Unsupported model provider "${display}". Supported providers are anthropic, openai, and google.`,
    };
  }

  const wantsSession = input.preferredMode === 'session';
  const wantsAccount =
    input.preferredMode === 'vault' || input.preferredMode === 'account';

  if (wantsSession && input.hasSessionKey) {
    return {
      status: 'ready',
      provider: rawProvider,
      mode: 'session',
    };
  }

  if (wantsAccount && input.hasVaultKey) {
    return {
      status: 'ready',
      provider: rawProvider,
      mode: 'vault',
    };
  }

  if (input.hasVaultKey) {
    return {
      status: 'ready',
      provider: rawProvider,
      mode: 'vault',
    };
  }

  if (input.hasSessionKey) {
    return {
      status: 'ready',
      provider: rawProvider,
      mode: 'session',
    };
  }

  return {
    status: 'needs_key',
    provider: rawProvider,
  };
}

export interface GetLanguageModelOptions extends ProviderModelConfigOptions {
  readonly provider: ModelProvider;
}

export function getLanguageModel(
  options: GetLanguageModelOptions
): LanguageModel {
  switch (options.provider) {
    case 'anthropic':
      return createAnthropicModel(options);
    case 'openai':
      return createOpenAIModel(options);
    case 'google':
      return createGoogleModel(options);
  }
}
