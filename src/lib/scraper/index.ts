import { prisma } from "../db";
import { SELLER_FETCH_LIMIT } from "./config";
import { fetchListingWithPlaywright, fetchPostHtmlWithPlaywright } from "./playwright";
import {
  extractHtmlSellerLinks,
  extractMedia,
  fetchListingHtmlPages,
  fetchPostComments,
  fetchPostHtml,
  fetchRedditListing,
  parseHtmlAuthor,
  parseHtmlBody,
  parseHtmlComments,
  parseHtmlCreatedUtc,
  parseHtmlFlair,
  parseHtmlMedia,
  parseHtmlPermalink,
  parseHtmlTitle,
} from "./reddit";
import { fetchSellerPrice } from "./seller";
import {
  buildCorpus,
  buildLinkContextMap,
  extractPriceFromText,
  extractSellerLinks,
  extractTags,
  inferBrandFromText,
  inferBrandFromUrls,
  inferTypeFromText,
} from "./text";
import type { ScrapedPost, ScrapedSellerLink } from "./types";
import { deriveItemName } from "@/lib/item-name";

export const runScrape = async () => {
  const startedAt = Date.now();
  const summary = { created: 0, updated: 0, errors: 0 };

  let listingSource: "json" | "html" = "json";
  let listing: Array<any> = [];

  try {
    listing = await fetchRedditListing();
  } catch (error) {
    console.warn("[scraper] JSON listing failed, falling back to Playwright", error);
    listingSource = "html";
    try {
      listing = await fetchListingHtmlPages();
    } catch (htmlError) {
      console.warn("[scraper] HTML listing failed, falling back to Playwright", htmlError);
      listing = await fetchListingWithPlaywright();
    }
  }

  for (const entry of listing) {
    try {
      const scraped =
        listingSource === "json"
          ? await scrapeFromJson(entry)
          : await scrapeFromHtml(entry);

      if (!scraped) continue;

      const existing = await prisma.post.findUnique({
        where: { id: scraped.id },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        await tx.post.upsert({
          where: { id: scraped.id },
          create: {
            id: scraped.id,
            title: scraped.title,
            body: scraped.body,
            author: scraped.author,
            createdUtc: scraped.createdUtc,
            flair: scraped.flair,
            permalink: scraped.permalink,
            brand: scraped.brand,
            type: scraped.type,
          },
          update: {
            title: scraped.title,
            body: scraped.body,
            author: scraped.author,
            createdUtc: scraped.createdUtc,
            flair: scraped.flair,
            permalink: scraped.permalink,
            brand: scraped.brand,
            type: scraped.type,
          },
        });

        await tx.media.deleteMany({ where: { postId: scraped.id } });
        await tx.sellerLink.deleteMany({ where: { postId: scraped.id } });
        await tx.comment.deleteMany({ where: { postId: scraped.id } });
        await tx.tag.deleteMany({ where: { postId: scraped.id } });

        if (scraped.media.length) {
          await tx.media.createMany({
            data: scraped.media.map((item) => ({
              postId: scraped.id,
              url: item.url,
              kind: item.kind,
            })),
          });
        }

        if (scraped.sellerLinks.length) {
          await tx.sellerLink.createMany({
            data: scraped.sellerLinks.map((link) => ({
              postId: scraped.id,
              url: link.url,
              domain: link.domain,
              itemName: link.itemName ?? null,
              priceValue: link.priceValue ?? null,
              priceCurrency: link.priceCurrency ?? null,
            })),
          });
        }

        if (scraped.comments.length) {
          await tx.comment.createMany({
            data: scraped.comments.map((comment) => ({
              id: comment.id,
              postId: scraped.id,
              author: comment.author,
              body: comment.body,
              isOp: comment.isOp,
            })),
          });
        }

        if (scraped.tags.length) {
          await tx.tag.createMany({
            data: scraped.tags.map((tag) => ({
              postId: scraped.id,
              tag,
            })),
          });
        }
      });

      if (existing) summary.updated += 1;
      else summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error("[scraper] failed to process post", error);
    }
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  console.log(
    `[scraper] done in ${duration}s | created=${summary.created} updated=${summary.updated} errors=${summary.errors}`
  );

  return summary;
};

const scrapeFromJson = async (post: any): Promise<ScrapedPost | null> => {
  if (!post?.id) return null;

  const title = post.title ?? "";
  const body = post.selftext ? post.selftext : null;
  const author = post.author ?? "unknown";
  const createdUtc = post.created_utc ?? Math.floor(Date.now() / 1000);
  const flair = post.link_flair_text ?? null;
  const permalink = post.permalink ?? "";

  const media = extractMedia(post);
  const commentResult = await fetchPostComments(permalink, author);
  const comments = commentResult.comments;
  const tags = extractTags(title + " " + (body ?? ""), flair);
  const commentSellerLinks = extractSellerLinks(comments.map((comment) => comment.body));

  if (tags.includes("W2C") && commentSellerLinks.length === 0 && commentResult.ok) {
    return null;
  }

  const corpus = buildCorpus(title, body, ...comments.map((comment) => comment.body));
  const type = inferTypeFromText(corpus);
  const segments = [title, body ?? "", ...comments.map((comment) => comment.body)];
  const sellerUrls = extractSellerLinks(segments);
  const linkContexts = buildLinkContextMap(segments);

  if (sellerUrls.length === 0 && !type) {
    return null;
  }
  const sellerLinks = await resolveSellerLinks(
    sellerUrls,
    corpus,
    linkContexts,
    deriveItemName(title),
    type
  );

  const brand = inferBrandFromUrls(sellerLinks.map((link) => link.url)) ??
    inferBrandFromText(corpus);

  return {
    id: post.id,
    title,
    body,
    author,
    createdUtc,
    flair,
    permalink,
    brand,
    type,
    tags,
    media,
    sellerLinks,
    comments,
  };
};

const scrapeFromHtml = async (entry: {
  id: string;
  permalink: string;
  title: string;
  author: string;
  createdUtc: number | null;
  flair: string | null;
}): Promise<ScrapedPost | null> => {
  if (!entry?.id) return null;
  let html = await fetchPostHtml(entry.permalink);
  if (!html) {
    html = await fetchPostHtmlWithPlaywright(entry.permalink);
  }

  const title = parseHtmlTitle(html) ?? entry.title;
  const body = parseHtmlBody(html);
  const author = parseHtmlAuthor(html) ?? entry.author;
  const createdUtc = parseHtmlCreatedUtc(html) ?? entry.createdUtc ??
    Math.floor(Date.now() / 1000);
  const permalink = parseHtmlPermalink(html) ?? entry.permalink;
  const flair = parseHtmlFlair(html) ?? entry.flair ?? null;

  const media = parseHtmlMedia(html);
  const comments = parseHtmlComments(html, author);
  const tags = extractTags(title + " " + (body ?? ""), flair);
  const commentSellerLinks = extractSellerLinks(comments.map((comment) => comment.body));

  if (tags.includes("W2C") && commentSellerLinks.length === 0) {
    return null;
  }

  const corpus = buildCorpus(title, body, ...comments.map((comment) => comment.body));
  const type = inferTypeFromText(corpus);
  const segments = [title, body ?? "", ...comments.map((comment) => comment.body)];
  const sellerUrls = extractSellerLinks([
    ...segments,
    ...extractHtmlSellerLinks(html),
  ]);
  const linkContexts = buildLinkContextMap(segments);

  if (sellerUrls.length === 0 && !type) {
    return null;
  }
  const sellerLinks = await resolveSellerLinks(
    sellerUrls,
    corpus,
    linkContexts,
    deriveItemName(title),
    type
  );

  const brand = inferBrandFromUrls(sellerLinks.map((link) => link.url)) ??
    inferBrandFromText(corpus);

  return {
    id: entry.id,
    title,
    body,
    author,
    createdUtc,
    flair,
    permalink,
    brand,
    type,
    tags,
    media,
    sellerLinks,
    comments,
  };
};

const resolveSellerLinks = async (
  urls: string[],
  corpus: string,
  linkContexts: Map<string, string>,
  fallbackName: string,
  fallbackType: string | null
): Promise<ScrapedSellerLink[]> => {
  const priceFromText = extractPriceFromText(corpus);
  const links: ScrapedSellerLink[] = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    let hostname: string;
    try {
      hostname = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    let price = priceFromText;

    if (!price && index < SELLER_FETCH_LIMIT) {
      price = await fetchSellerPrice(url);
    }

    const contextName = linkContexts.get(url);
    const itemName = deriveItemName(contextName ?? "") ||
      fallbackName ||
      (fallbackType ?? "") ||
      "";

    links.push({
      url,
      domain: hostname,
      itemName: itemName || null,
      priceValue: price?.value ?? null,
      priceCurrency: price?.currency ?? null,
    });
  }

  return links;
};
