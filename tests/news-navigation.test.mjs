import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("Story navigation exposes every news desk and the archive", async () => {
  const header = await source("src/components/Header.tsx");
  for (const anchor of [
    "news-world-and-markets",
    "news-ai-and-builders",
    "news-restaurant-business",
    "news-sports-and-betting",
    "news-nashua-and-new-hampshire",
  ]) {
    assert.match(header, new RegExp(anchor));
  }
  assert.match(header, /href=["{]?["']\/news["']/);
  assert.match(header, /aria-haspopup="menu"/);
});

test("archive index and dated edition routes are implemented", async () => {
  const archive = await source("src/app/news/page.tsx");
  const edition = await source("src/app/news/[date]/page.tsx");
  assert.match(archive, /newsEditions/);
  assert.match(edition, /getEditionByDate/);
  assert.match(edition, /generateStaticParams/);
});
