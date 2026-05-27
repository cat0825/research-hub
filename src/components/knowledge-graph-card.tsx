import Link from "next/link";
import { NetworkIcon } from "lucide-react";
import type { KnowledgeGraphSummary } from "@/lib/knowledge-graph-types.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatResourceDate } from "@/lib/resource-display.ts";

const SOURCE_TYPE_LABELS: Record<KnowledgeGraphSummary["source_type"], string> = {
  codebase: "代码库",
  paper: "论文",
  wiki: "知识库",
  resource_collection: "资源合集",
};

interface KnowledgeGraphCardProps {
  graph: KnowledgeGraphSummary;
}

export function KnowledgeGraphCard({ graph }: KnowledgeGraphCardProps) {
  return (
    <Link href={`/graphs/${graph.id}`} prefetch={false} className="block">
      <Card className="transition hover:bg-muted/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle className="inline-flex items-center gap-2">
                <NetworkIcon className="size-4" />
                {graph.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{SOURCE_TYPE_LABELS[graph.source_type]}</Badge>
                <Badge variant="outline">{graph.node_count} nodes</Badge>
                <Badge variant="outline">{graph.edge_count} edges</Badge>
                <Badge variant="outline">{graph.layer_count} layers</Badge>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatResourceDate(graph.updated_at)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {graph.summary}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>by {graph.owner.github_username}</span>
            <span>version {graph.graph_version}</span>
            {graph.source_url ? <span>{new URL(graph.source_url).hostname}</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
