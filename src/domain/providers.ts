export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
}

export interface ProviderMetadata {
  readonly id: AIProvider;
  readonly name: string;
  readonly defaultModels: readonly string[];
}

export const AI_PROVIDERS: readonly ProviderMetadata[] = [
  {
    id: AIProvider.Anthropic,
    name: 'Anthropic',
    defaultModels: ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  },
  {
    id: AIProvider.OpenAI,
    name: 'OpenAI',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: AIProvider.Google,
    name: 'Google Gemini',
    defaultModels: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  },
] as const;
