import Link from "next/link";
import { notFound } from "next/navigation";
import ItemGallery from "@/components/ItemGallery";
import SiteHeader from "@/components/SiteHeader";
import { getItemById } from "@/lib/api/items";

const formatPrice = (value: number | null, currency: string | null) => {
  if (value === null || currency === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export default async function ItemDetailPage({
  params,
}: {
  params: { id?: string } | Promise<{ id?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) notFound();

  const item = await getItemById(id);
  if (!item) notFound();

  const primaryPrice = item.sellerLinks[0]
    ? formatPrice(item.sellerLinks[0].priceValue, item.sellerLinks[0].priceCurrency)
    : null;
  const displayName = item.title;

  return (
    <div>
      <SiteHeader />
      <div className="detail-shell">
        <Link href="/" className="text-sm text-[color:var(--muted)]">
          ← Back to catalog
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ItemGallery images={item.media.map((media) => ({ url: media.url }))} />

          <div className="detail-panel space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {item.type ?? "Item"}
              </p>
              <h1 className="text-3xl mt-2">{displayName}</h1>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                {item.brand ?? "Unknown brand"}
              </p>
              {primaryPrice && (
                <p className="text-2xl font-semibold mt-4">{primaryPrice}</p>
              )}
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Seller links
              </h2>
              <div className="mt-3 space-y-2">
                {item.sellerLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between border border-[color:var(--border)] px-4 py-3 text-sm"
                  >
                    <span>{link.domain}</span>
                    <span>Open</span>
                  </a>
                ))}
                {!item.sellerLinks.length && (
                  <p className="text-sm text-[color:var(--muted)]">No seller links found.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Post details
              </h2>
              <div className="mt-3 text-sm text-[color:var(--muted)] space-y-2">
                <p>Post title: {item.postTitle ?? item.title}</p>
                <p>Author: {item.author}</p>
                <p>Flair: {item.flair ?? "None"}</p>
                <p>Created: {new Date(item.createdUtc * 1000).toLocaleString()}</p>
                <a
                  href={`https://www.reddit.com${item.permalink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[color:var(--ink)] underline"
                >
                  View original post
                </a>
              </div>
            </div>
          </div>
        </div>

        <section className="detail-panel mt-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Extracted comments
          </h2>
          <div className="mt-4 space-y-4">
            {item.comments.slice(0, 8).map((comment) => (
              <div key={comment.id} className="border-b border-[color:var(--border)] pb-3">
                <p className="text-sm font-semibold">{comment.author}</p>
                <p className="text-sm text-[color:var(--muted)] mt-1">
                  {comment.body}
                </p>
              </div>
            ))}
            {!item.comments.length && (
              <p className="text-sm text-[color:var(--muted)]">No comments captured.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
