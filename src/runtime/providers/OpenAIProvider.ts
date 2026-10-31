import {
  ChatProvider,
  ProviderToolCall,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class OpenAIProvider implements ChatProvider {
  async streamTurn(request: StreamTurnRequest): Promise<StreamTurnResponse> {
    const {
      apiKey,
      modelId,
      systemPrompt,
      params,
      tools,
      messages,
      onTextDelta,
    } = request;

    const openAiMessages: unknown[] = [];
    if (systemPrompt.trim()) {
      openAiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        openAiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        openAiMessages.push({
          role: 'assistant',
          content: msg.content || null,
          ...(msg.toolCalls && msg.toolCalls.length > 0
            ? {
                tool_calls: msg.toolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.arguments),
                  },
                })),
              }
            : {}),
        });
      } else if (msg.role === 'tool') {
        openAiMessages.push({
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: msg.content,
        });
      }
    }

    const body: Record<string, unknown> = {
      model: modelId,
      messages: openAiMessages,
      stream: true,
    };

    if (params.temperature !== undefined && params.temperature !== null) {
      body.temperature = params.temperature;
    }
    if (params.topP !== undefined && params.topP !== null) {
      body.top_p = params.topP;
    }
    if (params.presencePenalty !== undefined && params.presencePenalty !== null) {
      body.presence_penalty = params.presencePenalty;
    }
    if (
      params.frequencyPenalty !== undefined &&
      params.frequencyPenalty !== null
    ) {
      body.frequency_penalty = params.frequencyPenalty;
    }
    if (params.maxOutputTokens !== undefined && params.maxOutputTokens !== null) {
      body.max_completion_tokens = params.maxOutputTokens;
    }
    if (params.seed !== undefined && params.seed !== null) {
      body.seed = params.seed;
    }
    if (params.stopSequences && params.stopSequences.length > 0) {
      body.stop = params.stopSequences;
    }
    if (tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            ...t.inputSchema,
          },
        },
      }));
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const toolCallMap = new Map<
      number,
      { id: string; name: string; argsBuf: string }
    >();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr) as {
            choices?: Array<{
              delta?: {
                content?: string;
                tool_calls?: Array<{
                  index: number;
                  id?: string;
                  function?: { name?: string; arguments?: string };
                }>;
              };
            }>;
          };
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;
          if (typeof delta.content === 'string') {
            fullText += delta.content;
            onTextDelta?.(delta.content);
          }
          if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const existing = toolCallMap.get(tc.index) ?? {
                id: tc.id ?? crypto.randomUUID(),
                name: '',
                argsBuf: '',
              };
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.name += tc.function.name;
              if (tc.function?.arguments) {
                existing.argsBuf += tc.function.arguments;
              }
              toolCallMap.set(tc.index, existing);
            }
          }
        } catch {
          // Ignore malformed SSE line
        }
      }
    }

    const toolCalls: ProviderToolCall[] = [];
    for (const tc of toolCallMap.values()) {
      let args: Record<string, unknown> = {};
      if (tc.argsBuf.trim()) {
        try {
          args = JSON.parse(tc.argsBuf) as Record<string, unknown>;
        } catch {
          args = {};
        }
      }
      toolCalls.push({
        id: tc.id,
        name: tc.name,
        arguments: args,
      });
    }

    return { text: fullText, toolCalls };
  }
}
