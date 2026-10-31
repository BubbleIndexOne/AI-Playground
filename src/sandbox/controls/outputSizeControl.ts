export interface OutputSizeCheckResult {
  readonly valid: boolean;
  readonly byteLength: number;
  readonly reason?: string;
}

export function validateMaxOutputSize(
  result: unknown,
  maxOutputBytes: number
): OutputSizeCheckResult {
  let serialized = '';
  try {
    serialized = JSON.stringify(result) ?? '';
  } catch {
    return {
      valid: false,
      byteLength: 0,
      reason: 'Tool result is not JSON-serializable',
    };
  }

  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > maxOutputBytes) {
    return {
      valid: false,
      byteLength,
      reason: `Tool output size (${byteLength} bytes) exceeds policy limit (${maxOutputBytes} bytes)`,
    };
  }

  return {
    valid: true,
    byteLength,
  };
}
