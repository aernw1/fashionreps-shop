import { prisma } from "@/lib/db";
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

  const where: Prisma.PostWhereInput = {};

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { body: { contains: query.q, mode: "insensitive" } },
      { author: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.brand) {
    where.brand = { equals: query.brand, mode: "insensitive" };
  }

  if (query.type) {
    where.type = { equals: query.type, mode: "insensitive" };
  }

  if (query.minPrice || query.maxPrice) {
    where.sellerLinks = {
      some: {
        priceValue: {
          ...(query.minPrice ? { gte: query.minPrice } : {}),
          ...(query.maxPrice ? { lte: query.maxPrice } : {}),
        },
      },
    };
  }

  let orderBy: Prisma.PostOrderByWithRelationInput = { createdUtc: "desc" };
  if (query.sort === "oldest") orderBy = { createdUtc: "asc" };
  if (query.sort === "price_asc") {
    orderBy = { sellerLinks: { _min: { priceValue: "asc" } } };
  }
  if (query.sort === "price_desc") {
    orderBy = { sellerLinks: { _max: { priceValue: "desc" } } };
  }

  const [items, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        media: { take: 1 },
        sellerLinks: { orderBy: { priceValue: "asc" }, take: 1 },
      },
    }),
    prisma.post.count({ where }),
  ]);

  let facets: { brands: string[]; types: string[] } | undefined;
  if (query.includeFacets) {
    const [brands, types] = await prisma.$transaction([
      prisma.post.findMany({
        distinct: ["brand"],
        select: { brand: true },
        where: { brand: { not: null } },
      }),
      prisma.post.findMany({
        distinct: ["type"],
        select: { type: true },
        where: { type: { not: null } },
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
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    facets,
  };
};

export const getItemById = async (id: string) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      media: true,
      sellerLinks: true,
      comments: true,
      tags: true,
    },
  });
};
