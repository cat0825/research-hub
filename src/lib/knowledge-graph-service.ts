import { parseKnowledgeGraphDraft } from "@/lib/knowledge-graph-form.ts";
import { getSupabase } from "@/lib/supabase";
import {
  getMissingTableSetupMessage,
  isMissingTableError,
} from "@/lib/supabase-errors.ts";
import type {
  KnowledgeGraphDetail,
  KnowledgeGraphDocument,
  KnowledgeGraphSummary,
  KnowledgeGraphSourceType,
} from "@/lib/knowledge-graph-types.ts";

interface SessionUser {
  github_id: number;
  github_username: string;
  avatar_url: string;
}

interface KnowledgeGraphFilters {
  ownerGithubId?: number;
  sourceType?: KnowledgeGraphSourceType;
  limit?: number;
}

async function ensureMemberFromSession(user: SessionUser) {
  const { error } = await getSupabase().from("members").upsert(
    {
      github_id: user.github_id,
      github_username: user.github_username,
      avatar_url: user.avatar_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "github_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

function mapOwner(owner: Record<string, unknown> | null | undefined) {
  return {
    github_id: (owner?.github_id as number | undefined) ?? 0,
    github_username: (owner?.github_username as string | undefined) ?? "unknown",
    avatar_url: (owner?.avatar_url as string | null | undefined) ?? null,
    field: (owner?.field as string | undefined) ?? "",
  };
}

function mapGraphRow(row: Record<string, unknown>): KnowledgeGraphSummary {
  return {
    id: row.id as string,
    owner: mapOwner(row.owner as Record<string, unknown> | null | undefined),
    title: row.title as string,
    summary: row.summary as string,
    source_type: row.source_type as KnowledgeGraphSourceType,
    source_url: (row.source_url as string | null | undefined) ?? null,
    graph_version: (row.graph_version as string | undefined) ?? "1.0.0",
    node_count: (row.node_count as number | undefined) ?? 0,
    edge_count: (row.edge_count as number | undefined) ?? 0,
    layer_count: (row.layer_count as number | undefined) ?? 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapGraphDetail(row: Record<string, unknown>): KnowledgeGraphDetail {
  return {
    ...mapGraphRow(row),
    graph_json: row.graph_json as KnowledgeGraphDocument,
  };
}

const GRAPH_SELECT = `
  id,
  owner_github_id,
  title,
  summary,
  source_type,
  source_url,
  graph_version,
  node_count,
  edge_count,
  layer_count,
  created_at,
  updated_at,
  owner:members!knowledge_graphs_owner_github_id_fkey(
    github_id,
    github_username,
    avatar_url,
    field
  )
`;

const GRAPH_DETAIL_SELECT = `${GRAPH_SELECT}, graph_json`;

export async function listKnowledgeGraphs(filters: KnowledgeGraphFilters = {}) {
  let query = getSupabase()
    .from("knowledge_graphs")
    .select(GRAPH_SELECT)
    .order("updated_at", { ascending: false });

  if (filters.ownerGithubId) {
    query = query.eq("owner_github_id", filters.ownerGithubId);
  }

  if (filters.sourceType) {
    query = query.eq("source_type", filters.sourceType);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, "knowledge_graphs")) {
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapGraphRow);
}

export async function getKnowledgeGraphById(graphId: string) {
  const { data, error } = await getSupabase()
    .from("knowledge_graphs")
    .select(GRAPH_DETAIL_SELECT)
    .eq("id", graphId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "knowledge_graphs")) {
      return null;
    }

    throw new Error(error.message);
  }

  return data ? mapGraphDetail(data as Record<string, unknown>) : null;
}

export async function createKnowledgeGraph(input: unknown, user: SessionUser) {
  const draft = parseKnowledgeGraphDraft(input as Parameters<typeof parseKnowledgeGraphDraft>[0]);
  await ensureMemberFromSession(user);

  const { data, error } = await getSupabase()
    .from("knowledge_graphs")
    .insert({
      owner_github_id: user.github_id,
      title: draft.title,
      summary: draft.summary,
      source_type: draft.source_type,
      source_url: draft.source_url,
      graph_json: draft.graph_json,
      graph_version: draft.graph_version,
      node_count: draft.node_count,
      edge_count: draft.edge_count,
      layer_count: draft.layer_count,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error, "knowledge_graphs")) {
      throw new Error(getMissingTableSetupMessage("knowledge_graphs"));
    }

    throw new Error(error.message);
  }

  return getKnowledgeGraphById(data.id as string);
}

export async function updateKnowledgeGraph(
  graphId: string,
  input: unknown,
  user: SessionUser
) {
  const draft = parseKnowledgeGraphDraft(input as Parameters<typeof parseKnowledgeGraphDraft>[0]);
  const { data: owner, error: ownerError } = await getSupabase()
    .from("knowledge_graphs")
    .select("owner_github_id")
    .eq("id", graphId)
    .maybeSingle();

  if (ownerError) {
    if (isMissingTableError(ownerError, "knowledge_graphs")) {
      throw new Error(getMissingTableSetupMessage("knowledge_graphs"));
    }

    throw new Error(ownerError.message);
  }

  if (!owner) {
    throw new Error("Knowledge graph not found");
  }

  if ((owner.owner_github_id as number) !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error } = await getSupabase()
    .from("knowledge_graphs")
    .update({
      title: draft.title,
      summary: draft.summary,
      source_type: draft.source_type,
      source_url: draft.source_url,
      graph_json: draft.graph_json,
      graph_version: draft.graph_version,
      node_count: draft.node_count,
      edge_count: draft.edge_count,
      layer_count: draft.layer_count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", graphId);

  if (error) {
    throw new Error(error.message);
  }

  return getKnowledgeGraphById(graphId);
}

export async function deleteKnowledgeGraph(graphId: string, user: SessionUser) {
  const { data, error } = await getSupabase()
    .from("knowledge_graphs")
    .select("owner_github_id")
    .eq("id", graphId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "knowledge_graphs")) {
      throw new Error(getMissingTableSetupMessage("knowledge_graphs"));
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Knowledge graph not found");
  }

  if ((data.owner_github_id as number) !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error: deleteError } = await getSupabase()
    .from("knowledge_graphs")
    .delete()
    .eq("id", graphId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
