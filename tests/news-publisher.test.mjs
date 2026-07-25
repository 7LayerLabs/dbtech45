import test from "node:test";
import assert from "node:assert/strict";
import { mergeEdition, validateEdition } from "../scripts/news-edition-tools.mjs";

const categories = [
  "World & Markets",
  "AI & Builders",
  "Restaurant Business",
  "Sports & Betting",
  "Nashua & New Hampshire",
];

function edition(dateTime, summary = `Summary for ${dateTime}`) {
  return {
    date: "Saturday, July 25, 2026",
    dateTime,
    summary,
    categories: categories.map((name, index) => ({
      name,
      stories: [
        {
          headline: `${name} headline`,
          url: `https://example.com/story-${index}`,
          brief: "A concise verified briefing with enough detail to be useful.",
          sources: [{ label: "Example", url: `https://example.com/source-${index}` }],
        },
      ],
    })),
  };
}

test("publisher accepts a complete five-desk edition", () => {
  assert.doesNotThrow(() => validateEdition(edition("2026-07-25")));
});

test("publisher rejects an edition with a missing desk", () => {
  const invalid = edition("2026-07-25");
  invalid.categories.pop();
  assert.throws(() => validateEdition(invalid), /five permanent news desks/);
});

test("publisher allows a quiet desk to remain empty instead of inventing filler", () => {
  const quiet = edition("2026-07-25");
  quiet.categories.at(-1).stories = [];
  assert.doesNotThrow(() => validateEdition(quiet));
});

test("publisher replaces a same-day edition without duplicating it", () => {
  const existing = [edition("2026-07-24")];
  const first = mergeEdition(existing, edition("2026-07-25", "First filing"));
  const revised = mergeEdition(first, edition("2026-07-25", "Revised filing"));

  assert.deepEqual(revised.map((item) => item.dateTime), ["2026-07-25", "2026-07-24"]);
  assert.equal(revised[0].summary, "Revised filing");
});
