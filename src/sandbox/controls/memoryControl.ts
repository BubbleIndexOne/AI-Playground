interface PerformanceWithMemory extends Performance {
  measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
}

export interface MemoryCheckResult {
  readonly supported: boolean;
  readonly measuredBytes?: number;
  readonly exceeded: boolean;
  readonly reason?: string;
}

export function isMemoryMeasurementSupported(): boolean {
  if (typeof performance === 'undefined') return false;
  const perf = performance as PerformanceWithMemory;
  return (
    Boolean((globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated) &&
    typeof perf.measureUserAgentSpecificMemory === 'function'
  );
}

export async function checkMemoryBudget(
  budgetMb: number
): Promise<MemoryCheckResult> {
  if (!isMemoryMeasurementSupported()) {
    return {
      supported: false,
      exceeded: false,
    };
  }

  try {
    const perf = performance as PerformanceWithMemory;
    const measurement = await perf.measureUserAgentSpecificMemory!();
    const limitBytes = budgetMb * 1024 * 1024;
    const exceeded = measurement.bytes > limitBytes;
    return {
      supported: true,
      measuredBytes: measurement.bytes,
      exceeded,
      reason: exceeded
        ? `Memory budget exceeded: measured ${(measurement.bytes / (1024 * 1024)).toFixed(2)} MB > budget ${budgetMb} MB`
        : undefined,
    };
  } catch {
    return {
      supported: false,
      exceeded: false,
    };
  }
}
