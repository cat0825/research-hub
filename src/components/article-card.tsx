import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import type { ArticleSummary } from "@/lib/resource-types.ts";
import { formatResourceDate } from "@/lib/resource-display.ts";

interface ArticleCardProps {
  article: ArticleSummary;
  compact?: boolean;
}

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4 transition hover:border-foreground/25 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <BookOpenIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <Link
              href={`/article/${article.id}`}
              prefetch={false}
              className="block text-base font-semibold leading-snug tracking-tight underline-offset-4 hover:underline"
            >
              {article.title}
            </Link>
            <p className={`text-sm leading-6 text-muted-foreground ${compact ? "line-clamp-2" : ""}`}>
              {article.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{article.author.github_username}</span>
            <span>{formatResourceDate(article.updated_at)}</span>
            <Link
              href={`/article/${article.id}`}
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              阅读
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
