import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect } from 'react';
import {
  applyThemePreference,
  getThemePreference,
  ToastViewport,
} from '../shared/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    applyThemePreference(getThemePreference());
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (getThemePreference() === 'system') {
        applyThemePreference('system');
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  );
}
