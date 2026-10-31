import { LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  Card,
  CardGridSkeleton,
  PageHeader,
  Tooltip,
} from '../../../shared/ui';
import { formatDateTime, formatRelativeTime } from '../../../shared/utils/formatters';
import { useAuthMutations } from '../../auth/hooks/useAuth';
import { DeleteAccountSection } from '../components/DeleteAccountSection';
import { PasswordChangeForm } from '../components/PasswordChangeForm';
import { ProfileNameForm } from '../components/ProfileNameForm';
import { useProfileQuery } from '../hooks/useProfile';

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error, refetch } = useProfileQuery();
  const { logoutMutation } = useAuthMutations();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account details, password, and session."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </Button>
        }
      />

      {isLoading && <CardGridSkeleton count={2} />}

      {error && (
        <div className="space-y-3">
          <ErrorBanner error={error} title="Could not load profile" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      )}

      {profile && (
        <>
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-accent-tint text-accent border border-subtle flex items-center justify-center text-[15px] font-semibold">
                  {(
                    profile.display_name ||
                    profile.first_name ||
                    profile.email ||
                    'U'
                  )
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-[15px] font-semibold text-primary">
                    {profile.display_name ||
                      [profile.first_name, profile.middle_name, profile.last_name]
                        .filter(Boolean)
                        .join(' ')}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                    <span>{profile.email}</span>
                    {profile.created_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <Tooltip content={formatDateTime(profile.created_at)}>
                          <span className="text-muted underline decoration-dotted cursor-default">
                            Joined {formatRelativeTime(profile.created_at)}
                          </span>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <ProfileNameForm profile={profile} />
          <PasswordChangeForm />
          <DeleteAccountSection />
        </>
      )}
    </div>
  );
}
