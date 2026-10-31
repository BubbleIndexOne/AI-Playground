import {
  ProviderCredential,
  SaveCredentialInput,
} from '../../../storage/interfaces/CredentialStore';
import { credentialStore } from '../../../storage/local/IndexedDbCredentialStore';

export const credentialsService = {
  list(): Promise<ProviderCredential[]> {
    return credentialStore.list();
  },

  get(id: string): Promise<ProviderCredential | null> {
    return credentialStore.get(id);
  },

  save(input: SaveCredentialInput): Promise<ProviderCredential> {
    return credentialStore.save(input);
  },

  delete(id: string): Promise<void> {
    return credentialStore.delete(id);
  },
};
