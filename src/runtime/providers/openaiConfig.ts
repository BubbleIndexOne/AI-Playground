import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import { ProviderModelConfigOptions } from './anthropicConfig';
import { authFetch } from './authFetch';
import { getProviderProxyBaseUrl } from './proxyEndpoints';

export function createOpenAIModel(
  options: ProviderModelConfigOptions
): LanguageModel {
  if (options.mode === 'vault') {
    const provider = createOpenAI({
      baseURL: getProviderProxyBaseUrl('openai', options.apiBaseUrl),
      apiKey: 'proxied',
      fetch: options.fetch ?? authFetch,
    });
    return provider.chat(options.modelId);
  }

  const provider = createOpenAI({
    apiKey: options.sessionKey ?? '',
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return provider.chat(options.modelId);
}
