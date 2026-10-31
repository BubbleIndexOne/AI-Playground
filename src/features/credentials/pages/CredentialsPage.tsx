import { FormEvent, useState } from 'react';
import { AI_PROVIDERS, AIProvider } from '../../../domain/providers';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime, maskApiKey } from '../../../shared/utils/formatters';
import { ProviderCredential } from '../../../storage/interfaces/CredentialStore';
import {
  useCredentialMutations,
  useCredentialsQuery,
} from '../hooks/useCredentials';

export function CredentialsPage() {
  const { data: credentials, isLoading, error } = useCredentialsQuery();
  const { saveMutation, deleteMutation } = useCredentialMutations();

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
    setLabel('');
    setApiKey('');
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
    setReplacingCred(null);
    setReplacementKey('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          BYOK Provider API Keys
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Stored locally in IndexedDB behind the CredentialStore interface. Keys are never sent to the Agent Playground API.
        </p>
      </div>

      {error && <ErrorBanner error={error} />}

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Add Provider Key
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Label *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Personal Anthropic Key"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Provider *
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              API Key *
            </label>
            <input
              type="password"
              required
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors"
          >
            Save API Key Locally
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Saved Credentials
        </h2>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading credentials...</div>
        ) : !credentials || credentials.length === 0 ? (
          <EmptyState
            title="No provider API keys saved"
            description="Add an Anthropic, OpenAI, or Google Gemini API key above to run agents directly from your browser."
          />
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cred.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{cred.provider}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{maskApiKey(cred.apiKey)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Updated {formatDateTime(cred.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingCred(cred);
                      setReplacementKey('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Replace Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cred)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {replacingCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleReplaceKey}
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Replace API Key for &quot;{replacingCred.label}&quot;
              </h3>
              <p className="text-xs text-slate-500">
                Current masked key: <code className="font-mono">{maskApiKey(replacingCred.apiKey)}</code>
              </p>
            </div>
            <input
              type="password"
              required
              autoComplete="off"
              value={replacementKey}
              onChange={(e) => setReplacementKey(e.target.value)}
              placeholder="Enter new API key..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplacingCred(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
              >
                Save New Key
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete credential "${deleteTarget?.label ?? ''}"?`}
        description="Removes this API key from local IndexedDB storage."
        confirmLabel="Delete Key"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
