import { env } from '../config/env';
import { ErrorBanner } from '../shared/components/ErrorBanner';
import { useHealthCheckMutation } from '../shared/hooks/useHealthCheck';

interface SettingsModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpenAdminKeyDialog: () => void;
  readonly hasAdminKey: boolean;
}

export function SettingsModal({
  open,
  onClose,
  onOpenAdminKeyDialog,
  hasAdminKey,
}: SettingsModalProps) {
  const healthMutation = useHealthCheckMutation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Workspace Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>
            API Base URL (<code className="font-mono">VITE_API_BASE_URL</code>):{' '}
            <code className="font-mono text-slate-900 dark:text-slate-100">
              {env.apiBaseUrl || '(relative to origin)'}
            </code>
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                On-Demand Backend Health Check
              </h3>
              <p className="text-xs text-slate-500">
                Calls GET /health and displays the raw response.
              </p>
            </div>
            <button
              type="button"
              onClick={() => healthMutation.mutate()}
              disabled={healthMutation.isPending}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg whitespace-nowrap shrink-0"
            >
              {healthMutation.isPending ? 'Checking...' : 'Run health check'}
            </button>
          </div>

          {healthMutation.error && (
            <ErrorBanner error={healthMutation.error} title="Health check failed" />
          )}

          {healthMutation.data !== undefined && (
            <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono overflow-x-auto">
              {JSON.stringify(healthMutation.data, null, 2)}
            </pre>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Admin Session Key (x-admin-key)
            </h3>
            <p className="text-xs text-slate-500">
              {hasAdminKey
                ? 'Admin key is currently active in memory.'
                : 'Enter an admin key to reveal the Admin navigation item.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdminKeyDialog();
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
          >
            {hasAdminKey ? 'Update Admin Key' : 'Enter Admin Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
