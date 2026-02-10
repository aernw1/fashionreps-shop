import { REDDIT_USER_AGENT } from "./config";
import { parseListingHtml } from "./reddit";

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
