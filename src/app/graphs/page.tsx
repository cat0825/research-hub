import Link from "next/link";
import { NetworkIcon, PenLineIcon } from "lucide-react";
import { KnowledgeGraphCard } from "@/components/knowledge-graph-card";
import { buttonVariants } from "@/components/ui/button";
import { listKnowledgeGraphs } from "@/lib/knowledge-graph-service.ts";
import type { KnowledgeGraphSummary } from "@/lib/knowledge-graph-types.ts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GraphsPage() {
  let graphs: KnowledgeGraphSummary[] = [];
  let error = "";

  try {
    graphs = await listKnowledgeGraphs();
  } catch {
    error = "知识图谱加载失败，请确认数据库已执行最新 schema。";
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Knowledge Graphs
          </p>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <NetworkIcon className="size-7" />
            共同维护研究知识图谱
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            上传 Understand-Anything 生成的 knowledge-graph.json，把论文、知识库和项目理解变成大家可浏览、可讨论、可继续维护的公共结构。
          </p>
        </div>
        <Link href="/profile" className={cn(buttonVariants(), "gap-1.5")}>
          <PenLineIcon />
          发布图谱
        </Link>
      </section>

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {graphs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          还没有知识图谱。先在个人页发布第一张 graph。
        </div>
      ) : (
        <div className="grid gap-4">
          {graphs.map((graph) => (
            <KnowledgeGraphCard key={graph.id} graph={graph} />
          ))}
        </div>
      )}
    </div>
  );
}
