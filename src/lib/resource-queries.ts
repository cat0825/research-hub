import { isResourceType, type ResourceType } from "./resource-types.ts";

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | null | undefined>;

export type ResourceSort = "latest" | "discussed" | "bookmarked";
export const DEFAULT_RESOURCE_LIMIT = 24;
export const MAX_RESOURCE_LIMIT = 60;


export interface ResourceFilters {
  q?: string;
  type?: ResourceType;
  tag?: string;
  ownerGithubId?: number;
  sort: ResourceSort;
  limit?: number;
}

function getParam(source: SearchParamsLike, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }

  return source[key] ?? null;
}

export function normalizeResourceSort(value: string | null | undefined): ResourceSort {
  if (value === "discussed" || value === "bookmarked") {
    return value;
  }

  return "latest";
}

function normalizeLimit(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    return undefined;
  }

  return Math.min(limit, MAX_RESOURCE_LIMIT);
}

export function buildResourceFilters(searchParams: SearchParamsLike): ResourceFilters {
  const q = getParam(searchParams, "q")?.trim() || undefined;
  const type = getParam(searchParams, "type")?.trim() || undefined;
  const tag = getParam(searchParams, "tag")?.trim().toLowerCase() || undefined;
  const owner = getParam(searchParams, "owner")?.trim() || undefined;
  const ownerGithubId = owner ? Number(owner) : undefined;
  const sort = normalizeResourceSort(getParam(searchParams, "sort"));
  const limit = normalizeLimit(getParam(searchParams, "limit"));
  const filters: ResourceFilters = { sort };

  if (q) {
    filters.q = q;
  }

  if (type && isResourceType(type)) {
    filters.type = type;
  }

  if (tag) {
    filters.tag = tag;
  }

  if (ownerGithubId && Number.isFinite(ownerGithubId)) {
    filters.ownerGithubId = ownerGithubId;
  }

  if (limit) {
    filters.limit = limit;
  }

  return filters;
}

export function buildResourceQueryString(filters: {
  q?: string;
  type?: ResourceType;
  tag?: string;
  sort?: ResourceSort;
  limit?: number;
}): string {
  const params = new URLSearchParams();
  const query = filters.q?.trim();
  const tag = filters.tag?.trim().toLowerCase();
  const sort = normalizeResourceSort(filters.sort);
  const limit = filters.limit;

  if (query) {
    params.set("q", query);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (tag) {
    params.set("tag", tag);
  }

  if (sort !== "latest") {
    params.set("sort", sort);
  }

  if (limit && limit !== DEFAULT_RESOURCE_LIMIT) {
    params.set("limit", String(Math.min(limit, MAX_RESOURCE_LIMIT)));
  }

  return params.toString();
}
