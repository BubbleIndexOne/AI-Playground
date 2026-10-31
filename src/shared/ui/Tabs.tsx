import { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  readonly id: T;
  readonly label: string;
  readonly count?: number;
  readonly icon?: ReactNode;
}

interface TabsProps<T extends string = string> {
  readonly tabs: readonly TabItem<T>[];
  readonly activeTab: T;
  readonly onChange: (id: T) => void;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-1 border-b border-subtle overflow-x-auto"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
              isActive
                ? 'text-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="rounded bg-raised px-1.5 py-0.2 text-[11px] font-mono text-secondary tabular-nums">
                {tab.count}
              </span>
            )}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
