import { FormEvent, useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useAgentMutations, useAgentsQuery } from '../../agents/hooks/useAgents';
import { useToolVersionsQuery } from '../../tools/hooks/useTools';

interface MarketplaceToolDetailModalProps {
  readonly tool: Tool | null;
  readonly onClose: () => void;
}

export function MarketplaceToolDetailModal({
  tool,
  onClose,
}: MarketplaceToolDetailModalProps) {
  const { data: versions } = useToolVersionsQuery(tool?.id);
  const { data: agents } = useAgentsQuery();
  const { attachToolMutation } = useAgentMutations();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [pinnedVersion, setPinnedVersion] = useState<string>('');
  const [attachedNotice, setAttachedNotice] = useState<string | null>(null);

  if (!tool) return null;

  const allVersions = versions ?? tool.versions ?? [];
  const activeVersion = tool.current_version ?? allVersions[0] ?? null;

  const handleAttachToAgent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setAttachedNotice(null);
    await attachToolMutation.mutateAsync({
      agentId: selectedAgentId,
      toolId: tool.id,
      pinnedVersion: pinnedVersion ? Number(pinnedVersion) : null,
    });
    const agentName =
      agents?.find((a) => a.id === selectedAgentId)?.name ?? 'Agent';
    setAttachedNotice(
      `Attached "${tool.name}"${pinnedVersion ? ` (pinned v${pinnedVersion})` : ''} to ${agentName}.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-5 my-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {tool.name}
            </h2>
            {tool.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {tool.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">Type: {tool.type}</span>
              <span aria-hidden="true">·</span>
              <span>Status: {tool.status}</span>
              {activeVersion && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">v{activeVersion.version}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleAttachToAgent}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3"
        >
          <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
            Add to Agent
          </span>
          {attachToolMutation.error && (
            <ErrorBanner error={attachToolMutation.error} />
          )}
          {attachedNotice && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {attachedNotice}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <select
              required
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
            >
              <option value="">Select an agent...</option>
              {(agents ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={pinnedVersion}
              onChange={(e) => setPinnedVersion(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono"
            >
              <option value="">Latest version (unpinned)</option>
              {allVersions.map((v) => (
                <option key={v.version} value={String(v.version)}>
                  Pin v{v.version}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!selectedAgentId || attachToolMutation.isPending}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Add to Agent
            </button>
          </div>
        </form>

        {activeVersion && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Capabilities:{' '}
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">
                {activeVersion.capabilities_json?.length
                  ? activeVersion.capabilities_json.join(', ')
                  : 'none'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Read-Only Code
                </span>
                <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-56">
                  {activeVersion.code ?? '// No client code (MCP tool)'}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Parameter Schema (schema_json)
                </span>
                <pre className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(activeVersion.schema_json ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Published Versions ({allVersions.length})
              </span>
              <div className="flex flex-wrap gap-2 font-mono text-slate-600 dark:text-slate-400">
                {allVersions.map((v) => (
                  <span key={v.version}>v{v.version}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
