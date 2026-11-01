import { createAnthropic } from '@ai-sdk/anthropic';
import { LanguageModel } from 'ai';
import { authFetch } from './authFetch';
import { getProviderProxyBaseUrl } from './proxyEndpoints';

export interface ProviderModelConfigOptions {
  readonly modelId: string;
  readonly mode: 'vault' | 'session';
  readonly sessionKey?: string;
  readonly apiBaseUrl?: string;
  readonly fetch?: typeof fetch;
}

export function createAnthropicModel(
  options: ProviderModelConfigOptions
): LanguageModel {
  if (options.mode === 'vault') {
    const provider = createAnthropic({
      baseURL: getProviderProxyBaseUrl('anthropic', options.apiBaseUrl),
      apiKey: 'proxied',
      fetch: options.fetch ?? authFetch,
    });
    return provider(options.modelId);
  }

  const provider = createAnthropic({
    apiKey: options.sessionKey ?? '',
    headers: {
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return provider(options.modelId);
}
