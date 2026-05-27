import {
  isKnowledgeGraphSourceType,
  type KnowledgeGraphDocument,
  type KnowledgeGraphSourceType,
} from "./knowledge-graph-types.ts";

interface KnowledgeGraphDraftInput {
  title?: unknown;
  summary?: unknown;
  source_type?: unknown;
  source_url?: unknown;
  graph_json?: unknown;
}

export interface ParsedKnowledgeGraphDraft {
  title: string;
  summary: string;
  source_type: KnowledgeGraphSourceType;
  source_url: string | null;
  graph_json: KnowledgeGraphDocument;
  graph_version: string;
  node_count: number;
  edge_count: number;
  layer_count: number;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readGraphJson(value: unknown): KnowledgeGraphDocument {
  if (typeof value === "string") {
    try {
      return assertKnowledgeGraphDocument(JSON.parse(value));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("图谱 JSON 格式无效");
      }
      throw error;
    }
  }

  return assertKnowledgeGraphDocument(value);
}

function assertStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function assertKnowledgeGraphDocument(value: unknown): KnowledgeGraphDocument {
  if (!value || typeof value !== "object") {
    throw new Error("图谱 JSON 必须是对象");
  }

  const graph = value as Record<string, unknown>;
  const project = graph.project;
  if (!project || typeof project !== "object") {
    throw new Error("图谱缺少 project 信息");
  }

  const projectRecord = project as Record<string, unknown>;
  if (typeof projectRecord.name !== "string" || !projectRecord.name.trim()) {
    throw new Error("图谱 project.name 不能为空");
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    throw new Error("图谱必须包含至少一个节点");
  }

  if (!Array.isArray(graph.edges)) {
    throw new Error("图谱 edges 必须是数组");
  }

  const nodes = graph.nodes.map((node, index) => {
    if (!node || typeof node !== "object") {
      throw new Error(`第 ${index + 1} 个节点无效`);
    }

    const current = node as Record<string, unknown>;
    for (const key of ["id", "type", "name", "summary"] as const) {
      if (typeof current[key] !== "string" || !current[key].trim()) {
        throw new Error(`节点 ${index + 1} 缺少 ${key}`);
      }
    }

    return {
      ...current,
      id: current.id as string,
      type: current.type as string,
      name: current.name as string,
      summary: current.summary as string,
      tags: assertStringArray(current.tags),
      complexity:
        typeof current.complexity === "string" && current.complexity.trim()
          ? current.complexity
          : "simple",
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.map((edge, index) => {
    if (!edge || typeof edge !== "object") {
      throw new Error(`第 ${index + 1} 条边无效`);
    }

    const current = edge as Record<string, unknown>;
    const source = current.source;
    const target = current.target;
    const type = current.type;
    if (typeof source !== "string" || typeof target !== "string" || typeof type !== "string") {
      throw new Error(`边 ${index + 1} 缺少 source、target 或 type`);
    }

    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      throw new Error(`边 ${index + 1} 引用了不存在的节点`);
    }

    return {
      ...current,
      source,
      target,
      type,
    };
  });

  const layers = Array.isArray(graph.layers)
    ? graph.layers.map((layer, index) => {
        if (!layer || typeof layer !== "object") {
          throw new Error(`第 ${index + 1} 个层级无效`);
        }

        const current = layer as Record<string, unknown>;
        if (typeof current.id !== "string" || typeof current.name !== "string") {
          throw new Error(`层级 ${index + 1} 缺少 id 或 name`);
        }

        return {
          ...current,
          id: current.id,
          name: current.name,
          nodeIds: assertStringArray(current.nodeIds),
        };
      })
    : [];

  return {
    ...graph,
    version: typeof graph.version === "string" && graph.version.trim() ? graph.version : "1.0.0",
    kind: typeof graph.kind === "string" ? graph.kind : undefined,
    project: {
      ...projectRecord,
      name: projectRecord.name,
      description:
        typeof projectRecord.description === "string" ? projectRecord.description : undefined,
      languages: assertStringArray(projectRecord.languages),
      frameworks: assertStringArray(projectRecord.frameworks),
      analyzedAt:
        typeof projectRecord.analyzedAt === "string" ? projectRecord.analyzedAt : undefined,
      gitCommitHash:
        typeof projectRecord.gitCommitHash === "string" ? projectRecord.gitCommitHash : undefined,
    },
    nodes,
    edges,
    layers,
  } as KnowledgeGraphDocument;
}

function parseOptionalHttpUrl(value: unknown): string | null {
  const url = readString(value);
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url;
  } catch {
    throw new Error("来源链接必须是有效的 http(s) URL");
  }
}

export function parseKnowledgeGraphDraft(
  input: KnowledgeGraphDraftInput
): ParsedKnowledgeGraphDraft {
  const title = readString(input.title);
  const summary = readString(input.summary);
  const sourceType = readString(input.source_type);
  const graphJson = readGraphJson(input.graph_json);

  if (!title) {
    throw new Error("图谱标题不能为空");
  }

  if (!summary) {
    throw new Error("图谱摘要不能为空");
  }

  if (!isKnowledgeGraphSourceType(sourceType)) {
    throw new Error("不支持的图谱来源类型");
  }

  return {
    title,
    summary,
    source_type: sourceType,
    source_url: parseOptionalHttpUrl(input.source_url),
    graph_json: graphJson,
    graph_version: graphJson.version,
    node_count: graphJson.nodes.length,
    edge_count: graphJson.edges.length,
    layer_count: graphJson.layers?.length ?? 0,
  };
}
