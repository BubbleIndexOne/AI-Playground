/**
 * @fileoverview Cloudflare Worker Edge Entrypoint
 *
 * Handles HTTP requests at the Cloudflare Workers / Pages edge runtime.
 * Serves exported static Vite assets from the `dist/` directory binding (`env.ASSETS`),
 * with SPA fallback routing to /index.html and rejecting unhandled backend API requests with 404.
 */

export interface WorkerEnv {
  readonly NEXT_PUBLIC_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    // Reject unhandled backend API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    if (!env.ASSETS) {
      return new Response('AI Playground Worker Active', { status: 200 });
    }

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.method === 'GET') {
      response = await env.ASSETS.fetch(
        new Request(new URL('/index.html', request.url), request)
      );
    }

    return response;
  },
};
