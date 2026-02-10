"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CatalogItem = {
  id: string;
  title: string;
  brand: string | null;
  type: string | null;
  permalink: string;
  media: Array<{ url: string }>;
  sellerLinks: Array<{ url: string; priceValue: number | null; priceCurrency: string | null }>;
};

type CatalogResponse = {
  items: CatalogItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  facets?: { brands: string[]; types: string[] };
};

const formatPrice = (value: number | null, currency: string | null) => {
  if (value === null || currency === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CatalogPage() {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({
    q: "",
    brand: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
    page: 1,
  });

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query.q) search.set("q", query.q);
    if (query.brand) search.set("brand", query.brand);
    if (query.type) search.set("type", query.type);
    if (query.minPrice) search.set("minPrice", query.minPrice);
    if (query.maxPrice) search.set("maxPrice", query.maxPrice);
    if (query.sort) search.set("sort", query.sort);
    search.set("page", String(query.page));
    search.set("pageSize", "24");
    search.set("includeFacets", "1");
    return search.toString();
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      const response = await fetch(`/api/items?${params}`);
      const json = (await response.json()) as CatalogResponse;
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    };

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const brands = data?.facets?.brands ?? [];
  const types = data?.facets?.types ?? [];

  return (
    <div className="catalog-shell">
      <section className="panel p-10 mb-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,#d4552a55,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,#2f6f6d44,transparent_70%)]" />
        <div className="relative z-10">
          <span className="badge">Local Catalog</span>
          <h1 className="text-4xl md:text-5xl mt-4">Reddit Shop</h1>
          <p className="mt-3 text-lg text-[color:var(--muted)] max-w-2xl">
            Daily pulls from r/FashionReps, distilled into a clean catalog.
            Filter by brand, type, and price, then jump straight to seller links.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="button-primary">Browse Drops</button>
            <a className="button-secondary" href="/api/items">
              API Preview
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="panel p-6 h-fit sticky top-8">
          <h2 className="text-xl mb-4">Filter the drop</h2>
          <label className="block text-sm font-semibold">Search</label>
          <input
            className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
            placeholder="Brand, seller, keyword"
            value={query.q}
            onChange={(event) =>
              setQuery((prev) => ({ ...prev, q: event.target.value, page: 1 }))
            }
          />

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold">Brand</label>
              <select
                className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
                value={query.brand}
                onChange={(event) =>
                  setQuery((prev) => ({ ...prev, brand: event.target.value, page: 1 }))
                }
              >
                <option value="">All brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold">Type</label>
              <select
                className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
                value={query.type}
                onChange={(event) =>
                  setQuery((prev) => ({ ...prev, type: event.target.value, page: 1 }))
                }
              >
                <option value="">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold">Min</label>
                <input
                  type="number"
                  className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
                  placeholder="$"
                  value={query.minPrice}
                  onChange={(event) =>
                    setQuery((prev) => ({ ...prev, minPrice: event.target.value, page: 1 }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Max</label>
                <input
                  type="number"
                  className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
                  placeholder="$"
                  value={query.maxPrice}
                  onChange={(event) =>
                    setQuery((prev) => ({ ...prev, maxPrice: event.target.value, page: 1 }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold">Sort</label>
              <select
                className="mt-2 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2"
                value={query.sort}
                onChange={(event) =>
                  setQuery((prev) => ({ ...prev, sort: event.target.value, page: 1 }))
                }
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </aside>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl">Latest finds</h2>
              <p className="text-sm text-[color:var(--muted)]">
                {loading ? "Loading catalog..." : `${data?.total ?? 0} items tracked`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="button-secondary"
                disabled={query.page === 1}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
                }
              >
                Prev
              </button>
              <button
                className="button-secondary"
                disabled={Boolean(data && query.page >= data.totalPages)}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </button>
            </div>
          </div>

          {loading && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="panel p-4 space-y-4">
                  <div className="h-40 rounded-[20px] animate-shimmer" />
                  <div className="h-4 w-3/4 rounded-full animate-shimmer" />
                  <div className="h-3 w-1/2 rounded-full animate-shimmer" />
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {data?.items.map((item, index) => {
                const price = item.sellerLinks[0]
                  ? formatPrice(item.sellerLinks[0].priceValue, item.sellerLinks[0].priceCurrency)
                  : null;

                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="panel p-4 hover:-translate-y-1 transition-transform"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="relative h-48 rounded-[20px] overflow-hidden bg-[radial-gradient(circle,#f1e2d2,transparent_65%)]">
                      {item.media[0]?.url ? (
                        <img
                          src={item.media[0].url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-[color:var(--muted)]">
                          No image
                        </div>
                      )}
                      <div className="absolute top-3 left-3 badge">{item.type ?? "Item"}</div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg leading-tight">{item.title}</h3>
                      <p className="text-sm text-[color:var(--muted)] mt-1">
                        {item.brand ?? "Unknown brand"}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {price ?? "Price TBA"}
                        </span>
                        <span className="text-xs text-[color:var(--accent-2)]">View details →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
