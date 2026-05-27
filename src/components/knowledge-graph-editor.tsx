"use client";

import { useState } from "react";
import { NetworkIcon } from "lucide-react";
import {
  KNOWLEDGE_GRAPH_SOURCE_TYPES,
  type KnowledgeGraphSourceType,
} from "@/lib/knowledge-graph-types.ts";
import { parseKnowledgeGraphDraft } from "@/lib/knowledge-graph-form.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface KnowledgeGraphEditorValue {
  title: string;
  summary: string;
  source_type: KnowledgeGraphSourceType;
  source_url: string;
  graph_json: string;
}

const EMPTY_GRAPH: KnowledgeGraphEditorValue = {
  title: "",
  summary: "",
  source_type: "paper",
  source_url: "",
  graph_json: "",
};

interface KnowledgeGraphEditorProps {
  initialValue?: KnowledgeGraphEditorValue;
  title: string;
  description: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (value: KnowledgeGraphEditorValue) => Promise<void> | void;
  onCancel?: () => void;
}

export function KnowledgeGraphEditor({
  initialValue,
  title,
  description,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: KnowledgeGraphEditorProps) {
  const [value, setValue] = useState<KnowledgeGraphEditorValue>(
    initialValue ?? EMPTY_GRAPH
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      parseKnowledgeGraphDraft(value);
    } catch (validationError) {
      setError(
        validationError instanceof Error ? validationError.message : "图谱内容无效"
      );
      return;
    }

    setError("");
    await onSubmit(value);
    if (!initialValue) {
      setValue(EMPTY_GRAPH);
    }
  }

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <NetworkIcon className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
            <Input
              placeholder="图谱标题"
              required
              value={value.title}
              onChange={(event) =>
                setValue((current) => ({ ...current, title: event.target.value }))
              }
            />
            <select
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={value.source_type}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  source_type: event.target.value as KnowledgeGraphSourceType,
                }))
              }
            >
              {KNOWLEDGE_GRAPH_SOURCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            placeholder="一句话说明这张图谱帮助大家理解什么。"
            required
            rows={3}
            value={value.summary}
            onChange={(event) =>
              setValue((current) => ({ ...current, summary: event.target.value }))
            }
          />

          <Input
            placeholder="来源链接，可选，例如论文、仓库或知识库地址"
            type="url"
            value={value.source_url}
            onChange={(event) =>
              setValue((current) => ({ ...current, source_url: event.target.value }))
            }
          />

          <Textarea
            placeholder="粘贴 Understand-Anything 生成的 knowledge-graph.json"
            required
            rows={14}
            className="font-mono text-xs"
            value={value.graph_json}
            onChange={(event) =>
              setValue((current) => ({ ...current, graph_json: event.target.value }))
            }
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
