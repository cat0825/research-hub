import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceFilters,
  buildResourceQueryString,
  normalizeResourceSort,
} from "./resource-queries.ts";

test("buildResourceFilters normalizes resource list query params", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " transformer ",
      type: "pdf",
      tag: "NLP ",
      owner: "42",
      sort: "discussed",
      limit: "12",
      offset: "24",
    }),
    {
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      ownerGithubId: 42,
      sort: "discussed",
      limit: 12,
      offset: 24,
    }
  );
});

test("buildResourceFilters falls back from invalid type owner and sort", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " ",
      type: "zip",
      tag: " ",
      owner: "nope",
      sort: "random",
      limit: "999",
      offset: "0",
    }),
    {
      sort: "latest",
      limit: 60,
    }
  );
});

test("normalizeResourceSort accepts only supported sort values", () => {
  assert.equal(normalizeResourceSort("latest"), "latest");
  assert.equal(normalizeResourceSort("discussed"), "discussed");
  assert.equal(normalizeResourceSort("bookmarked"), "bookmarked");
  assert.equal(normalizeResourceSort("bad"), "latest");
  assert.equal(normalizeResourceSort(null), "latest");
});

test("buildResourceQueryString serializes active filters in stable order", () => {
  assert.equal(
    buildResourceQueryString({
      q: " infra ",
      type: "web",
      tag: "ai-infra",
      sort: "bookmarked",
      limit: 36,
      offset: 48,
    }),
    "q=infra&type=web&tag=ai-infra&sort=bookmarked&limit=36&offset=48"
  );
});

test("buildResourceQueryString omits default sort and inactive filters", () => {
  assert.equal(
    buildResourceQueryString({
      q: "",
      type: undefined,
      tag: undefined,
      sort: "latest",
    }),
    ""
  );
});

test("buildResourceQueryString omits the default resource limit", () => {
  assert.equal(
    buildResourceQueryString({
      sort: "latest",
      limit: 24,
    }),
    ""
  );
});
