import {
  deleteModelCredential,
  listModelCredentials,
  saveModelCredential,
  testModelCredential,
} from '../../../api/credentials.api';
import { ApiError } from '../../../api/http/errors';
import {
  DeleteModelCredentialResponse,
  ModelCredentialItem,
  SaveModelCredentialResponse,
  TestModelCredentialResponse,
} from '../../../api/types/credentials';
import { ModelProvider } from '../../../domain/providers';

export interface SaveModelCredentialInput {
  readonly provider: ModelProvider;
  readonly apiKey: string;
  readonly verify?: boolean;
}

export const credentialsService = {
  list(): Promise<ModelCredentialItem[]> {
    return listModelCredentials();
  },

  save(input: SaveModelCredentialInput): Promise<SaveModelCredentialResponse> {
    return saveModelCredential(
      input.provider,
      input.apiKey,
      input.verify ?? true
    );
  },

  async remove(
    provider: ModelProvider
  ): Promise<DeleteModelCredentialResponse> {
    try {
      return await deleteModelCredential(provider);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return {
          success: true,
          message: 'Key already removed',
        };
      }
      throw err;
    }
  },

  test(provider: ModelProvider): Promise<TestModelCredentialResponse> {
    return testModelCredential(provider);
  },
};
