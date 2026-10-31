export class SandboxTimeoutError extends Error {
  readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(`Execution timed out after ${timeoutMs} ms`);
    this.name = 'SandboxTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export function withHardWallClockTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onBreach: () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      onBreach();
      reject(new SandboxTimeoutError(timeoutMs));
    }, Math.max(50, timeoutMs));

    promise.then(
      (val) => {
        window.clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}
