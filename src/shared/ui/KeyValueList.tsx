import { ReactNode } from 'react';

export interface KeyValueItem {
  readonly key: string;
  readonly value: ReactNode;
  readonly mono?: boolean;
}

export function KeyValueList({
  items,
  compact = false,
}: {
  readonly items: readonly KeyValueItem[];
  readonly compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-raised px-2 py-0.5 text-[12px]"
          >
            <span className="text-secondary">{item.key}:</span>
            <span
              className={`text-primary font-medium ${
                item.mono ? 'font-mono' : ''
              }`}
            >
              {item.value}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <dl className="divide-y divide-subtle rounded-lg border border-subtle bg-app">
      {items.map((item) => (
        <div
          key={item.key}
          className="px-3.5 py-2.5 flex items-center justify-between gap-4 text-[13px]"
        >
          <dt className="text-secondary">{item.key}</dt>
          <dd
            className={`text-primary font-medium ${
              item.mono ? 'font-mono text-[12px]' : ''
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
