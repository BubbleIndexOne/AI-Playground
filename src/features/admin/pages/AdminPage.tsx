import { useState } from 'react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { AdminToolReviewCard } from '../components/AdminToolReviewCard';
import {
  useAdminKeySession,
  useAdminMutations,
  useAdminQueueQuery,
} from '../hooks/useAdmin';

export function AdminPage() {
  const { hasAdminKey, adminAuthError, setAdminKey } = useAdminKeySession();
  const { data: registeredTools, isLoading, error } =
    useAdminQueueQuery(hasAdminKey);
  const { deleteUserMutation } = useAdminMutations();

  const [userIdToDelete, setUserIdToDelete] = useState('');
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);
  const [userDeletedNotice, setUserDeletedNotice] = useState<string | null>(
    null
  );

  const handleConfirmDeleteUser = async () => {
    const trimmed = userIdToDelete.trim();
    if (!trimmed) return;
    await deleteUserMutation.mutateAsync(trimmed);
    setConfirmUserOpen(false);
    setUserDeletedNotice(`User ${trimmed} deleted.`);
    setUserIdToDelete('');
  };

  if (!hasAdminKey) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {adminAuthError && (
          <ErrorBanner error={new Error(adminAuthError)} title="403 Forbidden" />
        )}
        <EmptyState
          title="Admin key required"
          description="Enter a valid x-admin-key in the navigation bar to access the review queue and user management."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Admin Review Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Authenticated via in-memory x-admin-key header only.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAdminKey(null)}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Clear In-Memory Admin Key
        </button>
      </div>

      {error && <ErrorBanner error={error} title="Admin queue request failed" />}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Tools Waiting for Review (status=registered)
        </h2>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
            Loading registered tools...
          </div>
        ) : !registeredTools || registeredTools.length === 0 ? (
          <EmptyState
            title="Review queue is empty"
            description="No tools currently have status=registered."
          />
        ) : (
          <div className="space-y-4">
            {registeredTools.map((tool) => (
              <AdminToolReviewCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
            Delete User by ID (DELETE /auth/users/&#123;id&#125;)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Permanently deletes a user account using the adminKey security scheme.
          </p>
        </div>

        {deleteUserMutation.error && (
          <ErrorBanner error={deleteUserMutation.error} />
        )}
        {userDeletedNotice && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {userDeletedNotice}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={userIdToDelete}
            onChange={(e) => setUserIdToDelete(e.target.value)}
            placeholder="Enter user ID..."
            className="flex-1 min-w-[240px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            disabled={!userIdToDelete.trim()}
            onClick={() => setConfirmUserOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            Delete User
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmUserOpen}
        title={`Delete user "${userIdToDelete.trim()}"?`}
        description="Calls DELETE /auth/users/{id} with x-admin-key. This action is permanent."
        confirmLabel="Delete User"
        isDestructive
        isPending={deleteUserMutation.isPending}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setConfirmUserOpen(false)}
      />
    </div>
  );
}
