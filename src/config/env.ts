declare global {
  interface Window {
    __APP_ENV__?: {
      apiBaseUrl?: string;
    };
  }
}

export interface AppEnv {
  readonly apiBaseUrl: string;
}

const DEFAULT_API_BASE_URL =
  'https://agent-playground-backend-dev.bubbleindexone-dev.workers.dev';

function getApiBaseUrl(): string {
  // 1. Runtime injection from Cloudflare Worker
  if (typeof window !== 'undefined' && window.__APP_ENV__?.apiBaseUrl) {
    const runtimeUrl = window.__APP_ENV__.apiBaseUrl.trim();
    if (runtimeUrl.length > 0) {
      return runtimeUrl.replace(/\/+$/, '');
    }
  }

  // 2. Build-time Vite environment variables
  const metaEnv = import.meta.env as Record<string, string | undefined>;
  const raw =
    metaEnv.VITE_API_BASE_URL ||
    metaEnv.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/, '');
  }
  return '';
}

export const env: AppEnv = {
  apiBaseUrl: getApiBaseUrl(),
};
