import { generateText, streamText } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { normalizeErrorPayload } from '../../../api/http/errors';
import {
  DeleteModelCredentialResponseSchema,
  ListModelCredentialsResponseSchema,
  ModelCredentialItemSchema,
  SaveModelCredentialResponseSchema,
  TestModelCredentialFailureSchema,
  TestModelCredentialResponseSchema,
} from '../../../api/types/credentials';
import {
  checkLegacyCredentials,
  declineLegacyCredentialsMigration,
  LegacyCredentialAdapter,
  LegacyCredentialRecord,
  migrateLegacyCredentialsToVault,
} from '../../../features/credentials/migration/legacyCredentialMigration';
import { createAuthFetch, ProxyRuntimeError } from '../authFetch';
import { getLanguageModel, selectExecutionMode } from '../getLanguageModel';
import { isAllowedProxyPath } from '../proxyEndpoints';

describe('a) Model Credentials Zod Schemas', () => {
  const sampleItem = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    provider: 'anthropic' as const,
    preview: 'sk-ant-...9f2a',
    key_version: 1,
    last_verified_at: '2026-10-31T12:00:00.000Z',
    created_at: '2026-10-31T10:00:00.000Z',
    updated_at: '2026-10-31T12:00:00.000Z',
  };

  it('validates ModelCredentialItem with null preview and null last_verified_at', () => {
    const parsed = ModelCredentialItemSchema.parse({
      ...sampleItem,
      preview: null,
      last_verified_at: null,
    });
    expect(parsed.preview).toBeNull();
    expect(parsed.last_verified_at).toBeNull();
  });

  it('validates GET /credentials/models list response including empty array', () => {
    const emptyParsed = ListModelCredentialsResponseSchema.parse({
      success: true,
      credentials: [],
    });
    expect(emptyParsed.credentials).toEqual([]);

    const populatedParsed = ListModelCredentialsResponseSchema.parse({
      success: true,
      credentials: [sampleItem],
    });
    expect(populatedParsed.credentials).toHaveLength(1);
    expect(populatedParsed.credentials[0].provider).toBe('anthropic');
  });

  it('validates PUT /credentials/models/{provider} save response', () => {
    const parsed = SaveModelCredentialResponseSchema.parse({
      success: true,
      message: 'API key saved to encrypted vault',
      credential: sampleItem,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.credential.id).toBe(sampleItem.id);
  });

  it('validates DELETE /credentials/models/{provider} response', () => {
    const parsed = DeleteModelCredentialResponseSchema.parse({
      success: true,
      message: 'API key removed',
    });
    expect(parsed.success).toBe(true);
  });

  it('validates POST /credentials/models/{provider}/test 200 with details and 400 { success: false } shape', () => {
    const successWithDetails = TestModelCredentialResponseSchema.parse({
      success: true,
      message: 'Anthropic key verified',
      details: {
        provider: 'anthropic',
        latencyMs: 245,
        model: 'claude-3-5-haiku-latest',
      },
    });
    expect(successWithDetails.details?.latencyMs).toBe(245);

    const failure400 = TestModelCredentialFailureSchema.parse({
      success: false,
      message: 'Upstream provider rejected API key',
    });
    expect(failure400.success).toBe(false);
    expect(failure400.message).toBe('Upstream provider rejected API key');
  });
});

describe('b) Error Normaliser for Both Error Shapes', () => {
  it('normalises standard { statusCode, message: string | string[] } shape', () => {
    const single = normalizeErrorPayload(400, {
      statusCode: 400,
      message: 'Invalid API key format',
    });
    expect(single.status).toBe(400);
    expect(single.messages).toEqual(['Invalid API key format']);
    expect(single.primaryMessage).toBe('Invalid API key format');

    const multi = normalizeErrorPayload(400, {
      statusCode: 400,
      message: ['apiKey must not be empty', 'Invalid prefix'],
    });
    expect(multi.status).toBe(400);
    expect(multi.messages).toEqual(['apiKey must not be empty', 'Invalid prefix']);
  });

  it('normalises test endpoint 400 { success: false, message } shape', () => {
    const testFailure = normalizeErrorPayload(400, {
      success: false,
      message: 'Key verification failed: 401 Unauthorized from upstream',
    });
    expect(testFailure.status).toBe(400);
    expect(testFailure.messages).toEqual([
      'Key verification failed: 401 Unauthorized from upstream',
    ]);
    expect(testFailure.primaryMessage).toBe(
      'Key verification failed: 401 Unauthorized from upstream'
    );
  });
});

