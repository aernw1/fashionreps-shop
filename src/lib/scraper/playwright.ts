import { load } from "cheerio";
import { REDDIT_USER_AGENT } from "./config";

const LISTING_URL = "https://old.reddit.com/r/FashionReps/new/";

export type HtmlPostListing = {
  id: string;
  permalink: string;
  title: string;
  author: string;
  createdUtc: number | null;
  flair: string | null;
};

export const fetchListingWithPlaywright = async (): Promise<HtmlPostListing[]> => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: REDDIT_USER_AGENT });

  try {
    await page.goto(LISTING_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const html = await page.content();
    return parseListingHtml(html);
  } finally {
    await browser.close();
  }
};

export const fetchPostHtmlWithPlaywright = async (permalink: string): Promise<string> => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: REDDIT_USER_AGENT });

  try {
    const url = permalink.startsWith("http")
      ? permalink
      : `https://old.reddit.com${permalink}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
};

export const parseListingHtml = (html: string): HtmlPostListing[] => {
  const $ = load(html);
  const posts: HtmlPostListing[] = [];

  $(".thing").each((_, element) => {
    const id = $(element).attr("data-fullname")?.replace("t3_", "");
    const title = $(element).find("a.title").text().trim();
    const author = $(element).attr("data-author") || "unknown";
    const permalink = $(element).find("a.comments").attr("href");
    const flair = $(element).find("span.linkflairlabel").text().trim() || null;
    const datetime = $(element).find("time").attr("datetime");
    const createdUtc = datetime ? Math.floor(Date.parse(datetime) / 1000) : null;

    if (!id || !permalink) return;

    const pathname = (() => {
      try {
        return new URL(permalink).pathname;
      } catch {
        return permalink;
      }
    })();

    posts.push({
      id,
      permalink: pathname,
      title,
      author,
      createdUtc,
      flair,
    });
  });

  return posts;
};
