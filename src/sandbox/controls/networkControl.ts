import { SandboxPolicy } from '../protocol';

export function buildNetworkControlPreamble(policy: SandboxPolicy): string {
  const networkEnabled = Boolean(policy.networkEnabled);
  const allowedDomainsJson = JSON.stringify(
    policy.allowedDomains.map((d) => d.trim().toLowerCase()).filter(Boolean)
  );

  return `
  const __networkEnabled = ${networkEnabled};
  const __allowedDomains = ${allowedDomainsJson};

  function __isDomainAllowed(urlStr) {
    if (!__networkEnabled) return false;
    try {
      const parsed = new URL(String(urlStr), 'https://sandbox.invalid');
      const host = parsed.hostname.toLowerCase();
      if (__allowedDomains.length === 0) return false;
      return __allowedDomains.some((d) => host === d || host.endsWith('.' + d));
    } catch {
      return false;
    }
  }

  const __origFetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;
  globalThis.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
    const method = (init && init.method ? String(init.method) : 'GET').toUpperCase();
    const cap = (method === 'GET' || method === 'HEAD') ? 'network:http_get' : 'network:http_post';
    const allowed = __isDomainAllowed(url);
    __recordCall({ capability: cap, target: url, method, allowed, timestamp: Date.now() });
    if (!allowed || !__origFetch) {
      throw new Error('Sandbox network policy blocked fetch to ' + url);
    }
    return __origFetch(input, init);
  };

  if (typeof globalThis.XMLHttpRequest !== 'undefined') {
    const __OrigXHR = globalThis.XMLHttpRequest;
    globalThis.XMLHttpRequest = class PatchedXHR extends __OrigXHR {
      open(method, url, ...rest) {
        const m = String(method || 'GET').toUpperCase();
        const cap = (m === 'GET' || m === 'HEAD') ? 'network:http_get' : 'network:http_post';
        const allowed = __isDomainAllowed(url);
        __recordCall({ capability: cap, target: String(url), method: m, allowed, timestamp: Date.now() });
        if (!allowed) {
          throw new Error('Sandbox network policy blocked XMLHttpRequest to ' + url);
        }
        return super.open(method, url, ...rest);
      }
    };
  }

  if (typeof globalThis.WebSocket !== 'undefined') {
    const __OrigWS = globalThis.WebSocket;
    globalThis.WebSocket = class PatchedWebSocket extends __OrigWS {
      constructor(url, protocols) {
        const allowed = __isDomainAllowed(url);
        __recordCall({ capability: 'network:websocket', target: String(url), method: 'WS', allowed, timestamp: Date.now() });
        if (!allowed) {
          throw new Error('Sandbox network policy blocked WebSocket to ' + url);
        }
        super(url, protocols);
      }
    };
  }

  if (typeof globalThis.EventSource !== 'undefined') {
    const __OrigES = globalThis.EventSource;
    globalThis.EventSource = class PatchedEventSource extends __OrigES {
      constructor(url, init) {
        const allowed = __isDomainAllowed(url);
        __recordCall({ capability: 'network:eventsource', target: String(url), method: 'SSE', allowed, timestamp: Date.now() });
        if (!allowed) {
          throw new Error('Sandbox network policy blocked EventSource to ' + url);
        }
        super(url, init);
      }
    };
  }

  globalThis.importScripts = function(...urls) {
    __recordCall({ capability: 'network:import_scripts', target: urls.join(','), method: 'IMPORT', allowed: false, timestamp: Date.now() });
    throw new Error('Sandbox policy blocks importScripts inside module worker');
  };
  `;
}
