import { authApi } from '../../../api/auth.api';
import {
  ChangePasswordRequest,
  DeleteAccountRequest,
  UpdateProfileNamesRequest,
  UserProfile,
} from '../../../api/types/auth.types';
import { tokenStorage } from '../../../storage/local/IndexedDbTokenStorage';

export const profileService = {
  getProfile(): Promise<UserProfile> {
    return authApi.getMe();
  },

  updateNames(input: UpdateProfileNamesRequest): Promise<UserProfile> {
    return authApi.updateProfileNames(input);
  },

  changePassword(input: ChangePasswordRequest): Promise<unknown> {
    return authApi.changePassword(input);
  },

  async deleteAccount(input: DeleteAccountRequest): Promise<void> {
    await authApi.deleteMe(input);
    await tokenStorage.clearTokens();
  },
};
