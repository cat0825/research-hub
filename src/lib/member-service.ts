import { getSupabase } from "@/lib/supabase";
import type { MemberSummary } from "@/lib/resource-types.ts";

interface SessionUser {
  github_id: number;
  github_username: string;
  avatar_url: string;
}

function attachResourceCounts(
  members: MemberSummary[],
  counts: Map<number, number>
): MemberSummary[] {
  return members.map((member) => ({
    ...member,
    resource_count: counts.get(member.github_id) ?? 0,
  }));
}

async function fetchResourceCounts(ownerIds: number[]) {
  const counts = new Map<number, number>();
  if (ownerIds.length === 0) {
    return counts;
  }

  const { data, error } = await getSupabase()
    .from("resources")
    .select("owner_github_id")
    .in("owner_github_id", ownerIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const ownerId = row.owner_github_id as number;
    counts.set(ownerId, (counts.get(ownerId) ?? 0) + 1);
  }

  return counts;
}

export async function listMembers(limit?: number) {
  let query = getSupabase()
    .from("members")
    .select("github_id, github_username, avatar_url, field, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const members = (data ?? []) as MemberSummary[];
  const counts = await fetchResourceCounts(members.map((member) => member.github_id));
  return attachResourceCounts(members, counts);
}

export async function getMemberByGithubId(githubId: number) {
  const { data, error } = await getSupabase()
    .from("members")
    .select("github_id, github_username, avatar_url, field, created_at, updated_at")
    .eq("github_id", githubId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const counts = await fetchResourceCounts([githubId]);
  return {
    ...(data as MemberSummary),
    resource_count: counts.get(githubId) ?? 0,
  } satisfies MemberSummary;
}

export async function upsertMemberProfile(user: SessionUser, field: string) {
  const { data, error } = await getSupabase()
    .from("members")
    .upsert(
      {
        github_id: user.github_id,
        github_username: user.github_username,
        avatar_url: user.avatar_url,
        field: field.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "github_id" }
    )
    .select("github_id, github_username, avatar_url, field, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...(data as MemberSummary),
    resource_count: 0,
  } satisfies MemberSummary;
}
