import { Send } from 'lucide-react';
import { useState } from 'react';
import {
  Tool,
  ToolRegistrationResponse,
  ToolVersion,
} from '../../../api/types/tools.types';
import { SandboxTestStatus } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  Card,
  CodeBlock,
  CodeEditor,
  FormField,
  toast,
} from '../../../shared/ui';
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
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          setInputParseError('Audit inputs must be a JSON object.');
          return;
        }
        parsedInputs = parsed as Record<string, unknown>;
      } catch (err) {
        setInputParseError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    }

    try {
      const response = await registerToolMutation.mutateAsync(parsedInputs);
      setRegistrationResult(response);
      toast.success('Submitted for review');
    } catch {
      // Displayed via ErrorBanner
    }
  };

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-[16px] font-semibold text-primary">
            Request publishing
          </h3>
          <p className="text-[13px] text-secondary">
            Submits the current version to the server for an authoritative security audit and verification.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Send size={15} />}
          disabled={!hasPassingSandboxTest}
          loading={registerToolMutation.isPending}
          onClick={handleRequestPublish}
        >
          Request publishing
        </Button>
      </div>

      {!hasPassingSandboxTest && (
        <div className="rounded-lg border border-warning-border bg-warning-tint px-3.5 py-2.5 text-[13px] text-warning">
          Run a passing test in the <strong>Test</strong> tab and save it with the current version ({currentVersion ? `v${currentVersion.version}` : 'no version'}) to enable publishing requests.
        </div>
      )}

      <FormField
        label="Optional verification inputs (JSON)"
        hint="Inputs used by the server when verifying this tool."
        error={inputParseError}
      >
        <CodeEditor
          rows={4}
          value={optionalInputsText}
          onChange={setOptionalInputsText}
        />
      </FormField>

      {registerToolMutation.error && (
        <ErrorBanner
          error={registerToolMutation.error}
          title="Registration failed"
        />
      )}

      {registrationResult && (
        <div className="space-y-2">
          <span className="text-[13px] font-medium text-primary">
            Registration audit result
          </span>
          <CodeBlock
            code={JSON.stringify(registrationResult, null, 2)}
            maxHeight="max-h-64"
          />
        </div>
      )}
    </Card>
  );
}
