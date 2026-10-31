import { RotateCcw } from 'lucide-react';
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
import {
  Button,
  Dialog,
  FormField,
  Input,
  Select,
  toast,
} from '../../../shared/ui';
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

  const handleApplyDefaults = () => {
    setParams(extractDefaultParams(defaultsData, provider, modelId));
    toast.info('Defaults restored', 'Parameters reset to server defaults.');
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
      toast.success('Preset updated', `Saved changes to "${parsed.data.name}".`);
    } else {
      await createMutation.mutateAsync(parsed.data);
      toast.success('Preset created', `Created "${parsed.data.name}".`);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;
  const providerMeta = AI_PROVIDERS.find((p) => p.id === provider);

  return (
    <Dialog
      open={open}
      title={initialPreset ? 'Edit model preset' : 'New model preset'}
      description="Configure model selection and generation parameters."
      maxWidth="2xl"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {mutationError && <ErrorBanner error={mutationError} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Preset name" htmlFor="preset-name" required>
            <Input
              id="preset-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Balanced coding preset"
            />
          </FormField>

          <FormField label="Description" htmlFor="preset-desc">
            <Input
              id="preset-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </FormField>

          <FormField label="Provider" htmlFor="preset-provider" required>
            <Select
              id="preset-provider"
              value={provider}
              onChange={(e) => {
                const nextProv = e.target.value;
                setProvider(nextProv);
                const found = AI_PROVIDERS.find((p) => p.id === nextProv);
                if (found && found.defaultModels[0]) {
                  setModelId(found.defaultModels[0]);
                }
              }}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Model ID" htmlFor="preset-model-id" required>
            <Input
              id="preset-model-id"
              type="text"
              required
              list="preset-model-suggestions"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              mono
            />
            <datalist id="preset-model-suggestions">
              {providerMeta?.defaultModels.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </FormField>
        </div>

        <div className="pt-4 border-t border-subtle space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-primary">
              Generation parameters
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleApplyDefaults}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to defaults
            </Button>
          </div>
          <PresetParamsFields value={params} onChange={setParams} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-subtle">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isPending}>
            {initialPreset ? 'Save changes' : 'Create preset'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
