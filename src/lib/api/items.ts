import { prisma } from "@/lib/db";
import { deriveItemName } from "@/lib/item-name";
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
            media: { take: 1 },
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

  return {
    items: items.map((item) => ({
      id: String(item.id),
      title: item.itemName ?? deriveItemName(item.post.title) ?? item.post.title,
      brand: item.post.brand,
      type: item.post.type,
      permalink: item.post.permalink,
      media: item.post.media,
      sellerLinks: [
        {
          url: item.url,
          priceValue: item.priceValue,
          priceCurrency: item.priceCurrency,
          domain: item.domain,
        },
      ],
    })),
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
        },
      },
    },
  });

  if (!item) return null;

  return {
    id: String(item.id),
    title: item.itemName ?? deriveItemName(item.post.title) ?? item.post.title,
    postTitle: item.post.title,
    body: item.post.body,
    author: item.post.author,
    createdUtc: item.post.createdUtc,
    flair: item.post.flair,
    permalink: item.post.permalink,
    brand: item.post.brand,
    type: item.post.type,
    media: item.post.media,
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
