import { prisma } from "@/lib/db";
import { load } from "cheerio";
import { deriveItemName, isGenericItemName } from "@/lib/item-name";
import {
  inferBrandFromText,
  inferBrandFromUrls,
  inferTypeFromText,
} from "@/lib/scraper/text";
import type { Prisma } from "@prisma/client";

export type ItemsQuery = {
  q?: string;
  brand?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
  includeFacets?: boolean;
};

export const parseItemsQuery = (params: URLSearchParams): ItemsQuery => {
  const q = params.get("q") ?? undefined;
  const brand = params.get("brand") ?? undefined;
  const type = params.get("type") ?? undefined;
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const sort = (params.get("sort") as ItemsQuery["sort"]) ?? "newest";
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 24);
  const includeFacets = params.get("includeFacets") === "1";

  return {
    q: q?.trim() || undefined,
    brand: brand?.trim() || undefined,
    type: type?.trim() || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 24,
    includeFacets,
  };
};

export const getItems = async (query: ItemsQuery) => {
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 24, 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.SellerLinkWhereInput = {};
  const postWhere: Prisma.PostWhereInput = {};

  if (query.q) {
    where.OR = [
      { itemName: { contains: query.q } },
      { post: { title: { contains: query.q } } },
      { post: { body: { contains: query.q } } },
      { post: { author: { contains: query.q } } },
    ];
  }

  if (query.brand) {
    postWhere.brand = { equals: query.brand };
  }

  if (query.type) {
    postWhere.type = { equals: query.type };
  }

  if (query.minPrice || query.maxPrice) {
    where.priceValue = {
      ...(query.minPrice ? { gte: query.minPrice } : {}),
      ...(query.maxPrice ? { lte: query.maxPrice } : {}),
    };
  }

  if (Object.keys(postWhere).length > 0) {
    where.post = postWhere;
  }

  let orderBy: Prisma.SellerLinkOrderByWithRelationInput = {
    post: { createdUtc: "desc" },
  };
  if (query.sort === "oldest") orderBy = { post: { createdUtc: "asc" } };
  if (query.sort === "price_asc") orderBy = { priceValue: "asc" };
  if (query.sort === "price_desc") orderBy = { priceValue: "desc" };

  const [items, total] = await prisma.$transaction([
    prisma.sellerLink.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        post: {
          include: {
            media: { orderBy: { id: "asc" } },
            sellerLinks: {
              select: { id: true },
              orderBy: { id: "asc" },
            },
          },
        },
      },
    }),
    prisma.sellerLink.count({ where }),
  ]);

  let facets: { brands: string[]; types: string[] } | undefined;
  if (query.includeFacets) {
    const [brands, types] = await prisma.$transaction([
      prisma.post.findMany({
        distinct: ["brand"],
        select: { brand: true },
        where: { brand: { not: null }, sellerLinks: { some: {} } },
      }),
      prisma.post.findMany({
        distinct: ["type"],
        select: { type: true },
        where: { type: { not: null }, sellerLinks: { some: {} } },
      }),
    ]);

    facets = {
      brands: brands
        .map((row) => row.brand)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b)),
      types: types
        .map((row) => row.type)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b)),
    };
  }

  const mappedItems = await Promise.all(items.map(async (item) => {
    let media = pickMediaForSellerLink(item);
    if (media.length === 0) {
      const bodyImage = extractImageFromText(item.post.body);
      const fallbackImage = bodyImage ?? await getSellerPreviewImage(item.url);
      if (fallbackImage) {
        media = [{ url: fallbackImage }];
      }
    }

    return {
      ...deriveItemTaxonomy(item),
      media,
      id: String(item.id),
      title: resolveDisplayItemName(item),
      permalink: item.post.permalink,
      sellerLinks: [
        {
          url: item.url,
          priceValue: item.priceValue,
          priceCurrency: item.priceCurrency,
          domain: item.domain,
        },
      ],
    };
  }));

  return {
    items: mappedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    facets,
  };
};

