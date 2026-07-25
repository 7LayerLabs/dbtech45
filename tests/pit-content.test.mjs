import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pit = await readFile(new URL("../src/components/ThePit.tsx", import.meta.url), "utf8");

test("The Pit removes trading signals and newsletter promotion", () => {
  assert.doesNotMatch(pit, /Live signals/i);
  assert.doesNotMatch(pit, /Signal and Noise/i);
});

test("The Pit teaches market sentiment, stock news, earnings, and IPOs", () => {
  assert.match(pit, /marketDesk/);
  assert.match(pit, /Market sentiment/i);
  assert.match(pit, /VIX/);
  assert.match(pit, /10-year/i);
  assert.match(pit, /Stock news/i);
  assert.match(pit, /Earnings coming up/i);
  assert.match(pit, /IPO watch/i);
  assert.match(pit, /What this means/i);
});
