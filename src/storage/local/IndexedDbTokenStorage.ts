import { AuthTokens, TokenStorage } from '../interfaces/TokenStorage';
import { runTransaction, STORES } from './idbHelper';

const TOKEN_KEY = 'current_session';

export class IndexedDbTokenStorage implements TokenStorage {
  private listeners = new Set<(tokens: AuthTokens | null) => void>();
  private memoryCache: AuthTokens | null | undefined = undefined;

  async getTokens(): Promise<AuthTokens | null> {
    if (this.memoryCache !== undefined) {
      return this.memoryCache;
    }
    try {
      const stored = await runTransaction<AuthTokens | undefined>(
        STORES.TOKENS,
        'readonly',
        (store) => store.get(TOKEN_KEY)
      );
      this.memoryCache = stored ?? null;
      return this.memoryCache;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.memoryCache = tokens;
    await runTransaction(STORES.TOKENS, 'readwrite', (store) =>
      store.put(tokens, TOKEN_KEY)
    );
    this.notify(tokens);
  }

  async clearTokens(): Promise<void> {
    this.memoryCache = null;
    await runTransaction(STORES.TOKENS, 'readwrite', (store) =>
      store.delete(TOKEN_KEY)
    );
    this.notify(null);
  }

  subscribe(listener: (tokens: AuthTokens | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(tokens: AuthTokens | null): void {
    for (const listener of this.listeners) {
      listener(tokens);
    }
  }
}

export const tokenStorage: TokenStorage = new IndexedDbTokenStorage();
