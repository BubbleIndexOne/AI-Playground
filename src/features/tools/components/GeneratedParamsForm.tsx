import {
  Checkbox,
  FormField,
  Input,
  Select,
} from '../../../shared/ui';

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
      <p className="text-[12px] text-secondary">
        Add <code className="font-mono">properties</code> in the JSON schema to generate input fields automatically.
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
          <FormField
            key={key}
            label={key}
            required={isReq}
            rightLabel={<span className="font-mono">{type}</span>}
          >
            {prop.enum && prop.enum.length > 0 ? (
              <Select
                mono
                value={String(currentVal ?? '')}
                onChange={(e) => updateKey(key, e.target.value)}
              >
                <option value="">Select...</option>
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            ) : type === 'boolean' ? (
              <div className="pt-1">
                <Checkbox
                  checked={Boolean(currentVal)}
                  onChange={(checked) => updateKey(key, checked)}
                  label={prop.description || 'Enabled'}
                />
              </div>
            ) : type === 'number' || type === 'integer' ? (
              <Input
                type="number"
                mono
                value={currentVal !== undefined ? String(currentVal) : ''}
                onChange={(e) =>
                  updateKey(
                    key,
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                placeholder={prop.description ?? key}
              />
            ) : (
              <Input
                type="text"
                mono
                value={currentVal !== undefined ? String(currentVal) : ''}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder={prop.description ?? key}
              />
            )}
          </FormField>
        );
      })}
    </div>
  );
}
