import { z } from 'zod';
import { ConnectorType } from '../domain/enums';
import { apiRequest } from './http/client';
import { ApiError } from './http/errors';
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
  z
    .object({ connectors: z.array(ConnectorMetadataSchema) })
    .transform((v) => v.connectors),
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

  async getByType(type: ConnectorType): Promise<ConnectorMetadata> {
    try {
      return await apiRequest({
        method: 'GET',
        path: `/connectors/${encodeURIComponent(type)}`,
        security: 'bearer',
        schema: ConnectorMetadataSchema,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const all = await connectorsApi.list();
        const match = all.find((c) => c.type === type);
        if (match) return match;
      }
      throw err;
    }
  },

  async save(
    type: ConnectorType,
    credentials: ConnectorCredentials,
    verify = false
  ): Promise<ConnectorMetadata> {
    const body = {
      ...credentials,
      credentials,
      verify,
    };
    const query = verify ? { verify: true } : undefined;
    try {
      const res = await apiRequest<Record<string, unknown>>({
        method: 'PUT',
        path: `/connectors/${encodeURIComponent(type)}/credentials`,
        query,
        body,
        security: 'bearer',
      });
      const parsed = ConnectorMetadataSchema.safeParse(res);
      return parsed.success ? parsed.data : { type };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const res = await apiRequest<Record<string, unknown>>({
          method: 'PUT',
          path: `/connectors/${encodeURIComponent(type)}`,
          query,
          body,
          security: 'bearer',
        });
        const parsed = ConnectorMetadataSchema.safeParse(res);
        return parsed.success ? parsed.data : { type };
      }
      throw err;
    }
  },

  test(
    type: ConnectorType,
    credentials?: ConnectorCredentials
  ): Promise<ConnectorTestResponse> {
    return apiRequest({
      method: 'POST',
      path: `/connectors/${encodeURIComponent(type)}/test`,
      body: credentials ? { ...credentials, credentials } : {},
      security: 'bearer',
      schema: ConnectorTestResponseSchema,
    });
  },

  async delete(type: ConnectorType): Promise<unknown> {
    try {
      return await apiRequest({
        method: 'DELETE',
        path: `/connectors/${encodeURIComponent(type)}/credentials`,
        security: 'bearer',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return apiRequest({
          method: 'DELETE',
          path: `/connectors/${encodeURIComponent(type)}`,
          security: 'bearer',
        });
      }
      throw err;
    }
  },
};
