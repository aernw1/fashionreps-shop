"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

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
  const headerTitle = query.brand
    ? `${query.brand} (${data?.total ?? 0})`
    : `Catalog (${data?.total ?? 0})`;

  return (
    <div>
      <SiteHeader
        searchValue={query.q}
        onSearchChange={(value) =>
          setQuery((prev) => ({ ...prev, q: value, page: 1 }))
        }
      />

      <div className="catalog-shell">
        <div className="control-row">
          <div>
            <h1 className="section-title">{headerTitle}</h1>
            <p className="section-subtitle">
              {loading ? "Loading catalog..." : "Latest FashionReps drops"}
            </p>
          </div>
          <div>
            <label className="section-subtitle">Sort</label>
            <select
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

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="filters-panel">
            <h3>Filters</h3>
            <div className="space-y-4">
              <div>
                <label>Brand</label>
                <select
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
                <label>Type</label>
                <select
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
                  <label>Min price</label>
                  <input
                    type="number"
                    value={query.minPrice}
                    onChange={(event) =>
                      setQuery((prev) => ({ ...prev, minPrice: event.target.value, page: 1 }))
                    }
                  />
                </div>
                <div>
                  <label>Max price</label>
                  <input
                    type="number"
                    value={query.maxPrice}
                    onChange={(event) =>
                      setQuery((prev) => ({ ...prev, maxPrice: event.target.value, page: 1 }))
                    }
                  />
                </div>
              </div>
            </div>
          </aside>

          <section>
            {loading && (
              <div className="product-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="product-card">
                    <div className="h-[280px] bg-[#f0f0f0]" />
                    <div className="h-3 w-3/4 bg-[#ededed]" />
                    <div className="h-3 w-1/2 bg-[#ededed]" />
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <div className="product-grid">
                {data?.items.map((item) => {
                  const price = item.sellerLinks[0]
                    ? formatPrice(item.sellerLinks[0].priceValue, item.sellerLinks[0].priceCurrency)
                    : null;
                  return (
                    <Link key={item.id} href={`/items/${item.id}`} className="product-card">
                      {item.media[0]?.url ? (
                        <img src={item.media[0].url} alt={item.title} />
                      ) : (
                        <div className="h-[280px] bg-[#f0f0f0] flex items-center justify-center text-xs text-[color:var(--muted)]">
                          No image
                        </div>
                      )}
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.brand ?? "Unknown brand"}</p>
                        <p>{item.type ?? "Item"}</p>
                      </div>
                      <div className="price">{price ?? "Price TBA"}</div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pagination mt-6 flex justify-end">
              <button
                disabled={query.page === 1}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
                }
              >
                Prev
              </button>
              <button
                disabled={Boolean(data && query.page >= data.totalPages)}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
