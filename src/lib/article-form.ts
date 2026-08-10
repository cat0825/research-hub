import { stripMarkdown } from "./markdown.ts";

export interface ArticleDraftPayload {
  title: string;
  summary?: string;
  content: string;
}

export interface ParsedArticleDraft {
  title: string;
  summary: string;
  content: string;
}

const TITLE_MAX_LENGTH = 120;
const SUMMARY_MAX_LENGTH = 220;
const CONTENT_MAX_LENGTH = 20000;

function assertString(value: unknown, message: string): string {
  if (typeof value !== "string") {
    throw new Error(message);
  }

  return value.trim();
}

function buildSummary(content: string): string {
  const plain = stripMarkdown(content);
  const compact = plain.replace(/\s+/g, " ").trim();
  return compact.length > SUMMARY_MAX_LENGTH
    ? `${compact.slice(0, SUMMARY_MAX_LENGTH - 1)}…`
    : compact;
}

export function parseArticleDraft(input: ArticleDraftPayload): ParsedArticleDraft {
  const title = assertString(input.title, "文章标题不能为空");
  const content = assertString(input.content, "文章正文不能为空");
  const explicitSummary =
    typeof input.summary === "string" ? input.summary.trim() : "";
  const summary = explicitSummary || buildSummary(content);

  if (!title) {
    throw new Error("文章标题不能为空");
  }

  if (!content) {
    throw new Error("文章正文不能为空");
  }

  if (title.length > TITLE_MAX_LENGTH) {
    throw new Error(`文章标题不能超过 ${TITLE_MAX_LENGTH} 个字符`);
  }

  if (summary.length > SUMMARY_MAX_LENGTH) {
    throw new Error(`文章摘要不能超过 ${SUMMARY_MAX_LENGTH} 个字符`);
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new Error(`文章正文不能超过 ${CONTENT_MAX_LENGTH} 个字符`);
  }

  return {
    title,
    summary,
    content,
  };
}
