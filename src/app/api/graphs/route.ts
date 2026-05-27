import { auth } from "@/lib/auth";
import {
  isKnowledgeGraphSourceType,
  type KnowledgeGraphSourceType,
} from "@/lib/knowledge-graph-types.ts";
import {
  createKnowledgeGraph,
  listKnowledgeGraphs,
} from "@/lib/knowledge-graph-service.ts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerParam = searchParams.get("owner_github_id");
    const sourceTypeParam = searchParams.get("source_type");
    const limitParam = searchParams.get("limit");
    const ownerGithubId = ownerParam ? Number(ownerParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;

    if (ownerParam && !Number.isFinite(ownerGithubId)) {
      return Response.json({ error: "Invalid owner_github_id" }, { status: 400 });
    }

    if (sourceTypeParam && !isKnowledgeGraphSourceType(sourceTypeParam)) {
      return Response.json({ error: "Invalid source_type" }, { status: 400 });
    }
    const sourceType = sourceTypeParam
      ? (sourceTypeParam as KnowledgeGraphSourceType)
      : undefined;

    if (limitParam && (!Number.isFinite(limit) || Number(limit) < 1)) {
      return Response.json({ error: "Invalid limit" }, { status: 400 });
    }

    const graphs = await listKnowledgeGraphs({
      ownerGithubId,
      sourceType,
      limit,
    });
    return Response.json(graphs);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const graph = await createKnowledgeGraph(body, session.user);
    return Response.json(graph, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
