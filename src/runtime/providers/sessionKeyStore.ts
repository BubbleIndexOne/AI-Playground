import { ModelProvider } from '../../domain/providers';

// In-memory only session keys. Never persisted to localStorage, IndexedDB, or query cache.
const sessionKeys = new Map<ModelProvider, string>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getSessionKey(provider: ModelProvider): string | null {
  return sessionKeys.get(provider) ?? null;
}

export function hasSessionKey(provider: ModelProvider): boolean {
  const val = sessionKeys.get(provider);
  return typeof val === 'string' && val.length > 0;
}

export function setSessionKey(provider: ModelProvider, apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    sessionKeys.delete(provider);
  } else {
    sessionKeys.set(provider, trimmed);
  }
  notify();
}

export function clearSessionKey(provider: ModelProvider): void {
  if (sessionKeys.delete(provider)) {
    notify();
  }
}

export function clearAllSessionKeys(): void {
  if (sessionKeys.size > 0) {
    sessionKeys.clear();
    notify();
  }
}

export function subscribeSessionKeys(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
