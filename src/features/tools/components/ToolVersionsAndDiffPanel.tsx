import { useState } from 'react';
import { ToolVersion } from '../../../api/types/tools.types';
import { SandboxTestStatus } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Card,
  CodeBlock,
  EmptyState,
  Select,
  Tooltip,
} from '../../../shared/ui';
import { computeLineDiff } from '../../../shared/utils/diffLines';
import {
  formatDateTime,
  formatRelativeTime,
} from '../../../shared/utils/formatters';
import {
  useToolDiffQuery,
  useToolVersionDetailQuery,
} from '../hooks/useTools';

interface ToolVersionsAndDiffPanelProps {
  readonly toolId: string;
  readonly versions: readonly ToolVersion[];
}

export function ToolVersionsAndDiffPanel({
  toolId,
  versions,
}: ToolVersionsAndDiffPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    versions[0]?.version ?? null
  );
  const [diffFrom, setDiffFrom] = useState<number | null>(
    versions[1]?.version ?? versions[0]?.version ?? null
  );
  const [diffTo, setDiffTo] = useState<number | null>(
    versions[0]?.version ?? null
  );

  const { data: versionDetail } = useToolVersionDetailQuery(
    toolId,
    selectedVersion
  );

  const { data: diffBundle, error: diffError } = useToolDiffQuery(
    toolId,
    diffFrom,
    diffTo
  );

  if (versions.length === 0) {
    return (
      <EmptyState
        title="No versions saved yet"
        description="Save a version in the Code or Schema tab to view version history and compare diffs."
      />
    );
  }

  const codeDiff = diffBundle
    ? computeLineDiff(
        diffBundle.vFrom.code ?? '',
        diffBundle.vTo.code ?? ''
      )
    : [];

  const schemaDiff = diffBundle
    ? computeLineDiff(
        JSON.stringify(diffBundle.vFrom.schema_json ?? {}, null, 2),
        JSON.stringify(diffBundle.vTo.schema_json ?? {}, null, 2)
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card padding="md" className="space-y-3">
          <h3 className="text-[14px] font-semibold text-primary">
            Versions ({versions.length})
          </h3>
          <div className="divide-y divide-subtle">
            {versions.map((v) => {
              const isSelected = selectedVersion === v.version;
              const testStatus = v.test_results_json?.status;
              return (
                <button
                  key={v.version}
                  type="button"
                  onClick={() => setSelectedVersion(v.version)}
                  className={`w-full text-left py-2.5 px-3 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-accent-tint text-primary font-medium'
                      : 'text-secondary hover:text-primary hover:bg-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px]">v{v.version}</span>
                    {testStatus && (
                      <Badge
                        variant={
                          testStatus === SandboxTestStatus.Passed
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {testStatus}
                      </Badge>
                    )}
                  </div>
                  <Tooltip content={formatDateTime(v.created_at)}>
                    <span className="text-[12px] text-muted tabular-nums">
                      {formatRelativeTime(v.created_at)}
                    </span>
                  </Tooltip>
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="md" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-primary">
              {selectedVersion !== null
                ? `Version ${selectedVersion}`
                : 'Version details'}
            </h3>
            {versionDetail?.capabilities_json &&
              versionDetail.capabilities_json.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {versionDetail.capabilities_json.map((cap) => (
                    <Badge key={cap} mono variant="neutral">
                      {cap}
                    </Badge>
                  ))}
                </div>
              )}
          </div>

          {versionDetail && (
            <div className="space-y-4">
              {versionDetail.code && (
                <div className="space-y-1.5">
                  <span className="text-[12px] font-medium text-secondary">
                    Code
                  </span>
                  <CodeBlock code={versionDetail.code} maxHeight="max-h-52" />
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-secondary">
                  Parameter schema
                </span>
                <CodeBlock
                  code={JSON.stringify(versionDetail.schema_json, null, 2)}
                  maxHeight="max-h-52"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {versions.length >= 2 && (
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-[14px] font-semibold text-primary">
                Compare versions
              </h3>
              {diffBundle && (
                <p className="text-[12px] text-secondary">
                  {diffBundle.diffMeta.code_changed
                    ? 'Code modified'
                    : 'Code unchanged'}{' '}
                  ·{' '}
                  {diffBundle.diffMeta.schema_changed
                    ? 'Schema modified'
                    : 'Schema unchanged'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-28">
                <Select
                  mono
                  value={diffFrom ?? ''}
                  onChange={(e) => setDiffFrom(Number(e.target.value))}
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      From v{v.version}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-28">
                <Select
                  mono
                  value={diffTo ?? ''}
                  onChange={(e) => setDiffTo(Number(e.target.value))}
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      To v{v.version}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {diffError && <ErrorBanner error={diffError} />}

          {diffBundle && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-secondary">
                  Code diff
                </span>
                <div className="rounded-lg border border-subtle bg-app p-3 font-mono text-[12px] leading-5 overflow-x-auto max-h-64">
                  {codeDiff.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.type === 'added'
                          ? 'bg-success-tint text-success px-1.5 rounded-xs'
                          : line.type === 'removed'
                            ? 'bg-danger-tint text-danger px-1.5 rounded-xs'
                            : 'text-secondary px-1.5'
                      }
                    >
                      {line.type === 'added'
                        ? '+ '
                        : line.type === 'removed'
                          ? '- '
                          : '  '}
                      {line.text || ' '}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-secondary">
                  Schema diff
                </span>
                <div className="rounded-lg border border-subtle bg-app p-3 font-mono text-[12px] leading-5 overflow-x-auto max-h-64">
                  {schemaDiff.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.type === 'added'
                          ? 'bg-success-tint text-success px-1.5 rounded-xs'
                          : line.type === 'removed'
                            ? 'bg-danger-tint text-danger px-1.5 rounded-xs'
                            : 'text-secondary px-1.5'
                      }
                    >
                      {line.type === 'added'
                        ? '+ '
                        : line.type === 'removed'
                          ? '- '
                          : '  '}
                      {line.text || ' '}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
