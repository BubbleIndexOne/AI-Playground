import { Activity, KeyRound, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../../api/http/errors';
import { ModelCredentialItem } from '../../../api/types/credentials';
import { ModelProvider } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Input,
  Tooltip,
  toast,
} from '../../../shared/ui';
import {
  formatDateTime,
  formatRelativeTime,
} from '../../../shared/utils/formatters';
import {
  useDeleteModelCredential,
  useSaveModelCredential,
  useTestModelCredential,
} from '../hooks/useModelCredentials';

interface ProviderCredentialRowProps {
  readonly provider: ModelProvider;
  readonly providerName: string;
  readonly credential: ModelCredentialItem | null;
}

export function ProviderCredentialRow({
  provider,
  providerName,
  credential,
}: ProviderCredentialRowProps) {
  const saveMutation = useSaveModelCredential();
  const deleteMutation = useDeleteModelCredential();
  const testMutation = useTestModelCredential();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [isReplacing, setIsReplacing] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [inlineError, setInlineError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      setApiKeyInput('');
    };
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setInlineError(null);
    setApiKeyInput('');

    try {
      const res = await saveMutation.mutateAsync({
        provider,
        apiKey: trimmed,
        verify: verifyBeforeSave,
      });
      setIsReplacing(false);
      toast.success(res.message);
    } catch (err) {
      setInlineError(err);
    }
  };

  const handleTest = async () => {
    setInlineError(null);
    try {
      const res = await testMutation.mutateAsync(provider);
      const latencySuffix =
        typeof res.details?.latencyMs === 'number'
          ? ` (${res.details.latencyMs} ms)`
          : '';
      toast.success(`${res.message}${latencySuffix}`);
    } catch (err) {
      setInlineError(err);
    }
  };

  const handleConfirmRemove = async () => {
    setInlineError(null);
    try {
      const res = await deleteMutation.mutateAsync(provider);
      setConfirmRemoveOpen(false);
      setIsReplacing(false);
      setApiKeyInput('');
      toast.success(res.message);
    } catch (err) {
      setConfirmRemoveOpen(false);
      setInlineError(err);
    }
  };

  const showForm = !credential || isReplacing;

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-lg border border-subtle bg-raised flex items-center justify-center text-secondary shrink-0">
            <KeyRound size={16} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-medium text-primary">
                {providerName}
              </span>
              {credential && (
                <Badge variant="success">
                  <ShieldCheck size={12} className="mr-1" />
                  Saved in encrypted vault
                </Badge>
              )}
            </div>

            {credential && (
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                <span className="font-mono text-primary">
                  {credential.preview ?? 'Saved key'}
                </span>
                <span aria-hidden="true">·</span>
                {credential.last_verified_at ? (
                  <Tooltip content={formatDateTime(credential.last_verified_at)}>
                    <span className="text-secondary underline decoration-dotted cursor-default">
                      Verified {formatRelativeTime(credential.last_verified_at)}
                    </span>
                  </Tooltip>
                ) : (
                  <span className="text-muted">Not verified</span>
                )}
              </div>
            )}
          </div>
        </div>

        {credential && !isReplacing && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={testMutation.isPending}
              icon={<Activity size={14} />}
              onClick={handleTest}
            >
              Test
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                setInlineError(null);
                setApiKeyInput('');
                setIsReplacing(true);
              }}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmRemoveOpen(true)}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {inlineError !== null && (
        <ErrorBanner
          error={
            inlineError instanceof ApiError || inlineError instanceof Error
              ? inlineError
              : new Error('Operation failed')
          }
          onDismiss={() => setInlineError(null)}
        />
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <Input
              type="password"
              required
              autoComplete="off"
              mono
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={`Enter ${providerName} API key`}
              aria-label={`${providerName} API key`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Checkbox
              checked={verifyBeforeSave}
              onChange={(checked) => setVerifyBeforeSave(checked)}
              label="Verify key before saving"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saveMutation.isPending}
              disabled={!apiKeyInput.trim()}
            >
              Save to encrypted vault
            </Button>

            {isReplacing && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsReplacing(false);
                  setApiKeyInput('');
                  setInlineError(null);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmRemoveOpen}
        title={`Remove ${providerName} key?`}
        description={`This removes your ${providerName} key from the encrypted vault.`}
        confirmLabel="Remove"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </div>
  );
}
