import { useState } from 'react';
import { ConnectorType } from '../../../domain/enums';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime } from '../../../shared/utils/formatters';
import { PostgresConnectorForm } from '../components/PostgresConnectorForm';
import { SlackConnectorForm } from '../components/SlackConnectorForm';
import { useConnectorMutations, useConnectorsQuery } from '../hooks/useConnectors';

export function ConnectorsPage() {
  const { data: connectors, isLoading, error } = useConnectorsQuery();
  const { deleteMutation } = useConnectorMutations();
  const [deleteTarget, setDeleteTarget] = useState<ConnectorType | null>(null);

  const configuredTypes = new Set((connectors ?? []).map((c) => c.type));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Connectors
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure Postgres and Slack integrations. Stored secrets are never returned or displayed.
        </p>
      </div>

      {error && <ErrorBanner error={error} title="Could not load connectors" />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Configured Connectors
        </h2>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
            Loading connectors from GET /connectors...
          </div>
        ) : !connectors || connectors.length === 0 ? (
          <EmptyState
            title="No connectors configured"
            description="Save Postgres or Slack credentials below to attach them to tools and agents."
          />
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {connectors.map((conn) => (
              <div
                key={conn.type}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {conn.type}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {conn.is_verified ? 'Verified' : 'Saved'}
                    </span>
                    {conn.updated_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Updated {formatDateTime(conn.updated_at)}
                        </span>
                      </>
                    )}
                    {conn.preview && Object.keys(conn.preview).length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          Preview: {JSON.stringify(conn.preview)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(conn.type)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-6">
        <PostgresConnectorForm
          isConfigured={configuredTypes.has(ConnectorType.Postgres)}
        />
        <SlackConnectorForm
          isConfigured={configuredTypes.has(ConnectorType.Slack)}
        />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget ?? ''} connector?`}
        description="This removes the stored credentials from the server via DELETE /connectors/{type}."
        confirmLabel="Delete Connector"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
