interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: SwitchProps) {
  return (
    <label
      className={`inline-flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          checked
            ? 'bg-accent border-accent'
            : 'bg-raised border-subtle hover:border-strong'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ease-out ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className="text-[13px] font-medium text-primary leading-5">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[12px] text-secondary">{description}</span>
          )}
        </span>
      )}
    </label>
  );
}
