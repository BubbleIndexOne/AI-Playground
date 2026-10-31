import { SandboxTestStatus } from '../../domain/enums';
import { derivePolicyFromCapabilities } from '../../sandbox/controls/capabilitiesControl';
import { runInSandbox } from '../../sandbox/sandboxRunner';
import {
  ResolvedExecutableTool,
  ToolExecutionResult,
  ToolExecutor,
} from './ToolExecutor';

export class SandboxToolExecutor implements ToolExecutor {
  async execute(
    resolvedTool: ResolvedExecutableTool,
    args: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    const { tool, version } = resolvedTool;

    if (!tool.allow_client_execution) {
      return {
        ok: false,
        status: 'unavailable',
        error: `Tool "${tool.name}" has allow_client_execution=false and cannot run in the browser sandbox.`,
        durationMs: 0,
      };
    }

    if (!version.code || !version.code.trim()) {
      return {
        ok: false,
        status: 'failed',
        error: `Tool "${tool.name}" (v${version.version}) has no client module code.`,
        durationMs: 0,
      };
    }

    const policy = derivePolicyFromCapabilities(
      version.capabilities_json ?? []
    );

    const outcome = await runInSandbox({
      code: version.code,
      params: args,
      policy,
    });

    if (outcome.status === SandboxTestStatus.Passed) {
      return {
        ok: true,
        status: 'completed',
        output: outcome.result,
        durationMs: outcome.durationMs ?? 0,
      };
    }

    return {
      ok: false,
      status: 'failed',
      error: outcome.reason ?? 'Sandbox execution failed',
      output: outcome.result,
      durationMs: outcome.durationMs ?? 0,
    };
  }
}

export const sandboxToolExecutor = new SandboxToolExecutor();
