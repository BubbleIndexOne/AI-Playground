/**
 * @fileoverview Cloudflare Worker Edge Entrypoint
 *
 * Handles HTTP requests at the Cloudflare Workers / Pages edge runtime.
 * Serves exported static Vite assets from the `dist/` directory binding (`env.ASSETS`),
 * injects runtime Cloudflare variables (e.g. VITE_API_BASE_URL) into HTML responses,
 * provides SPA fallback routing to /index.html, and rejects unhandled backend API requests with 404.
 */

export interface WorkerEnv {
  readonly NEXT_PUBLIC_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  /**
   * Handles incoming HTTP requests to the Worker.
   * Intercepts navigation requests, serves static SPA assets via env.ASSETS,
   * and injects runtime environment variables into the served HTML shell.
   *
   * @param request Incoming HTTP request.
   * @param env Environment variables and asset bindings provided by Cloudflare.
   * @returns Generated or proxied HTTP Response.
   */
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

    // Inject runtime variables from Cloudflare Worker into HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') && response.ok) {
      const runtimeApiUrl = env.VITE_API_BASE_URL || env.NEXT_PUBLIC_API_BASE_URL;
      if (runtimeApiUrl) {
        const html = await response.text();
        const injection = `<script>window.__APP_ENV__={apiBaseUrl:${JSON.stringify(runtimeApiUrl)}};</script>`;
        const modifiedHtml = html.includes('</head>')
          ? html.replace('</head>', `${injection}</head>`)
          : `${injection}${html}`;

        const headers = new Headers(response.headers);
        headers.delete('content-length');

        return new Response(modifiedHtml, {
          status: response.status,
          headers,
        });
      }
    }

    return response;
  },
};
