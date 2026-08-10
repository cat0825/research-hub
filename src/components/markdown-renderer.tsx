"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 text-2xl font-bold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-medium">{children}</h4>
  ),

  p: ({ children }) => (
    <p className="mb-4 leading-7 last:mb-0">{children}</p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-lg"
    />
  ),

  pre: ({ children }) => <div className="my-4">{children}</div>,
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm font-mono leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },

  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-6 border-border" />,

  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left text-sm font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-sm">{children}</td>
  ),

  del: ({ children }) => (
    <del className="text-muted-foreground line-through">{children}</del>
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
