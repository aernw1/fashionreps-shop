import Link from "next/link";
import { notFound } from "next/navigation";
import ItemGallery from "@/components/ItemGallery";
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
  params: { id: string };
}) {
  const item = await getItemById(params.id);
  if (!item) notFound();

  const primaryPrice = item.sellerLinks[0]
    ? formatPrice(item.sellerLinks[0].priceValue, item.sellerLinks[0].priceCurrency)
    : null;

  return (
    <div className="catalog-shell">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)]"
      >
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <ItemGallery images={item.media.map((media) => ({ url: media.url }))} />

        <div className="panel p-8 space-y-6">
          <div>
            <span className="badge">{item.type ?? "Item"}</span>
            <h1 className="text-3xl mt-3">{item.title}</h1>
            <p className="text-[color:var(--muted)] mt-2">
              {item.brand ?? "Unknown brand"}
            </p>
            {primaryPrice && (
              <p className="text-2xl font-semibold mt-4">{primaryPrice}</p>
            )}
          </div>

          <div>
            <h2 className="text-lg mb-2">Seller links</h2>
            <div className="space-y-2">
              {item.sellerLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[16px] border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
                >
                  <span>{link.domain}</span>
                  <span className="text-[color:var(--accent-2)]">Open →</span>
                </a>
              ))}
              {!item.sellerLinks.length && (
                <p className="text-sm text-[color:var(--muted)]">No seller links found.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg mb-2">Post details</h2>
            <div className="text-sm text-[color:var(--muted)] space-y-2">
              <p>Author: {item.author}</p>
              <p>Flair: {item.flair ?? "None"}</p>
              <p>
                Created: {new Date(item.createdUtc * 1000).toLocaleString()}
              </p>
              <a
                href={`https://www.reddit.com${item.permalink}`}
                className="text-[color:var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                View original post
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="panel p-8 mt-8">
        <h2 className="text-lg mb-3">Extracted comments</h2>
        <div className="space-y-4">
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
  );
}
