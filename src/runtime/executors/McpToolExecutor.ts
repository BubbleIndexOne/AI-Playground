import {
  ResolvedExecutableTool,
  ToolExecutionResult,
  ToolExecutor,
} from './ToolExecutor';

export class McpToolExecutor implements ToolExecutor {
  async execute(
    resolvedTool: ResolvedExecutableTool,
    _args: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    const { tool } = resolvedTool;
    const reason = tool.connector_type
      ? `Connector execution (${tool.connector_type}) is not available yet in the browser runtime.`
      : `MCP tool execution ("${tool.name}") is not available yet in the browser runtime.`;

    return {
      ok: false,
      status: 'unavailable',
      output: { status: 'not_available_yet', message: reason },
      error: reason,
      durationMs: 0,
    };
  }
}

export const mcpToolExecutor = new McpToolExecutor();
