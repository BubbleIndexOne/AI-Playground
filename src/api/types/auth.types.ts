import { z } from 'zod';

const RawUserProfileSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    first_name: z.string(),
    middle_name: z.string().nullish(),
    last_name: z.string().nullish(),
    display_name: z.string().nullish(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const UserProfileSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>;
    if (rec.user && typeof rec.user === 'object' && !Array.isArray(rec.user)) {
      return rec.user;
    }
    if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      return rec.data;
    }
  }
  return val;
}, RawUserProfileSchema);

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthTokensResponseSchema = z
  .object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    user: UserProfileSchema.optional(),
  })
  .passthrough()
  .transform((val) => ({
    accessToken: val.accessToken ?? val.access_token ?? '',
    refreshToken: val.refreshToken ?? val.refresh_token ?? '',
    user: val.user,
  }));

export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UpdateProfileNamesSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
});

export type UpdateProfileNamesRequest = z.infer<typeof UpdateProfileNamesSchema>;

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required'),
});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountSchema>;
