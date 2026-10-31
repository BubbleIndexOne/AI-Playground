import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChangePasswordRequest,
  DeleteAccountRequest,
  UpdateProfileNamesRequest,
} from '../../../api/types/auth.types';
import { profileService } from '../services/profile.service';

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getProfile(),
    enabled,
    retry: false,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const updateNamesMutation = useMutation({
    mutationFn: (input: UpdateProfileNamesRequest) =>
      profileService.updateNames(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', 'me'], updated);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      profileService.changePassword(input),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (input: DeleteAccountRequest) =>
      profileService.deleteAccount(input),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    updateNamesMutation,
    changePasswordMutation,
    deleteAccountMutation,
  };
}
