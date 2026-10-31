import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { CodeBlock } from '../../../shared/ui';
import { ChatToolCallRecord } from '../../../storage/interfaces/ChatRepository';

interface ChatToolCallCardProps {
  readonly toolCall: ChatToolCallRecord;
}

export function ChatToolCallCard({ toolCall }: ChatToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    toolCall.status === 'completed' ? (
      <CheckCircle2 size={14} className="text-success shrink-0" />
    ) : toolCall.status === 'unavailable' ? (
      <AlertTriangle size={14} className="text-warning shrink-0" />
    ) : toolCall.status === 'failed' ? (
      <XCircle size={14} className="text-danger shrink-0" />
    ) : (
      <Loader2 size={14} className="text-info animate-spin shrink-0" />
    );

  return (
    <div className="rounded-lg border border-subtle bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {statusIcon}
          <Wrench size={13} className="text-muted shrink-0" />
          <span className="font-mono text-[12px] font-medium text-primary truncate">
            {toolCall.toolName}
          </span>
          {toolCall.durationMs !== undefined && (
            <span className="font-mono text-[11px] text-muted tabular-nums">
              {toolCall.durationMs} ms
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown size={14} className="text-muted shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="p-3 border-t border-subtle bg-app grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-secondary">
              Input JSON
            </span>
            <CodeBlock
              code={JSON.stringify(toolCall.input ?? {}, null, 2)}
              showLineNumbers={false}
              maxHeight="max-h-40"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-secondary">
              {toolCall.error ? 'Error / Output' : 'Output JSON'}
            </span>
            <CodeBlock
              code={
                toolCall.error
                  ? JSON.stringify(
                      { error: toolCall.error, output: toolCall.output },
                      null,
                      2
                    )
                  : JSON.stringify(toolCall.output ?? null, null, 2)
              }
              showLineNumbers={false}
              maxHeight="max-h-40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
