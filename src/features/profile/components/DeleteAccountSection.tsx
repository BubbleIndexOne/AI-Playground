import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useProfileMutations } from '../hooks/useProfile';

export function DeleteAccountSection() {
  const navigate = useNavigate();
  const { deleteAccountMutation } = useProfileMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleConfirmDelete = async () => {
    if (!password.trim()) return;
    try {
      await deleteAccountMutation.mutateAsync({ password });
      setDialogOpen(false);
      navigate('/auth/login', { replace: true });
    } catch {
      // Displayed in dialog
    }
  };

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
            Delete Account
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Permanently delete your account via DELETE /auth/me with password confirmation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPassword('');
            setDialogOpen(true);
          }}
          className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Delete Account
        </button>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Delete your account?"
        description="This action permanently deletes your account. Enter your password to confirm."
        confirmLabel="Delete Account"
        isDestructive
        isPending={deleteAccountMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogOpen(false)}
      >
        <div className="space-y-3">
          {deleteAccountMutation.error && (
            <ErrorBanner error={deleteAccountMutation.error} />
          )}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
