import {
  ChatProvider,
  executeProviderStreamTurn,
  StreamTurnRequest,
  StreamTurnResponse,
} from './ChatProvider';

export class GoogleGeminiProvider implements ChatProvider {
  streamTurn(request: StreamTurnRequest): Promise<StreamTurnResponse> {
    return executeProviderStreamTurn('google', request);
  }
}
