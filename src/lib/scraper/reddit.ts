import { load } from "cheerio";
import { REDDIT_USER_AGENT } from "./config";
import { decodeHtmlEntities, extractUrls } from "./text";
import type { ScrapedComment, ScrapedMedia } from "./types";

const LISTING_URL =
  "https://www.reddit.com/r/FashionReps/new.json?limit=200&raw_json=1";

export type RedditListingPost = {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  link_flair_text?: string | null;
  permalink: string;
  url_overridden_by_dest?: string;
  preview?: {
    images?: Array<{
      source?: { url?: string };
    }>;
  };
  gallery_data?: { items?: Array<{ media_id: string }> };
  media_metadata?: Record<string, { s?: { u?: string; gif?: string } }>;
};

export const fetchRedditListing = async (): Promise<RedditListingPost[]> => {
  const response = await fetch(LISTING_URL, {
    headers: { "User-Agent": REDDIT_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Reddit listing request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { children?: Array<{ data?: RedditListingPost }> };
  };

  const posts = payload?.data?.children
    ?.map((child) => child.data)
    .filter((post): post is RedditListingPost => Boolean(post?.id))
    .slice(0, 200);

  if (!posts || posts.length === 0) {
    throw new Error("Reddit listing returned no posts");
  }

  return posts;
};

export const fetchPostComments = async (
  permalink: string,
  opAuthor: string
): Promise<ScrapedComment[]> => {
  const url = `https://www.reddit.com${permalink}.json?limit=50&raw_json=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": REDDIT_USER_AGENT },
  });
  if (!response.ok) return [];

  const payload = (await response.json()) as Array<{
    data?: { children?: Array<{ kind?: string; data?: any }> };
  }>;

  const commentsListing = payload?.[1]?.data?.children ?? [];
  const comments: ScrapedComment[] = [];

  for (const child of commentsListing) {
    if (child.kind !== "t1" || !child.data) continue;
    const comment = child.data;
    if (!comment.body) continue;

    comments.push({
      id: comment.id,
      author: comment.author ?? "unknown",
      body: comment.body,
      isOp: comment.author === opAuthor,
    });

    const replies = comment.replies?.data?.children ?? [];
    for (const reply of replies) {
      if (reply.kind !== "t1" || !reply.data) continue;
      if (reply.data.author !== opAuthor) continue;
      comments.push({
        id: reply.data.id,
        author: reply.data.author ?? "unknown",
        body: reply.data.body,
        isOp: true,
      });
    }
  }

  return comments;
};

export const extractMedia = (post: RedditListingPost): ScrapedMedia[] => {
  const urls: string[] = [];

  post.preview?.images?.forEach((image) => {
    const url = image.source?.url;
    if (url) urls.push(decodeHtmlEntities(url));
  });

  if (post.gallery_data?.items && post.media_metadata) {
    for (const item of post.gallery_data.items) {
      const media = post.media_metadata[item.media_id];
      const url = media?.s?.u ?? media?.s?.gif;
      if (url) urls.push(decodeHtmlEntities(url));
    }
  }

  if (post.url_overridden_by_dest) {
    const override = decodeHtmlEntities(post.url_overridden_by_dest);
    if (isImageUrl(override)) urls.push(override);
  }

  const unique = Array.from(new Set(urls));
  return unique.map((url) => ({ url, kind: "image" }));
};

export const parseHtmlComments = (html: string, opAuthor: string) => {
  const $ = load(html);
  const comments: ScrapedComment[] = [];

  $(".comment").each((index, element) => {
    const author =
      $(element).attr("data-author") ||
      $(element).find("a.author").first().text().trim();
    const body = $(element).find(".usertext-body").text().trim();
    if (!author || !body) return;

    const id =
      $(element).attr("data-fullname")?.replace("t1_", "") ||
      `html-${index}`;

    comments.push({
      id,
      author,
      body,
      isOp: author === opAuthor,
    });
  });

  return comments;
};

export const parseHtmlMedia = (html: string): ScrapedMedia[] => {
  const $ = load(html);
  const urls = new Set<string>();

  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src && isImageUrl(src)) urls.add(src);
  });

  return Array.from(urls).map((url) => ({ url, kind: "image" }));
};

export const parseHtmlBody = (html: string): string | null => {
  const $ = load(html);
  const body = $(".expando .usertext-body").text().trim();
  return body || null;
};

export const parseHtmlTitle = (html: string): string | null => {
  const $ = load(html);
  const title = $("a.title").first().text().trim();
  return title || null;
};

export const parseHtmlPermalink = (html: string): string | null => {
  const $ = load(html);
  const link = $("a.title").first().attr("href");
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.pathname;
  } catch {
    return link;
  }
};

export const parseHtmlAuthor = (html: string): string | null => {
  const $ = load(html);
  const author = $("a.author").first().text().trim();
  return author || null;
};

export const parseHtmlCreatedUtc = (html: string): number | null => {
  const $ = load(html);
  const datetime = $("time").first().attr("datetime");
  if (!datetime) return null;
  const value = Date.parse(datetime);
  if (Number.isNaN(value)) return null;
  return Math.floor(value / 1000);
};

export const parseHtmlFlair = (html: string): string | null => {
  const $ = load(html);
  const flair = $("span.linkflairlabel").first().text().trim();
  return flair || null;
};

export const extractHtmlSellerLinks = (html: string): string[] => {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    if (!href.startsWith("http")) return;
    links.add(href);
  });

  const textLinks = extractUrls($.text());
  textLinks.forEach((link) => links.add(link));

  return Array.from(links);
};

const isImageUrl = (url: string): boolean => {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
};
