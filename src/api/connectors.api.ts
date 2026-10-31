import { z } from 'zod';
import { ConnectorType } from '../domain/enums';
import { apiRequest } from './http/client';
import {
  ConnectorCredentials,
  ConnectorMetadata,
  ConnectorMetadataSchema,
  ConnectorTestResponse,
  ConnectorTestResponseSchema,
} from './types/connectors.types';

const ConnectorListResponseSchema = z.union([
  z.array(ConnectorMetadataSchema),
  z.object({ items: z.array(ConnectorMetadataSchema) }).transform((v) => v.items),
  z.object({ data: z.array(ConnectorMetadataSchema) }).transform((v) => v.data),
  z.object({ connectors: z.array(ConnectorMetadataSchema) }).transform((v) => v.connectors),
]);

export const connectorsApi = {
  list(): Promise<ConnectorMetadata[]> {
    return apiRequest({
      method: 'GET',
      path: '/connectors',
      security: 'bearer',
      schema: ConnectorListResponseSchema,
    });
  },

  getByType(type: ConnectorType): Promise<ConnectorMetadata> {
    return apiRequest({
      method: 'GET',
      path: `/connectors/${encodeURIComponent(type)}`,
      security: 'bearer',
      schema: ConnectorMetadataSchema,
    });
  },

  save(
    type: ConnectorType,
    credentials: ConnectorCredentials,
    verify = false
  ): Promise<ConnectorMetadata> {
    return apiRequest({
      method: 'PUT',
      path: `/connectors/${encodeURIComponent(type)}`,
      query: verify ? { verify: true } : undefined,
      body: {
        ...credentials,
        credentials,
        verify,
      },
      security: 'bearer',
      schema: ConnectorMetadataSchema,
    });
  },

  test(
    type: ConnectorType,
    credentials?: ConnectorCredentials
  ): Promise<ConnectorTestResponse> {
    return apiRequest({
      method: 'POST',
      path: `/connectors/${encodeURIComponent(type)}/test`,
      body: credentials
        ? { ...credentials, credentials }
        : {},
      security: 'bearer',
      schema: ConnectorTestResponseSchema,
    });
  },

  delete(type: ConnectorType): Promise<unknown> {
    return apiRequest({
      method: 'DELETE',
      path: `/connectors/${encodeURIComponent(type)}`,
      security: 'bearer',
    });
  },
};
