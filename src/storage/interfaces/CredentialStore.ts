import { AIProvider } from '../../domain/providers';

export interface ProviderCredential {
  readonly id: string;
  readonly label: string;
  readonly provider: AIProvider;
  readonly apiKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SaveCredentialInput {
  readonly id?: string;
  readonly label: string;
  readonly provider: AIProvider;
  readonly apiKey: string;
}

export interface CredentialStore {
  list(): Promise<ProviderCredential[]>;
  get(id: string): Promise<ProviderCredential | null>;
  save(input: SaveCredentialInput): Promise<ProviderCredential>;
  delete(id: string): Promise<void>;
}
