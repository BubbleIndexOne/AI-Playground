import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { ProviderModelConfigOptions } from './anthropicConfig';
import { authFetch } from './authFetch';
import { getProviderProxyBaseUrl } from './proxyEndpoints';

export function createGoogleModel(
  options: ProviderModelConfigOptions
): LanguageModel {
  if (options.mode === 'vault') {
    const provider = createGoogleGenerativeAI({
      baseURL: getProviderProxyBaseUrl('google', options.apiBaseUrl),
      apiKey: 'proxied',
      fetch: options.fetch ?? authFetch,
    });
    return provider(options.modelId);
  }

  const provider = createGoogleGenerativeAI({
    apiKey: options.sessionKey ?? '',
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return provider(options.modelId);
}
