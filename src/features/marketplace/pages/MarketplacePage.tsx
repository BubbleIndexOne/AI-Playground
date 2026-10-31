import { useMemo, useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ToolStatus, ToolType } from '../../../domain/enums';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useToolsListQuery } from '../../tools/hooks/useTools';
import { MarketplaceToolDetailModal } from '../components/MarketplaceToolDetailModal';

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ToolType | ''>('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const { data: tools, isLoading, error } = useToolsListQuery({
    include_public: true,
  });

  const filteredTools = useMemo(() => {
    const publicVerified = (tools ?? []).filter(
      (t) => t.is_public || t.status === ToolStatus.Verified
    );
    return publicVerified.filter((tool) => {
      if (typeFilter && tool.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = tool.name.toLowerCase().includes(q);
        const descMatch = (tool.description ?? '').toLowerCase().includes(q);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [tools, typeFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Tool Marketplace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browse verified public tools from GET /tools?include_public=true and attach them to your agents.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools by name or description..."
          className="flex-1 min-w-[240px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Type:
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ToolType | '')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
          >
            <option value="">All types</option>
            <option value={ToolType.Client}>client</option>
            <option value={ToolType.Mcp}>mcp</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner error={error} title="Failed to load marketplace" />}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
          Loading public tools...
        </div>
      ) : filteredTools.length === 0 ? (
        <EmptyState
          title="No public tools found"
          description="Once an admin verifies and publishes tools, they appear here for any agent to attach."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {tool.name}
                </h3>
                {tool.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {tool.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="font-mono">{tool.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tool.status}</span>
                  {tool.current_version && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        v{tool.current_version.version}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTool(tool)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Inspect &amp; Add to Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MarketplaceToolDetailModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
