import { saveModelCredential } from '../../../api/credentials.api';
import { isModelProvider, ModelProvider } from '../../../domain/providers';
import { openAppDatabase } from '../../../storage/local/idbHelper';

const LEGACY_CREDENTIALS_STORE = 'provider_credentials';

export interface LegacyCredentialRecord {
  readonly id?: string;
  readonly label?: string;
  readonly provider: ModelProvider;
  readonly apiKey: string;
  readonly updatedAt?: string;
}

export interface LegacyCredentialAdapter {
  readAll(): Promise<LegacyCredentialRecord[]>;
  wipeAll(): Promise<void>;
}

export const indexedDbLegacyCredentialAdapter: LegacyCredentialAdapter = {
  async readAll(): Promise<LegacyCredentialRecord[]> {
    if (typeof indexedDB === 'undefined') return [];
    const db = await openAppDatabase();
    if (!db.objectStoreNames.contains(LEGACY_CREDENTIALS_STORE)) {
      return [];
    }

    const rawItems = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(LEGACY_CREDENTIALS_STORE, 'readonly');
      const store = tx.objectStore(LEGACY_CREDENTIALS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () =>
        reject(req.error ?? new Error('Failed to read legacy credentials'));
    });

    const valid: LegacyCredentialRecord[] = [];
    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      if (
        isModelProvider(obj.provider) &&
        typeof obj.apiKey === 'string' &&
        obj.apiKey.trim().length > 0
      ) {
        valid.push({
          id: typeof obj.id === 'string' ? obj.id : undefined,
          label: typeof obj.label === 'string' ? obj.label : undefined,
          provider: obj.provider,
          apiKey: obj.apiKey.trim(),
          updatedAt:
            typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
        });
      }
    }

    // Deduplicate by provider, keeping most recently updated first
    valid.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    const byProvider = new Map<ModelProvider, LegacyCredentialRecord>();
    for (const rec of valid) {
      if (!byProvider.has(rec.provider)) {
        byProvider.set(rec.provider, rec);
      }
    }

    return Array.from(byProvider.values());
  },

  async wipeAll(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const db = await openAppDatabase();
    if (!db.objectStoreNames.contains(LEGACY_CREDENTIALS_STORE)) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LEGACY_CREDENTIALS_STORE, 'readwrite');
      const store = tx.objectStore(LEGACY_CREDENTIALS_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () =>
        reject(req.error ?? new Error('Failed to wipe legacy credentials'));
    });
  },
};

export interface MigrationResult {
  readonly migratedProviders: readonly ModelProvider[];
  readonly errors: readonly {
    readonly provider: ModelProvider;
    readonly message: string;
  }[];
}

export async function checkLegacyCredentials(
  adapter: LegacyCredentialAdapter = indexedDbLegacyCredentialAdapter
): Promise<LegacyCredentialRecord[]> {
  return adapter.readAll();
}

export async function migrateLegacyCredentialsToVault(options?: {
  readonly adapter?: LegacyCredentialAdapter;
  readonly saveFn?: typeof saveModelCredential;
}): Promise<MigrationResult> {
  const adapter = options?.adapter ?? indexedDbLegacyCredentialAdapter;
  const saveFn = options?.saveFn ?? saveModelCredential;

  const records = await adapter.readAll();
  const migratedProviders: ModelProvider[] = [];
  const errors: { provider: ModelProvider; message: string }[] = [];

  try {
    for (const record of records) {
      try {
        await saveFn(record.provider, record.apiKey, true);
        migratedProviders.push(record.provider);
      } catch (err) {
        errors.push({
          provider: record.provider,
          message:
            err instanceof Error
              ? err.message
              : `Failed to migrate ${record.provider} key`,
        });
      }
    }
  } finally {
    await adapter.wipeAll();
  }

  return { migratedProviders, errors };
}

export async function declineLegacyCredentialsMigration(
  adapter: LegacyCredentialAdapter = indexedDbLegacyCredentialAdapter
): Promise<void> {
  await adapter.wipeAll();
}
