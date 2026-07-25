import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editionsUrl = new URL("../src/data/news/editions.json", import.meta.url);
const canonicalCategories = [
  "World & Markets",
  "AI & Builders",
  "Restaurant Business",
  "Sports & Betting",
  "Nashua & New Hampshire",
];

async function loadEditions() {
  return JSON.parse(await readFile(editionsUrl, "utf8"));
}

test("news archive keeps unique editions in newest-first order", async () => {
  const editions = await loadEditions();
  assert.ok(Array.isArray(editions));
  assert.ok(editions.length > 0);

  const dates = editions.map((edition) => edition.dateTime);
  assert.equal(new Set(dates).size, dates.length);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("every edition contains the five permanent news desks", async () => {
  const editions = await loadEditions();
  for (const edition of editions) {
    assert.deepEqual(
      edition.categories.map((category) => category.name),
      canonicalCategories,
    );
  }
});

test("every archived story has a linked headline and at least one linked source", async () => {
  const editions = await loadEditions();
  for (const edition of editions) {
    for (const category of edition.categories) {
      assert.ok(category.stories.length > 0, `${edition.dateTime}: ${category.name} is empty`);
      for (const story of category.stories) {
        assert.match(story.url, /^https:\/\//);
        assert.ok(story.headline.trim());
        assert.ok(story.brief.trim());
        assert.ok(story.sources.length > 0);
        for (const source of story.sources) {
          assert.match(source.url, /^https:\/\//);
          assert.ok(source.label.trim());
        }
      }
    }
  }
});
