import {
  ChatProvider,
  ProviderToolCall,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class AnthropicProvider implements ChatProvider {
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

    const anthropicMessages: unknown[] = [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        anthropicMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        const blocks: unknown[] = [];
        if (msg.content) {
          blocks.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls ?? []) {
          blocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        anthropicMessages.push({
          role: 'assistant',
          content: blocks.length > 0 ? blocks : msg.content || '...',
        });
      } else if (msg.role === 'tool') {
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId,
              content: msg.content,
            },
          ],
        });
      }
    }

    const body: Record<string, unknown> = {
      model: modelId,
      max_tokens: params.maxOutputTokens ?? 2048,
      messages: anthropicMessages,
      stream: true,
    };

    if (systemPrompt.trim()) {
      body.system = systemPrompt;
    }
    if (params.temperature !== undefined && params.temperature !== null) {
      body.temperature = params.temperature;
    }
    if (params.topP !== undefined && params.topP !== null) {
      body.top_p = params.topP;
    }
    if (params.topK !== undefined && params.topK !== null) {
      body.top_k = params.topK;
    }
    if (params.stopSequences && params.stopSequences.length > 0) {
      body.stop_sequences = params.stopSequences;
    }
    if (tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object',
          ...t.inputSchema,
        },
      }));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const activeToolBlocks = new Map<
      number,
      { id: string; name: string; jsonBuf: string }
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
          const evt = JSON.parse(dataStr) as Record<string, unknown>;
          if (evt.type === 'content_block_start') {
            const idx = Number(evt.index);
            const block = evt.content_block as Record<string, unknown>;
            if (block?.type === 'tool_use') {
              activeToolBlocks.set(idx, {
                id: String(block.id ?? crypto.randomUUID()),
                name: String(block.name ?? ''),
                jsonBuf: '',
              });
            }
          } else if (evt.type === 'content_block_delta') {
            const idx = Number(evt.index);
            const delta = evt.delta as Record<string, unknown>;
            if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
              fullText += delta.text;
              onTextDelta?.(delta.text);
            } else if (
              delta?.type === 'input_json_delta' &&
              typeof delta.partial_json === 'string'
            ) {
              const entry = activeToolBlocks.get(idx);
              if (entry) {
                entry.jsonBuf += delta.partial_json;
              }
            }
          }
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }

    const toolCalls: ProviderToolCall[] = [];
    for (const block of activeToolBlocks.values()) {
      let parsedArgs: Record<string, unknown> = {};
      if (block.jsonBuf.trim()) {
        try {
          parsedArgs = JSON.parse(block.jsonBuf) as Record<string, unknown>;
        } catch {
          parsedArgs = {};
        }
      }
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: parsedArgs,
      });
    }

    return { text: fullText, toolCalls };
  }
}
