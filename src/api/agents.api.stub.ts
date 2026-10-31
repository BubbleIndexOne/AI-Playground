/**
 * FUTURE BACKEND CLIENT STUB: /agents
 *
 * Notice: The current OpenAPI backend contract does not include /agents endpoints.
 * Agents are persisted locally via AgentRepository (IndexedDB).
 * When the backend adds /agents endpoints, replace AgentRepository's IndexedDB
 * implementation with an adapter that delegates to this client.
 *
 * Every method intentionally throws NotImplementedError and is NOT imported anywhere yet.
 */
import { NotImplementedError } from './http/errors';

export const agentsApiStub = {
  listAgents(): Promise<never> {
    throw new NotImplementedError('GET /agents');
  },

  getAgent(_id: string): Promise<never> {
    throw new NotImplementedError('GET /agents/{id}');
  },

  createAgent(_payload: unknown): Promise<never> {
    throw new NotImplementedError('POST /agents');
  },

  updateAgent(_id: string, _payload: unknown): Promise<never> {
    throw new NotImplementedError('PATCH /agents/{id}');
  },

  deleteAgent(_id: string): Promise<never> {
    throw new NotImplementedError('DELETE /agents/{id}');
  },
};
