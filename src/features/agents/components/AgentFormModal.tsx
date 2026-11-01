import { Search } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ConnectorType } from '../../../domain/enums';
import {
  Button,
  Checkbox,
  Drawer,
  FormField,
  Input,
  Select,
  Textarea,
  toast,
  ToolStatusBadge,
} from '../../../shared/ui';
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
  const { data: presets } = useModelPresetsQuery(undefined, open);
  const { data: credentials } = useCredentialsQuery();
  const { data: availableTools } = useToolsListQuery(
    { include_public: true },
    open
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelPresetId, setModelPresetId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [attachedTools, setAttachedTools] = useState<AttachedAgentTool[]>([]);
  const [attachedConnectors, setAttachedConnectors] = useState<ConnectorType[]>(
    []
  );
  const [toolSearch, setToolSearch] = useState('');

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
    setToolSearch('');
  }, [open, initialAgent, presets, credentials]);

  const filteredTools = useMemo(() => {
    const list = availableTools ?? [];
    if (!toolSearch.trim()) return list;
    const q = toolSearch.toLowerCase();
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
    );
  }, [availableTools, toolSearch]);

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
    try {
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
      toast.success(initialAgent ? 'Agent updated' : 'Agent created');
      onClose();
    } catch (err) {
      toast.error(
        'Could not save agent',
        err instanceof Error ? err.message : undefined
      );
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialAgent ? 'Edit agent' : 'Create agent'}
      description="Configure identity, instructions, model parameters, and attached capabilities."
      width="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="agent-drawer-form"
            loading={saveAgentMutation.isPending}
          >
            {initialAgent ? 'Save changes' : 'Create agent'}
          </Button>
        </>
      }
    >
      <form
        id="agent-drawer-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Section 1: Identity */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-semibold text-primary">Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Name" required>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Research assistant"
              />
            </FormField>
            <FormField label="Description">
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarizes documents and runs tools"
              />
            </FormField>
          </div>
        </section>

        {/* Section 2: System prompt */}
        <section className="space-y-3 pt-4 border-t border-subtle">
          <FormField
            label="System prompt"
            required
            rightLabel={
              <span className="font-mono tabular-nums">
                {systemPrompt.length} chars
              </span>
            }
          >
            <Textarea
              mono
              autoGrow
              rows={5}
              required
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Write instructions for how the agent should reason and respond..."
            />
          </FormField>
        </section>

        {/* Section 3: Model */}
        <section className="space-y-4 pt-4 border-t border-subtle">
          <h3 className="text-[14px] font-semibold text-primary">Model</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Model preset"
              hint="Defines provider, model ID, and sampling parameters."
            >
              <Select
                value={modelPresetId}
                onChange={(e) => setModelPresetId(e.target.value)}
              >
                <option value="">Default model settings</option>
                {(presets ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.provider} · {p.model_id})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="API key"
              hint="Used when streaming responses directly from your browser."
            >
              <Select
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
              >
                <option value="">Select a saved key...</option>
                {(credentials ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.provider})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </section>

        {/* Section 4: Tools */}
        <section className="space-y-3 pt-4 border-t border-subtle">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[14px] font-semibold text-primary">
              Tools ({attachedTools.length} selected)
            </h3>
            <div className="w-56">
              <Input
                type="search"
                leftIcon={<Search size={14} />}
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Filter tools..."
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-subtle bg-app divide-y divide-subtle">
            {filteredTools.length === 0 ? (
              <p className="p-4 text-[13px] text-secondary text-center">
                No matching tools found.
              </p>
            ) : (
              filteredTools.map((t) => {
                const attached = attachedTools.find((a) => a.toolId === t.id);
                return (
                  <div
                    key={t.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <Checkbox
                      checked={Boolean(attached)}
                      onChange={() => toggleTool(t.id)}
                      label={
                        <span className="inline-flex items-center gap-2">
                          <span>{t.name}</span>
                          <span className="font-mono text-[11px] text-muted">
                            {t.type}
                          </span>
                          <ToolStatusBadge status={t.status} />
                        </span>
                      }
                      description={t.description ?? undefined}
                    />
                    {attached && (
                      <div className="w-28 shrink-0">
                        <Input
                          type="number"
                          mono
                          min={1}
                          value={attached.pinnedVersion ?? ''}
                          onChange={(e) =>
                            updatePinnedVersion(t.id, e.target.value)
                          }
                          placeholder="Latest"
                          title="Optional pinned version number"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 5: Connectors */}
        <section className="space-y-3 pt-4 border-t border-subtle">
          <h3 className="text-[14px] font-semibold text-primary">Connectors</h3>
          <div className="flex flex-wrap items-center gap-6">
            {[ConnectorType.Postgres, ConnectorType.Slack].map((connType) => (
              <Checkbox
                key={connType}
                checked={attachedConnectors.includes(connType)}
                onChange={() => toggleConnector(connType)}
                label={<span className="capitalize">{connType}</span>}
              />
            ))}
          </div>
        </section>
      </form>
    </Drawer>
  );
}