describe('c) Mode Selection Pure Function', () => {
  it('blocks unsupported providers and names the provider', () => {
    const res = selectExecutionMode({
      provider: 'mistral',
      hasVaultKey: true,
      hasSessionKey: true,
    });
    expect(res.status).toBe('unsupported_provider');
    if (res.status === 'unsupported_provider') {
      expect(res.message).toContain('mistral');
    }
  });

  it('selects vault mode when a vault key exists', () => {
    const res = selectExecutionMode({
      provider: 'anthropic',
      hasVaultKey: true,
      hasSessionKey: true,
    });
    expect(res).toEqual({
      status: 'ready',
      provider: 'anthropic',
      mode: 'vault',
    });
  });

  it('selects session mode when no vault key exists but session key is present', () => {
    const res = selectExecutionMode({
      provider: 'openai',
      hasVaultKey: false,
      hasSessionKey: true,
    });
    expect(res).toEqual({
      status: 'ready',
      provider: 'openai',
      mode: 'session',
    });
  });

  it('returns needs_key when neither vault nor session key exists', () => {
    const res = selectExecutionMode({
      provider: 'google',
      hasVaultKey: false,
      hasSessionKey: false,
    });
    expect(res).toEqual({
      status: 'needs_key',
      provider: 'google',
    });
  });
});

describe('d) authFetch Refresh-and-Retry', () => {
  it('attaches current Bearer token, refreshes once on 401, and retries', async () => {
    const seenHeaders: string[] = [];
    let callCount = 0;

    const baseFetch = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        callCount += 1;
        const headers = new Headers(init?.headers);
        seenHeaders.push(headers.get('Authorization') ?? '');
        if (callCount === 1) {
          return new Response('Unauthorized', { status: 401 });
        }
        return new Response('{"ok":true}', { status: 200 });
      }
    );

    const refreshAccessToken = vi.fn(async () => 'fresh-access-token');
    const onLogout = vi.fn(async () => {});

    const customFetch = createAuthFetch({
      getAccessToken: async () => 'expired-access-token',
      refreshAccessToken,
      onLogout,
      baseFetch: baseFetch as unknown as typeof fetch,
    });

    const response = await customFetch('https://example.com/llm/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer proxied' },
    });

    expect(response.status).toBe(200);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
    expect(seenHeaders).toEqual([
      'Bearer expired-access-token',
      'Bearer fresh-access-token',
    ]);
  });

  it('logs out and throws ProxyRuntimeError when refresh fails on 401', async () => {
    const baseFetch = vi.fn(async () => new Response('Unauthorized', { status: 401 }));
    const onLogout = vi.fn(async () => {});

    const customFetch = createAuthFetch({
      getAccessToken: async () => 'expired-token',
      refreshAccessToken: async () => null,
      onLogout,
      baseFetch: baseFetch as unknown as typeof fetch,
    });

    await expect(
      customFetch('https://example.com/llm/anthropic/v1/messages', {
        method: 'POST',
      })
    ).rejects.toBeInstanceOf(ProxyRuntimeError);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe('e) Legacy Migration Module', () => {
  function createInMemoryAdapter(
    initial: LegacyCredentialRecord[]
  ): LegacyCredentialAdapter & { wiped: boolean; store: LegacyCredentialRecord[] } {
    const state = {
      wiped: false,
      store: [...initial],
    };
    return {
      get wiped() {
        return state.wiped;
      },
      get store() {
        return state.store;
      },
      async readAll() {
        return [...state.store];
      },
      async wipeAll() {
        state.wiped = true;
        state.store = [];
      },
    };
  }

  it('migrates each legacy key via saveModelCredential and wipes local records afterwards', async () => {
    const adapter = createInMemoryAdapter([
      { provider: 'anthropic', apiKey: 'sk-ant-legacy' },
      { provider: 'openai', apiKey: 'sk-proj-legacy' },
    ]);

    const saveFn = vi.fn(async (provider) => ({
      success: true as const,
      message: 'Saved',
      credential: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider,
        preview: 'sk-...legacy',
        key_version: 1,
        last_verified_at: null,
        created_at: '2026-10-31T00:00:00Z',
        updated_at: '2026-10-31T00:00:00Z',
      },
    }));

    const existing = await checkLegacyCredentials(adapter);
    expect(existing).toHaveLength(2);

    const res = await migrateLegacyCredentialsToVault({ adapter, saveFn });
    expect(res.migratedProviders).toEqual(['anthropic', 'openai']);
    expect(res.errors).toEqual([]);
    expect(saveFn).toHaveBeenCalledTimes(2);
    expect(adapter.wiped).toBe(true);
    expect(adapter.store).toEqual([]);
  });

  it('does not wipe local records when any record fails to save, preserving failed keys for retry', async () => {
    const adapter = createInMemoryAdapter([
      { provider: 'anthropic', apiKey: 'sk-ant-legacy' },
      { provider: 'openai', apiKey: 'sk-proj-legacy' },
    ]);

    const saveFn = vi.fn(async (provider) => {
      if (provider === 'openai') {
        throw new Error('Network error saving openai key');
      }
      return {
        success: true as const,
        message: 'Saved',
        credential: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider,
          preview: 'sk-...legacy',
          key_version: 1,
          last_verified_at: null,
          created_at: '2026-10-31T00:00:00Z',
          updated_at: '2026-10-31T00:00:00Z',
        },
      };
    });

    const res = await migrateLegacyCredentialsToVault({ adapter, saveFn });
    expect(res.migratedProviders).toEqual(['anthropic']);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].provider).toBe('openai');
    expect(adapter.wiped).toBe(false);
    expect(adapter.store).toHaveLength(2);
  });

  it('wipes local records when migration is declined', async () => {
    const adapter = createInMemoryAdapter([
      { provider: 'google', apiKey: 'AIzaSyLegacy' },
    ]);

    await declineLegacyCredentialsMigration(adapter);
    expect(adapter.wiped).toBe(true);
    expect(adapter.store).toEqual([]);
  });
});

