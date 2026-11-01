import { performSingleFlightRefresh } from '../../api/http/authInterceptor';
import { tokenStorage } from '../../storage/local/IndexedDbTokenStorage';
import { clearAllSessionKeys } from './sessionKeyStore';

export type ProxyErrorCode =
  | 'NO_VAULT_KEY'
  | 'PATH_NOT_ALLOWED'
  | 'UNAUTHORIZED';

export class ProxyRuntimeError extends Error {
  readonly code: ProxyErrorCode;
  readonly status: number;
  readonly details?: string;

  constructor(options: {
    readonly code: ProxyErrorCode;
    readonly status: number;
    readonly message: string;
    readonly details?: string;
  }) {
    super(options.message);
    this.name = 'ProxyRuntimeError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface AuthFetchDependencies {
  readonly getAccessToken?: () => Promise<string | null>;
  readonly refreshAccessToken?: () => Promise<string | null>;
  readonly onLogout?: () => Promise<void>;
  readonly baseFetch?: typeof fetch;
}

function mergeBearerHeader(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  accessToken: string | null
): RequestInit {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined)
  );
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }
  return {
    ...init,
    headers,
  };
}

export function createAuthFetch(
  deps?: AuthFetchDependencies
): typeof fetch {
  const getAccessToken =
    deps?.getAccessToken ??
    (async () => {
      const tokens = await tokenStorage.getTokens();
      return tokens?.accessToken ?? null;
    });

  const refreshAccessToken =
    deps?.refreshAccessToken ??
    (async () => {
      const refreshed = await performSingleFlightRefresh();
      return refreshed?.accessToken ?? null;
    });

  const onLogout =
    deps?.onLogout ??
    (async () => {
      clearAllSessionKeys();
      await tokenStorage.clearTokens();
    });

  const baseFetch = deps?.baseFetch ?? fetch;

  return async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const token = await getAccessToken();
    const firstInit = mergeBearerHeader(input, init, token);
    const response = await baseFetch(input, firstInit);

    if (response.status !== 401) {
      return response;
    }

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      await onLogout();
      throw new ProxyRuntimeError({
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Session expired. Please sign in again.',
      });
    }

    const retryInit = mergeBearerHeader(input, init, refreshedToken);
    const retryResponse = await baseFetch(input, retryInit);

    if (retryResponse.status === 401) {
      await onLogout();
      throw new ProxyRuntimeError({
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Session expired. Please sign in again.',
      });
    }

    return retryResponse;
  };
}

export const authFetch: typeof fetch = createAuthFetch();
