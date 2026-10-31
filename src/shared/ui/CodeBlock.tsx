import { useMemo } from 'react';

interface CodeBlockProps {
  readonly code: string;
  readonly showLineNumbers?: boolean;
  readonly maxHeight?: string;
  readonly className?: string;
}

export function CodeBlock({
  code,
  showLineNumbers = true,
  maxHeight = 'max-h-72',
  className = '',
}: CodeBlockProps) {
  const lines = useMemo(() => (code || '').split('\n'), [code]);

  return (
    <div
      className={`rounded-lg border border-subtle bg-app font-mono text-[12px] leading-5 overflow-auto ${maxHeight} ${className}`}
    >
      <div className="p-3 min-w-max">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            {showLineNumbers && (
              <span
                aria-hidden="true"
                className="w-8 pr-3 text-right select-none text-muted tabular-nums shrink-0"
              >
                {idx + 1}
              </span>
            )}
            <span className="text-primary whitespace-pre">{line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CodeEditorProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly disabled?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  rows = 12,
  placeholder,
  disabled = false,
}: CodeEditorProps) {
  const lineCount = Math.max(1, value.split('\n').length, rows);

  return (
    <div className="relative flex rounded-lg border border-subtle hover:border-strong focus-within:border-accent bg-app font-mono text-[12px] leading-5 overflow-hidden transition-colors">
      <div
        aria-hidden="true"
        className="py-2.5 pl-2.5 pr-2 bg-raised/50 border-r border-subtle text-right select-none text-muted tabular-nums shrink-0"
      >
        {Array.from({ length: lineCount }).map((_, idx) => (
          <div key={idx}>{idx + 1}</div>
        ))}
      </div>
      <textarea
        rows={rows}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full py-2.5 px-3 bg-transparent text-primary font-mono text-[12px] leading-5 focus:outline-none resize-y"
      />
    </div>
  );
}
