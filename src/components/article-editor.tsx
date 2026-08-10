"use client";

import { useState } from "react";
import { EyeIcon, PenLineIcon } from "lucide-react";
import { parseArticleDraft } from "@/lib/article-form.ts";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ArticleEditorValue {
  title: string;
  summary: string;
  content: string;
}

const EMPTY_ARTICLE: ArticleEditorValue = {
  title: "",
  summary: "",
  content: "",
};

interface ArticleEditorProps {
  initialValue?: ArticleEditorValue;
  title: string;
  description: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (value: ArticleEditorValue) => Promise<void> | void;
  onCancel?: () => void;
}

export function ArticleEditor({
  initialValue,
  title,
  description,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: ArticleEditorProps) {
  const [value, setValue] = useState<ArticleEditorValue>(
    initialValue ?? EMPTY_ARTICLE
  );
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      parseArticleDraft(value);
    } catch (validationError) {
      setError(
        validationError instanceof Error ? validationError.message : "文章内容无效"
      );
      return;
    }

    setError("");
    await onSubmit(value);
    if (!initialValue) {
      setValue(EMPTY_ARTICLE);
    }
  }

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <PenLineIcon className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            placeholder="文章标题"
            required
            value={value.title}
            onChange={(event) =>
              setValue((current) => ({ ...current, title: event.target.value }))
            }
          />

          <Textarea
            placeholder="摘要，会显示在知识分享区列表里。留空时自动截取正文。"
            rows={3}
            value={value.summary}
            onChange={(event) =>
              setValue((current) => ({ ...current, summary: event.target.value }))
            }
          />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 rounded-lg border p-0.5 text-sm text-muted-foreground">
              <button
                type="button"
                className={`rounded-md px-3 py-1 transition ${
                  !previewMode
                    ? "bg-muted font-medium text-foreground shadow-xs"
                    : "hover:text-foreground"
                }`}
                onClick={() => setPreviewMode(false)}
              >
                <PenLineIcon className="mr-1 inline size-3.5" />
                编辑
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1 transition ${
                  previewMode
                    ? "bg-muted font-medium text-foreground shadow-xs"
                    : "hover:text-foreground"
                }`}
                onClick={() => setPreviewMode(true)}
              >
                <EyeIcon className="mr-1 inline size-3.5" />
                预览
              </button>
            </div>

            {previewMode ? (
              <div className="min-h-[200px] rounded-xl border bg-card p-5">
                {value.content.trim() ? (
                  <MarkdownRenderer content={value.content} />
                ) : (
                  <p className="text-sm text-muted-foreground">还没有正文内容。</p>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="正文内容，支持 Markdown 格式"
                required
                rows={12}
                value={value.content}
                onChange={(event) =>
                  setValue((current) => ({ ...current, content: event.target.value }))
                }
              />
            )}
          </div>
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
