import { useState } from 'react';
import { ToolVersion } from '../../../api/types/tools.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { computeLineDiff } from '../../../shared/utils/diffLines';
import { formatDateTime } from '../../../shared/utils/formatters';
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

  const { data: versionDetail, isLoading: loadingDetail } =
    useToolVersionDetailQuery(toolId, selectedVersion);

  const {
    data: diffBundle,
    isLoading: loadingDiff,
    error: diffError,
  } = useToolDiffQuery(toolId, diffFrom, diffTo);

  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-xs text-slate-500">
        No immutable versions created yet. Save a version above to view history and diffs.
      </div>
    );
  }

  const codeDiff =
    diffBundle
      ? computeLineDiff(
          diffBundle.vFrom.code ?? '',
          diffBundle.vTo.code ?? ''
        )
      : [];

  const schemaDiff =
    diffBundle
      ? computeLineDiff(
          JSON.stringify(diffBundle.vFrom.schema_json ?? {}, null, 2),
          JSON.stringify(diffBundle.vTo.schema_json ?? {}, null, 2)
        )
      : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Version History ({versions.length})
          </h3>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {versions.map((v) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setSelectedVersion(v.version)}
                className={`w-full text-left py-2.5 px-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                  selectedVersion === v.version
                    ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="font-mono">v{v.version}</span>
                <span className="tabular-nums text-[11px] text-slate-500">
                  {v.test_results_json?.status
                    ? `Test: ${v.test_results_json.status} · `
                    : ''}
                  {formatDateTime(v.created_at)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Version Detail {selectedVersion !== null ? `(v${selectedVersion})` : ''}
          </h3>
          {loadingDetail ? (
            <p className="text-xs text-slate-500">Loading version detail...</p>
          ) : !versionDetail ? (
            <p className="text-xs text-slate-500">Select a version to inspect.</p>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-500">
                <span className="font-mono">v{versionDetail.version}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Capabilities:{' '}
                  {versionDetail.capabilities_json?.length
                    ? versionDetail.capabilities_json.join(', ')
                    : 'none'}
                </span>
              </div>
              {versionDetail.code && (
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Code
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-48">
                    {versionDetail.code}
                  </pre>
                </div>
              )}
              <div className="space-y-1">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Schema JSON
                </span>
                <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(versionDetail.schema_json, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {versions.length >= 2 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Version Diff Comparison
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5">
                <span>From:</span>
                <select
                  value={diffFrom ?? ''}
                  onChange={(e) => setDiffFrom(Number(e.target.value))}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 font-mono"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5">
                <span>To:</span>
                <select
                  value={diffTo ?? ''}
                  onChange={(e) => setDiffTo(Number(e.target.value))}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 font-mono"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {diffError && <ErrorBanner error={diffError} />}
          {loadingDiff && (
            <p className="text-xs text-slate-500">Computing version diff...</p>
          )}

          {diffBundle && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span>
                  API diff summary:{' '}
                  <code className="font-mono">
                    code_changed={String(diffBundle.diffMeta.code_changed)}
                  </code>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <code className="font-mono">
                    schema_changed={String(diffBundle.diffMeta.schema_changed)}
                  </code>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Code Diff
                  </span>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs overflow-x-auto max-h-64">
                    {codeDiff.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.type === 'added'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-1'
                            : line.type === 'removed'
                              ? 'bg-red-500/15 text-red-800 dark:text-red-300 px-1'
                              : 'text-slate-600 dark:text-slate-400 px-1'
                        }
                      >
                        {line.type === 'added'
                          ? '+ '
                          : line.type === 'removed'
                            ? '- '
                            : '  '}
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Schema Diff
                  </span>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs overflow-x-auto max-h-64">
                    {schemaDiff.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.type === 'added'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-1'
                            : line.type === 'removed'
                              ? 'bg-red-500/15 text-red-800 dark:text-red-300 px-1'
                              : 'text-slate-600 dark:text-slate-400 px-1'
                        }
                      >
                        {line.type === 'added'
                          ? '+ '
                          : line.type === 'removed'
                            ? '- '
                            : '  '}
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
