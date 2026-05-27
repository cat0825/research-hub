import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon, NetworkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKnowledgeGraphById } from "@/lib/knowledge-graph-service.ts";
import { formatResourceDate } from "@/lib/resource-display.ts";

const SOURCE_TYPE_LABELS = {
  codebase: "代码库",
  paper: "论文",
  wiki: "知识库",
  resource_collection: "资源合集",
} as const;

export default async function KnowledgeGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let graph = null;

  try {
    graph = await getKnowledgeGraphById(id);
  } catch {
    graph = null;
  }

  if (!graph) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">没有找到这张知识图谱。</p>
        <Link href="/graphs" className="mt-3 inline-block text-sm underline">
          返回图谱广场
        </Link>
      </div>
    );
  }

  const nodes = graph.graph_json.nodes;
  const edges = graph.graph_json.edges;
  const layers = graph.graph_json.layers ?? [];
  const topNodes = nodes.slice(0, 18);
  const topEdges = edges.slice(0, 24);

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{SOURCE_TYPE_LABELS[graph.source_type]}</Badge>
              <Badge variant="outline">v{graph.graph_version}</Badge>
              <Badge variant="outline">{formatResourceDate(graph.updated_at)}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                <NetworkIcon className="size-8" />
                {graph.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {graph.summary}
              </p>
            </div>
          </div>
          {graph.source_url ? (
            <a
              href={graph.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLinkIcon className="size-4" />
              来源
            </a>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="节点" value={graph.node_count} />
          <Metric label="关系" value={graph.edge_count} />
          <Metric label="层级" value={graph.layer_count} />
          <Metric label="项目" value={graph.graph_json.project.name} />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>层级</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {layers.length === 0 ? (
              <p className="text-sm text-muted-foreground">这张图没有声明 layers。</p>
            ) : (
              layers.map((layer) => (
                <div key={layer.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{layer.name}</p>
                    <Badge variant="outline">{layer.nodeIds.length}</Badge>
                  </div>
                  {layer.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{layer.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>关键节点</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {topNodes.map((node) => (
              <div key={node.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{node.name}</p>
                  <Badge variant="outline">{node.type}</Badge>
                  <Badge variant="secondary">{node.complexity}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {node.summary}
                </p>
                {node.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {node.tags.slice(0, 6).map((tag) => (
                      <Badge key={tag} variant="ghost">{tag}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>关系预览</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {topEdges.map((edge, index) => (
            <div key={`${edge.source}-${edge.target}-${edge.type}-${index}`} className="rounded-lg border p-3 text-sm">
              <p className="font-mono text-xs text-muted-foreground">{edge.type}</p>
              <p className="mt-1 break-all">{edge.source}</p>
              <p className="text-muted-foreground">→</p>
              <p className="break-all">{edge.target}</p>
            </div>
          ))}
        </CardContent>
      </Card>
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
