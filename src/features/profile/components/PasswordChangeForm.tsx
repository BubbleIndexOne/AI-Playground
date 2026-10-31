import { FormEvent, useState } from 'react';
import { ChangePasswordSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useProfileMutations } from '../hooks/useProfile';

export function PasswordChangeForm() {
  const { changePasswordMutation } = useProfileMutations();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMsg(false);

    const parsed = ChangePasswordSchema.safeParse({
      current_password: currentPassword,
      new_password: newPassword,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    await changePasswordMutation.mutateAsync(parsed.data);
    setCurrentPassword('');
    setNewPassword('');
    setSuccessMsg(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Change Password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Separate password update via PATCH /auth/me (current_password + new_password).
        </p>
      </div>

      {validationError && <ErrorBanner error={new Error(validationError)} />}
      {changePasswordMutation.error && (
        <ErrorBanner
          error={changePasswordMutation.error}
          title="Password change failed"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Current password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            New password (min 8 characters)
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {successMsg ? 'Password updated.' : ''}
        </span>
        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
