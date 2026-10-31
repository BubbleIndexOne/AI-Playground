import { GoogleGenAI } from '@google/genai';
import {
  ChatProvider,
  ProviderToolCall,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class GoogleGeminiProvider implements ChatProvider {
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

    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text:
            m.role === 'tool'
              ? `Tool result (${m.toolName ?? m.toolCallId}): ${m.content}`
              : m.content,
        },
      ],
    }));

    const functionDeclarations = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parametersJsonSchema: {
        type: 'object',
        ...t.inputSchema,
      },
    }));

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents,
      config: {
        ...(systemPrompt.trim() ? { systemInstruction: systemPrompt } : {}),
        ...(params.temperature !== undefined && params.temperature !== null
          ? { temperature: params.temperature }
          : {}),
        ...(params.topP !== undefined && params.topP !== null
          ? { topP: params.topP }
          : {}),
        ...(params.topK !== undefined && params.topK !== null
          ? { topK: params.topK }
          : {}),
        ...(params.maxOutputTokens !== undefined &&
        params.maxOutputTokens !== null
          ? { maxOutputTokens: params.maxOutputTokens }
          : {}),
        ...(functionDeclarations.length > 0
          ? { tools: [{ functionDeclarations }] }
          : {}),
      },
    });

    let fullText = '';
    const toolCalls: ProviderToolCall[] = [];

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullText += chunk.text;
        onTextDelta?.(chunk.text);
      }
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        for (const fc of chunk.functionCalls) {
          toolCalls.push({
            id: fc.id ?? crypto.randomUUID(),
            name: fc.name ?? 'unknown_tool',
            arguments: (fc.args as Record<string, unknown>) ?? {},
          });
        }
      }
    }

    return { text: fullText, toolCalls };
  }
}
