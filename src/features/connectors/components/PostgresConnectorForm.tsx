import { FormEvent, useState } from 'react';
import {
  ConnectorTestResponse,
  PostgresCredentialsSchema,
} from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  Checkbox,
  CodeBlock,
  FormField,
  Input,
  Switch,
  toast,
} from '../../../shared/ui';
import { useConnectorMutations } from '../hooks/useConnectors';

interface PostgresConnectorFormProps {
  readonly isConfigured: boolean;
  readonly onSaved?: () => void;
}

export function PostgresConnectorForm({
  isConfigured,
  onSaved,
}: PostgresConnectorFormProps) {
  const { saveMutation, testMutation } = useConnectorMutations();

  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectorTestResponse | null>(null);

  const clearForm = () => {
    setHost('');
    setPort('5432');
    setDatabase('');
    setUser('');
    setPassword('');
    setSsl(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = PostgresCredentialsSchema.safeParse({
      host: host.trim(),
      port,
      database: database.trim(),
      user: user.trim(),
      password,
      ssl,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    await saveMutation.mutateAsync({
      type: ConnectorType.Postgres,
      credentials: parsed.data,
      verify: verifyBeforeSave,
    });
    clearForm();
    toast.success('Postgres configured', 'Credentials were saved and cleared from the form.');
    onSaved?.();
  };

  const handleTestForm = async () => {
    setValidationError(null);
    setTestResult(null);
    const parsed = PostgresCredentialsSchema.safeParse({
      host: host.trim(),
      port,
      database: database.trim(),
      user: user.trim(),
      password,
      ssl,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }
    const res = await testMutation.mutateAsync({
      type: ConnectorType.Postgres,
      credentials: parsed.data,
    });
    setTestResult(res);
  };

  const handleTestStored = async () => {
    setValidationError(null);
    setTestResult(null);
    const res = await testMutation.mutateAsync({
      type: ConnectorType.Postgres,
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Host" htmlFor="pg-host" required>
            <Input
              id="pg-host"
              type="text"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="db.example.com"
            />
          </FormField>
        </div>
        <FormField label="Port" htmlFor="pg-port" required>
          <Input
            id="pg-port"
            type="number"
            required
            value={port}
            onChange={(e) => setPort(e.target.value)}
            mono
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Database" htmlFor="pg-db" required>
          <Input
            id="pg-db"
            type="text"
            required
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder="production"
          />
        </FormField>
        <FormField label="User" htmlFor="pg-user" required>
          <Input
            id="pg-user"
            type="text"
            required
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="postgres"
          />
        </FormField>
        <FormField label="Password" htmlFor="pg-pass" required>
          <Input
            id="pg-pass"
            type="password"
            required
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-subtle">
        <div className="flex flex-wrap items-center gap-6">
          <Checkbox
            checked={ssl}
            onChange={setSsl}
            label="Require SSL"
          />
          <Switch
            checked={verifyBeforeSave}
            onChange={setVerifyBeforeSave}
            label="Verify before saving"
          />
        </div>

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
