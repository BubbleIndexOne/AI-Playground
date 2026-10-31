import { ModelPresetParams } from '../../../api/types/modelPresets.types';

interface PresetParamsFieldsProps {
  readonly value: ModelPresetParams;
  readonly onChange: (next: ModelPresetParams) => void;
}

function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          temperature (0–2)
        </label>
        <input
          type="number"
          step="0.05"
          min="0"
          max="2"
          value={value.temperature ?? ''}
          onChange={(e) => updateField('temperature', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          topP (0–1)
        </label>
        <input
          type="number"
          step="0.05"
          min="0"
          max="1"
          value={value.topP ?? ''}
          onChange={(e) => updateField('topP', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          topK
        </label>
        <input
          type="number"
          step="1"
          min="1"
          value={value.topK ?? ''}
          onChange={(e) => updateField('topK', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          presencePenalty (-2–2)
        </label>
        <input
          type="number"
          step="0.1"
          min="-2"
          max="2"
          value={value.presencePenalty ?? ''}
          onChange={(e) => updateField('presencePenalty', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          frequencyPenalty (-2–2)
        </label>
        <input
          type="number"
          step="0.1"
          min="-2"
          max="2"
          value={value.frequencyPenalty ?? ''}
          onChange={(e) => updateField('frequencyPenalty', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          maxOutputTokens
        </label>
        <input
          type="number"
          step="1"
          min="1"
          value={value.maxOutputTokens ?? ''}
          onChange={(e) => updateField('maxOutputTokens', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          seed
        </label>
        <input
          type="number"
          step="1"
          value={value.seed ?? ''}
          onChange={(e) => updateField('seed', parseOptionalNumber(e.target.value))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          reasoning
        </label>
        <input
          type="text"
          placeholder="low | medium | high or JSON"
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
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          toolChoice
        </label>
        <select
          value={toolChoiceStr || ''}
          onChange={(e) =>
            updateField(
              'toolChoice',
              e.target.value ? (e.target.value as ModelPresetParams['toolChoice']) : undefined
            )
          }
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
        >
          <option value="">Default</option>
          <option value="auto">auto</option>
          <option value="none">none</option>
          <option value="required">required</option>
          <option value="any">any</option>
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-3 space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          stopSequences (comma-separated)
        </label>
        <input
          type="text"
          placeholder="e.g. STOP, <|endoftext|>"
          value={stopSequencesStr}
          onChange={(e) => {
            const parts = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            updateField('stopSequences', parts.length > 0 ? parts : undefined);
          }}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
        />
      </div>
    </div>
  );
}
