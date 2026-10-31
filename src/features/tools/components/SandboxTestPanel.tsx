import { useEffect, useState } from 'react';
import { ToolTestResults } from '../../../api/types/tools.types';
import { SandboxTestStatus, ToolType } from '../../../domain/enums';
import { derivePolicyFromCapabilities } from '../../../sandbox/controls/capabilitiesControl';
import {
  DEFAULT_SANDBOX_POLICY,
  SandboxExecutionOutcome,
  SandboxPolicy,
} from '../../../sandbox/protocol';
import { useToolMutations } from '../hooks/useTools';
import { GeneratedParamsForm } from './GeneratedParamsForm';
import { SandboxPolicyControls } from './SandboxPolicyControls';

interface SandboxTestPanelProps {
  readonly toolType: ToolType;
  readonly code: string;
  readonly schemaJson: Record<string, unknown>;
  readonly declaredCapabilities: readonly string[];
  readonly attachedResults: ToolTestResults | null;
  readonly onAttachResults: (results: ToolTestResults | null) => void;
}

export function SandboxTestPanel({
  toolType,
  code,
  schemaJson,
  declaredCapabilities,
  attachedResults,
  onAttachResults,
}: SandboxTestPanelProps) {
  const { sandboxRunMutation } = useToolMutations();

  const [policy, setPolicy] = useState<SandboxPolicy>(() =>
    derivePolicyFromCapabilities(declaredCapabilities, DEFAULT_SANDBOX_POLICY)
  );
  const [paramsValues, setParamsValues] = useState<Record<string, unknown>>({});
  const [rawParamsText, setRawParamsText] = useState('{}');
  const [useRawJson, setUseRawJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<SandboxExecutionOutcome | null>(
    null
  );

  useEffect(() => {
    setPolicy((prev) => ({
      ...prev,
      declaredCapabilities: [...declaredCapabilities],
    }));
  }, [declaredCapabilities]);

  if (toolType === ToolType.Mcp) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Browser Test Sandbox
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          MCP tools do not contain client-side code and are not executed in the browser module worker sandbox.
        </p>
      </div>
    );
  }

  const handleRunSandbox = async () => {
    setJsonError(null);
    let finalParams: Record<string, unknown> = paramsValues;

    if (useRawJson) {
      try {
        const parsed = JSON.parse(rawParamsText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setJsonError('Test input JSON must be an object.');
          return;
        }
        finalParams = parsed as Record<string, unknown>;
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    }

    const outcome = await sandboxRunMutation.mutateAsync({
      code,
      params: finalParams,
      policy: {
        ...policy,
        declaredCapabilities: [...declaredCapabilities],
      },
    });
    setLastOutcome(outcome);
  };

  const toSpecTestResult = (outcome: SandboxExecutionOutcome): ToolTestResults => ({
    status: outcome.status,
    result: outcome.result,
    observedCalls: outcome.observedCalls,
    durationMs: outcome.durationMs,
    inputsUsed: outcome.inputsUsed,
    timestamp: outcome.timestamp,
    reason: outcome.reason,
    details: outcome.details,
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Browser Tool Test Sandbox
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note: The browser sandbox is a developer convenience. Backend registration (POST /tools/&#123;id&#125;/register) is the authoritative audit.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSandbox}
          disabled={sandboxRunMutation.isPending || !code.trim()}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {sandboxRunMutation.isPending ? 'Running in Worker...' : 'Run Sandbox Test'}
        </button>
      </div>

      <SandboxPolicyControls policy={policy} onChange={setPolicy} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Test Input Parameters (params)
          </span>
          <button
            type="button"
            onClick={() => {
              if (!useRawJson) {
                setRawParamsText(JSON.stringify(paramsValues, null, 2));
              }
              setUseRawJson(!useRawJson);
            }}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
          >
            {useRawJson ? 'Use Generated Form' : 'Edit Raw JSON'}
          </button>
        </div>

        {jsonError && (
          <p className="text-xs text-red-600 dark:text-red-400">{jsonError}</p>
        )}

        {useRawJson ? (
          <textarea
            rows={4}
            value={rawParamsText}
            onChange={(e) => setRawParamsText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono"
          />
        ) : (
          <GeneratedParamsForm
            schemaJson={schemaJson}
            values={paramsValues}
            onChange={setParamsValues}
          />
        )}
      </div>

      {lastOutcome && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`font-semibold uppercase ${
                  lastOutcome.status === SandboxTestStatus.Passed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {lastOutcome.status}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {lastOutcome.durationMs ?? 0} ms
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                Observed calls: {lastOutcome.observedCalls?.length ?? 0}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {lastOutcome.memoryMeasurementSupported
                  ? `Memory: ${((lastOutcome.measuredMemoryBytes ?? 0) / 1024).toFixed(1)} KB`
                  : 'Memory measurement: not supported by browser'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onAttachResults(toSpecTestResult(lastOutcome))}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
            >
              Attach as test_results_json
            </button>
          </div>

          {lastOutcome.reason && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              Reason: {lastOutcome.reason}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Output Result
              </span>
              <pre className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono overflow-x-auto max-h-48">
                {JSON.stringify(lastOutcome.result ?? null, null, 2)}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Observed Calls & Details
              </span>
              <pre className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono overflow-x-auto max-h-48">
                {JSON.stringify(
                  {
                    observedCalls: lastOutcome.observedCalls ?? [],
                    details: lastOutcome.details,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {attachedResults && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 px-3.5 py-2 text-xs text-emerald-900 dark:text-emerald-200">
          <span>
            Attached <code className="font-mono">test_results_json</code> (status:{' '}
            <strong>{attachedResults.status}</strong>,{' '}
            {attachedResults.durationMs ?? 0} ms) ready for next version save.
          </span>
          <button
            type="button"
            onClick={() => onAttachResults(null)}
            className="underline font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
