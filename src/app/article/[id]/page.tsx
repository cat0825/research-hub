import Link from "next/link";
import { ArrowLeftIcon, Code2Icon } from "lucide-react";
import { getArticleById } from "@/lib/article-service.ts";
import { formatResourceDate } from "@/lib/resource-display.ts";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { ArticleSummary } from "@/lib/resource-types.ts";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let article: ArticleSummary | null = null;

  try {
    article = await getArticleById(id);
  } catch {
    article = null;
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">没有找到这篇文章。</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          返回资源中心
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-7">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        返回资源中心
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={`/member/${article.author.github_id}`}
            className="inline-flex items-center gap-2 hover:text-foreground"
          >
            {article.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.author.avatar_url}
                alt=""
                className="size-7 rounded-full border"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full border bg-muted text-xs">
                {article.author.github_username[0]?.toUpperCase()}
              </span>
            )}
            {article.author.github_username}
          </Link>
          <span>{formatResourceDate(article.updated_at)}</span>
          <a
            href="https://github.com/cat0825/research-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Code2Icon className="size-3.5" />
            GitHub 项目
          </a>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            {article.summary}
          </p>
        </div>
      </header>

      <div className="rounded-xl border bg-card p-5">
        <MarkdownRenderer content={article.content} />
      </div>
    </article>
  );
}
