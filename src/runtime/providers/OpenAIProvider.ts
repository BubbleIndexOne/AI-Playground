import {
  ChatProvider,
  executeProviderStreamTurn,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class OpenAIProvider implements ChatProvider {
  streamTurn(request: StreamTurnRequest): Promise<StreamTurnResponse> {
    return executeProviderStreamTurn('openai', request);
  }
}
