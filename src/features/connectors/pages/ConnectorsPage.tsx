import { Database, MessageSquare, Play, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConnectorTestResponse } from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  CardGridSkeleton,
  CodeBlock,
  ConfirmDialog,
  Dialog,
  PageHeader,
  Tooltip,
  toast,
} from '../../../shared/ui';
import { formatDateTime, formatRelativeTime } from '../../../shared/utils/formatters';
import { PostgresConnectorForm } from '../components/PostgresConnectorForm';
import { SlackConnectorForm } from '../components/SlackConnectorForm';
import { useConnectorMutations, useConnectorsQuery } from '../hooks/useConnectors';

const CONNECTOR_ITEMS: ReadonlyArray<{
  type: ConnectorType;
  title: string;
  description: string;
}> = [
  {
    type: ConnectorType.Postgres,
    title: 'PostgreSQL',
    description: 'Connect relational databases for read and write tool queries.',
  },
  {
    type: ConnectorType.Slack,
    title: 'Slack',
    description: 'Send messages and interact with workspace channels.',
  },
];

export function ConnectorsPage() {
  const { data: connectors, isLoading, error } = useConnectorsQuery();
  const { deleteMutation, testMutation } = useConnectorMutations();

  const [configuringType, setConfiguringType] = useState<ConnectorType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectorType | null>(null);
  const [testResults, setTestResults] = useState<
    Partial<Record<ConnectorType, ConnectorTestResponse>>
  >({});

  const connectorByType = new Map((connectors ?? []).map((c) => [c.type, c]));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget);
    toast.success('Connector removed', `Removed ${deleteTarget} credentials.`);
    setDeleteTarget(null);
  };

  const handleTestStored = async (type: ConnectorType) => {
    const res = await testMutation.mutateAsync({ type });
    setTestResults((prev) => ({ ...prev, [type]: res }));
    if (res.ok) {
      toast.success('Connection verified', res.message ?? `${type} responded.`);
    } else {
      toast.error('Connection test failed', res.message ?? 'Check your credentials.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connectors"
        description="Configure external integrations for tools and agents. Secrets are never returned after saving."
      />

      {error && <ErrorBanner error={error} title="Could not load connectors" />}

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONNECTOR_ITEMS.map((item) => {
            const existing = connectorByType.get(item.type);
            const isConfigured = Boolean(existing);
            const previewEntries = existing?.preview
              ? Object.entries(existing.preview)
              : [];
            const testResult = testResults[item.type];

            return (
              <Card
                key={item.type}
                className="flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-subtle bg-raised flex items-center justify-center text-secondary shrink-0">
                        {item.type === ConnectorType.Postgres ? (
                          <Database className="w-5 h-5" />
                        ) : (
                          <MessageSquare className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-[15px] font-semibold text-primary">
                          {item.title}
                        </h2>
                        <p className="text-[12px] text-secondary">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isConfigured ? 'success' : 'neutral'}>
                      {isConfigured
                        ? existing?.is_verified
                          ? 'Configured · Verified'
                          : 'Configured'
                        : 'Not configured'}
                    </Badge>
                  </div>

                  {isConfigured && existing ? (
                    <div className="rounded-lg border border-subtle bg-app p-3 space-y-2">
                      {previewEntries.length > 0 ? (
                        <div className="text-[12px] font-mono text-primary break-all">
                          {JSON.stringify(existing.preview)}
                        </div>
                      ) : (
                        <div className="text-[12px] text-secondary">
                          Credentials saved.
                        </div>
                      )}
                      {existing.updated_at && (
                        <div className="text-[11px] text-muted">
                          Updated{' '}
                          <Tooltip content={formatDateTime(existing.updated_at)}>
                            <span className="underline decoration-dotted cursor-default">
                              {formatRelativeTime(existing.updated_at)}
                            </span>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-subtle p-3 text-[12px] text-muted">
                      No credentials stored for {item.title}.
                    </div>
                  )}

                  {testResult && (
                    <CodeBlock
                      code={JSON.stringify(testResult, null, 2)}
                      maxHeight="120px"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
                  <div>
                    {isConfigured && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item.type)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfigured && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTestStored(item.type)}
                        loading={testMutation.isPending}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Test
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={isConfigured ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => setConfiguringType(item.type)}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Configure
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={configuringType !== null}
        title={
          configuringType === ConnectorType.Postgres
            ? 'Configure PostgreSQL'
            : 'Configure Slack'
        }
        description="Stored secrets are encrypted and cleared from this form immediately after saving."
        maxWidth="xl"
        onClose={() => setConfiguringType(null)}
      >
        {configuringType === ConnectorType.Postgres && (
          <PostgresConnectorForm
            isConfigured={connectorByType.has(ConnectorType.Postgres)}
            onSaved={() => setConfiguringType(null)}
          />
        )}
        {configuringType === ConnectorType.Slack && (
          <SlackConnectorForm
            isConfigured={connectorByType.has(ConnectorType.Slack)}
            onSaved={() => setConfiguringType(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Remove ${deleteTarget ?? ''} connector?`}
        description="This permanently deletes the stored credentials for this integration."
        confirmLabel="Remove connector"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
