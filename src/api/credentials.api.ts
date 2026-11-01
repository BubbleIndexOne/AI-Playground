import { ModelProvider } from '../domain/providers';
import { apiRequest } from './http/client';
import {
  DeleteModelCredentialResponse,
  DeleteModelCredentialResponseSchema,
  ListModelCredentialsResponse,
  ListModelCredentialsResponseSchema,
  ModelCredentialItem,
  SaveModelCredentialResponse,
  SaveModelCredentialResponseSchema,
  TestModelCredentialResponse,
  TestModelCredentialResponseSchema,
} from './types/credentials';

export async function listModelCredentials(): Promise<ModelCredentialItem[]> {
  const res = await apiRequest<ListModelCredentialsResponse>({
    method: 'GET',
    path: '/credentials/models',
    security: 'bearer',
    schema: ListModelCredentialsResponseSchema,
  });
  return res.credentials;
}

export async function saveModelCredential(
  provider: ModelProvider,
  apiKey: string,
  verify = true
): Promise<SaveModelCredentialResponse> {
  return apiRequest<SaveModelCredentialResponse>({
    method: 'PUT',
    path: `/credentials/models/${encodeURIComponent(provider)}`,
    query: { verify },
    body: { apiKey },
    security: 'bearer',
    schema: SaveModelCredentialResponseSchema,
  });
}

export async function deleteModelCredential(
  provider: ModelProvider
): Promise<DeleteModelCredentialResponse> {
  return apiRequest<DeleteModelCredentialResponse>({
    method: 'DELETE',
    path: `/credentials/models/${encodeURIComponent(provider)}`,
    security: 'bearer',
    schema: DeleteModelCredentialResponseSchema,
  });
}

export async function testModelCredential(
  provider: ModelProvider
): Promise<TestModelCredentialResponse> {
  return apiRequest<TestModelCredentialResponse>({
    method: 'POST',
    path: `/credentials/models/${encodeURIComponent(provider)}/test`,
    body: {},
    security: 'bearer',
    schema: TestModelCredentialResponseSchema,
  });
}

export const credentialsApi = {
  listModelCredentials,
  saveModelCredential,
  deleteModelCredential,
  testModelCredential,
};
