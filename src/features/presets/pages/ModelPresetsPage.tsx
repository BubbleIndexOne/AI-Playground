import { useState } from 'react';
import { ModelPreset } from '../../../api/types/modelPresets.types';
import { AI_PROVIDERS } from '../../../domain/providers';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { formatDateTime } from '../../../shared/utils/formatters';
import { ModelPresetFormModal } from '../components/ModelPresetFormModal';
import {
  useModelPresetDefaultsQuery,
  useModelPresetMutations,
  useModelPresetsQuery,
} from '../hooks/useModelPresets';

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
  const { data: defaultsData } = useModelPresetDefaultsQuery();
  const { archiveMutation, purgeMutation } = useModelPresetMutations();

  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    if (confirmAction.mode === 'archive') {
      await archiveMutation.mutateAsync(confirmAction.preset.id);
    } else {
      await purgeMutation.mutateAsync(confirmAction.preset.id);
    }
    setConfirmAction(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Model Presets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reusable model parameter configurations with server-hydrated defaults.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPreset(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          New Model Preset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Provider:
          </label>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
          >
            <option value="">All providers</option>
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Model ID:
          </label>
          <input
            type="text"
            value={modelIdFilter}
            onChange={(e) => setModelIdFilter(e.target.value)}
            placeholder="Filter by model_id..."
            className="w-full max-w-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
          />
        </div>
      </div>

      {error && <ErrorBanner error={error} title="Failed to load model presets" />}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
          Loading model presets...
        </div>
      ) : !presets || presets.length === 0 ? (
        <EmptyState
          title="No model presets found"
          description="Create a model preset to configure temperature, topP, reasoning, and tool choice for your agents."
          actionLabel="Create First Preset"
          onAction={() => {
            setEditingPreset(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {presets.map((preset) => {
            const hydrated = preset.hydrated_params ?? preset.params;
            return (
              <div
                key={preset.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {preset.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{preset.provider}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{preset.model_id}</span>
                      {preset.is_archived && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Archived</span>
                        </>
                      )}
                      {preset.updated_at && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            Updated {formatDateTime(preset.updated_at)}
                          </span>
                        </>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                        {preset.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPreset(preset);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({ preset, mode: 'archive' })
                      }
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({ preset, mode: 'purge' })
                      }
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Configured Params
                    </span>
                    <pre className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(preset.params ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Hydrated Params (from API)
                    </span>
                    <pre className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(hydrated ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
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
            ? `Permanently delete "${confirmAction.preset.name}"?`
            : `Archive "${confirmAction?.preset.name ?? ''}"?`
        }
        description={
          confirmAction?.mode === 'purge'
            ? 'Calls DELETE /model-presets/{id}?purge=true. This cannot be undone.'
            : 'Calls DELETE /model-presets/{id} (archives by default).'
        }
        confirmLabel={
          confirmAction?.mode === 'purge' ? 'Delete Permanently' : 'Archive Preset'
        }
        isDestructive={confirmAction?.mode === 'purge'}
        isPending={archiveMutation.isPending || purgeMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
