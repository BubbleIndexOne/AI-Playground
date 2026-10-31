import { useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { computeLineDiff } from '../../../shared/utils/diffLines';
import {
  useAdminMutations,
  useAdminToolInspectionQuery,
} from '../hooks/useAdmin';

interface AdminToolReviewCardProps {
  readonly tool: Tool;
}

export function AdminToolReviewCard({ tool }: AdminToolReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmMode, setConfirmMode] = useState<
    'reject' | 'deprecate' | 'purge' | null
  >(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: inspection } = useAdminToolInspectionQuery(
    expanded ? tool.id : null
  );
  const {
    approveMutation,
    rejectMutation,
    deprecateMutation,
    purgeToolMutation,
  } = useAdminMutations();

  const currentVersion =
    tool.current_version ?? inspection?.versions?.[0] ?? null;
  const previousVersion = inspection?.versions?.[1] ?? null;

  const codeDiff =
    currentVersion && previousVersion
      ? computeLineDiff(previousVersion.code ?? '', currentVersion.code ?? '')
      : [];

  const handleConfirmAction = async () => {
    if (!confirmMode) return;
    if (confirmMode === 'reject') {
      await rejectMutation.mutateAsync({
        toolId: tool.id,
        reason: rejectReason,
      });
    } else if (confirmMode === 'deprecate') {
      await deprecateMutation.mutateAsync(tool.id);
    } else if (confirmMode === 'purge') {
      await purgeToolMutation.mutateAsync(tool.id);
    }
    setConfirmMode(null);
  };

  const actionError =
    approveMutation.error ??
    rejectMutation.error ??
    deprecateMutation.error ??
    purgeToolMutation.error;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {tool.name}
          </h3>
          {tool.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {tool.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">ID: {tool.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Type: {tool.type}</span>
            <span aria-hidden="true">·</span>
            <span>Status: {tool.status}</span>
            {currentVersion && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">v{currentVersion.version}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            {expanded ? 'Hide Inspection' : 'Inspect Code & Diff'}
          </button>
          <button
            type="button"
            onClick={() => approveMutation.mutate(tool.id)}
            disabled={approveMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            Approve (Verified + Public)
          </button>
          <button
            type="button"
            onClick={() => {
              setRejectReason('');
              setConfirmMode('reject');
            }}
            className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setConfirmMode('deprecate')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg"
          >
            Deprecate
          </button>
          <button
            type="button"
            onClick={() => setConfirmMode('purge')}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
          >
            Purge
          </button>
        </div>
      </div>

      {actionError && <ErrorBanner error={actionError} />}

      {expanded && currentVersion && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
            <span>
              Capabilities:{' '}
              {currentVersion.capabilities_json?.length
                ? currentVersion.capabilities_json.join(', ')
                : 'none'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Code (v{currentVersion.version})
              </span>
              <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-56">
                {currentVersion.code ?? '// No code (MCP tool)'}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Schema & Test Results
              </span>
              <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-56">
                {JSON.stringify(
                  {
                    schema_json: currentVersion.schema_json,
                    test_results_json: currentVersion.test_results_json,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {previousVersion && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Diff against v{previousVersion.version}
              </span>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono overflow-x-auto max-h-48">
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
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmMode !== null}
        title={
          confirmMode === 'purge'
            ? `Permanently purge "${tool.name}"?`
            : confirmMode === 'reject'
              ? `Reject "${tool.name}"?`
              : `Deprecate "${tool.name}"?`
        }
        description={
          confirmMode === 'purge'
            ? 'Calls DELETE /tools/{id}?purge=true with x-admin-key. This cannot be undone.'
            : confirmMode === 'reject'
              ? 'Sets tool status to rejected via PATCH /tools/{id}.'
              : 'Sets tool status to deprecated via PATCH /tools/{id}.'
        }
        confirmLabel={
          confirmMode === 'purge'
            ? 'Purge Tool'
            : confirmMode === 'reject'
              ? 'Reject Tool'
              : 'Deprecate Tool'
        }
        isDestructive
        isPending={
          rejectMutation.isPending ||
          deprecateMutation.isPending ||
          purgeToolMutation.isPending
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmMode(null)}
      >
        {confirmMode === 'reject' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Rejection reason (optional)
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this version was rejected..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
