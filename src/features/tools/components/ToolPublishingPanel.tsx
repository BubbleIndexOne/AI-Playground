/**
 * @fileoverview Panel for managing tool registration audits and MCP server
 * hosting evaluation requests.
 */

import { CheckCircle2, Clock, Cloud, Send, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Tool,
  ToolRegistrationResponse,
  ToolVersion,
} from '../../../api/types/tools.types';
import { SandboxTestStatus, ToolStatus } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
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
  const {
    registerToolMutation,
    requestMcpHostingMutation,
    withdrawMcpHostingMutation,
  } = useToolMutations(tool.id);

  const [optionalInputsText, setOptionalInputsText] = useState('{}');
  const [inputParseError, setInputParseError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] =
    useState<ToolRegistrationResponse | null>(null);

  const hasPassingSandboxTest =
    currentVersion?.test_results_json?.status === SandboxTestStatus.Passed;

  const isRegistered = tool.status === ToolStatus.Registered;
  const mcpStatus = tool.mcp_hosting_status ?? 'none';

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
      toast.success('Submitted for registration audit');
    } catch {
      // Handled via ErrorBanner
    }
  };

  const handleRequestMcpHosting = async () => {
    try {
      await requestMcpHostingMutation.mutateAsync();
      toast.success(
        'MCP Hosting Requested',
        'Queued for automated admin pipeline verification.'
      );
    } catch (err) {
      toast.error(
        'MCP Request Failed',
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const handleWithdrawMcpHosting = async () => {
    try {
      await withdrawMcpHostingMutation.mutateAsync();
      toast.info(
        'Request Withdrawn',
        'MCP server hosting evaluation request was canceled.'
      );
    } catch (err) {
      toast.error(
        'Withdrawal Failed',
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Sandbox Registration Audit */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-[16px] font-semibold text-primary">
              Registration security audit
            </h3>
            <p className="text-[13px] text-secondary">
              Submits the active version to the server sandbox for an authoritative capability and security audit, transitioning status to registered.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Send size={15} />}
            disabled={!currentVersion || registerToolMutation.isPending}
            loading={registerToolMutation.isPending}
            onClick={handleRequestPublish}
          >
            Run registration audit
          </Button>
        </div>

        {!currentVersion ? (
          <div className="rounded-lg border border-warning-border bg-warning-tint px-3.5 py-2.5 text-[13px] text-warning">
            Save a version in the <strong>Code</strong> or <strong>Schema</strong> tab to enable registration audits.
          </div>
        ) : !hasPassingSandboxTest ? (
          <div className="rounded-lg border border-subtle bg-raised/50 px-3.5 py-2.5 text-[12px] text-secondary flex items-center justify-between gap-3">
            <span>
              Authoritative registration audit will validate code exports and schema consistency on the backend for version <strong>v{currentVersion.version}</strong>.
            </span>
            <Badge variant="neutral">v{currentVersion.version}</Badge>
          </div>
        ) : null}

        <FormField
          label="Optional verification inputs (JSON)"
          hint="Custom test inputs to validate against schema during audit."
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
            title="Registration audit rejected"
          />
        )}

        {registrationResult && (
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-primary">
              Audit results
            </span>
            <CodeBlock
              code={JSON.stringify(registrationResult, null, 2)}
              maxHeight="max-h-64"
            />
          </div>
        )}
      </Card>

      {/* 2. MCP Server Hosting Evaluation */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-primary">
                MCP server hosting
              </h3>
              {tool.is_mcp_hosted ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck size={12} />
                  Active on MCP Server
                </Badge>
              ) : mcpStatus === 'requested' ? (
                <Badge variant="warning" className="gap-1">
                  <Clock size={12} />
                  Evaluation Requested
                </Badge>
              ) : mcpStatus === 'in_review' ? (
                <Badge variant="info" className="gap-1">
                  <Cloud size={12} />
                  In Review
                </Badge>
              ) : mcpStatus === 'rejected' ? (
                <Badge variant="danger" className="gap-1">
                  <XCircle size={12} />
                  Rejected
                </Badge>
              ) : null}
            </div>

            <p className="text-[13px] text-secondary">
              Promote your tool to run securely in backend MCP workers with persistent connector caching and protected source code.
            </p>
          </div>

          <div>
            {tool.is_mcp_hosted ? (
              <Badge variant="success">Fully Deployed</Badge>
            ) : mcpStatus === 'requested' ? (
              <Button
                variant="secondary"
                size="md"
                icon={<Undo2 size={14} />}
                loading={withdrawMcpHostingMutation.isPending}
                onClick={handleWithdrawMcpHosting}
              >
                Withdraw request
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                icon={<Cloud size={14} />}
                disabled={!isRegistered}
                loading={requestMcpHostingMutation.isPending}
                onClick={handleRequestMcpHosting}
              >
                Request MCP hosting
              </Button>
            )}
          </div>
        </div>

        {!isRegistered && !tool.is_mcp_hosted && (
          <div className="rounded-lg border border-subtle bg-app px-3.5 py-2.5 text-[12px] text-muted">
            Tools must be in <strong>Registered</strong> status before submitting for MCP server hosting evaluation.
          </div>
        )}

        {tool.is_mcp_hosted && (
          <div className="rounded-lg border border-success-border bg-success-tint px-3.5 py-2.5 text-[13px] text-success flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>This tool is active on the Agent-Playground-MCP server with isolated execution.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
