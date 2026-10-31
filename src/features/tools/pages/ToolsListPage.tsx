import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tool } from '../../../api/types/tools.types';
import { ToolStatus, ToolType } from '../../../domain/enums';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime } from '../../../shared/utils/formatters';
import { ToolMetadataModal } from '../components/ToolMetadataModal';
import { useToolMutations, useToolsListQuery } from '../hooks/useTools';

export function ToolsListPage() {
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<ToolType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | ''>('');
  const [includePublic, setIncludePublic] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);

  const { data: tools, isLoading, error } = useToolsListQuery({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    include_public: includePublic,
  });

  const { deleteToolMutation } = useToolMutations();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteToolMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Tools
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Author client or MCP tools, test in the isolated browser sandbox, and submit for admin verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTool(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Create Tool
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Type:
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ToolType | '')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
          >
            <option value="">All types</option>
            <option value={ToolType.Client}>client</option>
            <option value={ToolType.Mcp}>mcp</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ToolStatus | '')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
          >
            <option value="">All statuses</option>
            {Object.values(ToolStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={includePublic}
            onChange={(e) => setIncludePublic(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700"
          />
          Include public tools (include_public=true)
        </label>
      </div>

      {error && <ErrorBanner error={error} title="Could not load tools" />}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
          Loading tools from GET /tools...
        </div>
      ) : !tools || tools.length === 0 ? (
        <EmptyState
          title="No tools match your filters"
          description="Create a client or MCP tool to author versions, test in the browser sandbox, and request publication."
          actionLabel="Create Tool"
          onAction={() => {
            setEditingTool(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 flex flex-wrap items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="space-y-1">
                <Link
                  to={`/tools/${tool.id}`}
                  className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                >
                  {tool.name}
                </Link>
                {tool.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                    {tool.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="font-mono">{tool.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>Status: {tool.status}</span>
                  {tool.connector_type && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Connector: {tool.connector_type}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>
                    {tool.allow_client_execution
                      ? 'Client execution enabled'
                      : 'Client execution off'}
                  </span>
                  {tool.current_version && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        v{tool.current_version.version}
                      </span>
                    </>
                  )}
                  {tool.updated_at && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatDateTime(tool.updated_at)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/tools/${tool.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Open Studio
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTool(tool);
                    setModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Edit Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(tool)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToolMetadataModal
        open={modalOpen}
        initialTool={editingTool}
        onClose={() => setModalOpen(false)}
        onCreated={(created) => navigate(`/tools/${created.id}`)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Soft-delete "${deleteTarget?.name ?? ''}"?`}
        description="Calls DELETE /tools/{id} to soft-delete this tool."
        confirmLabel="Delete Tool"
        isDestructive
        isPending={deleteToolMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
