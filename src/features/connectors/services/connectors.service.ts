import { connectorsApi } from '../../../api/connectors.api';
import {
  ConnectorCredentials,
  ConnectorMetadata,
  ConnectorTestResponse,
} from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';

export const connectorsService = {
  list(): Promise<ConnectorMetadata[]> {
    return connectorsApi.list();
  },

  getByType(type: ConnectorType): Promise<ConnectorMetadata> {
    return connectorsApi.getByType(type);
  },

  save(
    type: ConnectorType,
    credentials: ConnectorCredentials,
    verify: boolean
  ): Promise<ConnectorMetadata> {
    return connectorsApi.save(type, credentials, verify);
  },

  test(
    type: ConnectorType,
    credentials?: ConnectorCredentials
  ): Promise<ConnectorTestResponse> {
    return connectorsApi.test(type, credentials);
  },

  delete(type: ConnectorType): Promise<unknown> {
    return connectorsApi.delete(type);
  },
};
