interface SchemaProperty {
  readonly type?: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly enum?: readonly string[];
}

interface GeneratedParamsFormProps {
  readonly schemaJson: Record<string, unknown>;
  readonly values: Record<string, unknown>;
  readonly onChange: (next: Record<string, unknown>) => void;
}

export function GeneratedParamsForm({
  schemaJson,
  values,
  onChange,
}: GeneratedParamsFormProps) {
  const properties =
    schemaJson &&
    typeof schemaJson.properties === 'object' &&
    schemaJson.properties !== null
      ? (schemaJson.properties as Record<string, SchemaProperty>)
      : {};

  const requiredList = Array.isArray(schemaJson?.required)
    ? (schemaJson.required as string[])
    : [];

  const keys = Object.keys(properties);

  if (keys.length === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Define <code className="font-mono">properties</code> in{' '}
        <code className="font-mono">schema_json</code> to generate typed input fields automatically.
      </p>
    );
  }

  const updateKey = (key: string, val: unknown) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {keys.map((key) => {
        const prop = properties[key] ?? {};
        const isReq = requiredList.includes(key);
        const type = prop.type ?? 'string';
        const currentVal = values[key];

        return (
          <div key={key} className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="font-mono">{key}</span>
              {isReq ? ' *' : ''}{' '}
              <span className="text-slate-400">({type})</span>
            </label>
            {prop.enum && prop.enum.length > 0 ? (
              <select
                value={String(currentVal ?? '')}
                onChange={(e) => updateKey(key, e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
              >
                <option value="">Select...</option>
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : type === 'boolean' ? (
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(currentVal)}
                  onChange={(e) => updateKey(key, e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                {prop.description || 'Enabled'}
              </label>
            ) : type === 'number' || type === 'integer' ? (
              <input
                type="number"
                value={currentVal !== undefined ? String(currentVal) : ''}
                onChange={(e) =>
                  updateKey(
                    key,
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                placeholder={prop.description ?? key}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
              />
            ) : (
              <input
                type="text"
                value={currentVal !== undefined ? String(currentVal) : ''}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder={prop.description ?? key}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
