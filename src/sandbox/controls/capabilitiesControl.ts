import { ObservedCall } from '../../api/types/tools.types';
import { DEFAULT_SANDBOX_POLICY, SandboxPolicy } from '../protocol';

export interface CapabilityAuditResult {
  readonly passed: boolean;
  readonly violations: readonly ObservedCall[];
  readonly reason?: string;
}

export function derivePolicyFromCapabilities(
  declaredCapabilities: readonly string[],
  overrides?: Partial<SandboxPolicy>
): SandboxPolicy {
  const capSet = new Set(declaredCapabilities);
  const hasNetwork =
    capSet.has('network:http_get') ||
    capSet.has('network:http_post') ||
    capSet.has('network:websocket') ||
    capSet.has('network:eventsource');

  return {
    ...DEFAULT_SANDBOX_POLICY,
    networkEnabled: overrides?.networkEnabled ?? hasNetwork,
    allowedDomains: overrides?.allowedDomains ?? (hasNetwork ? ['*'] : []),
    allowIndexedDb: overrides?.allowIndexedDb ?? capSet.has('storage:indexeddb'),
    allowCaches: overrides?.allowCaches ?? capSet.has('storage:caches'),
    memoryBudgetMb: overrides?.memoryBudgetMb ?? DEFAULT_SANDBOX_POLICY.memoryBudgetMb,
    timeoutMs: overrides?.timeoutMs ?? DEFAULT_SANDBOX_POLICY.timeoutMs,
    maxOutputBytes: overrides?.maxOutputBytes ?? DEFAULT_SANDBOX_POLICY.maxOutputBytes,
    declaredCapabilities: [...declaredCapabilities],
  };
}

export function auditObservedCallsAgainstCapabilities(
  observedCalls: readonly ObservedCall[],
  declaredCapabilities: readonly string[]
): CapabilityAuditResult {
  const declared = new Set(declaredCapabilities);
  const violations = observedCalls.filter(
    (call) => !declared.has(call.capability) || call.allowed === false
  );

  if (violations.length > 0) {
    const undeclaredList = Array.from(
      new Set(violations.map((v) => v.capability))
    ).join(', ');
    return {
      passed: false,
      violations,
      reason: `Observed calls outside declared capabilities or policy: ${undeclaredList}`,
    };
  }

  return {
    passed: true,
    violations: [],
  };
}
