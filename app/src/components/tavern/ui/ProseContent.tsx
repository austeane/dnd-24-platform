import Markdown from "react-markdown";

export interface ProseContentProps {
  content: string;
  className?: string;
}

export function ProseContent({ content, className = "" }: ProseContentProps) {
  return (
    <div
      className={`prose-tavern font-body text-ink leading-relaxed ${className}`}
    >
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 font-heading text-2xl font-bold text-ink">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 font-heading text-xl font-bold text-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-heading text-lg font-semibold text-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-sm text-ink">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-ember underline decoration-ember/30 hover:decoration-ember"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc pl-5 text-sm text-ink">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal pl-5 text-sm text-ink">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-3 border-ember/30 pl-4 italic text-ink-soft">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.startsWith("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-[var(--radius-button)] bg-cream-warm p-3 font-mono text-xs text-ink">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-cream-warm px-1.5 py-0.5 font-mono text-xs text-wood">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto">{children}</pre>
          ),
          hr: () => <hr className="my-6 border-border-light" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-ink-soft">{children}</em>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-cream-warm px-3 py-2 text-left font-heading text-xs font-bold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border-light px-3 py-2 text-ink">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
