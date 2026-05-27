import graphJson from "../../../../public/examples/transformer-knowledge-graph.json";
import Link from "next/link";
import { ArrowLeftIcon, NetworkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeGraphDocument } from "@/lib/knowledge-graph-types.ts";

const graph = graphJson as KnowledgeGraphDocument;

export default function TransformerGraphDemoPage() {
  const nodes = graph.nodes;
  const edges = graph.edges;
  const layers = graph.layers ?? [];

  return (
    <div className="space-y-7">
      <Link
        href="/graphs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        返回图谱广场
      </Link>

      <header className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>示例图谱</Badge>
          <Badge variant="outline">paper</Badge>
          <Badge variant="outline">v{graph.version}</Badge>
        </div>
        <div className="space-y-2">
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            <NetworkIcon className="size-8" />
            Transformer Understand-Anything Wiki
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            这是用 Understand-Anything 从 Transformer 论文概念 wiki 生成的示例知识图谱，展示 research-hub 如何承载共同维护的研究结构。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="节点" value={nodes.length} />
          <Metric label="关系" value={edges.length} />
          <Metric label="层级" value={layers.length} />
          <Metric label="项目" value={graph.project.name} />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>层级</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {layers.map((layer) => (
              <div key={layer.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{layer.name}</p>
                  <Badge variant="outline">{layer.nodeIds.length}</Badge>
                </div>
                {layer.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{layer.description}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>关键节点</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {nodes.slice(0, 18).map((node) => (
              <div key={node.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{node.name}</p>
                  <Badge variant="outline">{node.type}</Badge>
                  <Badge variant="secondary">{node.complexity}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {node.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </div>
  );
}
