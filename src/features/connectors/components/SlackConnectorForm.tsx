import { FormEvent, useState } from 'react';
import {
  ConnectorTestResponse,
  SlackCredentialsSchema,
} from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  CodeBlock,
  FormField,
  Input,
  Switch,
  toast,
} from '../../../shared/ui';
import { useConnectorMutations } from '../hooks/useConnectors';

interface SlackConnectorFormProps {
  readonly isConfigured: boolean;
  readonly onSaved?: () => void;
}

export function SlackConnectorForm({
  isConfigured,
  onSaved,
}: SlackConnectorFormProps) {
  const { saveMutation, testMutation } = useConnectorMutations();

  const [botToken, setBotToken] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [defaultChannel, setDefaultChannel] = useState('');
  const [teamId, setTeamId] = useState('');
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectorTestResponse | null>(null);

  const clearForm = () => {
    setBotToken('');
    setSigningSecret('');
    setDefaultChannel('');
    setTeamId('');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = SlackCredentialsSchema.safeParse({
      bot_token: botToken.trim(),
      signing_secret: signingSecret.trim() || undefined,
      default_channel: defaultChannel.trim() || undefined,
      team_id: teamId.trim() || undefined,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    await saveMutation.mutateAsync({
      type: ConnectorType.Slack,
      credentials: parsed.data,
      verify: verifyBeforeSave,
    });
    clearForm();
    toast.success('Slack configured', 'Credentials were saved and cleared from the form.');
    onSaved?.();
  };

  const handleTestForm = async () => {
    setValidationError(null);
    setTestResult(null);
    const parsed = SlackCredentialsSchema.safeParse({
      bot_token: botToken.trim(),
      signing_secret: signingSecret.trim() || undefined,
      default_channel: defaultChannel.trim() || undefined,
      team_id: teamId.trim() || undefined,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }
    const res = await testMutation.mutateAsync({
      type: ConnectorType.Slack,
      credentials: parsed.data,
    });
    setTestResult(res);
  };

  const handleTestStored = async () => {
    setValidationError(null);
    setTestResult(null);
    const res = await testMutation.mutateAsync({
      type: ConnectorType.Slack,
    });
    setTestResult(res);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {validationError && <ErrorBanner error={new Error(validationError)} />}
      {saveMutation.error && <ErrorBanner error={saveMutation.error} title="Save failed" />}
      {testMutation.error && <ErrorBanner error={testMutation.error} title="Test failed" />}

      {testResult && (
        <div className="space-y-1.5">
          <span className="text-[12px] font-medium text-secondary">
            Connection test result
          </span>
          <CodeBlock code={JSON.stringify(testResult, null, 2)} maxHeight="160px" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Bot token" htmlFor="slack-bot-token" required>
          <Input
            id="slack-bot-token"
            type="password"
            required
            autoComplete="off"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="xoxb-…"
            mono
          />
        </FormField>

        <FormField label="Signing secret" htmlFor="slack-signing-secret">
          <Input
            id="slack-signing-secret"
            type="password"
            autoComplete="off"
            value={signingSecret}
            onChange={(e) => setSigningSecret(e.target.value)}
            placeholder="Optional signing secret"
            mono
          />
        </FormField>

        <FormField label="Default channel" htmlFor="slack-channel">
          <Input
            id="slack-channel"
            type="text"
            value={defaultChannel}
            onChange={(e) => setDefaultChannel(e.target.value)}
            placeholder="#general or C01234567"
          />
        </FormField>

        <FormField label="Team ID" htmlFor="slack-team">
          <Input
            id="slack-team"
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="T01234567"
            mono
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-subtle">
        <Switch
          checked={verifyBeforeSave}
          onChange={setVerifyBeforeSave}
          label="Verify before saving"
        />

        <div className="flex items-center gap-2">
          {isConfigured && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleTestStored}
              loading={testMutation.isPending}
            >
              Test stored
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestForm}
            loading={testMutation.isPending}
          >
            Test connection
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saveMutation.isPending}
          >
            Save credentials
          </Button>
        </div>
      </div>
    </form>
  );
}
