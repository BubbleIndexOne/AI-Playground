import { SandboxPolicy } from '../../../sandbox/protocol';
import { toolsService } from '../services/tools.service';

interface SandboxPolicyControlsProps {
  readonly policy: SandboxPolicy;
  readonly onChange: (next: SandboxPolicy) => void;
}

export function SandboxPolicyControls({
  policy,
  onChange,
}: SandboxPolicyControlsProps) {
  const canMeasureMemory = toolsService.canMeasureMemory();
  const domainStr = policy.allowedDomains.join(', ');

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          Sandbox Policy Controls
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Isolated iframe (sandbox=&quot;allow-scripts&quot;) + Blob Module Worker
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.networkEnabled}
              onChange={(e) =>
                onChange({ ...policy, networkEnabled: e.target.checked })
              }
              className="rounded border-slate-300 dark:border-slate-700"
            />
            Allow Outbound Network
          </label>
          <input
            type="text"
            disabled={!policy.networkEnabled}
            value={domainStr}
            onChange={(e) =>
              onChange({
                ...policy,
                allowedDomains: e.target.value
                  .split(',')
                  .map((d) => d.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Domain allowlist: api.example.com"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Storage & Globals Access
          </span>
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.allowIndexedDb}
                onChange={(e) =>
                  onChange({ ...policy, allowIndexedDb: e.target.checked })
                }
                className="rounded border-slate-300 dark:border-slate-700"
              />
              Allow IndexedDB (storage:indexeddb)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.allowCaches}
                onChange={(e) =>
                  onChange({ ...policy, allowCaches: e.target.checked })
                }
                className="rounded border-slate-300 dark:border-slate-700"
              />
              Allow Cache Storage (storage:caches)
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Memory Budget (MB)
          </label>
          <input
            type="number"
            min={8}
            max={1024}
            value={policy.memoryBudgetMb}
            onChange={(e) =>
              onChange({
                ...policy,
                memoryBudgetMb: Math.max(8, Number(e.target.value) || 64),
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {canMeasureMemory
              ? 'Measured via performance.measureUserAgentSpecificMemory().'
              : 'Browser cannot measure memory here (requires crossOriginIsolated); budget is not enforced in this browser.'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Wall-Clock Timeout (ms)
          </label>
          <input
            type="number"
            min={100}
            max={60000}
            step={100}
            value={policy.timeoutMs}
            onChange={(e) =>
              onChange({
                ...policy,
                timeoutMs: Math.max(100, Number(e.target.value) || 5000),
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Max Output Size (bytes)
          </label>
          <input
            type="number"
            min={256}
            max={1048576}
            step={1024}
            value={policy.maxOutputBytes}
            onChange={(e) =>
              onChange({
                ...policy,
                maxOutputBytes: Math.max(256, Number(e.target.value) || 65536),
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}
