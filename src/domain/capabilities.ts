export interface CapabilityDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly category: 'network' | 'storage' | 'compute';
}

export const TOOL_CAPABILITIES: readonly CapabilityDefinition[] = [
  {
    id: 'network:http_get',
    label: 'HTTP GET Requests',
    description: 'Allows outbound HTTP GET and HEAD requests via fetch or XMLHttpRequest.',
    category: 'network',
  },
  {
    id: 'network:http_post',
    label: 'HTTP Mutating Requests',
    description: 'Allows outbound POST, PUT, PATCH, and DELETE HTTP requests.',
    category: 'network',
  },
  {
    id: 'network:websocket',
    label: 'WebSocket Connections',
    description: 'Allows establishing outbound WebSocket connections.',
    category: 'network',
  },
  {
    id: 'network:eventsource',
    label: 'Server-Sent Events',
    description: 'Allows opening EventSource streams.',
    category: 'network',
  },
  {
    id: 'storage:indexeddb',
    label: 'IndexedDB Access',
    description: 'Allows reading and writing browser IndexedDB databases.',
    category: 'storage',
  },
  {
    id: 'storage:caches',
    label: 'Cache Storage API',
    description: 'Allows access to the Cache Storage API.',
    category: 'storage',
  },
] as const;

export type KnownCapabilityId = (typeof TOOL_CAPABILITIES)[number]['id'];
