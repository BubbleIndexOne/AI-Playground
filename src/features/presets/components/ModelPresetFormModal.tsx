import { FormEvent, useEffect, useState } from 'react';
import {
  CreateModelPresetSchema,
  ModelPreset,
  ModelPresetDefaults,
  ModelPresetParams,
  ModelPresetParamsSchema,
} from '../../../api/types/modelPresets.types';
import { AI_PROVIDERS } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useModelPresetMutations } from '../hooks/useModelPresets';
import { PresetParamsFields } from './PresetParamsFields';

interface ModelPresetFormModalProps {
  readonly open: boolean;
  readonly initialPreset?: ModelPreset | null;
  readonly defaultsData?: ModelPresetDefaults;
  readonly onClose: () => void;
}

function extractDefaultParams(
  defaultsData: ModelPresetDefaults | undefined,
  provider: string,
  modelId: string
): ModelPresetParams {
  if (!defaultsData) return {};
  const candidate =
    (defaultsData[provider] as Record<string, unknown> | undefined)?.[modelId] ??
    defaultsData[provider] ??
    defaultsData.params ??
    defaultsData.defaults ??
    defaultsData;
  const parsed = ModelPresetParamsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : {};
}

export function ModelPresetFormModal({
  open,
  initialPreset,
  defaultsData,
  onClose,
}: ModelPresetFormModalProps) {
  const { createMutation, updateMutation } = useModelPresetMutations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<string>(AI_PROVIDERS[0].id);
  const [modelId, setModelId] = useState<string>(AI_PROVIDERS[0].defaultModels[0]);
  const [params, setParams] = useState<ModelPresetParams>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialPreset) {
      setName(initialPreset.name);
      setDescription(initialPreset.description ?? '');
      setProvider(initialPreset.provider);
      setModelId(initialPreset.model_id);
      setParams(initialPreset.params ?? {});
    } else {
      const defProv = AI_PROVIDERS[0].id;
      const defModel = AI_PROVIDERS[0].defaultModels[0];
      setName('');
      setDescription('');
      setProvider(defProv);
      setModelId(defModel);
      setParams(extractDefaultParams(defaultsData, defProv, defModel));
    }
    setValidationError(null);
  }, [open, initialPreset, defaultsData]);

  if (!open) return null;

  const handleApplyDefaults = () => {
    setParams(extractDefaultParams(defaultsData, provider, modelId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = CreateModelPresetSchema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
      provider: provider.trim(),
      model_id: modelId.trim(),
      params,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    if (initialPreset) {
      await updateMutation.mutateAsync({
        id: initialPreset.id,
        body: parsed.data,
      });
    } else {
      await createMutation.mutateAsync(parsed.data);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;
  const providerMeta = AI_PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-5 my-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {initialPreset ? 'Edit Model Preset' : 'Create Model Preset'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prefilled from GET /model-presets/defaults when available.
            </p>
          </div>
          <button
            type="button"
            onClick={handleApplyDefaults}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Reset to Server Defaults
          </button>
        </div>

        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {mutationError && <ErrorBanner error={mutationError} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Preset Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Balanced Coding Preset"
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Provider *
            </label>
            <select
              value={provider}
              onChange={(e) => {
                const nextProv = e.target.value;
                setProvider(nextProv);
                const found = AI_PROVIDERS.find((p) => p.id === nextProv);
                if (found && found.defaultModels[0]) {
                  setModelId(found.defaultModels[0]);
                }
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Model ID *
            </label>
            <input
              type="text"
              required
              list="preset-model-suggestions"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
            <datalist id="preset-model-suggestions">
              {providerMeta?.defaultModels.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Generation Parameters
          </h3>
          <PresetParamsFields value={params} onChange={setParams} />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Saving...' : initialPreset ? 'Save Preset' : 'Create Preset'}
          </button>
        </div>
      </form>
    </div>
  );
}
