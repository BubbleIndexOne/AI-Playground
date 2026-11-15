import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectorType } from '../../../domain/enums';
import {
  getProviderDisplayName,
  isModelProvider,
} from '../../../domain/providers';
import {
  Badge,
  BlobbieAvatar,
  BLOBBIE_PALETTE,
  BlobbieConfig,
  Button,
  Checkbox,
  Drawer,
  FormField,
  fromSeed,
  generateRandomBlobbie,
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
import { useModelCredentials } from '../../credentials/hooks/useModelCredentials';
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
  const { data: credentials } = useModelCredentials(open);
  const { data: availableTools } = useToolsListQuery(
    { include_public: true },
    open
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelPresetId, setModelPresetId] = useState('');
  const [attachedTools, setAttachedTools] = useState<AttachedAgentTool[]>([]);
  const [attachedConnectors, setAttachedConnectors] = useState<ConnectorType[]>(
    []
  );
  const [toolSearch, setToolSearch] = useState('');

  // 3-Avatar Carousel States
  const [currentAvatar, setCurrentAvatar] = useState<BlobbieConfig>(() =>
    generateRandomBlobbie()
  );
  const [nextAvatar, setNextAvatar] = useState<BlobbieConfig>(() =>
    generateRandomBlobbie()
  );
  const [prevAvatar, setPrevAvatar] = useState<BlobbieConfig | null>(null);
  const [historyStack, setHistoryStack] = useState<BlobbieConfig[]>([]);
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialAgent) {
      setName(initialAgent.name);
      setDescription(initialAgent.description);
      setSystemPrompt(initialAgent.systemPrompt);
      setModelPresetId(initialAgent.modelPresetId);
      setAttachedTools([...initialAgent.attachedTools]);
      setAttachedConnectors([...initialAgent.attachedConnectors]);

      const initialAv =
        initialAgent.avatar ?? fromSeed(initialAgent.name || initialAgent.id);
      setCurrentAvatar(initialAv);
      setNextAvatar(generateRandomBlobbie());
      setPrevAvatar(null);
      setHistoryStack([]);
    } else {
      setName('');
      setDescription('');
      setSystemPrompt('');
      setModelPresetId(presets?.[0]?.id ?? '');
      setAttachedTools([]);
      setAttachedConnectors([]);

      const initialAv = generateRandomBlobbie();
      setCurrentAvatar(initialAv);
      setNextAvatar(generateRandomBlobbie());
      setPrevAvatar(null);
      setHistoryStack([]);
    }
    setShowAdvancedCustomizer(false);
    setToolSearch('');
  }, [open, initialAgent, presets]);

  // Handle advancing to next randomized avatar in the stream
  const handleAdvanceNext = () => {
    setHistoryStack((prev) => [...prev, currentAvatar]);
    setPrevAvatar(currentAvatar);
    setCurrentAvatar(nextAvatar);
    setNextAvatar(generateRandomBlobbie());
  };

  // Handle stepping back to previous avatar
  const handleStepBack = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    const newStack = historyStack.slice(0, -1);
    setNextAvatar(currentAvatar);
    setCurrentAvatar(previous);
    setPrevAvatar(newStack.length > 0 ? newStack[newStack.length - 1] : null);
    setHistoryStack(newStack);
  };

  // Fine-tuning handler for specific parameters
  const updateCurrentAvatarParam = (
    key: keyof BlobbieConfig,
    value: number | string
  ) => {
    setCurrentAvatar((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectedPreset = useMemo(
    () => (presets ?? []).find((p) => p.id === modelPresetId) ?? null,
    [presets, modelPresetId]
  );

  const selectedProvider = selectedPreset?.provider ?? null;
  const hasSavedKeyForProvider = useMemo(() => {
    if (!selectedProvider || !isModelProvider(selectedProvider)) return false;
    return (credentials ?? []).some((c) => c.provider === selectedProvider);
  }, [credentials, selectedProvider]);

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
        systemPrompt:
          systemPrompt.trim() ||
          'You are a helpful and knowledgeable AI assistant. Respond with clarity, precision, and thoroughness.',
        modelPresetId,
        attachedTools,
        attachedConnectors,
        avatar: currentAvatar,
      });
      toast.success(initialAgent ? 'Agent profile updated' : 'Agent created');
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
      title={initialAgent ? 'Edit Agent Profile' : 'Create Digital Teammate'}
      description="Build a living AI colleague with a unique persona, avatar, instructions, and tools."
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
            {initialAgent ? 'Save profile' : 'Create teammate'}
          </Button>
        </>
      }
    >
      <form
        id="agent-drawer-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Section 1: 3-Avatar Live Stage */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-primary">
              Living Avatar Persona
            </h3>
            <span className="text-[12px] text-secondary">
              Follows cursor & reacts to touch
            </span>
          </div>

          <div className="rounded-2xl border border-subtle bg-app/40 p-4 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-4 sm:gap-8 w-full py-2">
              {/* Left slot: Skipped / Previous */}
              <div className="flex flex-col items-center gap-1.5 w-24">
                {prevAvatar ? (
                  <button
                    type="button"
                    onClick={handleStepBack}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-subtle bg-card/60 hover:bg-raised hover:border-accent transition-all cursor-pointer"
                    title="Restore previous avatar"
                  >
                    <BlobbieAvatar config={prevAvatar} size={56} interactive={false} />
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-secondary group-hover:text-primary mt-1">
                      <ChevronLeft size={12} /> Back
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center w-20 h-24 rounded-xl border border-dashed border-subtle/50 text-muted/60 text-center p-2 select-none">
                    <span className="text-[10px] leading-tight">
                      Previous will appear here
                    </span>
                  </div>
                )}
              </div>

              {/* Center slot: Active Chosen Living Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative p-2.5 rounded-full bg-gradient-to-b from-card to-raised border-2 border-accent/40 shadow-raised flex items-center justify-center">
                  <BlobbieAvatar
                    config={currentAvatar}
                    size={130}
                    interactive={true}
                    title="Active chosen avatar · Click to bounce"
                  />
                </div>
                <span className="mt-2 text-[12px] font-semibold text-primary">
                  Active Persona
                </span>
                <span className="text-[11px] text-secondary">
                  Looking at you · Click to bounce
                </span>
              </div>

              {/* Right slot: Next in line candidate */}
              <div className="flex flex-col items-center gap-1.5 w-24">
                <button
                  type="button"
                  onClick={handleAdvanceNext}
                  className="group relative flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-subtle bg-card/60 hover:bg-raised hover:border-accent transition-all cursor-pointer"
                  title="Advance to next randomized avatar"
                >
                  <BlobbieAvatar config={nextAvatar} size={56} interactive={false} />
                  <span className="flex items-center gap-0.5 text-[11px] font-medium text-secondary group-hover:text-primary mt-1">
                    Next <ChevronRight size={12} />
                  </span>
                </button>
              </div>
            </div>

            {/* Advanced Fine-Tuning Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedCustomizer((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary hover:text-primary transition-colors cursor-pointer mt-1"
            >
              <SlidersHorizontal size={13} />
              <span>
                {showAdvancedCustomizer
                  ? 'Hide fine-tuning controls'
                  : 'Fine-tune avatar features'}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  showAdvancedCustomizer ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Fine-Tuning Controls */}
            {showAdvancedCustomizer && (
              <div className="w-full pt-4 border-t border-subtle space-y-4">
                {/* Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-secondary">
                    Color Palette
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {BLOBBIE_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateCurrentAvatarParam('color', color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                          currentAvatar.color === color
                            ? 'border-primary ring-2 ring-accent'
                            : 'border-subtle'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={currentAvatar.color}
                      onChange={(e) =>
                        updateCurrentAvatarParam('color', e.target.value)
                      }
                      className="w-7 h-7 p-0 rounded-full border border-subtle cursor-pointer bg-transparent"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Silhouette</span>
                    <select
                      value={currentAvatar.sides}
                      onChange={(e) =>
                        updateCurrentAvatarParam('sides', Number(e.target.value))
                      }
                      className="rounded border border-subtle bg-card px-2 py-1 text-primary text-[12px]"
                    >
                      <option value={0}>Circle</option>
                      <option value={3}>Triangle</option>
                      <option value={4}>Square</option>
                      <option value={5}>Pentagon</option>
                      <option value={6}>Hexagon</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Roundness</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={currentAvatar.round}
                      onChange={(e) =>
                        updateCurrentAvatarParam('round', Number(e.target.value))
                      }
                      className="accent-accent"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Eye Size</span>
                    <input
                      type="range"
                      min={0.6}
                      max={1.4}
                      step={0.01}
                      value={currentAvatar.es}
                      onChange={(e) =>
                        updateCurrentAvatarParam('es', Number(e.target.value))
                      }
                      className="accent-accent"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Eye Tilt</span>
                    <input
                      type="range"
                      min={-0.5}
                      max={0.7}
                      step={0.01}
                      value={currentAvatar.tilt}
                      onChange={(e) =>
                        updateCurrentAvatarParam('tilt', Number(e.target.value))
                      }
                      className="accent-accent"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Eye Spacing</span>
                    <input
                      type="range"
                      min={0.15}
                      max={0.55}
                      step={0.01}
                      value={currentAvatar.sp}
                      onChange={(e) =>
                        updateCurrentAvatarParam('sp', Number(e.target.value))
                      }
                      className="accent-accent"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-secondary">
                    <span>Teardrop Tip</span>
                    <input
                      type="range"
                      min={0}
                      max={0.6}
                      step={0.01}
                      value={currentAvatar.point}
                      onChange={(e) =>
                        updateCurrentAvatarParam('point', Number(e.target.value))
                      }
                      className="accent-accent"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Human-Centric Identity */}
        <section className="space-y-4 pt-4 border-t border-subtle">
          <h3 className="text-[14px] font-semibold text-primary">
            Profile & Persona
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Full Name & Codename"
              required
              hint="Give your teammate a distinct identity."
            >
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Elena Vance or Marcus Chen (Security Lead)"
              />
            </FormField>

            <FormField
              label="Role & Mission"
              hint="Summarize this teammate's primary operational focus."
            >
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lead Code Auditor specializing in TypeScript concurrency & edge cases"
              />
            </FormField>
          </div>

          <FormField
            label="Working Instructions & Operating Principles"
            hint="Guide how this agent reasons, formats responses, and handles edge cases."
            rightLabel={
              <span className="font-mono tabular-nums text-muted text-[11px]">
                {systemPrompt.length} chars
              </span>
            }
          >
            <Textarea
              mono
              autoGrow
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are Marcus, a seasoned principal software engineer. You communicate with clarity, question unverified assumptions, and always provide working, verified code with edge-case considerations..."
            />
          </FormField>
        </section>

        {/* Section 3: Cognitive Model Engine */}
        <section className="space-y-3 pt-4 border-t border-subtle">
          <h3 className="text-[14px] font-semibold text-primary">
            Cognitive Model Engine
          </h3>
          <FormField
            label="Model Preset"
            hint="Defines the provider, model architecture, and execution parameters."
          >
            <Select
              value={modelPresetId}
              onChange={(e) => setModelPresetId(e.target.value)}
            >
              <option value="">Default (Automatic: based on active keys)</option>
              {(presets ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.provider} · {p.model_id})
                </option>
              ))}
            </Select>
          </FormField>

          {selectedProvider ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-subtle bg-app px-3 py-2 text-[12px]">
              <div className="flex items-center gap-2">
                {hasSavedKeyForProvider ? (
                  <>
                    <CheckCircle2 size={14} className="text-success shrink-0" />
                    <span className="text-primary font-medium">
                      {getProviderDisplayName(selectedProvider)}: key verified
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <span className="text-primary font-medium">
                      {getProviderDisplayName(selectedProvider)}: no key saved
                    </span>
                    <Badge variant="warning">No key saved</Badge>
                  </>
                )}
              </div>
              <Link
                to="/credentials"
                onClick={onClose}
                className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                <KeyRound size={12} />
                Manage API Keys
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-subtle bg-app px-3 py-2 text-[12px] text-secondary">
              <span>Select a model preset to resolve provider credentials.</span>
              <Link
                to="/credentials"
                onClick={onClose}
                className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                <KeyRound size={12} />
                API Keys
              </Link>
            </div>
          )}
        </section>

        {/* Section 4: Assigned Equipment & Tools */}
        <section className="space-y-3 pt-4 border-t border-subtle">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[14px] font-semibold text-primary">
              Assigned Equipment & Tools ({attachedTools.length} active)
            </h3>
            <div className="w-56">
              <Input
                type="search"
                leftIcon={<Search size={14} />}
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Search tools..."
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
          <h3 className="text-[14px] font-semibold text-primary">
            Integrations & Connectors
          </h3>
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
