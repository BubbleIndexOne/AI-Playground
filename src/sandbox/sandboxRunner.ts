import { SandboxTestStatus } from '../domain/enums';
import { auditObservedCallsAgainstCapabilities } from './controls/capabilitiesControl';
import {
  checkMemoryBudget,
  isMemoryMeasurementSupported,
} from './controls/memoryControl';
import { buildNetworkControlPreamble } from './controls/networkControl';
import { validateMaxOutputSize } from './controls/outputSizeControl';
import { buildStorageGlobalsControlPreamble } from './controls/storageGlobalsControl';
import {
  SandboxTimeoutError,
  withHardWallClockTimeout,
} from './controls/timeoutControl';
import {
  HostToIframeExecuteMessage,
  IframeToHostResultMessage,
  SandboxExecutionOutcome,
  SandboxRunInput,
} from './protocol';

function buildIframeSrcDoc(): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
  let activeWorker = null;
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.channel !== 'agent-playground-sandbox' || msg.type !== 'EXECUTE_TOOL') return;

    const { requestId, workerPreamble, userCode, params } = msg;
    const startMs = performance.now();

    const userBlob = new Blob([userCode], { type: 'text/javascript' });
    const userBlobUrl = URL.createObjectURL(userBlob);

    const runnerSource = \`
      const __observedCalls = [];
      function __recordCall(entry) {
        __observedCalls.push(entry);
      }
      \${workerPreamble}

      self.onmessage = async (e) => {
        const { userBlobUrl, params } = e.data;
        try {
          const mod = await import(userBlobUrl);
          if (typeof mod.default !== 'function') {
            throw new Error('Tool module must export a default function: export default async function run(params)');
          }
          const output = await mod.default(params);
          self.postMessage({ ok: true, result: output, observedCalls: __observedCalls });
        } catch (err) {
          self.postMessage({
            ok: false,
            error: err && err.message ? err.message : String(err),
            observedCalls: __observedCalls
          });
        }
      };
    \`;

    const runnerBlob = new Blob([runnerSource], { type: 'text/javascript' });
    const runnerBlobUrl = URL.createObjectURL(runnerBlob);

    try {
      activeWorker = new Worker(runnerBlobUrl, { type: 'module' });
      activeWorker.onmessage = (wEvent) => {
        const durationMs = Math.round(performance.now() - startMs);
        URL.revokeObjectURL(userBlobUrl);
        URL.revokeObjectURL(runnerBlobUrl);
        if (activeWorker) {
          activeWorker.terminate();
          activeWorker = null;
        }
        parent.postMessage({
          channel: 'agent-playground-sandbox',
          type: 'TOOL_RESULT',
          requestId,
          ok: Boolean(wEvent.data.ok),
          result: wEvent.data.result,
          error: wEvent.data.error,
          observedCalls: wEvent.data.observedCalls || [],
          durationMs,
        }, '*');
      };

      activeWorker.onerror = (wErr) => {
        const durationMs = Math.round(performance.now() - startMs);
        URL.revokeObjectURL(userBlobUrl);
        URL.revokeObjectURL(runnerBlobUrl);
        if (activeWorker) {
          activeWorker.terminate();
          activeWorker = null;
        }
        parent.postMessage({
          channel: 'agent-playground-sandbox',
          type: 'TOOL_RESULT',
          requestId,
          ok: false,
          error: wErr.message || 'Module worker syntax or runtime error',
          observedCalls: [],
          durationMs,
        }, '*');
      };

      activeWorker.postMessage({ userBlobUrl, params });
    } catch (spawnErr) {
      const durationMs = Math.round(performance.now() - startMs);
      parent.postMessage({
        channel: 'agent-playground-sandbox',
        type: 'TOOL_RESULT',
        requestId,
        ok: false,
        error: spawnErr && spawnErr.message ? spawnErr.message : String(spawnErr),
        observedCalls: [],
        durationMs,
      }, '*');
    }
  });
</script>
</body>
</html>`;
}

