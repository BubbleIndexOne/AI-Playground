import { SandboxPolicy } from '../protocol';

export function buildStorageGlobalsControlPreamble(policy: SandboxPolicy): string {
  const allowIndexedDb = Boolean(policy.allowIndexedDb);
  const allowCaches = Boolean(policy.allowCaches);

  return `
  const __allowIndexedDb = ${allowIndexedDb};
  const __allowCaches = ${allowCaches};

  const __origIndexedDB = globalThis.indexedDB;
  try {
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      get() {
        __recordCall({
          capability: 'storage:indexeddb',
          target: 'globalThis.indexedDB',
          method: 'ACCESS',
          allowed: __allowIndexedDb,
          timestamp: Date.now(),
        });
        if (!__allowIndexedDb) {
          throw new Error('Sandbox policy blocked access to indexedDB');
        }
        return __origIndexedDB;
      },
    });
  } catch {}

  const __origCaches = globalThis.caches;
  try {
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      get() {
        __recordCall({
          capability: 'storage:caches',
          target: 'globalThis.caches',
          method: 'ACCESS',
          allowed: __allowCaches,
          timestamp: Date.now(),
        });
        if (!__allowCaches) {
          throw new Error('Sandbox policy blocked access to Cache Storage API');
        }
        return __origCaches;
      },
    });
  } catch {}
  `;
}
