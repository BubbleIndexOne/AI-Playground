import { useState } from 'react';
import { ChatToolCallRecord } from '../../../storage/interfaces/ChatRepository';

interface ChatToolCallCardProps {
  readonly toolCall: ChatToolCallRecord;
}

export function ChatToolCallCard({ toolCall }: ChatToolCallCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            Tool Call: {toolCall.toolName}
          </span>
          <span aria-hidden="true">·</span>
          <span
            className={
              toolCall.status === 'completed'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : toolCall.status === 'unavailable'
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : toolCall.status === 'failed'
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-slate-500'
            }
          >
            {toolCall.status}
          </span>
          {toolCall.durationMs !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-500">
                {toolCall.durationMs} ms
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline"
        >
          {expanded ? 'Collapse' : 'Inspect'}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">
              Inputs
            </span>
            <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-36">
              {JSON.stringify(toolCall.input ?? {}, null, 2)}
            </pre>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">
              {toolCall.error ? 'Error / Output' : 'Output'}
            </span>
            <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono overflow-x-auto max-h-36">
              {toolCall.error
                ? `${toolCall.error}${
                    toolCall.output
                      ? `\n${JSON.stringify(toolCall.output, null, 2)}`
                      : ''
                  }`
                : JSON.stringify(toolCall.output ?? null, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
