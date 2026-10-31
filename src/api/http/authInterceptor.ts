import { z } from 'zod';
import { env } from '../../config/env';
import { AuthTokens } from '../../storage/interfaces/TokenStorage';
import { tokenStorage } from '../../storage/local/IndexedDbTokenStorage';

const RefreshResponseSchema = z
  .object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .transform((val) => ({
    accessToken: val.accessToken ?? val.access_token ?? '',
    refreshToken: val.refreshToken ?? val.refresh_token ?? '',
  }));

let inflightRefresh: Promise<AuthTokens | null> | null = null;

// In-memory only admin key (never persisted, never logged)
let inMemoryAdminKey: string | null = null;
const adminKeyListeners = new Set<(hasKey: boolean, error?: string) => void>();

export function setAdminKey(key: string | null, errorMsg?: string): void {
  inMemoryAdminKey = key && key.trim().length > 0 ? key.trim() : null;
  for (const listener of adminKeyListeners) {
    listener(inMemoryAdminKey !== null, errorMsg);
  }
}

export function getAdminKey(): string | null {
  return inMemoryAdminKey;
}

export function subscribeAdminKey(
  listener: (hasKey: boolean, error?: string) => void
): () => void {
  adminKeyListeners.add(listener);
  return () => {
    adminKeyListeners.delete(listener);
  };
}

export async function performSingleFlightRefresh(): Promise<AuthTokens | null> {
  if (inflightRefresh) {
    return inflightRefresh;
  }

  inflightRefresh = (async () => {
    try {
      const current = await tokenStorage.getTokens();
      if (!current?.refreshToken) {
        await tokenStorage.clearTokens();
        return null;
      }

      const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: current.refreshToken,
          refresh_token: current.refreshToken,
        }),
      });

      if (!response.ok) {
        await tokenStorage.clearTokens();
        return null;
      }

      const json: unknown = await response.json();
      const parsed = RefreshResponseSchema.safeParse(json);
      if (!parsed.success || !parsed.data.accessToken) {
        await tokenStorage.clearTokens();
        return null;
      }

      const nextTokens: AuthTokens = {
        accessToken: parsed.data.accessToken,
        refreshToken: parsed.data.refreshToken || current.refreshToken,
      };
      await tokenStorage.setTokens(nextTokens);
      return nextTokens;
    } catch {
      await tokenStorage.clearTokens();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}
