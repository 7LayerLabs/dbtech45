import { readFile, rename, writeFile, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { mergeEdition } from "./news-edition-tools.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: node scripts/publish-news-edition.mjs <edition.json>");
}

const archivePath = resolve("src/data/news/editions.json");
const temporaryPath = `${archivePath}.tmp`;
const edition = JSON.parse(await readFile(resolve(inputPath), "utf8"));
const existing = JSON.parse(await readFile(archivePath, "utf8"));
const merged = mergeEdition(existing, edition);
const serialized = `${JSON.stringify(merged, null, 2)}\n`;

await writeFile(temporaryPath, serialized, "utf8");
try {
  await rename(temporaryPath, archivePath);
} catch {
  await copyFile(temporaryPath, archivePath);
  await rm(temporaryPath, { force: true });
}

const storyCount = edition.categories.reduce(
  (total, category) => total + category.stories.length,
  0,
);
console.log(
  JSON.stringify({
    status: "published-to-archive",
    date: edition.dateTime,
    stories: storyCount,
    editions: merged.length,
  }),
);
