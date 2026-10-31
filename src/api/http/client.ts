import { ZodType } from 'zod';
import { env } from '../../config/env';
import { tokenStorage } from '../../storage/local/IndexedDbTokenStorage';
import {
  getAdminKey,
  performSingleFlightRefresh,
  setAdminKey,
} from './authInterceptor';
import { ApiError, normalizeErrorPayload } from './errors';

export type SecurityScheme = 'bearer' | 'adminKey' | 'none';

export interface RequestOptions<TResponse> {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly query?: Record<string, string | number | boolean | undefined | null>;
  readonly body?: unknown;
  readonly security?: SecurityScheme;
  readonly schema?: ZodType<TResponse>;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = `${env.apiBaseUrl}${normalizedPath}`;
  if (!query) return base;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

async function buildHeaders(
  security: SecurityScheme,
  hasBody: boolean
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (security === 'adminKey') {
    // Admin calls send ONLY x-admin-key, never Authorization
    const adminKey = getAdminKey();
    if (adminKey) {
      headers['x-admin-key'] = adminKey;
    }
  } else if (security === 'bearer') {
    const tokens = await tokenStorage.getTokens();
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<TResponse = unknown>(
  options: RequestOptions<TResponse>,
  isRetry = false
): Promise<TResponse> {
  const {
    method = 'GET',
    path,
    query,
    body,
    security = 'bearer',
    schema,
  } = options;

  const url = buildUrl(path, query);
  const hasBody = body !== undefined;
  const headers = await buildHeaders(security, hasBody);

  const response = await fetch(url, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && security === 'bearer' && !isRetry) {
    const refreshed = await performSingleFlightRefresh();
    if (refreshed) {
      return apiRequest(options, true);
    }
  }

  if (response.status === 403 && security === 'adminKey') {
    setAdminKey(null, 'invalid or missing admin key');
    throw new ApiError({
      status: 403,
      messages: ['invalid or missing admin key'],
      primaryMessage: 'invalid or missing admin key',
    });
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(normalizeErrorPayload(response.status, payload));
  }

  if (schema) {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const issueMsg = parsed.error.issues
        .map((i) => `${i.path.join('.') || 'response'}: ${i.message}`)
        .join('; ');
      throw new ApiError({
        status: response.status,
        messages: [`Invalid API response shape: ${issueMsg}`],
        primaryMessage: `Invalid API response shape: ${issueMsg}`,
      });
    }
    return parsed.data;
  }

  return payload as TResponse;
}
