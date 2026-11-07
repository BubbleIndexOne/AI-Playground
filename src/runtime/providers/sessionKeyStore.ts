import { ModelProvider } from '../../domain/providers';

export type KeyStorageMode = 'session' | 'account';

// In-memory only session keys. Never persisted to localStorage, IndexedDB, or query cache.
const sessionKeys = new Map<ModelProvider, string>();
const needsAttentionProviders = new Set<ModelProvider>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getSessionKey(provider: ModelProvider): string | null {
  return sessionKeys.get(provider) ?? null;
}

export function getSessionKeyPreview(provider: ModelProvider): string | null {
  const key = sessionKeys.get(provider);
  if (!key) return null;
  const trimmed = key.trim();
  const last4 = trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
  return `••••${last4}`;
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
    needsAttentionProviders.delete(provider);
  }
  notify();
}

export function clearSessionKey(provider: ModelProvider): void {
  if (sessionKeys.delete(provider)) {
    notify();
  }
}

export function clearAllSessionKeys(): void {
  let changed = false;
  if (sessionKeys.size > 0) {
    sessionKeys.clear();
    changed = true;
  }
  if (needsAttentionProviders.size > 0) {
    needsAttentionProviders.clear();
    changed = true;
  }
  if (changed) {
    notify();
  }
}

export function markProviderNeedsAttention(provider: ModelProvider): void {
  if (!needsAttentionProviders.has(provider)) {
    needsAttentionProviders.add(provider);
    notify();
  }
}

export function clearProviderNeedsAttention(provider: ModelProvider): void {
  if (needsAttentionProviders.delete(provider)) {
    notify();
  }
}

export function hasProviderNeedsAttention(provider: ModelProvider): boolean {
  return needsAttentionProviders.has(provider);
}

const PREF_KEY_PREFIX = 'model_provider_mode_';

export function getPreferredMode(
  provider: ModelProvider,
  hasAccountKey: boolean
): KeyStorageMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`${PREF_KEY_PREFIX}${provider}`);
      if (stored === 'session' || stored === 'account') {
        return stored;
      }
    }
  } catch {
    // fallback
  }
  // Default to account if a saved account key exists, otherwise session
  return hasAccountKey ? 'account' : 'session';
}

export function setPreferredMode(
  provider: ModelProvider,
  mode: KeyStorageMode
): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${PREF_KEY_PREFIX}${provider}`, mode);
    }
  } catch {
    // fallback
  }
  notify();
}

export function subscribeSessionKeys(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
