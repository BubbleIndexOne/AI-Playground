import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import katex from 'katex';
import { marked } from 'marked';

interface MarkdownRendererProps {
  readonly content: string;
}

interface InteractiveCodeBlockProps {
  readonly code: string;
  readonly language?: string;
}

function InteractiveCodeBlock({ code, language }: InteractiveCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = useMemo(() => (code || '').split('\n'), [code]);

  return (
    <div className="rounded-xl border border-subtle bg-app overflow-hidden my-3 shadow-sm">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-raised/60 border-b border-subtle text-[11px]">
        <span className="font-mono font-medium text-secondary lowercase">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-hover text-secondary hover:text-primary transition-colors cursor-pointer select-none"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} className="text-success" />
              <span className="text-success font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Line Numbers */}
      <div className="p-3 font-mono text-[12px] leading-5 overflow-x-auto no-scrollbar">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span
              aria-hidden="true"
              className="w-8 pr-3 text-right select-none text-muted tabular-nums shrink-0"
            >
              {idx + 1}
            </span>
            <span className="text-primary whitespace-pre">{line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compiles a markdown segment with KaTeX LaTeX math support.
 */
function compileMarkdownAndMath(content: string): string {
  if (!content) return '';

  const mathPlaceholders: { [key: string]: string } = {};
  let counter = 0;

  // 1. Protect inline code spans so math symbols inside backticks are never processed
  const codePlaceholders: { [key: string]: string } = {};
  let text = content.replace(/(`[^`]+`)/g, (match) => {
    const key = `%%CODE_INLINE_${counter++}%%`;
    codePlaceholders[key] = match;
    return key;
  });

  // 2. Extract Display Math: $$...$$ or \[...\]
  text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
    const rawTex = match.startsWith('$$')
      ? match.slice(2, -2).trim()
      : match.slice(2, -2).trim();
    const key = `%%DISPLAY_MATH_${counter++}%%`;
    try {
      const rendered = katex.renderToString(rawTex, {
        displayMode: true,
        throwOnError: false,
      });
      mathPlaceholders[key] = `<div class="katex-display-block my-3 overflow-x-auto text-center font-serif text-[15px] py-1">${rendered}</div>`;
    } catch {
      mathPlaceholders[key] = `<code class="font-mono text-[12px] bg-raised px-1 py-0.5 rounded">${match}</code>`;
    }
    return `\n\n${key}\n\n`;
  });

  // 3. Extract Inline Math: $...$ or \(...\)
  // Ensures we don't match currency like $100 or $42.50 or escaped \$
  text = text.replace(
    /((?<!\\)\$([^\s\$](?:[^\$]*?[^\s\$])?)\$(?!\d)|\\\(([\s\S]*?)\\\))/g,
    (match, _, p1, p2) => {
      const rawTex = (p1 ?? p2 ?? '').trim();
      if (!rawTex) return match;
      const key = `%%INLINE_MATH_${counter++}%%`;
      try {
        const rendered = katex.renderToString(rawTex, {
          displayMode: false,
          throwOnError: false,
        });
        mathPlaceholders[key] = `<span class="katex-inline-formula font-serif px-0.5">${rendered}</span>`;
      } catch {
        mathPlaceholders[key] = `<code class="font-mono text-[12px] bg-raised px-1 py-0.5 rounded">${match}</code>`;
      }
      return key;
    }
  );

  // 4. Restore inline code spans
  for (const [key, code] of Object.entries(codePlaceholders)) {
    text = text.replace(key, code);
  }

  // 5. Run GFM marked compilation
  let html = marked.parse(text, { gfm: true, breaks: true }) as string;

  // 6. Restore math placeholders
  for (const [key, renderedMath] of Object.entries(mathPlaceholders)) {
    html = html.replace(`<p>${key}</p>`, renderedMath);
    html = html.replaceAll(key, renderedMath);
  }

  return html;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by fenced code blocks (```lang ... ```)
  const segments = useMemo(() => {
    const parts: Array<
      | { type: 'code'; code: string; language: string }
      | { type: 'markdown'; content: string }
    > = [];

    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index).trim();
        if (text) {
          parts.push({ type: 'markdown', content: text });
        }
      }

      parts.push({
        type: 'code',
        language: match[1] || '',
        code: match[2].replace(/\n$/, ''),
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      const text = content.slice(lastIndex).trim();
      if (text) {
        parts.push({ type: 'markdown', content: text });
      }
    }

    return parts;
  }, [content]);

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-primary">
      {segments.map((segment, idx) => {
        if (segment.type === 'code') {
          return (
            <InteractiveCodeBlock
              key={idx}
              code={segment.code}
              language={segment.language}
            />
          );
        }

        const html = compileMarkdownAndMath(segment.content);

        return (
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            className="prose-chat space-y-2 [&_h1]:text-[18px] [&_h1]:font-semibold [&_h1]:text-primary [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:leading-relaxed [&_p]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-1.5 [&_li]:leading-relaxed [&_li>ul]:mt-1 [&_li>ul]:pl-4 [&_li>ol]:mt-1 [&_li>ol]:pl-4 [&_strong]:font-semibold [&_strong]:text-primary [&_blockquote]:border-l-4 [&_blockquote]:border-accent/60 [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:text-secondary [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:bg-raised/20 [&_blockquote]:rounded-r-lg [&_a]:text-accent [&_a]:hover:underline [&_a]:font-medium [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-subtle [&_table]:my-3 [&_table]:text-[13px] [&_table]:rounded-lg [&_table]:overflow-hidden [&_th]:bg-raised/70 [&_th]:border [&_th]:border-subtle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-primary [&_td]:border [&_td]:border-subtle [&_td]:px-3 [&_td]:py-2 [&_td]:text-secondary [&_tr:nth-child(even)]:bg-raised/20 [&_code]:rounded [&_code]:bg-raised/80 [&_code]:border [&_code]:border-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-primary"
          />
        );
      })}
    </div>
  );
}
