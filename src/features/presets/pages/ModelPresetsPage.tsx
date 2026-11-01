import { Archive, Pencil, Plus, Sliders, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ModelPreset, ModelPresetParams } from '../../../api/types/modelPresets.types';
import { AI_PROVIDERS } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  CardGridSkeleton,
  ConfirmDialog,
  EmptyState,
  Input,
  KeyValueList,
  PageHeader,
  Select,
  Tooltip,
  toast,
} from '../../../shared/ui';
import { formatDateTime, formatRelativeTime } from '../../../shared/utils/formatters';
import { ModelPresetFormModal } from '../components/ModelPresetFormModal';
import {
  useModelPresetDefaultsQuery,
  useModelPresetMutations,
  useModelPresetsQuery,
} from '../hooks/useModelPresets';

function formatParamsToItems(params: ModelPresetParams | undefined) {
  if (!params) return [];
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, val]) => ({
      key,
      value:
        typeof val === 'object' ? JSON.stringify(val) : String(val),
      mono: true,
    }));
}

export function ModelPresetsPage() {
  const [providerFilter, setProviderFilter] = useState('');
  const [modelIdFilter, setModelIdFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ModelPreset | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    preset: ModelPreset;
    mode: 'archive' | 'purge';
  } | null>(null);

  const { data: presets, isLoading, error } = useModelPresetsQuery({
    provider: providerFilter || undefined,
    model_id: modelIdFilter.trim() || undefined,
  });
  const { data: defaultsData } = useModelPresetDefaultsQuery(modalOpen);
  const { archiveMutation, purgeMutation } = useModelPresetMutations();

  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    if (confirmAction.mode === 'archive') {
      await archiveMutation.mutateAsync(confirmAction.preset.id);
      toast.success('Preset archived', `Archived "${confirmAction.preset.name}".`);
    } else {
      await purgeMutation.mutateAsync(confirmAction.preset.id);
      toast.success('Preset deleted', `Deleted "${confirmAction.preset.name}".`);
    }
    setConfirmAction(null);
  };

  const hasPresets = Boolean(presets && presets.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Presets"
        description="Reusable model parameter configurations with server-hydrated defaults."
        actions={
          hasPresets ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingPreset(null);
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New preset
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            aria-label="Filter by provider"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">All providers</option>
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-64">
          <Input
            type="search"
            value={modelIdFilter}
            onChange={(e) => setModelIdFilter(e.target.value)}
            placeholder="Filter by model ID…"
            mono
          />
        </div>
      </div>

      {error && <ErrorBanner error={error} title="Failed to load model presets" />}

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : !presets || presets.length === 0 ? (
        <EmptyState
          icon={<Sliders className="w-5 h-5" />}
          title="No model presets found"
          description="Create a model preset to configure sampling, penalties, and output behavior for your agents."
          actionLabel="Create preset"
          onAction={() => {
            setEditingPreset(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => {
            const hydrated = preset.hydrated_params ?? preset.params;
            const paramItems = formatParamsToItems(hydrated);

            return (
              <Card
                key={preset.id}
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-primary truncate">
                          {preset.name}
                        </h3>
                        {preset.is_archived && (
                          <Badge variant="warning">Archived</Badge>
                        )}
                      </div>
                      {preset.description && (
                        <p className="text-[13px] text-secondary line-clamp-2">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="neutral" mono>
                        {preset.provider}
                      </Badge>
                      <Badge variant="info" mono>
                        {preset.model_id}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-muted">
                      Effective parameters
                    </span>
                    <KeyValueList items={paramItems} compact />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
                  <span className="text-[11px] text-muted">
                    {preset.updated_at ? (
                      <Tooltip content={formatDateTime(preset.updated_at)}>
                        <span className="underline decoration-dotted cursor-default">
                          Updated {formatRelativeTime(preset.updated_at)}
                        </span>
                      </Tooltip>
                    ) : (
                      'Saved'
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingPreset(preset);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    {!preset.is_archived && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({ preset, mode: 'archive' })
                        }
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() =>
                        setConfirmAction({ preset, mode: 'purge' })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ModelPresetFormModal
        open={modalOpen}
        initialPreset={editingPreset}
        defaultsData={defaultsData}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.mode === 'purge'
            ? `Delete "${confirmAction.preset.name}" permanently?`
            : `Archive "${confirmAction?.preset.name ?? ''}"?`
        }
        description={
          confirmAction?.mode === 'purge'
            ? 'This permanently removes the model preset and cannot be undone.'
            : 'Archived presets remain stored but are hidden from active selection.'
        }
        confirmLabel={
          confirmAction?.mode === 'purge' ? 'Delete preset' : 'Archive preset'
        }
        isDestructive={confirmAction?.mode === 'purge'}
        isPending={archiveMutation.isPending || purgeMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
