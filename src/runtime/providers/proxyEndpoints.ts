import { env } from '../../config/env';
import { ModelProvider } from '../../domain/providers';

export function getProxyBaseUrls(
  apiBaseUrl: string = env.apiBaseUrl
): Record<ModelProvider, string> {
  const base = apiBaseUrl.replace(/\/+$/, '');
  return {
    anthropic: `${base}/llm/anthropic/v1`,
    openai: `${base}/llm/openai/v1`,
    google: `${base}/llm/google/v1beta`,
  };
}

export function getProviderProxyBaseUrl(
  provider: ModelProvider,
  apiBaseUrl: string = env.apiBaseUrl
): string {
  return getProxyBaseUrls(apiBaseUrl)[provider];
}

export const PROXY_ALLOWED_PATTERNS: Record<ModelProvider, readonly RegExp[]> = {
  anthropic: [/^\/llm\/anthropic\/v1\/messages$/],
  openai: [
    /^\/llm\/openai\/v1\/chat\/completions$/,
    /^\/llm\/openai\/v1\/responses$/,
  ],
  google: [
    /^\/llm\/google\/v1beta\/models\/[^/]+:generateContent$/,
    /^\/llm\/google\/v1beta\/models\/[^/]+:streamGenerateContent$/,
  ],
};

export function isAllowedProxyPath(
  provider: ModelProvider,
  pathname: string
): boolean {
  const patterns = PROXY_ALLOWED_PATTERNS[provider];
  return patterns.some((re) => re.test(pathname));
}
