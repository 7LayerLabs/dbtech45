export const permanentNewsDesks = [
  "World & Markets",
  "AI & Builders",
  "Restaurant Business",
  "Sports & Betting",
  "Nashua & New Hampshire",
];

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be non-empty text`);
  }
}

function requireHttps(value, label) {
  requireText(value, label);
  if (!value.startsWith("https://")) {
    throw new Error(`${label} must use https://`);
  }
}

export function validateEdition(edition) {
  if (!edition || typeof edition !== "object" || Array.isArray(edition)) {
    throw new Error("Edition must be an object");
  }

  requireText(edition.date, "date");
  requireText(edition.dateTime, "dateTime");
  requireText(edition.summary, "summary");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition.dateTime)) {
    throw new Error("dateTime must use YYYY-MM-DD");
  }

  const categoryNames = edition.categories?.map((category) => category.name);
  if (
    !Array.isArray(edition.categories) ||
    edition.categories.length !== permanentNewsDesks.length ||
    JSON.stringify(categoryNames) !== JSON.stringify(permanentNewsDesks)
  ) {
    throw new Error("Edition must contain the five permanent news desks in canonical order");
  }

  const storyUrls = new Set();
  for (const category of edition.categories) {
    if (!Array.isArray(category.stories) || category.stories.length === 0) {
      throw new Error(`${category.name} must contain at least one story`);
    }

    for (const story of category.stories) {
      requireText(story.headline, `${category.name} headline`);
      requireText(story.brief, `${story.headline} brief`);
      requireHttps(story.url, `${story.headline} URL`);
      if (story.brief.trim().length < 40) {
        throw new Error(`${story.headline} brief is too short`);
      }
      if (storyUrls.has(story.url)) {
        throw new Error(`Duplicate story URL: ${story.url}`);
      }
      storyUrls.add(story.url);

      if (!Array.isArray(story.sources) || story.sources.length === 0) {
        throw new Error(`${story.headline} must contain at least one source`);
      }
      for (const source of story.sources) {
        requireText(source.label, `${story.headline} source label`);
        requireHttps(source.url, `${story.headline} source URL`);
      }
    }
  }

  return edition;
}

export function validateMarketDesk(desk) {
  if (!desk || typeof desk !== "object" || Array.isArray(desk)) {
    throw new Error("Market desk must be an object");
  }

  requireText(desk.asOf, "market asOf");
  requireText(desk.sentiment?.label, "market sentiment label");
  requireText(desk.sentiment?.explanation, "market sentiment explanation");

  for (const [label, indicator] of [["VIX", desk.vix], ["10-year yield", desk.tenYear]]) {
    requireText(indicator?.value, `${label} value`);
    requireText(indicator?.explanation, `${label} explanation`);
    requireText(indicator?.source?.label, `${label} source label`);
    requireHttps(indicator?.source?.url, `${label} source URL`);
  }

  for (const [label, items] of [
    ["stock news", desk.stockNews],
    ["earnings", desk.earnings],
    ["IPOs", desk.ipos],
  ]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`Market desk must contain at least one ${label} item`);
    }
  }

  for (const story of desk.stockNews) {
    requireText(story.headline, "stock news headline");
    requireText(story.brief, `${story.headline} brief`);
    requireText(story.beginnerTakeaway, `${story.headline} beginner takeaway`);
    requireHttps(story.url, `${story.headline} URL`);
    requireText(story.sourceLabel, `${story.headline} source label`);
  }

  for (const item of desk.earnings) {
    requireText(item.ticker, "earnings ticker");
    requireText(item.company, `${item.ticker} company`);
    requireText(item.date, `${item.ticker} earnings date`);
    requireText(item.whatItDoes, `${item.ticker} what it does`);
    requireText(item.whatToWatch, `${item.ticker} what to watch`);
    requireText(item.beginnerTakeaway, `${item.ticker} beginner takeaway`);
    requireText(item.source?.label, `${item.ticker} source label`);
    requireHttps(item.source?.url, `${item.ticker} source URL`);
  }

  for (const item of desk.ipos) {
    requireText(item.ticker, "IPO ticker");
    requireText(item.company, `${item.ticker} company`);
    requireText(item.expectedDate, `${item.ticker} expected date`);
    requireText(item.priceRange, `${item.ticker} price range`);
    requireText(item.whatItDoes, `${item.ticker} what it does`);
    requireText(item.beginnerTakeaway, `${item.ticker} beginner takeaway`);
    requireText(item.source?.label, `${item.ticker} source label`);
    requireHttps(item.source?.url, `${item.ticker} source URL`);
  }

  return desk;
}

export function mergeEdition(existingEditions, edition) {
  validateEdition(edition);
  if (!Array.isArray(existingEditions)) {
    throw new Error("Existing editions must be an array");
  }

  return [
    edition,
    ...existingEditions.filter((item) => item.dateTime !== edition.dateTime),
  ].sort((left, right) => right.dateTime.localeCompare(left.dateTime));
}
