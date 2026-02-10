import { load } from "cheerio";
import { SELLER_FETCH_TIMEOUT_MS } from "./config";
import { extractPriceFromText } from "./text";

export const fetchSellerPrice = async (
  url: string
): Promise<{ value: number; currency: string } | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SELLER_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "reddit-shop/1.0 (seller price fetch)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = load(html);
    const text = $("body").text();
    return extractPriceFromText(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
