const DB_NAME = 'agent_playground_db';
const DB_VERSION = 1;

export const STORES = {
  TOKENS: 'auth_tokens',
  CREDENTIALS: 'provider_credentials',
  AGENTS: 'agents',
  CHATS: 'chats',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openAppDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.TOKENS)) {
        db.createObjectStore(STORES.TOKENS);
      }
      if (!db.objectStoreNames.contains(STORES.CREDENTIALS)) {
        db.createObjectStore(STORES.CREDENTIALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.AGENTS)) {
        db.createObjectStore(STORES.AGENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatStore = db.createObjectStore(STORES.CHATS, { keyPath: 'id' });
        chatStore.createIndex('by_agent', 'agentId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });

  return dbPromise;
}

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
    req.onerror = () => reject(req.error ?? new Error(`IndexedDB error in ${storeName}`));
  });
}
