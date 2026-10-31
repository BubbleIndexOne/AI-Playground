import { ReactNode } from 'react';
import { CodeBlock } from '../../../shared/ui';

interface MarkdownRendererProps {
  readonly content: string;
}

function renderInlineFormatting(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded bg-raised border border-subtle px-1.5 py-0.5 font-mono text-[12px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-primary">
      {segments.map((segment, idx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const inner = segment.slice(3, -3);
          const firstNewline = inner.indexOf('\n');
          const codeBody =
            firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;
          return (
            <CodeBlock
              key={idx}
              code={codeBody.replace(/\n$/, '')}
              showLineNumbers
              maxHeight="max-h-80"
            />
          );
        }

        const paragraphs = segment
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

        return paragraphs.map((para, pIdx) => {
          if (para.startsWith('### ')) {
            return (
              <h4
                key={`${idx}-${pIdx}`}
                className="text-[15px] font-semibold text-primary pt-1"
              >
                {para.slice(4)}
              </h4>
            );
          }
          if (para.startsWith('## ')) {
            return (
              <h3
                key={`${idx}-${pIdx}`}
                className="text-[16px] font-semibold text-primary pt-1"
              >
                {para.slice(3)}
              </h3>
            );
          }
          if (para.startsWith('# ')) {
            return (
              <h2
                key={`${idx}-${pIdx}`}
                className="text-[18px] font-semibold text-primary pt-1"
              >
                {para.slice(2)}
              </h2>
            );
          }

          const lines = para.split('\n');
          if (lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
            return (
              <ul
                key={`${idx}-${pIdx}`}
                className="list-disc pl-5 space-y-1 text-primary"
              >
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>
                    {renderInlineFormatting(line.trim().slice(2))}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`${idx}-${pIdx}`} className="whitespace-pre-wrap">
              {renderInlineFormatting(para)}
            </p>
          );
        });
      })}
    </div>
  );
}
