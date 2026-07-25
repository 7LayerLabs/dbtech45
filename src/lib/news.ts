import editions from "../data/news/editions.json";

export type NewsSource = {
  label: string;
  url: string;
};

export type NewsStory = {
  headline: string;
  url: string;
  brief: string;
  sources: NewsSource[];
};

export type NewsCategory = {
  name: string;
  stories: NewsStory[];
};

export type DailyNewsBrief = {
  date: string;
  dateTime: string;
  summary: string;
  categories: NewsCategory[];
};

export const newsEditions = editions as DailyNewsBrief[];
export const currentEdition = newsEditions[0];

export function getEditionByDate(date: string) {
  return newsEditions.find((edition) => edition.dateTime === date);
}

export function categoryId(name: string) {
  return `news-${name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
