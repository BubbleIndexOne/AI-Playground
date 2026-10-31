import { CheckCircle2, Play, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ToolTestResults } from '../../../api/types/tools.types';
import { SandboxTestStatus, ToolType } from '../../../domain/enums';
import { derivePolicyFromCapabilities } from '../../../sandbox/controls/capabilitiesControl';
import {
  DEFAULT_SANDBOX_POLICY,
  SandboxExecutionOutcome,
  SandboxPolicy,
} from '../../../sandbox/protocol';
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  CodeEditor,
  toast,
} from '../../../shared/ui';
import { useToolMutations } from '../hooks/useTools';
import { GeneratedParamsForm } from './GeneratedParamsForm';
import { SandboxPolicyControls } from './SandboxPolicyControls';

interface SandboxTestPanelProps {
  readonly toolType: ToolType;
  readonly code: string;
  readonly onChangeCode?: (next: string) => void;
  readonly schemaJson: Record<string, unknown>;
  readonly declaredCapabilities: readonly string[];
  readonly attachedResults: ToolTestResults | null;
  readonly onAttachResults: (results: ToolTestResults | null) => void;
  readonly onSaveVersionWithTest?: (results: ToolTestResults) => Promise<void>;
  readonly isSavingVersion?: boolean;
}

export function SandboxTestPanel({
  toolType,
  code,
  onChangeCode,
  schemaJson,
  declaredCapabilities,
  attachedResults,
  onAttachResults,
  onSaveVersionWithTest,
  isSavingVersion = false,
}: SandboxTestPanelProps) {
  const { sandboxRunMutation } = useToolMutations();

  const [policy, setPolicy] = useState<SandboxPolicy>(() =>
    derivePolicyFromCapabilities(declaredCapabilities, DEFAULT_SANDBOX_POLICY)
  );
  const [paramsValues, setParamsValues] = useState<Record<string, unknown>>({});
  const [rawParamsText, setRawParamsText] = useState('{}');
  const [useRawJson, setUseRawJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] =
    useState<SandboxExecutionOutcome | null>(null);

  useEffect(() => {
    setPolicy((prev) => ({
      ...prev,
      declaredCapabilities: [...declaredCapabilities],
    }));
  }, [declaredCapabilities]);

  if (toolType === ToolType.Mcp) {
    return (
      <Card padding="md" className="space-y-1.5">
        <h3 className="text-[14px] font-semibold text-primary">
          Browser sandbox
        </h3>
        <p className="text-[13px] text-secondary">
          MCP tools do not include client-side JavaScript code and cannot be executed in the browser worker sandbox.
        </p>
      </Card>
    );
  }

  const handleRunSandbox = async () => {
    setJsonError(null);
    let finalParams: Record<string, unknown> = paramsValues;

    if (useRawJson) {
      try {
        const parsed = JSON.parse(rawParamsText);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
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

  const toSpecTestResult = (
    outcome: SandboxExecutionOutcome
  ): ToolTestResults => ({
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-secondary">
          The browser sandbox is a developer convenience. Backend registration is the authoritative audit.
        </p>
        <Button
          variant="primary"
          size="md"
          icon={<Play size={15} />}
          loading={sandboxRunMutation.isPending}
          disabled={!code.trim()}
          onClick={handleRunSandbox}
        >
          Run test
        </Button>
      </div>

      {/* Split Layout: Left Code Editor, Right Inputs + Policy + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-primary">
              Tool code
            </span>
            <span className="text-[11px] font-mono text-muted">
              export default async function run(params)
            </span>
          </div>
          <CodeEditor
            rows={16}
            value={code}
            disabled={!onChangeCode}
            onChange={(next) => onChangeCode?.(next)}
          />
        </Card>

        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-primary">
                Test inputs
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!useRawJson) {
                    setRawParamsText(JSON.stringify(paramsValues, null, 2));
                  }
                  setUseRawJson(!useRawJson);
                }}
                className="text-[12px] font-medium text-accent hover:underline cursor-pointer"
              >
                {useRawJson ? 'Use generated form' : 'Edit JSON'}
              </button>
            </div>

            {jsonError && (
              <p className="text-[12px] text-danger">{jsonError}</p>
            )}

            {useRawJson ? (
              <CodeEditor
                rows={5}
                value={rawParamsText}
                onChange={setRawParamsText}
              />
            ) : (
              <GeneratedParamsForm
                schemaJson={schemaJson}
                values={paramsValues}
                onChange={setParamsValues}
              />
            )}
          </Card>

          <SandboxPolicyControls policy={policy} onChange={setPolicy} />

          {lastOutcome && (
            <Card padding="md" className="space-y-4">
              {/* Passed/Failed Banner */}
              <div
                className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
                  lastOutcome.status === SandboxTestStatus.Passed
                    ? 'border-success-border bg-success-tint text-success'
                    : 'border-danger-border bg-danger-tint text-danger'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lastOutcome.status === SandboxTestStatus.Passed ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span className="text-[13px] font-semibold capitalize">
                    Test {lastOutcome.status}
                  </span>
                  <span className="text-[12px] font-mono tabular-nums opacity-90">
                    · {lastOutcome.durationMs ?? 0} ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const specRes = toSpecTestResult(lastOutcome);
                      onAttachResults(specRes);
                      toast.success('Test results attached to version draft');
                    }}
                  >
                    Attach result
                  </Button>
                  {onSaveVersionWithTest && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isSavingVersion}
                      onClick={() =>
                        onSaveVersionWithTest(toSpecTestResult(lastOutcome))
                      }
                    >
                      Save version with result
                    </Button>
                  )}
                </div>
              </div>

              {lastOutcome.reason && (
                <p className="text-[12px] text-danger font-medium">
                  {lastOutcome.reason}
                </p>
              )}

              {/* Observed Calls as Chips */}
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-secondary">
                  Observed calls ({lastOutcome.observedCalls?.length ?? 0})
                </span>
                {lastOutcome.observedCalls &&
                lastOutcome.observedCalls.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lastOutcome.observedCalls.map((call, idx) => (
                      <Badge
                        key={idx}
                        mono
                        variant={call.allowed === false ? 'danger' : 'info'}
                      >
                        {call.capability}
                        {call.method ? ` (${call.method})` : ''}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted">
                    No network or storage calls observed.
                  </p>
                )}
              </div>

              {/* Raw Result in CodeBlock */}
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-secondary">
                  Result payload
                </span>
                <CodeBlock
                  code={JSON.stringify(
                    lastOutcome.result ?? lastOutcome.details ?? null,
                    null,
                    2
                  )}
                  showLineNumbers
                  maxHeight="max-h-52"
                />
              </div>
            </Card>
          )}

          {attachedResults && (
            <div className="flex items-center justify-between rounded-lg border border-success-border bg-success-tint px-3.5 py-2 text-[12px] text-success">
              <span>
                Attached test result ({attachedResults.status},{' '}
                {attachedResults.durationMs ?? 0} ms) ready to save with version.
              </span>
              <button
                type="button"
                onClick={() => onAttachResults(null)}
                className="underline font-medium cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
