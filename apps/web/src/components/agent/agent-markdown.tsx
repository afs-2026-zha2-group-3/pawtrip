import type { ComponentProps } from "react";
import { Markdown, type MarkdownReactOptions } from "@tanstack/markdown/react";
import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";

const markdownOptions = {
  extensions: [streamingMarkdownExtension()],
  frontmatter: false,
  headingIds: false,
  allowHtml: false,
  components: {
    p: (props: ComponentProps<"p">) => (
      <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0" {...props} />
    ),
    h1: (props: ComponentProps<"h1">) => (
      <h1 className="mt-3 mb-1 text-base font-semibold" {...props} />
    ),
    h2: (props: ComponentProps<"h2">) => (
      <h2 className="mt-3 mb-1 text-sm font-semibold" {...props} />
    ),
    h3: (props: ComponentProps<"h3">) => (
      <h3 className="mt-2 mb-1 text-sm font-semibold" {...props} />
    ),
    ul: (props: ComponentProps<"ul">) => (
      <ul className="my-1.5 list-disc pl-5" {...props} />
    ),
    ol: (props: ComponentProps<"ol">) => (
      <ol className="my-1.5 list-decimal pl-5" {...props} />
    ),
    li: (props: ComponentProps<"li">) => <li className="my-0.5" {...props} />,
    a: (props: ComponentProps<"a">) => (
      <a
        className="text-primary underline underline-offset-2"
        target="_blank"
        rel="noreferrer noopener"
        {...props}
      />
    ),
    code: (props: ComponentProps<"code">) => (
      <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props} />
    ),
    pre: (props: ComponentProps<"pre">) => (
      <pre
        className="my-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs"
        {...props}
      />
    ),
    blockquote: (props: ComponentProps<"blockquote">) => (
      <blockquote
        className="my-2 border-l-2 pl-3 text-muted-foreground"
        {...props}
      />
    ),
  },
} satisfies MarkdownReactOptions;

export function AgentMarkdown({ text }: { text: string }) {
  return (
    <div
      data-testid="agent-markdown"
      className="w-full text-sm break-words text-foreground"
    >
      <Markdown {...markdownOptions}>{text}</Markdown>
    </div>
  );
}