import { useState } from 'react';
import {
  Tool,
  ToolRegistrationResponse,
  ToolVersion,
} from '../../../api/types/tools.types';
import { SandboxTestStatus } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useToolMutations } from '../hooks/useTools';

interface ToolPublishingPanelProps {
  readonly tool: Tool;
  readonly currentVersion?: ToolVersion | null;
}

export function ToolPublishingPanel({
  tool,
  currentVersion,
}: ToolPublishingPanelProps) {
  const { registerToolMutation } = useToolMutations(tool.id);

  const [optionalInputsText, setOptionalInputsText] = useState('{}');
  const [inputParseError, setInputParseError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] =
    useState<ToolRegistrationResponse | null>(null);

  const hasPassingSandboxTest =
    currentVersion?.test_results_json?.status === SandboxTestStatus.Passed;

  const handleRequestPublish = async () => {
    setInputParseError(null);
    let parsedInputs: Record<string, unknown> | undefined = undefined;

    if (optionalInputsText.trim()) {
      try {
        const parsed = JSON.parse(optionalInputsText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setInputParseError('Optional inputs must be a JSON object.');
          return;
        }
        parsedInputs = parsed as Record<string, unknown>;
      } catch (err) {
        setInputParseError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    }

    const response = await registerToolMutation.mutateAsync(parsedInputs);
    setRegistrationResult(response);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Request Publishing (POST /tools/&#123;id&#125;/register)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submits the current version to the backend for authoritative registration audit and admin review.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestPublish}
          disabled={!hasPassingSandboxTest || registerToolMutation.isPending}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          {registerToolMutation.isPending
            ? 'Submitting Registration...'
            : 'Request Publishing'}
        </button>
      </div>

      {!hasPassingSandboxTest && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Request publishing is enabled only when the current saved version (
          {currentVersion ? `v${currentVersion.version}` : 'none'}) has a passing local sandbox test attached (`test_results_json.status === &quot;passed&quot;`).
        </p>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Optional Audit Inputs JSON
        </label>
        <textarea
          rows={2}
          value={optionalInputsText}
          onChange={(e) => setOptionalInputsText(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono"
        />
        {inputParseError && (
          <p className="text-xs text-red-600 dark:text-red-400">{inputParseError}</p>
        )}
      </div>

      {registerToolMutation.error && (
        <ErrorBanner
          error={registerToolMutation.error}
          title="Registration failed (400)"
        />
      )}

      {registrationResult && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Full ToolRegistrationResponse
          </span>
          <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono overflow-x-auto">
            {JSON.stringify(registrationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
