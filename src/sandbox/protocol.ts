import { ObservedCall, ToolTestResults } from '../api/types/tools.types';

export interface SandboxPolicy {
  readonly networkEnabled: boolean;
  readonly allowedDomains: readonly string[];
  readonly allowIndexedDb: boolean;
  readonly allowCaches: boolean;
  readonly memoryBudgetMb: number;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly declaredCapabilities: readonly string[];
}

export const DEFAULT_SANDBOX_POLICY: SandboxPolicy = {
  networkEnabled: false,
  allowedDomains: [],
  allowIndexedDb: false,
  allowCaches: false,
  memoryBudgetMb: 64,
  timeoutMs: 5000,
  maxOutputBytes: 65536,
  declaredCapabilities: [],
};

export interface SandboxRunInput {
  readonly code: string;
  readonly params: Record<string, unknown>;
  readonly policy: SandboxPolicy;
}

export interface HostToIframeExecuteMessage {
  readonly channel: 'agent-playground-sandbox';
  readonly type: 'EXECUTE_TOOL';
  readonly requestId: string;
  readonly workerPreamble: string;
  readonly userCode: string;
  readonly params: Record<string, unknown>;
}

export interface IframeToHostResultMessage {
  readonly channel: 'agent-playground-sandbox';
  readonly type: 'TOOL_RESULT';
  readonly requestId: string;
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: string;
  readonly observedCalls: readonly ObservedCall[];
  readonly durationMs: number;
}

export type SandboxExecutionOutcome = ToolTestResults & {
  readonly memoryMeasurementSupported: boolean;
  readonly measuredMemoryBytes?: number;
};
