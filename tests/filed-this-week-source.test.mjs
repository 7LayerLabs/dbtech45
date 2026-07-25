import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hero = await readFile(new URL("../src/components/Hero.tsx", import.meta.url), "utf8");

test("Filed This Week contains no dead page reference or hardcoded claims", () => {
  assert.doesNotMatch(hero, /see page 3/i);
  assert.doesNotMatch(hero, /1,200 subs|4,118 agent tasks|ES 5,480 breakout/i);
  assert.match(hero, /filedThisWeek/);
});
