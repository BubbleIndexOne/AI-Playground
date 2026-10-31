import {
  CredentialStore,
  ProviderCredential,
  SaveCredentialInput,
} from '../interfaces/CredentialStore';
import { runTransaction, STORES } from './idbHelper';

export class IndexedDbCredentialStore implements CredentialStore {
  async list(): Promise<ProviderCredential[]> {
    const items = await runTransaction<ProviderCredential[]>(
      STORES.CREDENTIALS,
      'readonly',
      (store) => store.getAll()
    );
    return (items ?? []).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  async get(id: string): Promise<ProviderCredential | null> {
    const item = await runTransaction<ProviderCredential | undefined>(
      STORES.CREDENTIALS,
      'readonly',
      (store) => store.get(id)
    );
    return item ?? null;
  }

  async save(input: SaveCredentialInput): Promise<ProviderCredential> {
    const now = new Date().toISOString();
    const existing = input.id ? await this.get(input.id) : null;

    const record: ProviderCredential = {
      id: existing?.id ?? input.id ?? crypto.randomUUID(),
      label: input.label.trim(),
      provider: input.provider,
      apiKey: input.apiKey.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await runTransaction(STORES.CREDENTIALS, 'readwrite', (store) =>
      store.put(record)
    );
    return record;
  }

  async delete(id: string): Promise<void> {
    await runTransaction(STORES.CREDENTIALS, 'readwrite', (store) =>
      store.delete(id)
    );
  }
}

export const credentialStore: CredentialStore = new IndexedDbCredentialStore();
