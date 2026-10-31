import { KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { AI_PROVIDERS, AIProvider } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  TableSkeleton,
  Tooltip,
  toast,
} from '../../../shared/ui';
import {
  formatDateTime,
  formatRelativeTime,
  maskApiKey,
} from '../../../shared/utils/formatters';
import { ProviderCredential } from '../../../storage/interfaces/CredentialStore';
import {
  useCredentialMutations,
  useCredentialsQuery,
} from '../hooks/useCredentials';

export function CredentialsPage() {
  const { data: credentials, isLoading, error } = useCredentialsQuery();
  const { saveMutation, deleteMutation } = useCredentialMutations();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState<AIProvider>(AIProvider.Anthropic);
  const [apiKey, setApiKey] = useState('');

  const [replacingCred, setReplacingCred] = useState<ProviderCredential | null>(
    null
  );
  const [replacementKey, setReplacementKey] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProviderCredential | null>(
    null
  );

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !apiKey.trim()) return;
    await saveMutation.mutateAsync({
      label: label.trim(),
      provider,
      apiKey: apiKey.trim(),
    });
    toast.success('API key saved', `Added key "${label.trim()}".`);
    setLabel('');
    setApiKey('');
    setAddModalOpen(false);
  };

  const handleReplaceKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!replacingCred || !replacementKey.trim()) return;
    await saveMutation.mutateAsync({
      id: replacingCred.id,
      label: replacingCred.label,
      provider: replacingCred.provider,
      apiKey: replacementKey.trim(),
    });
    toast.success('API key replaced', `Updated key for "${replacingCred.label}".`);
    setReplacingCred(null);
    setReplacementKey('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast.success('API key deleted', `Removed "${deleteTarget.label}".`);
    setDeleteTarget(null);
  };

  const hasCredentials = Boolean(credentials && credentials.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Keys are stored in this browser and never sent to the Agent Playground server."
        actions={
          hasCredentials ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add key
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : !credentials || credentials.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="w-5 h-5" />}
          title="No provider API keys saved"
          description="Add an Anthropic, OpenAI, or Google Gemini API key to run agents in your browser."
          actionLabel="Add key"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <Card padding="none" className="divide-y divide-subtle overflow-hidden">
          {credentials.map((cred) => {
            const providerMeta = AI_PROVIDERS.find((p) => p.id === cred.provider);
            return (
              <div
                key={cred.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-hover/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg border border-subtle bg-raised flex items-center justify-center text-[13px] font-semibold text-primary shrink-0 uppercase">
                    {cred.provider.slice(0, 2)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-primary truncate">
                        {cred.label}
                      </span>
                      <Badge variant="neutral" mono>
                        {providerMeta?.name ?? cred.provider}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                      <span className="font-mono text-muted">
                        {maskApiKey(cred.apiKey)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <Tooltip content={formatDateTime(cred.updatedAt)}>
                        <span className="text-muted underline decoration-dotted cursor-default">
                          Updated {formatRelativeTime(cred.updatedAt)}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setReplacingCred(cred);
                      setReplacementKey('');
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                    onClick={() => setDeleteTarget(cred)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Dialog
        open={addModalOpen}
        title="Add provider API key"
        description="Keys are stored in this browser and never sent to the Agent Playground server."
        maxWidth="md"
        onClose={() => setAddModalOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Label" htmlFor="cred-label" required>
            <Input
              id="cred-label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Personal Anthropic key"
            />
          </FormField>

          <FormField label="Provider" htmlFor="cred-provider" required>
            <Select
              id="cred-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="API key" htmlFor="cred-key" required>
            <Input
              id="cred-key"
              type="password"
              required
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              mono
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveMutation.isPending}
            >
              Save key
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={replacingCred !== null}
        title={`Replace key for "${replacingCred?.label ?? ''}"`}
        description={
          replacingCred
            ? `Current key: ${maskApiKey(replacingCred.apiKey)}`
            : undefined
        }
        maxWidth="md"
        onClose={() => setReplacingCred(null)}
      >
        <form onSubmit={handleReplaceKey} className="space-y-4">
          <FormField label="New API key" htmlFor="replace-key-input" required>
            <Input
              id="replace-key-input"
              type="password"
              required
              autoComplete="off"
              value={replacementKey}
              onChange={(e) => setReplacementKey(e.target.value)}
              placeholder="Enter new API key…"
              mono
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReplacingCred(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveMutation.isPending}
            >
              Replace key
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete key "${deleteTarget?.label ?? ''}"?`}
        description="This removes the API key from your browser storage."
        confirmLabel="Delete key"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
