import { apiRequest } from './http/client';
import {
  AuthTokensResponse,
  AuthTokensResponseSchema,
  ChangePasswordRequest,
  DeleteAccountRequest,
  LoginRequest,
  SignupRequest,
  UpdateProfileNamesRequest,
  UserProfile,
  UserProfileSchema,
} from './types/auth.types';

export const authApi = {
  signup(body: SignupRequest): Promise<AuthTokensResponse> {
    return apiRequest({
      method: 'POST',
      path: '/auth/signup',
      body,
      security: 'none',
      schema: AuthTokensResponseSchema,
    });
  },

  login(body: LoginRequest): Promise<AuthTokensResponse> {
    return apiRequest({
      method: 'POST',
      path: '/auth/login',
      body,
      security: 'none',
      schema: AuthTokensResponseSchema,
    });
  },

  getMe(): Promise<UserProfile> {
    return apiRequest({
      method: 'GET',
      path: '/auth/me',
      security: 'bearer',
      schema: UserProfileSchema,
    });
  },

  updateProfileNames(body: UpdateProfileNamesRequest): Promise<UserProfile> {
    return apiRequest({
      method: 'PATCH',
      path: '/auth/me',
      body,
      security: 'bearer',
      schema: UserProfileSchema,
    });
  },

  changePassword(body: ChangePasswordRequest): Promise<unknown> {
    return apiRequest({
      method: 'PATCH',
      path: '/auth/me',
      body,
      security: 'bearer',
    });
  },

  deleteMe(body: DeleteAccountRequest): Promise<unknown> {
    return apiRequest({
      method: 'DELETE',
      path: '/auth/me',
      body,
      security: 'bearer',
    });
  },

  adminDeleteUser(userId: string): Promise<unknown> {
    return apiRequest({
      method: 'DELETE',
      path: `/auth/users/${encodeURIComponent(userId)}`,
      security: 'adminKey',
    });
  },
};
