export enum AIProvider {
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  Google = 'google',
}

export const MODEL_PROVIDERS = ['anthropic', 'openai', 'google'] as const;

export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export const ModelProvider = {
  Anthropic: 'anthropic',
  OpenAI: 'openai',
  Google: 'google',
} as const;

export function isModelProvider(value: unknown): value is ModelProvider {
  return (
    typeof value === 'string' &&
    (MODEL_PROVIDERS as readonly string[]).includes(value)
  );
}

export interface ProviderMetadata {
  readonly id: ModelProvider;
  readonly name: string;
  readonly defaultModels: readonly string[];
}

export const AI_PROVIDERS: readonly ProviderMetadata[] = [
  {
    id: AIProvider.Anthropic,
    name: 'Anthropic',
    defaultModels: [
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
  },
  {
    id: AIProvider.OpenAI,
    name: 'OpenAI',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: AIProvider.Google,
    name: 'Google',
    defaultModels: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  },
] as const;

export function getProviderDisplayName(provider: string): string {
  const found = AI_PROVIDERS.find((p) => p.id === provider);
  return found ? found.name : provider;
}
