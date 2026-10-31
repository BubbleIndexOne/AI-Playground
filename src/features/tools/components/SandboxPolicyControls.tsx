import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';
import { SandboxPolicy } from '../../../sandbox/protocol';
import { Checkbox, FormField, Input, Switch } from '../../../shared/ui';
import { toolsService } from '../services/tools.service';

interface SandboxPolicyControlsProps {
  readonly policy: SandboxPolicy;
  readonly onChange: (next: SandboxPolicy) => void;
}

export function SandboxPolicyControls({
  policy,
  onChange,
}: SandboxPolicyControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const canMeasureMemory = toolsService.canMeasureMemory();
  const domainStr = policy.allowedDomains.join(', ');

  return (
    <div className="rounded-xl border border-subtle bg-app overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-secondary" />
          <span className="text-[13px] font-medium text-primary">
            Sandbox policy
          </span>
          <span className="text-[12px] text-muted font-mono">
            {policy.timeoutMs}ms · {(policy.maxOutputBytes / 1024).toFixed(0)}KB ·{' '}
            {policy.networkEnabled ? 'Network allowlist' : 'Network off'}
          </span>
        </div>
        {expanded ? (
          <ChevronDown size={15} className="text-muted" />
        ) : (
          <ChevronRight size={15} className="text-muted" />
        )}
      </button>

      {expanded && (
        <div className="p-4 border-t border-subtle space-y-4 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Switch
                checked={policy.networkEnabled}
                onChange={(checked) =>
                  onChange({ ...policy, networkEnabled: checked })
                }
                label="Allow outbound network"
              />
              <Input
                type="text"
                mono
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
                placeholder="Allowed domains: api.example.com"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-[12px] font-medium text-secondary">
                Browser storage APIs
              </span>
              <div className="flex flex-col gap-2">
                <Checkbox
                  checked={policy.allowIndexedDb}
                  onChange={(checked) =>
                    onChange({ ...policy, allowIndexedDb: checked })
                  }
                  label="Allow IndexedDB"
                />
                <Checkbox
                  checked={policy.allowCaches}
                  onChange={(checked) =>
                    onChange({ ...policy, allowCaches: checked })
                  }
                  label="Allow Cache Storage"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-subtle">
            <FormField
              label="Timeout (ms)"
              hint="Hard wall-clock limit"
            >
              <Input
                type="number"
                mono
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
              />
            </FormField>

            <FormField
              label="Max output (bytes)"
              hint="Rejects larger payloads"
            >
              <Input
                type="number"
                mono
                min={256}
                max={1048576}
                step={1024}
                value={policy.maxOutputBytes}
                onChange={(e) =>
                  onChange({
                    ...policy,
                    maxOutputBytes: Math.max(
                      256,
                      Number(e.target.value) || 65536
                    ),
                  })
                }
              />
            </FormField>

            <FormField
              label="Memory budget (MB)"
              hint={
                canMeasureMemory
                  ? 'Measured in browser'
                  : 'Cannot be measured in this browser'
              }
            >
              <Input
                type="number"
                mono
                min={8}
                max={1024}
                value={policy.memoryBudgetMb}
                onChange={(e) =>
                  onChange({
                    ...policy,
                    memoryBudgetMb: Math.max(8, Number(e.target.value) || 64),
                  })
                }
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