export async function runInSandbox(
  input: SandboxRunInput
): Promise<SandboxExecutionOutcome> {
  const { code, params, policy } = input;
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const iframe = document.createElement('iframe');
  // Sandboxed iframe with allow-scripts ONLY (no allow-same-origin)
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';
  iframe.srcdoc = buildIframeSrcDoc();
  document.body.appendChild(iframe);

  const workerPreamble = [
    buildNetworkControlPreamble(policy),
    buildStorageGlobalsControlPreamble(policy),
  ].join('\n');

  const cleanupIframe = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  try {
    const rawResponse = await withHardWallClockTimeout<IframeToHostResultMessage>(
      new Promise<IframeToHostResultMessage>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          const data = event.data as IframeToHostResultMessage | undefined;
          if (
            !data ||
            data.channel !== 'agent-playground-sandbox' ||
            data.type !== 'TOOL_RESULT' ||
            data.requestId !== requestId
          ) {
            return;
          }
          window.removeEventListener('message', handleMessage);
          resolve(data);
        };

        window.addEventListener('message', handleMessage);

        iframe.onload = () => {
          if (!iframe.contentWindow) {
            window.removeEventListener('message', handleMessage);
            reject(new Error('Sandbox iframe failed to initialize'));
            return;
          }
          const executeMsg: HostToIframeExecuteMessage = {
            channel: 'agent-playground-sandbox',
            type: 'EXECUTE_TOOL',
            requestId,
            workerPreamble,
            userCode: code,
            params,
          };
          iframe.contentWindow.postMessage(executeMsg, '*');
        };
      }),
      policy.timeoutMs,
      cleanupIframe
    );

    cleanupIframe();

    const memoryCheck = await checkMemoryBudget(policy.memoryBudgetMb);
    const capAudit = auditObservedCallsAgainstCapabilities(
      rawResponse.observedCalls,
      policy.declaredCapabilities
    );

    if (!rawResponse.ok) {
      return {
        status: SandboxTestStatus.Failed,
        result: rawResponse.result,
        observedCalls: [...rawResponse.observedCalls],
        durationMs: rawResponse.durationMs,
        inputsUsed: params,
        timestamp,
        reason: rawResponse.error ?? 'Tool execution threw an error',
        details: !capAudit.passed ? { capabilityViolations: capAudit.violations } : undefined,
        memoryMeasurementSupported: memoryCheck.supported,
        measuredMemoryBytes: memoryCheck.measuredBytes,
      };
    }

    if (!capAudit.passed) {
      return {
        status: SandboxTestStatus.Failed,
        result: rawResponse.result,
        observedCalls: [...rawResponse.observedCalls],
        durationMs: rawResponse.durationMs,
        inputsUsed: params,
        timestamp,
        reason: capAudit.reason,
        details: { violations: capAudit.violations },
        memoryMeasurementSupported: memoryCheck.supported,
        measuredMemoryBytes: memoryCheck.measuredBytes,
      };
    }

    const sizeCheck = validateMaxOutputSize(
      rawResponse.result,
      policy.maxOutputBytes
    );
    if (!sizeCheck.valid) {
      return {
        status: SandboxTestStatus.Failed,
        result: undefined,
        observedCalls: [...rawResponse.observedCalls],
        durationMs: rawResponse.durationMs,
        inputsUsed: params,
        timestamp,
        reason: sizeCheck.reason,
        details: { byteLength: sizeCheck.byteLength, maxOutputBytes: policy.maxOutputBytes },
        memoryMeasurementSupported: memoryCheck.supported,
        measuredMemoryBytes: memoryCheck.measuredBytes,
      };
    }

    if (memoryCheck.exceeded) {
      return {
        status: SandboxTestStatus.Failed,
        result: rawResponse.result,
        observedCalls: [...rawResponse.observedCalls],
        durationMs: rawResponse.durationMs,
        inputsUsed: params,
        timestamp,
        reason: memoryCheck.reason,
        details: { measuredBytes: memoryCheck.measuredBytes },
        memoryMeasurementSupported: memoryCheck.supported,
        measuredMemoryBytes: memoryCheck.measuredBytes,
      };
    }

    return {
      status: SandboxTestStatus.Passed,
      result: rawResponse.result,
      observedCalls: [...rawResponse.observedCalls],
      durationMs: rawResponse.durationMs,
      inputsUsed: params,
      timestamp,
      memoryMeasurementSupported: memoryCheck.supported,
      measuredMemoryBytes: memoryCheck.measuredBytes,
    };
  } catch (err) {
    cleanupIframe();
    const isTimeout = err instanceof SandboxTimeoutError;
    return {
      status: SandboxTestStatus.Failed,
      observedCalls: [],
      durationMs: isTimeout ? policy.timeoutMs : 0,
      inputsUsed: params,
      timestamp,
      reason: err instanceof Error ? err.message : String(err),
      memoryMeasurementSupported: isMemoryMeasurementSupported(),
    };
  }
}
