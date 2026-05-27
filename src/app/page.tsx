import { ResourceHub } from "@/components/resource-hub";
import { auth } from "@/lib/auth";
import { listArticles } from "@/lib/article-service.ts";
import { listMembers } from "@/lib/member-service.ts";
import { listResources, listTags } from "@/lib/resource-service.ts";

export default async function Home() {
  let viewerGithubId: number | undefined;
  let initialError = "";

  try {
    const session = await auth();
    viewerGithubId = session?.user?.github_id;
  } catch {
    initialError = "登录配置不可用，已按访客模式加载。";
  }

  const [resourcesResult, tagsResult, membersResult, articlesResult] =
    await Promise.allSettled([
    listResources({ sort: "latest" }, viewerGithubId),
    listTags(),
    listMembers(8),
    listArticles({ limit: 4 }),
  ]);

  if (
    resourcesResult.status === "rejected" ||
    tagsResult.status === "rejected" ||
    membersResult.status === "rejected" ||
    articlesResult.status === "rejected"
  ) {
    initialError = "部分数据加载失败，请稍后刷新。";
  }

  return (
    <ResourceHub
      initialResources={
        resourcesResult.status === "fulfilled" ? resourcesResult.value : []
      }
      initialTags={tagsResult.status === "fulfilled" ? tagsResult.value : []}
      initialMembers={
        membersResult.status === "fulfilled" ? membersResult.value : []
      }
      initialArticles={
        articlesResult.status === "fulfilled" ? articlesResult.value : []
      }
      initialError={initialError}
    />
  );
}
