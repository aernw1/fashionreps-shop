import {
  BRAND_TEXT_PATTERNS,
  BRAND_URL_PATTERNS,
  REDDIT_HOSTS,
  TAG_KEYWORDS,
  TYPE_KEYWORDS,
} from "./config";

export type PriceInfo = { value: number; currency: string } | null;

const URL_REGEX = /\bhttps?:\/\/[^\s<>()]+/gi;
const TRACKING_QUERY_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "spm",
  "source",
  "from",
  "ref",
  "ref_src",
  "share_relation",
  "share_token",
  "share",
  "fbclid",
  "gclid",
];

export const normalizeUrl = (rawUrl: string): string | null => {
  const decoded = decodeHtmlEntities(rawUrl.trim());
  const trimmed = decoded.replace(/[),.?!\]]+$/g, "");
  try {
    const url = new URL(trimmed);
    url.hash = "";

    for (const key of TRACKING_QUERY_PARAMS) {
      url.searchParams.delete(key);
    }

    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    url.hostname = host;

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return null;
  }
};

export const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

export const extractUrls = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(URL_REGEX) ?? [];
  const normalized = matches
    .map((match) => normalizeUrl(match))
    .filter((url): url is string => Boolean(url));
  return Array.from(new Set(normalized));
};

export const extractSellerLinks = (segments: string[]): string[] => {
  const urls = segments.flatMap((segment) => extractUrls(segment));
  const filtered = urls.filter((url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return !REDDIT_HOSTS.some((blocked) => host === blocked);
    } catch {
      return false;
    }
  });

  return Array.from(new Set(filtered));
};

export const buildLinkContextMap = (segments: string[]): Map<string, string> => {
  const contextMap = new Map<string, string>();

  for (const segment of segments) {
    if (!segment) continue;
    const urls = extractUrls(segment);
    if (!urls.length) continue;

    for (const url of urls) {
      const cleaned = cleanLinkContext(segment, url);
      if (!cleaned) continue;
      const existing = contextMap.get(url);
      if (!existing || cleaned.length > existing.length) {
        contextMap.set(url, cleaned);
      }
    }
  }

  return contextMap;
};

const cleanLinkContext = (segment: string, url: string): string => {
  let context = segment.replace(url, " ");
  context = context.replace(/\s+/g, " ").trim();
  context = context.replace(/\b(w2c|qc|lc|haul|review)\b/gi, " ").trim();
  context = context.replace(/\s+/g, " ").trim();
  if (context.length < 3) return "";
  return context;
};

export const inferBrandFromUrls = (urls: string[]): string | null => {
  for (const url of urls) {
    for (const { pattern, brand } of BRAND_URL_PATTERNS) {
      if (pattern.test(url)) return brand;
    }
  }
  return null;
};

export const inferBrandFromText = (text: string): string | null => {
  for (const { pattern, brand } of BRAND_TEXT_PATTERNS) {
    if (pattern.test(text)) return brand;
  }
  return null;
};

export const inferTypeFromText = (text: string): string | null => {
  const lowered = text.toLowerCase();
  for (const { type, keywords } of TYPE_KEYWORDS) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return type;
    }
  }
  return null;
};

const PRICE_PATTERNS: Array<{ regex: RegExp; currency: string }> = [
  { regex: /(?:USD|US\$|\$)\s*(\d+(?:[\.,]\d{1,2})?)/i, currency: "USD" },
  { regex: /(?:EUR|€)\s*(\d+(?:[\.,]\d{1,2})?)/i, currency: "EUR" },
  { regex: /(?:GBP|£)\s*(\d+(?:[\.,]\d{1,2})?)/i, currency: "GBP" },
  { regex: /(?:CNY|RMB|¥)\s*(\d+(?:[\.,]\d{1,2})?)/i, currency: "CNY" },
];

export const extractPriceFromText = (text: string): PriceInfo => {
  if (!text) return null;
  for (const { regex, currency } of PRICE_PATTERNS) {
    const match = regex.exec(text);
    if (!match?.[1]) continue;
    const value = Number(match[1].replace(/,/g, ""));
    if (Number.isNaN(value)) continue;
    return { value, currency };
  }
  return null;
};

export const extractTags = (text: string, flair?: string | null): string[] => {
  const corpus = `${text} ${flair ?? ""}`.toUpperCase();
  const tags = TAG_KEYWORDS.filter((tag) => corpus.includes(tag));
  return Array.from(new Set(tags));
};

export const buildCorpus = (...segments: Array<string | null | undefined>): string => {
  return segments.filter(Boolean).join(" ");
};
