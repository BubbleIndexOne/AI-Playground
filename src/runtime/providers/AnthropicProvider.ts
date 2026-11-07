import {
  ChatProvider,
  executeProviderStreamTurn,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class AnthropicProvider implements ChatProvider {
  streamTurn(request: StreamTurnRequest): Promise<StreamTurnResponse> {
    return executeProviderStreamTurn('anthropic', request);
  }
}
