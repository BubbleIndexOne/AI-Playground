export interface WorkerEnv {
  readonly NEXT_PUBLIC_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('AI Playground Worker Active', { status: 200 });
  },
};
