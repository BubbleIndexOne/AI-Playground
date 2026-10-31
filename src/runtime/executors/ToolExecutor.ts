import { Tool, ToolVersion } from '../../api/types/tools.types';

export interface ResolvedExecutableTool {
  readonly tool: Tool;
  readonly version: ToolVersion;
  readonly executableInBrowser: boolean;
  readonly nonExecutableReason?: string;
}

export interface ToolExecutionResult {
  readonly ok: boolean;
  readonly status: 'completed' | 'failed' | 'unavailable';
  readonly output?: unknown;
  readonly error?: string;
  readonly durationMs: number;
}

export interface ToolExecutor {
  execute(
    resolvedTool: ResolvedExecutableTool,
    args: Record<string, unknown>
  ): Promise<ToolExecutionResult>;
}
