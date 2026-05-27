"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { KnowledgeGraphSummary } from "@/lib/knowledge-graph-types.ts";
import type { ArticleSummary, ResourceSummary } from "@/lib/resource-types.ts";
import { ArticleCard } from "@/components/article-card";
import { ArticleEditor, type ArticleEditorValue } from "@/components/article-editor";
import { KnowledgeGraphCard } from "@/components/knowledge-graph-card";
import {
  KnowledgeGraphEditor,
  type KnowledgeGraphEditorValue,
} from "@/components/knowledge-graph-editor";
import { LoginWall } from "@/components/login-wall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "@/components/resource-card";
import { ResourceEditor, type ResourceEditorValue } from "@/components/resource-editor";

export function EditProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [field, setField] = useState("");
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [graphs, setGraphs] = useState<KnowledgeGraphSummary[]>([]);
  const [editingResource, setEditingResource] = useState<ResourceSummary | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleSummary | null>(null);
  const [editingGraph, setEditingGraph] = useState<KnowledgeGraphSummary | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [articleSaving, setArticleSaving] = useState(false);
  const [graphSaving, setGraphSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [articleError, setArticleError] = useState("");
  const [graphError, setGraphError] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [resourceStatus, setResourceStatus] = useState("");
  const [articleStatus, setArticleStatus] = useState("");
  const [graphStatus, setGraphStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (session?.user?.github_id && !loaded) {
      Promise.all([
        fetch(`/api/members/${session.user.github_id}`).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(`/api/members/${session.user.github_id}/resources`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`/api/articles?author_github_id=${session.user.github_id}`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`/api/graphs?owner_github_id=${session.user.github_id}`).then((r) =>
          r.ok ? r.json() : []
        ),
      ]).then(([member, resourceData, articleData, graphData]) => {
        if (member) {
          setField(member.field || "");
        }
        setResources(Array.isArray(resourceData) ? resourceData : []);
        setArticles(Array.isArray(articleData) ? articleData : []);
        setGraphs(Array.isArray(graphData) ? graphData : []);
        setLoaded(true);
      });
    }
  }, [session, loaded]);

  async function reloadResources() {
    if (!session?.user?.github_id) return;
    const response = await fetch(`/api/members/${session.user.github_id}/resources`);
    const data = await response.json();
    setResources(Array.isArray(data) ? data : []);
  }

  async function reloadArticles() {
    if (!session?.user?.github_id) return;
    const response = await fetch(`/api/articles?author_github_id=${session.user.github_id}`);
    const data = await response.json();
    setArticles(Array.isArray(data) ? data : []);
  }

  async function reloadGraphs() {
    if (!session?.user?.github_id) return;
    const response = await fetch(`/api/graphs?owner_github_id=${session.user.github_id}`);
    const data = await response.json();
    setGraphs(Array.isArray(data) ? data : []);
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError("");
    setProfileStatus("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setProfileError(payload?.error ?? "资料保存失败");
        return;
      }

      setProfileStatus("资料已保存。");
      router.refresh();
    } catch {
      setProfileError("资料保存失败，请重试。");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleResourceSubmit(value: ResourceEditorValue) {
    setResourceSaving(true);
    setResourceError("");
    setResourceStatus("");
    const endpoint = editingResource
      ? `/api/resources/${editingResource.id}`
      : "/api/resources";
    const method = editingResource ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setResourceError(payload?.error ?? "资源保存失败");
        return;
      }

      setEditingResource(null);
      await reloadResources();
      setResourceStatus(editingResource ? "资源已更新。" : "资源已发布。");
    } catch {
      setResourceError("资源保存失败，请重试。");
    } finally {
      setResourceSaving(false);
    }
  }

  async function handleDeleteResource(resourceId: string) {
    if (!window.confirm("确认删除这条资源？删除后不可恢复。")) return;

    setResourceError("");
    setResourceStatus("");

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Resource delete failed");
      }

      await reloadResources();
      setResourceStatus("资源已删除。");
    } catch {
      setResourceError("资源删除失败，请重试。");
    }
  }

  async function handleArticleSubmit(value: ArticleEditorValue) {
    setArticleSaving(true);
    setArticleError("");
    setArticleStatus("");
    const endpoint = editingArticle
      ? `/api/articles/${editingArticle.id}`
      : "/api/articles";
    const method = editingArticle ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setArticleError(payload?.error ?? "文章保存失败");
        return;
      }

      setEditingArticle(null);
      await reloadArticles();
      setArticleStatus(editingArticle ? "文章已更新。" : "文章已发布。");
    } catch {
      setArticleError("文章保存失败，请重试。");
    } finally {
      setArticleSaving(false);
    }
  }

  async function handleDeleteArticle(articleId: string) {
    if (!window.confirm("确认删除这篇文章？删除后不可恢复。")) return;

    setArticleError("");
    setArticleStatus("");

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Article delete failed");
      }

      await reloadArticles();
      setArticleStatus("文章已删除。");
    } catch {
      setArticleError("文章删除失败，请重试。");
    }
  }

  async function handleGraphSubmit(value: KnowledgeGraphEditorValue) {
    setGraphSaving(true);
    setGraphError("");
    setGraphStatus("");
    const endpoint = editingGraph ? `/api/graphs/${editingGraph.id}` : "/api/graphs";
    const method = editingGraph ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setGraphError(payload?.error ?? "图谱保存失败");
        return;
      }

      setEditingGraph(null);
      await reloadGraphs();
      setGraphStatus(editingGraph ? "图谱已更新。" : "图谱已发布。");
    } catch {
      setGraphError("图谱保存失败，请重试。");
    } finally {
      setGraphSaving(false);
    }
  }

  async function handleDeleteGraph(graphId: string) {
    if (!window.confirm("确认删除这张知识图谱？删除后不可恢复。")) return;

    setGraphError("");
    setGraphStatus("");

    try {
      const response = await fetch(`/api/graphs/${graphId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Graph delete failed");
      }

      await reloadGraphs();
      setGraphStatus("图谱已删除。");
    } catch {
      setGraphError("图谱删除失败，请重试。");
    }
  }

  if (status === "loading" || (status === "authenticated" && !loaded)) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        正在加载...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <LoginWall
        title="登录后发布资源、文章和图谱"
        description="登录后可以管理个人资料、发布研究资源、写文章，并维护可共同创造的知识图谱。"
        secondaryLabel="返回资源中心"
        secondaryHref="/"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">资料、资源、文章与图谱管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          当前登录：<strong>{session.user.github_username}</strong>
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">研究方向</label>
          <Input
            placeholder="例如：机器学习、计算机网络"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? "保存中..." : "保存资料"}
          </Button>
        </div>
        {profileError ? (
          <p className="mt-3 text-sm text-destructive">{profileError}</p>
        ) : null}
        {profileStatus ? (
          <p className="mt-3 text-sm text-muted-foreground">{profileStatus}</p>
        ) : null}
      </div>

      <ResourceEditor
        key={editingResource?.id ?? "new"}
        title={editingResource ? "编辑资源" : "发布资源"}
        description="手动填写标题、链接、类型、摘要和标签。"
        submitLabel={editingResource ? "更新资源" : "发布资源"}
        pending={resourceSaving}
        initialValue={
          editingResource
            ? {
                title: editingResource.title,
                url: editingResource.url,
                type: editingResource.type,
                summary: editingResource.summary,
                tags: editingResource.tags.map((tag) => tag.name).join(", "),
              }
            : undefined
        }
        onSubmit={handleResourceSubmit}
        onCancel={editingResource ? () => setEditingResource(null) : undefined}
      />
      {resourceError ? (
        <p className="-mt-4 text-sm text-destructive">{resourceError}</p>
      ) : null}
      {resourceStatus ? (
        <p className="-mt-4 text-sm text-muted-foreground">{resourceStatus}</p>
      ) : null}

      <ArticleEditor
        key={editingArticle?.id ?? "new-article"}
        title={editingArticle ? "编辑文章" : "发布文章"}
        description="写研究笔记、资源使用经验、论文阅读记录或项目复盘。"
        submitLabel={editingArticle ? "更新文章" : "发布文章"}
        pending={articleSaving}
        initialValue={
          editingArticle
            ? {
                title: editingArticle.title,
                summary: editingArticle.summary,
                content: editingArticle.content,
              }
            : undefined
        }
        onSubmit={handleArticleSubmit}
        onCancel={editingArticle ? () => setEditingArticle(null) : undefined}
      />
      {articleError ? (
        <p className="-mt-4 text-sm text-destructive">{articleError}</p>
      ) : null}
      {articleStatus ? (
        <p className="-mt-4 text-sm text-muted-foreground">{articleStatus}</p>
      ) : null}

      <KnowledgeGraphEditor
        key={editingGraph?.id ?? "new-graph"}
        title={editingGraph ? "重新上传知识图谱" : "发布知识图谱"}
        description="粘贴 Understand-Anything 生成的 knowledge-graph.json，让大家共同浏览、讨论和维护。"
        submitLabel={editingGraph ? "更新图谱" : "发布图谱"}
        pending={graphSaving}
        initialValue={
          editingGraph
            ? {
                title: editingGraph.title,
                summary: editingGraph.summary,
                source_type: editingGraph.source_type,
                source_url: editingGraph.source_url ?? "",
                graph_json: "",
              }
            : undefined
        }
        onSubmit={handleGraphSubmit}
        onCancel={editingGraph ? () => setEditingGraph(null) : undefined}
      />
      {graphError ? (
        <p className="-mt-4 text-sm text-destructive">{graphError}</p>
      ) : null}
      {graphStatus ? (
        <p className="-mt-4 text-sm text-muted-foreground">{graphStatus}</p>
      ) : null}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">我发布的知识图谱</h3>
          <p className="text-sm text-muted-foreground">
            这些图谱会出现在图谱广场，适合沉淀论文、项目和知识库结构。
          </p>
        </div>

        {graphs.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            还没有发布知识图谱。
          </div>
        ) : (
          <div className="grid gap-4">
            {graphs.map((graph) => (
              <div key={graph.id} className="space-y-3 rounded-xl border p-3">
                <KnowledgeGraphCard graph={graph} />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGraph(graph)}
                  >
                    重新上传
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteGraph(graph.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">我发布的文章</h3>
          <p className="text-sm text-muted-foreground">
            这些内容会出现在首页和知识分享区。
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            还没有发布文章。
          </div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div key={article.id} className="space-y-3 rounded-xl border p-3">
                <ArticleCard article={article} />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingArticle(article)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteArticle(article.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">我发布的资源</h3>
          <p className="text-sm text-muted-foreground">
            编辑或删除挂在你作者页下的资源。
          </p>
        </div>

        {resources.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            还没有发布资源。
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="space-y-3 rounded-xl border p-3">
                <ResourceCard resource={resource} />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingResource(resource)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
