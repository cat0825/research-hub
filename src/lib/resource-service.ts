import { getSupabase } from "./supabase.ts";
import {
  DEFAULT_RESOURCE_LIMIT,
  type ResourceFilters,
  type ResourceSort,
} from "./resource-queries.ts";
import { parseResourceDraft } from "./resource-form.ts";
import type {
  MemberSummary,
  ResourceComment,
  ResourceSummary,
  ResourceTag,
} from "@/lib/resource-types.ts";

interface SessionUser {
  github_id: number;
  github_username: string;
  avatar_url: string;
}

interface ResourceDraftPayload {
  title: string;
  url: string;
  type: string;
  summary: string;
  tags: string;
}

const RESOURCE_SUMMARY_SELECT = `
  id,
  owner_github_id,
  title,
  url,
  type,
  summary,
  created_at,
  updated_at,
  owner:members!resources_owner_github_id_fkey(
    github_id,
    github_username,
    avatar_url,
    field,
    created_at,
    updated_at
  )
`;

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureMemberFromSession(user: SessionUser, field = "") {
  const { error } = await getSupabase().from("members").upsert(
    {
      github_id: user.github_id,
      github_username: user.github_username,
      avatar_url: user.avatar_url,
      field,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "github_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function resolveTagIds(tagNames: string[]): Promise<ResourceTag[]> {
  if (tagNames.length === 0) {
    return [];
  }

  const payload = tagNames.map((name) => {
    const slug = toSlug(name);
    return {
      slug,
      name,
    };
  });

  const { data, error } = await getSupabase()
    .from("tags")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug, name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ResourceTag[];
}

async function syncResourceTags(resourceId: string, tagNames: string[]) {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase
    .from("resource_tags")
    .delete()
    .eq("resource_id", resourceId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const tags = await resolveTagIds(tagNames);
  if (tags.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("resource_tags").insert(
    tags.map((tag) => ({
      resource_id: resourceId,
      tag_id: tag.id,
    }))
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function mapOwner(owner: Partial<MemberSummary> | null | undefined): MemberSummary {
  return {
    github_id: owner?.github_id ?? 0,
    github_username: owner?.github_username ?? "unknown",
    avatar_url: owner?.avatar_url ?? null,
    field: owner?.field ?? "",
    created_at: owner?.created_at,
    updated_at: owner?.updated_at,
    resource_count: owner?.resource_count,
  };
}

async function fetchResourceTags(resourceIds: string[]): Promise<Map<string, ResourceTag[]>> {
  const tagsByResource = new Map<string, ResourceTag[]>();
  if (resourceIds.length === 0) {
    return tagsByResource;
  }

  const { data, error } = await getSupabase()
    .from("resource_tags")
    .select("resource_id, tags(id, slug, name)")
    .in("resource_id", resourceIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const resourceId = row.resource_id as string;
    const tags = tagsByResource.get(resourceId) ?? [];
    const relatedTags = Array.isArray(row.tags)
      ? (row.tags as ResourceTag[])
      : row.tags
        ? ([row.tags] as ResourceTag[])
        : [];

    if (relatedTags.length > 0) {
      tags.push(...relatedTags);
      tagsByResource.set(resourceId, tags);
    }
  }

  return tagsByResource;
}

async function fetchCountMap(
  table: "resource_comments" | "resource_bookmarks",
  column: "resource_id",
  resourceIds: string[]
) {
  const counts = new Map<string, number>();
  if (resourceIds.length === 0) {
    return counts;
  }

  const { data, error } = await getSupabase()
    .from(table)
    .select(column)
    .in(column, resourceIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const id = row[column] as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

async function fetchBookmarkedIds(resourceIds: string[], viewerGithubId?: number) {
  const bookmarkedIds = new Set<string>();
  if (!viewerGithubId || resourceIds.length === 0) {
    return bookmarkedIds;
  }

  const { data, error } = await getSupabase()
    .from("resource_bookmarks")
    .select("resource_id")
    .in("resource_id", resourceIds)
    .eq("user_github_id", viewerGithubId);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    bookmarkedIds.add(row.resource_id as string);
  }

  return bookmarkedIds;
}

function mapResourceRow(
  row: Record<string, unknown>,
  tagsByResource: Map<string, ResourceTag[]>,
  commentCounts: Map<string, number>,
  bookmarkCounts: Map<string, number>,
  bookmarkedIds: Set<string>
): ResourceSummary {
  const id = row.id as string;

  return {
    id,
    title: row.title as string,
    url: row.url as string,
    type: row.type as ResourceSummary["type"],
    summary: row.summary as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    owner: mapOwner(row.owner as Partial<MemberSummary> | null | undefined),
    tags: tagsByResource.get(id) ?? [],
    comment_count: commentCounts.get(id) ?? 0,
    bookmark_count: bookmarkCounts.get(id) ?? 0,
    is_bookmarked: bookmarkedIds.has(id),
  };
}

async function hydrateResourceRows(
  rows: Record<string, unknown>[],
  viewerGithubId?: number
): Promise<ResourceSummary[]> {
  const resourceIds = rows.map((row) => row.id as string);
  const [tagsByResource, commentCounts, bookmarkCounts, bookmarkedIds] =
    await Promise.all([
      fetchResourceTags(resourceIds),
      fetchCountMap("resource_comments", "resource_id", resourceIds),
      fetchCountMap("resource_bookmarks", "resource_id", resourceIds),
      fetchBookmarkedIds(resourceIds, viewerGithubId),
    ]);

  return rows.map((row) =>
    mapResourceRow(row, tagsByResource, commentCounts, bookmarkCounts, bookmarkedIds)
  );
}

export interface RelatedResourcesPayload {
  by_owner: ResourceSummary[];
  by_tag: ResourceSummary[];
}

function compareDateDesc(left: ResourceSummary, right: ResourceSummary): number {
  return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
}

export function sortResourceSummaries(
  resources: ResourceSummary[],
  sort: ResourceSort
): ResourceSummary[] {
  const next = [...resources];

  if (sort === "discussed") {
    return next.sort(
      (left, right) =>
        right.comment_count - left.comment_count || compareDateDesc(left, right)
    );
  }

  if (sort === "bookmarked") {
    return next.sort(
      (left, right) =>
        right.bookmark_count - left.bookmark_count || compareDateDesc(left, right)
    );
  }

  return next.sort(compareDateDesc);
}

async function resolveTaggedResourceIds(tagSlug: string): Promise<string[] | null> {
  const { data: tagRows, error: tagError } = await getSupabase()
    .from("tags")
    .select("id")
    .eq("slug", tagSlug)
    .limit(1);

  if (tagError) {
    throw new Error(tagError.message);
  }

  const tagId = tagRows?.[0]?.id as string | undefined;
  if (!tagId) {
    return [];
  }

  const { data, error } = await getSupabase()
    .from("resource_tags")
    .select("resource_id")
    .eq("tag_id", tagId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.resource_id as string);
}

export async function listResources(filters: ResourceFilters, viewerGithubId?: number) {
  const taggedIds =
    filters.tag ? await resolveTaggedResourceIds(filters.tag) : null;

  if (taggedIds && taggedIds.length === 0) {
    return [];
  }

  let query = getSupabase()
    .from("resources")
    .select(RESOURCE_SUMMARY_SELECT)
    .limit(filters.limit ?? DEFAULT_RESOURCE_LIMIT)
    .order("updated_at", { ascending: false });

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.ownerGithubId) {
    query = query.eq("owner_github_id", filters.ownerGithubId);
  }

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,summary.ilike.%${filters.q}%`
    );
  }

  if (taggedIds) {
    query = query.in("id", taggedIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const mapped = await hydrateResourceRows(rows, viewerGithubId);

  return sortResourceSummaries(mapped, filters.sort);
}

export async function getResourceById(resourceId: string, viewerGithubId?: number) {
  const { data, error } = await getSupabase()
    .from("resources")
    .select(RESOURCE_SUMMARY_SELECT)
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [resource] = await hydrateResourceRows(
    [data as Record<string, unknown>],
    viewerGithubId
  );
  return resource;
}

export async function listRelatedResources(
  resourceId: string,
  viewerGithubId?: number
): Promise<RelatedResourcesPayload> {
  const resource = await getResourceById(resourceId, viewerGithubId);
  if (!resource) {
    return { by_owner: [], by_tag: [] };
  }

  const byOwnerPromise = getSupabase()
    .from("resources")
    .select(RESOURCE_SUMMARY_SELECT)
    .eq("owner_github_id", resource.owner.github_id)
    .neq("id", resourceId)
    .order("updated_at", { ascending: false })
    .limit(3);

  const tagIds = resource.tags.map((tag) => tag.id);
  const byTagPromise =
    tagIds.length > 0
      ? getSupabase()
          .from("resources")
          .select(`${RESOURCE_SUMMARY_SELECT}, resource_tags!inner(tag_id)`)
          .in("resource_tags.tag_id", tagIds)
          .neq("id", resourceId)
          .order("updated_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [], error: null });

  const [byOwnerResult, byTagResult] = await Promise.all([
    byOwnerPromise,
    byTagPromise,
  ]);

  if (byOwnerResult.error) {
    throw new Error(byOwnerResult.error.message);
  }

  if (byTagResult.error) {
    throw new Error(byTagResult.error.message);
  }

  const [byOwner, byTag] = await Promise.all([
    hydrateResourceRows(
      (byOwnerResult.data ?? []) as Record<string, unknown>[],
      viewerGithubId
    ),
    hydrateResourceRows(
      (byTagResult.data ?? []) as Record<string, unknown>[],
      viewerGithubId
    ),
  ]);

  return {
    by_owner: sortResourceSummaries(byOwner, "latest").slice(0, 3),
    by_tag: sortResourceSummaries(byTag, "latest").slice(0, 3),
  };
}

export async function createResource(
  input: ResourceDraftPayload,
  user: SessionUser
) {
  const draft = parseResourceDraft(input);
  await ensureMemberFromSession(user);

  const { data, error } = await getSupabase()
    .from("resources")
    .insert({
      owner_github_id: user.github_id,
      title: draft.title,
      url: draft.url,
      type: draft.type,
      summary: draft.summary,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncResourceTags(data.id as string, draft.tags);
  return getResourceById(data.id as string, user.github_id);
}

export async function updateResource(
  resourceId: string,
  input: ResourceDraftPayload,
  user: SessionUser
) {
  const draft = parseResourceDraft(input);
  const owner = await getResourceOwner(resourceId);
  if (owner !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error } = await getSupabase()
    .from("resources")
    .update({
      title: draft.title,
      url: draft.url,
      type: draft.type,
      summary: draft.summary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);

  if (error) {
    throw new Error(error.message);
  }

  await syncResourceTags(resourceId, draft.tags);
  return getResourceById(resourceId, user.github_id);
}

export async function deleteResource(resourceId: string, user: SessionUser) {
  const owner = await getResourceOwner(resourceId);
  if (owner !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error } = await getSupabase().from("resources").delete().eq("id", resourceId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getResourceOwner(resourceId: string) {
  const { data, error } = await getSupabase()
    .from("resources")
    .select("owner_github_id")
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.owner_github_id as number | undefined;
}

export async function listTags() {
  const { data, error } = await getSupabase()
    .from("tags")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ResourceTag[];
}

export async function listResourceComments(resourceId: string) {
  const { data, error } = await getSupabase()
    .from("resource_comments")
    .select("*")
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ResourceComment[];
}

export async function addResourceComment(
  resourceId: string,
  content: string,
  user: SessionUser,
  parentCommentId?: string | null
) {
  const cleaned = content.trim();
  if (!cleaned) {
    throw new Error("Comment content is required");
  }

  await ensureMemberFromSession(user);

  if (parentCommentId) {
    const { data: parent, error: parentError } = await getSupabase()
      .from("resource_comments")
      .select("id")
      .eq("id", parentCommentId)
      .eq("resource_id", resourceId)
      .maybeSingle();

    if (parentError) {
      throw new Error(parentError.message);
    }

    if (!parent) {
      throw new Error("Parent comment not found");
    }
  }

  const { data, error } = await getSupabase()
    .from("resource_comments")
    .insert({
      resource_id: resourceId,
      ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
      author_github_id: user.github_id,
      author_username: user.github_username,
      author_avatar: user.avatar_url,
      content: cleaned,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ResourceComment;
}

export async function deleteResourceComment(commentId: string, user: SessionUser) {
  const { data, error } = await getSupabase()
    .from("resource_comments")
    .select("author_github_id")
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Comment not found");
  }

  if ((data.author_github_id as number) !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error: deleteError } = await getSupabase()
    .from("resource_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

export async function addBookmark(resourceId: string, user: SessionUser) {
  await ensureMemberFromSession(user);
  const { error } = await getSupabase().from("resource_bookmarks").upsert(
    {
      resource_id: resourceId,
      user_github_id: user.github_id,
    },
    { onConflict: "resource_id,user_github_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeBookmark(resourceId: string, user: SessionUser) {
  const { error } = await getSupabase()
    .from("resource_bookmarks")
    .delete()
    .eq("resource_id", resourceId)
    .eq("user_github_id", user.github_id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listBookmarks(user: SessionUser) {
  const { data, error } = await getSupabase()
    .from("resource_bookmarks")
    .select("resource_id")
    .eq("user_github_id", user.github_id);

  if (error) {
    throw new Error(error.message);
  }

  const resourceIds = (data ?? []).map((row) => row.resource_id as string);
  if (resourceIds.length === 0) {
    return [];
  }

  const resources = await listResources({ sort: "latest" }, user.github_id);
  return resources.filter((resource) => resourceIds.includes(resource.id));
}
