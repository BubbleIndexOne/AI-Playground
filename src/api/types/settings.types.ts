import { z } from 'zod';
import { ThemePreference } from '../../shared/ui/theme/tokens';

export const UserSettingsSchema = z.object({
  user_id: z.string(),
  theme: z.enum(['system', 'light', 'dark']),
  extra: z.record(z.string(), z.unknown()).default({}),
  updated_at: z.string().optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const GetUserSettingsResponseSchema = z.object({
  success: z.boolean(),
  settings: UserSettingsSchema,
});

export interface UpdateUserSettingsInput {
  readonly theme?: ThemePreference;
  readonly extra?: Record<string, unknown>;
}
