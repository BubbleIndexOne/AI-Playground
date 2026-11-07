const DB_NAME = 'agent_playground_db';
const DB_VERSION = 2;

export const STORES = {
  TOKENS: 'auth_tokens',
  AGENTS: 'agents',
  CHATS: 'chats',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens and returns the local IndexedDB database connection.
 * Handles schema upgrades, cleans cached connection on errors or version collisions,
 * and rejects gracefully if another tab blocks a schema migration.
 *
 * @returns Promise resolving to the active IDBDatabase instance.
 */
export function openAppDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onblocked = () => {
      dbPromise = null;
      reject(
        new Error(
          'IndexedDB upgrade blocked by another open tab. Please close other tabs and reload.'
        )
      );
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.TOKENS)) {
        db.createObjectStore(STORES.TOKENS);
      }
      if (!db.objectStoreNames.contains(STORES.AGENTS)) {
        db.createObjectStore(STORES.AGENTS, { keyPath: 'id' });
      } else if (event.oldVersion < 2 && request.transaction) {
        const agentStore = request.transaction.objectStore(STORES.AGENTS);
        const cursorReq = agentStore.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          const value = cursor.value as Record<string, unknown>;
          if (value && typeof value === 'object' && 'credentialId' in value) {
            const { credentialId: _dropped, ...rest } = value;
            cursor.update(rest);
          }
          cursor.continue();
        };
      }
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatStore = db.createObjectStore(STORES.CHATS, { keyPath: 'id' });
        chatStore.createIndex('by_agent', 'agentId', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

/**
 * Runs a transactional operation against an IndexedDB object store.
 *
 * @param storeName Target object store name.
 * @param mode Transaction access mode ('readonly' or 'readwrite').
 * @param operation Callback that executes the store request.
 * @returns Promise resolving to the request result.
 */
export async function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openAppDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = operation(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error(`IndexedDB error in ${storeName}`));
  });
}