export const getItemById = async (id: string) => {
  const sellerId = Number(id);
  if (!Number.isFinite(sellerId)) return null;

  const item = await prisma.sellerLink.findUnique({
    where: { id: sellerId },
    include: {
      post: {
        include: {
          media: true,
          comments: true,
          tags: true,
          sellerLinks: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!item) return null;

  let media = item.post.media;
  if (media.length === 0) {
    const bodyImage = extractImageFromText(item.post.body);
    const fallbackImage = bodyImage ?? await getSellerPreviewImage(item.url);
    if (fallbackImage) {
      media = [{ id: -1, postId: item.post.id, kind: "image", url: fallbackImage }];
    }
  }

  return {
    id: String(item.id),
    title: resolveDisplayItemName(item),
    postTitle: item.post.title,
    body: item.post.body,
    author: item.post.author,
    createdUtc: item.post.createdUtc,
    flair: item.post.flair,
    permalink: item.post.permalink,
    ...deriveItemTaxonomy(item),
    media,
    sellerLinks: [
      {
        id: item.id,
        url: item.url,
        domain: item.domain,
        priceValue: item.priceValue,
        priceCurrency: item.priceCurrency,
      },
    ],
    comments: item.post.comments,
    tags: item.post.tags,
  };
};

const deriveItemTaxonomy = (item: {
  url: string;
  itemName: string | null;
  post: { brand: string | null; type: string | null; sellerLinks?: Array<{ id: number }> };
}) => {
  const inferredBrand =
    inferBrandFromUrls([item.url]) ??
    inferBrandFromText(item.itemName ?? "");
  const inferredType = inferTypeFromText(item.itemName ?? "");

  const isMultiLinkPost = (item.post.sellerLinks?.length ?? 0) > 1;

  return {
    brand: inferredBrand ?? (isMultiLinkPost ? null : item.post.brand),
    type: inferredType ?? (isMultiLinkPost ? null : item.post.type),
  };
};

const resolveDisplayItemName = (item: {
  url: string;
  domain: string;
  itemName: string | null;
  post: { title: string; brand: string | null; type: string | null };
}) => {
  const cleanedItemName = deriveItemName(item.itemName ?? "");
  if (!isGenericItemName(cleanedItemName)) return cleanedItemName;

  const cleanedPostTitle = deriveItemName(item.post.title);
  if (!isGenericItemName(cleanedPostTitle)) return cleanedPostTitle;

  const brand =
    inferBrandFromUrls([item.url]) ??
    inferBrandFromText(item.itemName ?? "") ??
    item.post.brand;
  const itemType = inferTypeFromText(item.itemName ?? "") ?? item.post.type;
  const syntheticName = [brand, itemType].filter(Boolean).join(" ");
  if (syntheticName) return syntheticName;

  const domainLabel = item.domain.split(".")[0] ?? "Item";
  return `${domainLabel} item`;
};

const pickMediaForSellerLink = (item: {
  id: number;
  post: {
    media: Array<{ url: string }>;
    sellerLinks: Array<{ id: number }>;
  };
}) => {
  const media = item.post.media;
  if (!media.length) return [];
  if (item.post.sellerLinks.length <= 1) return media.slice(0, 8);

  const siblingIndex = item.post.sellerLinks.findIndex(
    (sellerLink) => sellerLink.id === item.id
  );
  if (siblingIndex < 0) return media.slice(0, 8);

  const stride = Math.max(item.post.sellerLinks.length, 1);
  const assigned: Array<{ url: string }> = [];
  for (let index = siblingIndex; index < media.length; index += stride) {
    const picked = media[index];
    if (picked) assigned.push(picked);
    if (assigned.length >= 8) break;
  }

  if (!assigned.length) {
    const fallback = media[siblingIndex % media.length];
    return fallback ? [fallback] : [];
  }

  return assigned;
};

const globalForSellerPreview = global as unknown as {
  sellerPreviewCache?: Map<string, string | null>;
};
const sellerPreviewCache =
  globalForSellerPreview.sellerPreviewCache ?? new Map<string, string | null>();
if (!globalForSellerPreview.sellerPreviewCache) {
  globalForSellerPreview.sellerPreviewCache = sellerPreviewCache;
}

const getSellerPreviewImage = async (url: string): Promise<string | null> => {
  const cached = sellerPreviewCache.get(url);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "reddit-shop/1.0 (seller image fallback)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      sellerPreviewCache.set(url, null);
      return null;
    }

    const html = await response.text();
    const $ = load(html);
    const candidates: Array<string | undefined> = [
      $("meta[property=\"og:image\"]").attr("content"),
      $("meta[name=\"twitter:image\"]").attr("content"),
      $("link[rel=\"image_src\"]").attr("href"),
    ];

    $("img").each((_, element) => {
      candidates.push($(element).attr("src"));
      candidates.push($(element).attr("data-src"));
      candidates.push($(element).attr("data-original"));
      const srcset = $(element).attr("srcset");
      if (srcset) {
        const first = srcset.split(",")[0]?.trim().split(" ")[0];
        candidates.push(first);
      }
    });

    for (const candidate of candidates) {
      const resolved = resolveImageUrl(candidate, response.url);
      if (resolved) {
        sellerPreviewCache.set(url, resolved);
        return resolved;
      }
    }

    sellerPreviewCache.set(url, null);
    return null;
  } catch {
    sellerPreviewCache.set(url, null);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const resolveImageUrl = (raw: string | undefined, baseUrl: string) => {
  if (!raw) return null;
  const decoded = raw.replace(/&amp;/g, "&").trim();
  if (!decoded) return null;
  try {
    const url = new URL(decoded, baseUrl).toString();
    if (!url.startsWith("http")) return null;
    if (!isLikelyProductImage(url)) return null;
    return url;
  } catch {
    return null;
  }
};

const isLikelyProductImage = (url: string) => {
  const lowered = url.toLowerCase();
  if (lowered.includes("logo") || lowered.includes("icon") || lowered.includes("sprite")) {
    return false;
  }
  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(lowered)) return true;
  return lowered.includes("image") || lowered.includes("photo");
};

const extractImageFromText = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const matches = text.match(/\bhttps?:\/\/[^\s<>()]+/gi) ?? [];
  for (const match of matches) {
    const cleaned = match.replace(/[),.?!\]]+$/g, "");
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(cleaned)) {
      return cleaned;
    }
  }
  return null;
};
