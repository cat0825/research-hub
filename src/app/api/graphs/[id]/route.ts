import { auth } from "@/lib/auth";
import {
  deleteKnowledgeGraph,
  getKnowledgeGraphById,
  updateKnowledgeGraph,
} from "@/lib/knowledge-graph-service.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graph = await getKnowledgeGraphById(id);

    if (!graph) {
      return Response.json({ error: "Knowledge graph not found" }, { status: 404 });
    }

    return Response.json(graph);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const graph = await updateKnowledgeGraph(id, body, session.user);
    return Response.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : 400;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteKnowledgeGraph(id, session.user);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : 400;
    return Response.json({ error: message }, { status });
  }
}
