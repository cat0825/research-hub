import assert from "node:assert/strict";
import test from "node:test";
import { parseArticleDraft } from "./article-form.ts";

test("parseArticleDraft normalizes valid article input", () => {
  assert.deepEqual(
    parseArticleDraft({
      title: "  论文阅读方法  ",
      summary: "  一套可复用的阅读流程  ",
      content: "  正文内容  ",
    }),
    {
      title: "论文阅读方法",
      summary: "一套可复用的阅读流程",
      content: "正文内容",
    }
  );
});

test("parseArticleDraft builds summary from content when summary is blank", () => {
  const draft = parseArticleDraft({
    title: "没有摘要",
    summary: "",
    content: "第一段内容\n\n第二段内容",
  });

  assert.equal(draft.summary, "第一段内容 第二段内容");
});

test("parseArticleDraft rejects blank title or content", () => {
  assert.throws(
    () => parseArticleDraft({ title: " ", content: "正文" }),
    /文章标题不能为空/
  );
  assert.throws(
    () => parseArticleDraft({ title: "标题", content: " " }),
    /文章正文不能为空/
  );
});

test("parseArticleDraft strips markdown syntax from auto-generated summary", () => {
  const draft = parseArticleDraft({
    title: "Markdown 测试",
    summary: "",
    content:
      "# 大标题\n\n这是 **粗体** 和 *斜体* 文本。\n\n" +
      "一个 [链接](https://example.com) 在这里。\n\n" +
      "```\n代码块\n```\n\n" +
      "- 列表项\n\n" +
      "![图片](https://example.com/img.png)",
  });

  assert.equal(
    draft.summary,
    "大标题 这是 粗体 和 斜体 文本。 一个 链接 在这里。 列表项 图片"
  );
});

test("parseArticleDraft unwraps inline code in summary", () => {
  const draft = parseArticleDraft({
    title: "内联代码",
    summary: "",
    content: "使用 `parseArticleDraft` 函数。",
  });

  assert.equal(draft.summary, "使用 parseArticleDraft 函数。");
});
