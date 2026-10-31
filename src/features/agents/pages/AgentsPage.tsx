import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime } from '../../../shared/utils/formatters';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import { AgentFormModal } from '../components/AgentFormModal';
import { useAgentMutations, useAgentsQuery } from '../hooks/useAgents';
import { agentsService } from '../services/agents.service';

export function AgentsPage() {
  const navigate = useNavigate();
  const { data: agents, isLoading, error } = useAgentsQuery();
  const { deleteAgentMutation, importAgentsMutation } = useAgentMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const handleExportJson = async () => {
    const json = await agentsService.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agents-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    await importAgentsMutation.mutateAsync(importJsonText);
    setImportJsonText('');
    setImportModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAgentMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Agents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Stored locally behind AgentRepository. Combine a system prompt, model preset, BYOK credential, tools, and connectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingAgent(null);
              setFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg"
          >
            New Agent
          </button>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <div className="p-6 text-sm text-slate-500">Loading agents...</div>
      ) : !agents || agents.length === 0 ? (
        <EmptyState
          title="No agents created yet"
          description="Build an agent from a system prompt, model preset, BYOK API key, and tools."
          actionLabel="Create First Agent"
          onAction={() => {
            setEditingAgent(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {agent.name}
                </h3>
                {agent.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {agent.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Tools: {agent.attachedTools.length}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Connectors:{' '}
                    {agent.attachedConnectors.length
                      ? agent.attachedConnectors.join(', ')
                      : 'none'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    Updated {formatDateTime(agent.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/chat?agentId=${agent.id}`)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
                >
                  Chat with Agent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAgent(agent);
                    setFormOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(agent)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AgentFormModal
        open={formOpen}
        initialAgent={editingAgent}
        onClose={() => setFormOpen(false)}
      />

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Import Agents from JSON
            </h3>
            {importAgentsMutation.error && (
              <ErrorBanner error={importAgentsMutation.error} />
            )}
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste exported agent JSON array or object..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete agent "${deleteTarget?.name ?? ''}"?`}
        description="Removes this agent from local storage."
        confirmLabel="Delete Agent"
        isDestructive
        isPending={deleteAgentMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
