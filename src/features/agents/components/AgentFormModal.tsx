import { FormEvent, useEffect, useState } from 'react';
import { ConnectorType } from '../../../domain/enums';
import {
  AgentRecord,
  AttachedAgentTool,
} from '../../../storage/interfaces/AgentRepository';
import { useCredentialsQuery } from '../../credentials/hooks/useCredentials';
import { useModelPresetsQuery } from '../../presets/hooks/useModelPresets';
import { useToolsListQuery } from '../../tools/hooks/useTools';
import { useAgentMutations } from '../hooks/useAgents';

interface AgentFormModalProps {
  readonly open: boolean;
  readonly initialAgent?: AgentRecord | null;
  readonly onClose: () => void;
}

export function AgentFormModal({
  open,
  initialAgent,
  onClose,
}: AgentFormModalProps) {
  const { saveAgentMutation } = useAgentMutations();
  const { data: presets } = useModelPresetsQuery();
  const { data: credentials } = useCredentialsQuery();
  const { data: availableTools } = useToolsListQuery({ include_public: true });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelPresetId, setModelPresetId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [attachedTools, setAttachedTools] = useState<AttachedAgentTool[]>([]);
  const [attachedConnectors, setAttachedConnectors] = useState<ConnectorType[]>(
    []
  );

  useEffect(() => {
    if (!open) return;
    if (initialAgent) {
      setName(initialAgent.name);
      setDescription(initialAgent.description);
      setSystemPrompt(initialAgent.systemPrompt);
      setModelPresetId(initialAgent.modelPresetId);
      setCredentialId(initialAgent.credentialId);
      setAttachedTools([...initialAgent.attachedTools]);
      setAttachedConnectors([...initialAgent.attachedConnectors]);
    } else {
      setName('');
      setDescription('');
      setSystemPrompt('You are a helpful AI assistant.');
      setModelPresetId(presets?.[0]?.id ?? '');
      setCredentialId(credentials?.[0]?.id ?? '');
      setAttachedTools([]);
      setAttachedConnectors([]);
    }
  }, [open, initialAgent, presets, credentials]);

  if (!open) return null;

  const toggleTool = (toolId: string) => {
    setAttachedTools((prev) =>
      prev.some((t) => t.toolId === toolId)
        ? prev.filter((t) => t.toolId !== toolId)
        : [...prev, { toolId, pinnedVersion: null }]
    );
  };

  const updatePinnedVersion = (toolId: string, val: string) => {
    setAttachedTools((prev) =>
      prev.map((t) =>
        t.toolId === toolId
          ? { ...t, pinnedVersion: val.trim() ? Number(val) : null }
          : t
      )
    );
  };

  const toggleConnector = (type: ConnectorType) => {
    setAttachedConnectors((prev) =>
      prev.includes(type) ? prev.filter((c) => c !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveAgentMutation.mutateAsync({
      id: initialAgent?.id,
      name: name.trim(),
      description: description.trim(),
      systemPrompt,
      modelPresetId,
      credentialId,
      attachedTools,
      attachedConnectors,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4 my-8"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {initialAgent ? 'Edit Agent' : 'Create Agent'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Agent Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Research Assistant"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            System Prompt *
          </label>
          <textarea
            rows={4}
            required
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Model Preset
            </label>
            <select
              value={modelPresetId}
              onChange={(e) => setModelPresetId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
            >
              <option value="">Select model preset...</option>
              {(presets ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.provider} / {p.model_id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              BYOK Credential
            </label>
            <select
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
            >
              <option value="">Select API key credential...</option>
              {(credentials ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
            Attached Tools (optional version pinning)
          </span>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {(availableTools ?? []).length === 0 ? (
              <p className="p-3 text-xs text-slate-500">
                No tools available yet.
              </p>
            ) : (
              (availableTools ?? []).map((t) => {
                const attached = attachedTools.find((a) => a.toolId === t.id);
                return (
                  <div
                    key={t.id}
                    className="p-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(attached)}
                        onChange={() => toggleTool(t.id)}
                        className="rounded border-slate-300 dark:border-slate-700"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {t.name}
                      </span>
                      <span className="font-mono text-slate-500">({t.type})</span>
                    </label>
                    {attached && (
                      <input
                        type="number"
                        min={1}
                        value={attached.pinnedVersion ?? ''}
                        onChange={(e) => updatePinnedVersion(t.id, e.target.value)}
                        placeholder="Pin version #"
                        className="w-28 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs font-mono"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
            Attached Connectors
          </span>
          <div className="flex items-center gap-4 text-xs">
            {[ConnectorType.Postgres, ConnectorType.Slack].map((connType) => (
              <label
                key={connType}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={attachedConnectors.includes(connType)}
                  onChange={() => toggleConnector(connType)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span className="capitalize">{connType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveAgentMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            {saveAgentMutation.isPending ? 'Saving...' : 'Save Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
