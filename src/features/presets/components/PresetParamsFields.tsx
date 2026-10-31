import { ModelPresetParams } from '../../../api/types/modelPresets.types';
import { FormField, Input, Select } from '../../../shared/ui';

interface PresetParamsFieldsProps {
  readonly value: ModelPresetParams;
  readonly onChange: (next: ModelPresetParams) => void;
}

function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
}

interface BoundedSliderFieldProps {
  readonly id: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultSliderValue: number;
  readonly value: number | null | undefined;
  readonly onChange: (next: number | undefined) => void;
}

function BoundedSliderField({
  id,
  label,
  min,
  max,
  step,
  defaultSliderValue,
  value,
  onChange,
}: BoundedSliderFieldProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? defaultSliderValue}
          onChange={(e) => onChange(parseOptionalNumber(e.target.value))}
          className="flex-1 accent-[var(--accent)] cursor-pointer"
        />
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          max={max}
          value={value ?? ''}
          placeholder="Default"
          onChange={(e) => onChange(parseOptionalNumber(e.target.value))}
          mono
          className="w-24 text-right"
        />
      </div>
    </FormField>
  );
}

export function PresetParamsFields({ value, onChange }: PresetParamsFieldsProps) {
  const updateField = <K extends keyof ModelPresetParams>(
    key: K,
    val: ModelPresetParams[K]
  ) => {
    const next = { ...value, [key]: val };
    if (val === undefined) {
      delete next[key];
    }
    onChange(next);
  };

  const stopSequencesStr = Array.isArray(value.stopSequences)
    ? value.stopSequences.join(', ')
    : '';

  const reasoningStr =
    typeof value.reasoning === 'string'
      ? value.reasoning
      : value.reasoning !== undefined && value.reasoning !== null
        ? JSON.stringify(value.reasoning)
        : '';

  const toolChoiceStr =
    typeof value.toolChoice === 'string'
      ? value.toolChoice
      : value.toolChoice
        ? JSON.stringify(value.toolChoice)
        : '';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Sampling
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BoundedSliderField
            id="param-temperature"
            label="Temperature (0–2)"
            min={0}
            max={2}
            step={0.05}
            defaultSliderValue={0.7}
            value={value.temperature}
            onChange={(v) => updateField('temperature', v)}
          />
          <BoundedSliderField
            id="param-top-p"
            label="Top P (0–1)"
            min={0}
            max={1}
            step={0.05}
            defaultSliderValue={1}
            value={value.topP}
            onChange={(v) => updateField('topP', v)}
          />
          <FormField label="Top K" htmlFor="param-top-k">
            <Input
              id="param-top-k"
              type="number"
              step="1"
              min="1"
              value={value.topK ?? ''}
              placeholder="Default"
              onChange={(e) => updateField('topK', parseOptionalNumber(e.target.value))}
              mono
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-subtle">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Penalties
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BoundedSliderField
            id="param-presence-penalty"
            label="Presence penalty (-2–2)"
            min={-2}
            max={2}
            step={0.1}
            defaultSliderValue={0}
            value={value.presencePenalty}
            onChange={(v) => updateField('presencePenalty', v)}
          />
          <BoundedSliderField
            id="param-frequency-penalty"
            label="Frequency penalty (-2–2)"
            min={-2}
            max={2}
            step={0.1}
            defaultSliderValue={0}
            value={value.frequencyPenalty}
            onChange={(v) => updateField('frequencyPenalty', v)}
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-subtle">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Output
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Max output tokens" htmlFor="param-max-tokens">
            <Input
              id="param-max-tokens"
              type="number"
              step="1"
              min="1"
              value={value.maxOutputTokens ?? ''}
              placeholder="Default"
              onChange={(e) =>
                updateField('maxOutputTokens', parseOptionalNumber(e.target.value))
              }
              mono
            />
          </FormField>

          <FormField label="Seed" htmlFor="param-seed">
            <Input
              id="param-seed"
              type="number"
              step="1"
              value={value.seed ?? ''}
              placeholder="Optional integer"
              onChange={(e) => updateField('seed', parseOptionalNumber(e.target.value))}
              mono
            />
          </FormField>

          <FormField label="Reasoning effort" htmlFor="param-reasoning">
            <Input
              id="param-reasoning"
              type="text"
              placeholder="low, medium, high, or JSON"
              value={reasoningStr}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  updateField('reasoning', undefined);
                  return;
                }
                if (raw.startsWith('{')) {
                  try {
                    updateField('reasoning', JSON.parse(raw));
                    return;
                  } catch {
                    // Keep as string while typing
                  }
                }
                updateField('reasoning', raw);
              }}
              mono
            />
          </FormField>

          <FormField label="Tool choice" htmlFor="param-tool-choice">
            <Select
              id="param-tool-choice"
              value={toolChoiceStr || ''}
              onChange={(e) =>
                updateField(
                  'toolChoice',
                  e.target.value
                    ? (e.target.value as ModelPresetParams['toolChoice'])
                    : undefined
                )
              }
            >
              <option value="">Default</option>
              <option value="auto">auto</option>
              <option value="none">none</option>
              <option value="required">required</option>
              <option value="any">any</option>
            </Select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField
              label="Stop sequences"
              htmlFor="param-stop-seq"
              hint="Comma-separated strings that halt token generation."
            >
              <Input
                id="param-stop-seq"
                type="text"
                placeholder="STOP, <|endoftext|>"
                value={stopSequencesStr}
                onChange={(e) => {
                  const parts = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateField('stopSequences', parts.length > 0 ? parts : undefined);
                }}
                mono
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );
}
