import { authApi } from '../../../api/auth.api';
import {
  AuthTokensResponse,
  LoginRequest,
  SignupRequest,
} from '../../../api/types/auth.types';
import { AuthTokens } from '../../../storage/interfaces/TokenStorage';
import { tokenStorage } from '../../../storage/local/IndexedDbTokenStorage';

export const authService = {
  async signup(input: SignupRequest): Promise<AuthTokensResponse> {
    const cleaned: SignupRequest = {
      email: input.email.trim(),
      password: input.password,
      first_name: input.first_name.trim(),
      ...(input.middle_name?.trim() ? { middle_name: input.middle_name.trim() } : {}),
      ...(input.last_name?.trim() ? { last_name: input.last_name.trim() } : {}),
      ...(input.display_name?.trim() ? { display_name: input.display_name.trim() } : {}),
    };
    const response = await authApi.signup(cleaned);
    if (response.accessToken) {
      await tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  },

  async login(input: LoginRequest): Promise<AuthTokensResponse> {
    const response = await authApi.login({
      email: input.email.trim(),
      password: input.password,
    });
    if (response.accessToken) {
      await tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  },

  async logout(): Promise<void> {
    await tokenStorage.clearTokens();
  },

  getTokens(): Promise<AuthTokens | null> {
    return tokenStorage.getTokens();
  },

  subscribeTokens(listener: (tokens: AuthTokens | null) => void): () => void {
    return tokenStorage.subscribe(listener);
  },
};
