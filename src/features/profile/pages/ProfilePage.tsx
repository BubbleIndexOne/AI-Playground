import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime } from '../../../shared/utils/formatters';
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Account Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your identity, password, and session.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Sign Out (Local)
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
          Loading profile from GET /auth/me...
        </div>
      )}

      {error && (
        <div className="space-y-3">
          <ErrorBanner error={error} title="Could not load profile" />
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            Retry GET /auth/me
          </button>
        </div>
      )}

      {profile && (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {profile.display_name ||
                    [profile.first_name, profile.middle_name, profile.last_name]
                      .filter(Boolean)
                      .join(' ')}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{profile.email}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">ID: {profile.id}</span>
                  {profile.created_at && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Joined {formatDateTime(profile.created_at)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ProfileNameForm profile={profile} />
          <PasswordChangeForm />
          <DeleteAccountSection />
        </>
      )}
    </div>
  );
}
