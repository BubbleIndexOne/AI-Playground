import { apiRequest } from './http/client';
import {
  GetUserSettingsResponseSchema,
  UpdateUserSettingsInput,
  UserSettings,
} from './types/settings.types';

export const settingsApi = {
  async getSettings(): Promise<UserSettings> {
    const res = await apiRequest({
      method: 'GET',
      path: '/users/me/settings',
      security: 'bearer',
      schema: GetUserSettingsResponseSchema,
    });
    return res.settings;
  },

  async updateSettings(body: UpdateUserSettingsInput): Promise<UserSettings> {
    const res = await apiRequest({
      method: 'PATCH',
      path: '/users/me/settings',
      body,
      security: 'bearer',
      schema: GetUserSettingsResponseSchema,
    });
    return res.settings;
  },
};
