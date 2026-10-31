import { FormEvent, useState } from 'react';
import {
  ConnectorTestResponse,
  PostgresCredentialsSchema,
} from '../../../api/types/connectors.types';
import { ConnectorType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useConnectorMutations } from '../hooks/useConnectors';

interface PostgresConnectorFormProps {
  readonly isConfigured: boolean;
}

export function PostgresConnectorForm({ isConfigured }: PostgresConnectorFormProps) {
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
  const [savedNotice, setSavedNotice] = useState(false);

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
    setSavedNotice(false);

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
    // Never display stored secrets; after saving, clear the form.
    clearForm();
    setSavedNotice(true);
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
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            PostgreSQL Credentials
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PUT /connectors/postgres · Form clears automatically after saving.
          </p>
        </div>
        {isConfigured && (
          <button
            type="button"
            onClick={handleTestStored}
            disabled={testMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Test Stored Credentials
          </button>
        )}
      </div>

      {validationError && <ErrorBanner error={new Error(validationError)} />}
      {saveMutation.error && <ErrorBanner error={saveMutation.error} title="Save failed" />}
      {testMutation.error && <ErrorBanner error={testMutation.error} title="Test failed" />}

      {testResult && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono overflow-x-auto">
          {JSON.stringify(testResult, null, 2)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Host *
          </label>
          <input
            type="text"
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="db.example.com"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Port *
          </label>
          <input
            type="number"
            required
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Database *
          </label>
          <input
            type="text"
            required
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder="production"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            User *
          </label>
          <input
            type="text"
            required
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="postgres"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Password *
          </label>
          <input
            type="password"
            required
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ssl}
              onChange={(e) => setSsl(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700"
            />
            Require SSL
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={verifyBeforeSave}
              onChange={(e) => setVerifyBeforeSave(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700"
            />
            Verify before saving
          </label>
          {savedNotice && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Saved and cleared.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestForm}
            disabled={testMutation.isPending}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Test Form Values
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Postgres'}
          </button>
        </div>
      </div>
    </form>
  );
}