describe('f) Proxy URL Allowlist Verification across Providers (Generate & Stream)', () => {
  const testApiBase = 'https://proxy.example.com';

  function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  }

  it('captures and validates Anthropic generate and stream paths against /llm/anthropic/v1/messages', async () => {
    const capturedUrls: URL[] = [];

    const fakeFetch: typeof fetch = async (input) => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const parsedUrl = new URL(urlStr);
      capturedUrls.push(parsedUrl);
      console.log(
        `[Allowlist Test][anthropic] pathname=${parsedUrl.pathname} query=${parsedUrl.search || '(none)'}`
      );

      if (capturedUrls.length === 1) {
        return new Response(
          JSON.stringify({
            id: 'msg_01',
            type: 'message',
            role: 'assistant',
            model: 'claude-3-5-sonnet-latest',
            content: [{ type: 'text', text: 'ok' }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 5, output_tokens: 2 },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        createSSEStream([
          'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant","content":[],"model":"claude-3-5-sonnet-latest","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":5,"output_tokens":1}}}\n\n',
          'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"ok"}}\n\n',
          'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n',
          'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":1}}\n\n',
          'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }
      );
    };

    const model = getLanguageModel({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-latest',
      mode: 'vault',
      apiBaseUrl: testApiBase,
      fetch: fakeFetch,
    });

    await generateText({ model, prompt: 'ping' });
    const streamRes = streamText({ model, prompt: 'ping' });
    for await (const _ of streamRes.textStream) {
      // consume stream
    }

    expect(capturedUrls).toHaveLength(2);
    for (const u of capturedUrls) {
      expect(isAllowedProxyPath('anthropic', u.pathname)).toBe(true);
      expect(u.pathname).toBe('/llm/anthropic/v1/messages');
    }
  });

  it('captures and validates OpenAI generate and stream paths against /llm/openai/v1/chat/completions or /llm/openai/v1/responses', async () => {
    const capturedUrls: URL[] = [];

    const fakeFetch: typeof fetch = async (input) => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const parsedUrl = new URL(urlStr);
      capturedUrls.push(parsedUrl);
      console.log(
        `[Allowlist Test][openai] pathname=${parsedUrl.pathname} query=${parsedUrl.search || '(none)'}`
      );

      if (capturedUrls.length === 1) {
        return new Response(
          JSON.stringify({
            id: 'chatcmpl-1',
            object: 'chat.completion',
            created: 1700000000,
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'ok' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        createSSEStream([
          'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"role":"assistant","content":"ok"},"finish_reason":null}]}\n\n',
          'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
          'data: [DONE]\n\n',
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }
      );
    };

    const model = getLanguageModel({
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      mode: 'vault',
      apiBaseUrl: testApiBase,
      fetch: fakeFetch,
    });

    await generateText({ model, prompt: 'ping' });
    const streamRes = streamText({ model, prompt: 'ping' });
    for await (const _ of streamRes.textStream) {
      // consume stream
    }

    expect(capturedUrls).toHaveLength(2);
    for (const u of capturedUrls) {
      expect(isAllowedProxyPath('openai', u.pathname)).toBe(true);
      expect([
        '/llm/openai/v1/chat/completions',
        '/llm/openai/v1/responses',
      ]).toContain(u.pathname);
    }
  });

  it('captures and validates Google generate and stream paths against /llm/google/v1beta/models/{model}:generateContent or :streamGenerateContent', async () => {
    const capturedUrls: URL[] = [];

    const fakeFetch: typeof fetch = async (input) => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const parsedUrl = new URL(urlStr);
      capturedUrls.push(parsedUrl);
      console.log(
        `[Allowlist Test][google] pathname=${parsedUrl.pathname} query=${parsedUrl.search || '(none)'}`
      );

      if (capturedUrls.length === 1) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'ok' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 1,
              totalTokenCount: 6,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        createSSEStream([
          'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"ok"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":1,"totalTokenCount":6}}\n\n',
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }
      );
    };

    const model = getLanguageModel({
      provider: 'google',
      modelId: 'gemini-2.5-flash',
      mode: 'vault',
      apiBaseUrl: testApiBase,
      fetch: fakeFetch,
    });

    await generateText({ model, prompt: 'ping' });
    const streamRes = streamText({ model, prompt: 'ping' });
    for await (const _ of streamRes.textStream) {
      // consume stream
    }

    expect(capturedUrls).toHaveLength(2);
    expect(capturedUrls[0].pathname).toBe(
      '/llm/google/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(capturedUrls[1].pathname).toBe(
      '/llm/google/v1beta/models/gemini-2.5-flash:streamGenerateContent'
    );
    expect(capturedUrls[1].search).toBe('?alt=sse');
    for (const u of capturedUrls) {
      expect(isAllowedProxyPath('google', u.pathname)).toBe(true);
    }
  });
});
