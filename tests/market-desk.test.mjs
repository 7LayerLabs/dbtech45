import test from "node:test";
import assert from "node:assert/strict";
import { validateMarketDesk } from "../scripts/news-edition-tools.mjs";

function marketDesk() {
  return {
    asOf: "2026-07-24T16:00:00-04:00",
    sentiment: {
      label: "Cautious",
      explanation: "Stocks are holding up, but oil, rates, and expensive technology shares leave less room for mistakes.",
    },
    vix: {
      value: "18.58",
      explanation: "The VIX is the market's fear meter. Below 20 usually means concern, not panic.",
      source: { label: "CappNotes", url: "https://example.com/vix" },
    },
    tenYear: {
      value: "4.69%",
      explanation: "The 10-year yield influences loans and stock valuations. Higher yields make future profits worth less today.",
      source: { label: "Treasury summary", url: "https://example.com/yield" },
    },
    stockNews: [
      {
        headline: "Investors demand proof that AI spending will pay off",
        brief: "Several technology companies sold off even after revenue beats because spending and cash flow disappointed.",
        beginnerTakeaway: "A company can grow sales and still fall if investors think it is spending too much to get that growth.",
        url: "https://example.com/stocks",
        sourceLabel: "Reuters",
      },
    ],
    earnings: [
      {
        ticker: "MSFT",
        company: "Microsoft",
        date: "July 29, after market close",
        whatItDoes: "Microsoft sells software and cloud computing.",
        whatToWatch: "Azure growth and whether AI spending is producing enough revenue.",
        beginnerTakeaway: "Earnings show what happened last quarter; guidance tells investors what management expects next.",
        source: { label: "Earnings calendar", url: "https://example.com/earnings" },
      },
    ],
    ipos: [
      {
        ticker: "JMKE",
        company: "Jersey Mike's",
        expectedDate: "July 30",
        priceRange: "$21–$25",
        whatItDoes: "A sandwich franchise that earns royalties from restaurant sales.",
        beginnerTakeaway: "The price range is an estimate, not a promise. New stocks can swing sharply on their first day.",
        source: { label: "Renaissance Capital", url: "https://example.com/ipo" },
      },
    ],
  };
}

test("market desk requires beginner explanations for every section", () => {
  assert.doesNotThrow(() => validateMarketDesk(marketDesk()));
});

test("market desk rejects stock news without a beginner takeaway", () => {
  const invalid = marketDesk();
  invalid.stockNews[0].beginnerTakeaway = "";
  assert.throws(() => validateMarketDesk(invalid), /beginner takeaway/i);
});
