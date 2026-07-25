import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(
  await readFile(new URL("../src/data/filedThisWeek.json", import.meta.url), "utf8"),
);

test("Filed This Week contains no more than five linked, dated entries", () => {
  assert.ok(data.entries.length <= 5);
  assert.ok(data.entries.length > 0);
  for (const entry of data.entries) {
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(entry.url, /^(https:\/\/|\/)/);
    assert.ok(entry.project.trim());
    assert.ok(entry.text.trim());
  }
});

test("every filing is inside the rolling seven-day window", () => {
  const asOf = new Date(`${data.asOf}T12:00:00Z`);
  const oldestAllowed = new Date(asOf);
  oldestAllowed.setUTCDate(oldestAllowed.getUTCDate() - 6);

  for (const entry of data.entries) {
    const filed = new Date(`${entry.date}T12:00:00Z`);
    assert.ok(filed <= asOf, `${entry.project} is dated in the future`);
    assert.ok(filed >= oldestAllowed, `${entry.project} is older than seven days`);
  }
});
