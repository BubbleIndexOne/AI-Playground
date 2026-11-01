import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../features/auth/hooks/useAuth';
import { useProfileQuery } from '../features/profile/hooks/useProfile';
import { Spinner } from '../shared/ui';

export function RequireAuth({ children }: { readonly children: ReactNode }) {
  const { isLoading: isSessionLoading, isAuthenticated } = useAuthSession();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfileQuery(isAuthenticated);
  const location = useLocation();

  if (
    isSessionLoading ||
    (isAuthenticated && isProfileLoading && !profile)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app text-[13px] text-secondary gap-2">
        <Spinner size={16} />
        <span>Loading workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated || (isProfileError && !profile)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuthSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app text-[13px] text-secondary gap-2">
        <Spinner size={16} />
        <span>Loading workspace...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}
