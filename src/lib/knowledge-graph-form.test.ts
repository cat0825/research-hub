import assert from "node:assert/strict";
import test from "node:test";
import { parseKnowledgeGraphDraft } from "./knowledge-graph-form.ts";

const graph = {
  version: "1.0.0",
  kind: "knowledge",
  project: { name: "Transformer Wiki", languages: ["markdown"] },
  nodes: [
    {
      id: "article:Transformer",
      type: "article",
      name: "Transformer",
      summary: "Transformer overview",
      tags: ["architecture"],
      complexity: "simple",
    },
    {
      id: "article:Attention",
      type: "article",
      name: "Attention",
      summary: "Attention mechanism",
      tags: ["attention"],
      complexity: "moderate",
    },
  ],
  edges: [
    {
      source: "article:Transformer",
      target: "article:Attention",
      type: "related",
    },
  ],
  layers: [
    {
      id: "layer:architecture",
      name: "Architecture",
      nodeIds: ["article:Transformer"],
    },
  ],
};

test("parseKnowledgeGraphDraft accepts a valid graph object", () => {
  const parsed = parseKnowledgeGraphDraft({
    title: " Transformer graph ",
    summary: " Shared graph ",
    source_type: "paper",
    source_url: "https://arxiv.org/abs/1706.03762",
    graph_json: graph,
  });

  assert.equal(parsed.title, "Transformer graph");
  assert.equal(parsed.source_type, "paper");
  assert.equal(parsed.graph_version, "1.0.0");
  assert.equal(parsed.node_count, 2);
  assert.equal(parsed.edge_count, 1);
  assert.equal(parsed.layer_count, 1);
});

test("parseKnowledgeGraphDraft accepts a JSON string", () => {
  const parsed = parseKnowledgeGraphDraft({
    title: "Transformer graph",
    summary: "Shared graph",
    source_type: "wiki",
    graph_json: JSON.stringify(graph),
  });

  assert.equal(parsed.graph_json.project.name, "Transformer Wiki");
});

test("parseKnowledgeGraphDraft rejects dangling edges", () => {
  assert.throws(
    () =>
      parseKnowledgeGraphDraft({
        title: "Bad graph",
        summary: "Bad graph",
        source_type: "paper",
        graph_json: {
          ...graph,
          edges: [{ source: "article:Transformer", target: "missing", type: "related" }],
        },
      }),
    /不存在的节点/
  );
});
