import {
  Bot,
  Copy,
  Download,
  Edit3,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  CardGridSkeleton,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  EmptyState,
  IconButton,
  PageHeader,
  Textarea,
  toast,
} from '../../../shared/ui';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import { useModelPresetsQuery } from '../../presets/hooks/useModelPresets';
import { AgentFormModal } from '../components/AgentFormModal';
import { useAgentMutations, useAgentsQuery } from '../hooks/useAgents';
import { agentsService } from '../services/agents.service';

export function AgentsPage() {
  const navigate = useNavigate();
  const { data: agents, isLoading, error } = useAgentsQuery();
  const hasPresetRefs = Boolean(
    agents && agents.some((a) => Boolean(a.modelPresetId))
  );
  const { data: presets } = useModelPresetsQuery(undefined, hasPresetRefs);
  const { saveAgentMutation, deleteAgentMutation, importAgentsMutation } =
    useAgentMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const presetNameById = new Map((presets ?? []).map((p) => [p.id, p.name]));

  const downloadJson = (json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const json = await agentsService.exportAll();
    downloadJson(json, 'agents.json');
    toast.success('Exported all agents');
  };

  const handleExportSingle = (agent: AgentRecord) => {
    downloadJson(
      JSON.stringify(agent, null, 2),
      `${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
    );
    toast.success(`Exported "${agent.name}"`);
  };

  const handleDuplicate = async (agent: AgentRecord) => {
    await saveAgentMutation.mutateAsync({
      name: `${agent.name} (Copy)`,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      modelPresetId: agent.modelPresetId,
      credentialId: agent.credentialId,
      attachedTools: agent.attachedTools,
      attachedConnectors: agent.attachedConnectors,
    });
    toast.success(`Duplicated "${agent.name}"`);
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    try {
      const imported = await importAgentsMutation.mutateAsync(importJsonText);
      toast.success(`Imported ${imported.length} agent(s)`);
      setImportJsonText('');
      setImportModalOpen(false);
    } catch (err) {
      toast.error(
        'Import failed',
        err instanceof Error ? err.message : undefined
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAgentMutation.mutateAsync(deleteTarget.id);
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const hasAgents = Boolean(agents && agents.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Combine a system prompt, model preset, tools, and connectors. Agents are saved in this browser."
        actions={
          <>
            <DropdownMenu
              items={[
                {
                  label: 'Import JSON',
                  icon: <Upload size={14} />,
                  onClick: () => setImportModalOpen(true),
                },
                {
                  label: 'Export all JSON',
                  icon: <Download size={14} />,
                  disabled: !hasAgents,
                  onClick: handleExportAll,
                },
              ]}
              trigger={
                <Button variant="secondary" size="md">
                  Import / Export
                </Button>
              }
            />
            {hasAgents && (
              <Button
                variant="primary"
                size="md"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingAgent(null);
                  setFormOpen(true);
                }}
              >
                New agent
              </Button>
            )}
          </>
        }
      />

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : !hasAgents ? (
        <EmptyState
          icon={<Bot size={20} />}
          title="No agents yet"
          description="Create an agent with custom instructions, a model preset, and tools to start chatting."
          actionLabel="Create agent"
          onAction={() => {
            setEditingAgent(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents!.map((agent) => {
            const presetName =
              presetNameById.get(agent.modelPresetId) ?? 'Default model';
            return (
              <Card
                key={agent.id}
                interactive
                padding="md"
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[16px] font-semibold text-primary truncate">
                      {agent.name}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<MessageSquare size={14} />}
                        onClick={() => navigate(`/chat?agentId=${agent.id}`)}
                      >
                        Chat
                      </Button>
                      <DropdownMenu
                        items={[
                          {
                            label: 'Edit',
                            icon: <Edit3 size={14} />,
                            onClick: () => {
                              setEditingAgent(agent);
                              setFormOpen(true);
                            },
                          },
                          {
                            label: 'Duplicate',
                            icon: <Copy size={14} />,
                            onClick: () => handleDuplicate(agent),
                          },
                          {
                            label: 'Export JSON',
                            icon: <Download size={14} />,
                            onClick: () => handleExportSingle(agent),
                          },
                          {
                            label: 'Delete',
                            icon: <Trash2 size={14} />,
                            danger: true,
                            onClick: () => setDeleteTarget(agent),
                          },
                        ]}
                        trigger={
                          <IconButton
                            aria-label={`More actions for ${agent.name}`}
                            icon={<MoreHorizontal size={16} />}
                            size="sm"
                          />
                        }
                      />
                    </div>
                  </div>

                  <p className="text-[13px] text-secondary line-clamp-2 min-h-[2.5rem]">
                    {agent.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-subtle flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{presetName}</Badge>
                  <Badge variant="neutral" mono>
                    {agent.attachedTools.length}{' '}
                    {agent.attachedTools.length === 1 ? 'tool' : 'tools'}
                  </Badge>
                  <Badge variant="neutral" mono>
                    {agent.attachedConnectors.length}{' '}
                    {agent.attachedConnectors.length === 1
                      ? 'connector'
                      : 'connectors'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AgentFormModal
        open={formOpen}
        initialAgent={editingAgent}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import agents from JSON"
        description="Paste an exported agent JSON object or array."
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={importAgentsMutation.isPending}
              onClick={handleImportJson}
            >
              Import agents
            </Button>
          </>
        }
      >
        {importAgentsMutation.error && (
          <ErrorBanner error={importAgentsMutation.error} />
        )}
        <Textarea
          mono
          rows={8}
          value={importJsonText}
          onChange={(e) => setImportJsonText(e.target.value)}
          placeholder='[{"name": "Research Agent", "systemPrompt": "..."}]'
        />
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description="This agent will be removed from this browser."
        confirmLabel="Delete agent"
        isDestructive
        isPending={deleteAgentMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
