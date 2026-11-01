import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LoginRequest, SignupRequest } from '../../../api/types/auth.types';
import { AuthTokens } from '../../../storage/interfaces/TokenStorage';
import { authService } from '../services/auth.service';

export function useAuthSession() {
  const [tokens, setTokens] = useState<AuthTokens | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    authService.getTokens().then((initial) => {
      if (mounted) setTokens(initial);
    });
    const unsubscribe = authService.subscribeTokens((next) => {
      if (mounted) setTokens(next);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    isLoading: tokens === undefined,
    isAuthenticated: Boolean(tokens?.accessToken),
    tokens: tokens ?? null,
  };
}

export function useAuthMutations() {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (input: LoginRequest) => authService.login(input),
    onSuccess: (res) => {
      if (res.user) {
        queryClient.setQueryData(['profile', 'me'], res.user);
      } else {
        queryClient.removeQueries({ queryKey: ['profile', 'me'] });
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: (input: SignupRequest) => authService.signup(input),
    onSuccess: (res) => {
      if (res.user) {
        queryClient.setQueryData(['profile', 'me'], res.user);
      } else {
        queryClient.removeQueries({ queryKey: ['profile', 'me'] });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    loginMutation,
    signupMutation,
    logoutMutation,
  };
}
