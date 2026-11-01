import { KeyRound, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../../api/http/errors';
import { getProviderDisplayName, ModelProvider } from '../../../domain/providers';
import { CredentialExecutionMode } from '../../../runtime/providers/getLanguageModel';
import { setSessionKey } from '../../../runtime/providers/sessionKeyStore';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Checkbox, Input, toast } from '../../../shared/ui';
import { useSaveModelCredential } from '../../credentials/hooks/useModelCredentials';

interface ComposerKeyPromptProps {
  readonly provider: ModelProvider;
  readonly onResolved: (mode: CredentialExecutionMode) => void;
  readonly onCancel: () => void;
}

export function ComposerKeyPrompt({
  provider,
  onResolved,
  onCancel,
}: ComposerKeyPromptProps) {
  const saveMutation = useSaveModelCredential();
  const providerName = getProviderDisplayName(provider);

  const [choice, setChoice] = useState<'session' | 'vault'>('vault');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [inlineError, setInlineError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      setApiKeyInput('');
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setInlineError(null);
    setApiKeyInput('');

    if (choice === 'session') {
      setSessionKey(provider, trimmed);
      onResolved('session');
      return;
    }

    try {
      const res = await saveMutation.mutateAsync({
        provider,
        apiKey: trimmed,
        verify: verifyBeforeSave,
      });
      toast.success(res.message);
      onResolved('vault');
    } catch (err) {
      setInlineError(err);
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-subtle bg-raised p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
          <KeyRound size={15} className="text-secondary shrink-0" />
          <span>{providerName} API key required</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={choice === 'session' ? 'primary' : 'secondary'}
            onClick={() => {
              setChoice('session');
              setApiKeyInput('');
              setInlineError(null);
            }}
          >
            Use a key for this session
          </Button>
          <Button
            type="button"
            size="sm"
            variant={choice === 'vault' ? 'primary' : 'secondary'}
            icon={<ShieldCheck size={13} />}
            onClick={() => {
              setChoice('vault');
              setApiKeyInput('');
              setInlineError(null);
            }}
          >
            Save a key to the vault
          </Button>
        </div>
      </div>

      {inlineError !== null && (
        <ErrorBanner
          error={
            inlineError instanceof ApiError || inlineError instanceof Error
              ? inlineError
              : new Error('Could not save API key')
          }
          onDismiss={() => setInlineError(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row sm:items-center gap-2.5"
      >
        <div className="flex-1 min-w-0">
          <Input
            type="password"
            required
            autoComplete="off"
            mono
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={
              choice === 'session'
                ? `Enter ${providerName} key for this session only`
                : `Enter ${providerName} key to save in encrypted vault`
            }
            aria-label={`${providerName} API key`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {choice === 'vault' && (
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
            loading={saveMutation.isPending}
            disabled={!apiKeyInput.trim()}
          >
            {choice === 'session'
              ? 'Continue with session key'
              : 'Save to encrypted vault'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setApiKeyInput('');
              setInlineError(null);
              onCancel();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
