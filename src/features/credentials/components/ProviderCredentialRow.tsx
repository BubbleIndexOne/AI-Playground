import {
  Activity,
  AlertTriangle,
  HelpCircle,
  KeyRound,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../../api/http/errors';
import { ModelCredentialItem } from '../../../api/types/credentials';
import { ModelProvider } from '../../../domain/providers';
import {
  clearSessionKey,
  getPreferredMode,
  getSessionKeyPreview,
  hasProviderNeedsAttention,
  hasSessionKey,
  setPreferredMode,
  setSessionKey,
  subscribeSessionKeys,
} from '../../../runtime/providers/sessionKeyStore';
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
import { useAuthSession } from '../../auth/hooks/useAuth';
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
  const { isAuthenticated } = useAuthSession();
  const saveMutation = useSaveModelCredential();
  const deleteMutation = useDeleteModelCredential();
  const testMutation = useTestModelCredential();

  const [sessionKeyActive, setSessionKeyActive] = useState(() =>
    hasSessionKey(provider)
  );
  const [sessionPreview, setSessionPreview] = useState(() =>
    getSessionKeyPreview(provider)
  );
  const [needsAttention, setNeedsAttention] = useState(() =>
    hasProviderNeedsAttention(provider)
  );

  useEffect(() => {
    return subscribeSessionKeys(() => {
      setSessionKeyActive(hasSessionKey(provider));
      setSessionPreview(getSessionKeyPreview(provider));
      setNeedsAttention(hasProviderNeedsAttention(provider));
    });
  }, [provider]);

  // Mode selection: default to account if account key exists, otherwise session
  const [storageChoice, setStorageChoice] = useState<'session' | 'account'>(
    () => {
      return getPreferredMode(provider, Boolean(credential));
    }
  );

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [isReplacing, setIsReplacing] = useState(false);
  const [confirmRemoveAccountOpen, setConfirmRemoveAccountOpen] =
    useState(false);
  const [confirmRemoveSessionOpen, setConfirmRemoveSessionOpen] =
    useState(false);
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

    if (storageChoice === 'session') {
      setSessionKey(provider, trimmed);
      setPreferredMode(provider, 'session');
      setApiKeyInput('');
      setIsReplacing(false);
      toast.success(`${providerName} key saved for this session only`);
      return;
    }

    // Account vault save
    try {
      const res = await saveMutation.mutateAsync({
        provider,
        apiKey: trimmed,
        verify: verifyBeforeSave,
      });
      setPreferredMode(provider, 'account');
      setApiKeyInput('');
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

  const handleConfirmRemoveAccount = async () => {
    setInlineError(null);
    try {
      const res = await deleteMutation.mutateAsync(provider);
      setConfirmRemoveAccountOpen(false);
      setIsReplacing(false);
      setApiKeyInput('');
      toast.success(res.message);
    } catch (err) {
      setConfirmRemoveAccountOpen(false);
      setInlineError(err);
    }
  };

  const handleRemoveSessionKey = () => {
    clearSessionKey(provider);
    setIsReplacing(false);
    setApiKeyInput('');
    setConfirmRemoveSessionOpen(false);
    toast.success(`${providerName} session key removed`);
  };

  const hasConfiguredKey = Boolean(credential) || sessionKeyActive;
  const showForm = !hasConfiguredKey || isReplacing;

  return (
    <div className="p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-lg border border-subtle bg-raised flex items-center justify-center text-secondary shrink-0">
            <KeyRound size={16} />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-primary">
                {providerName}
              </span>

              {credential ? (
                <Badge variant="success">
                  <ShieldCheck size={12} className="mr-1" />
                  Saved to account
                </Badge>
              ) : sessionKeyActive ? (
                <Badge variant="neutral">
                  <Laptop size={12} className="mr-1" />
                  This session only
                </Badge>
              ) : null}

              {needsAttention && (
                <Badge variant="warning">
                  <AlertTriangle size={12} className="mr-1" />
                  Needs attention
                </Badge>
              )}
            </div>

            {/* Account key preview & details */}
            {credential && (
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                <Tooltip content="Account keys are securely encrypted on the server and cannot be viewed or copied again.">
                  <span className="font-mono text-primary cursor-help underline decoration-dotted">
                    {credential.preview ?? '••••a3f9'}
                  </span>
                </Tooltip>
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

            {/* Session key preview & details */}
            {!credential && sessionKeyActive && (
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                <Tooltip content="Kept only in this browser tab memory; cleared when tab is closed.">
                  <span className="font-mono text-primary cursor-help underline decoration-dotted">
                    {sessionPreview ?? '••••'}
                  </span>
                </Tooltip>
                <span aria-hidden="true">·</span>
                <span className="text-muted">Active for current session</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing key actions */}
        {hasConfiguredKey && !isReplacing && (
          <div className="flex items-center gap-2 shrink-0">
            {credential && (
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
            )}
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
              onClick={() => {
                if (credential) {
                  setConfirmRemoveAccountOpen(true);
                } else {
                  setConfirmRemoveSessionOpen(true);
                }
              }}
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

      {/* Key entry & storage choice form */}
      {showForm && (
        <form onSubmit={handleSave} className="pt-2 space-y-3">
          {/* Storage location selector */}
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium text-secondary">
              Where would you like to keep this key?
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Option 1: Session only */}
              <button
                type="button"
                onClick={() => setStorageChoice('session')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                  storageChoice === 'session'
                    ? 'border-accent bg-accent/10 text-primary'
                    : 'border-subtle bg-app text-secondary hover:text-primary hover:border-default'
                }`}
              >
                <Laptop size={13} />
                <span>This session only</span>
                <span className="text-[10px] text-muted">(default)</span>
                <Tooltip content="Session: your browser sends requests directly to the model provider with your key; nothing is stored on our servers. Cleared when this tab closes.">
                  <span
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center justify-center text-muted hover:text-primary cursor-help ml-0.5"
                    aria-label="Session mode explanation"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle size={12} />
                  </span>
                </Tooltip>
              </button>

              {/* Option 2: Save to account */}
              <button
                type="button"
                disabled={!isAuthenticated}
                onClick={() => {
                  if (isAuthenticated) setStorageChoice('account');
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                  !isAuthenticated
                    ? 'opacity-50 cursor-not-allowed border-subtle bg-app text-muted'
                    : storageChoice === 'account'
                      ? 'border-accent bg-accent/10 text-primary'
                      : 'border-subtle bg-app text-secondary hover:text-primary hover:border-default'
                }`}
              >
                <ShieldCheck size={13} />
                <span>Save to my account</span>
                {!isAuthenticated && (
                  <span className="text-[10px] text-amber-500 font-normal">
                    (Log in required)
                  </span>
                )}
                <Tooltip
                  content={
                    !isAuthenticated
                      ? 'Log in to your account to save keys securely in your encrypted vault.'
                      : 'Account: your key is encrypted and stored on our safe servers; requests go from your browser to our proxy, which adds your key and forwards them to the provider; your key is never sent back to your browser, and prompts/responses are never logged.'
                  }
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center justify-center text-muted hover:text-primary cursor-help ml-0.5"
                    aria-label="Account mode explanation"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle size={12} />
                  </span>
                </Tooltip>
              </button>
            </div>
          </div>

          {/* Key input & action row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <Input
                type="password"
                required
                autoComplete="off"
                mono
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  storageChoice === 'session'
                    ? `Enter ${providerName} API key for this session only`
                    : `Enter ${providerName} API key to save encrypted to account`
                }
                aria-label={`${providerName} API key`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {storageChoice === 'account' && (
                <Checkbox
                  checked={verifyBeforeSave}
                  onChange={(checked) => setVerifyBeforeSave(checked)}
                  label="Verify key before saving"
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={storageChoice === 'account' && saveMutation.isPending}
                disabled={!apiKeyInput.trim()}
              >
                {storageChoice === 'session'
                  ? 'Use for this session'
                  : 'Save to my account'}
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
          </div>
        </form>
      )}

      {/* Remove Account Key Confirmation */}
      <ConfirmDialog
        open={confirmRemoveAccountOpen}
        title={`Remove ${providerName} key from account?`}
        description={`This removes your ${providerName} key from your encrypted server vault. Requests will no longer use this key.`}
        confirmLabel="Remove"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmRemoveAccount}
        onCancel={() => setConfirmRemoveAccountOpen(false)}
      />

      {/* Remove Session Key Confirmation */}
      <ConfirmDialog
        open={confirmRemoveSessionOpen}
        title={`Remove ${providerName} session key?`}
        description={`This clears the in-memory ${providerName} session key from this browser tab.`}
        confirmLabel="Remove"
        isDestructive
        onConfirm={handleRemoveSessionKey}
        onCancel={() => setConfirmRemoveSessionOpen(false)}
      />
    </div>
  );
}
