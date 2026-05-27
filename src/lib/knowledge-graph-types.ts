export const KNOWLEDGE_GRAPH_SOURCE_TYPES = [
  { value: "codebase", label: "代码库" },
  { value: "paper", label: "论文" },
  { value: "wiki", label: "知识库" },
  { value: "resource_collection", label: "资源合集" },
] as const;

export type KnowledgeGraphSourceType =
  (typeof KNOWLEDGE_GRAPH_SOURCE_TYPES)[number]["value"];

export interface KnowledgeGraphNode {
  id: string;
  type: string;
  name: string;
  summary: string;
  tags: string[];
  complexity: string;
  filePath?: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: string;
  direction?: string;
  weight?: number;
}

export interface KnowledgeGraphLayer {
  id: string;
  name: string;
  description?: string;
  nodeIds: string[];
}

export interface KnowledgeGraphProject {
  name: string;
  description?: string;
  languages?: string[];
  frameworks?: string[];
  analyzedAt?: string;
  gitCommitHash?: string;
}

export interface KnowledgeGraphDocument {
  version: string;
  kind?: string;
  project: KnowledgeGraphProject;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  layers?: KnowledgeGraphLayer[];
  tour?: unknown;
}

export interface KnowledgeGraphSummary {
  id: string;
  owner: {
    github_id: number;
    github_username: string;
    avatar_url: string | null;
    field: string;
  };
  title: string;
  summary: string;
  source_type: KnowledgeGraphSourceType;
  source_url: string | null;
  graph_version: string;
  node_count: number;
  edge_count: number;
  layer_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraphDetail extends KnowledgeGraphSummary {
  graph_json: KnowledgeGraphDocument;
}

const SOURCE_TYPE_SET = new Set<KnowledgeGraphSourceType>(
  KNOWLEDGE_GRAPH_SOURCE_TYPES.map((option) => option.value)
);

export function isKnowledgeGraphSourceType(
  value: string
): value is KnowledgeGraphSourceType {
  return SOURCE_TYPE_SET.has(value as KnowledgeGraphSourceType);
}
