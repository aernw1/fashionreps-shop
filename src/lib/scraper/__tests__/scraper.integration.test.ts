import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_DB_URL = "file:./test.db";
const TEST_DB_PATH = path.join(process.cwd(), "prisma", "test.db");

vi.mock("@/lib/scraper/reddit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/scraper/reddit")>(
    "@/lib/scraper/reddit"
  );
  return {
    ...actual,
    fetchRedditListing: vi.fn(),
    fetchPostComments: vi.fn(),
  };
});

vi.mock("@/lib/scraper/seller", async () => {
  const actual = await vi.importActual<typeof import("@/lib/scraper/seller")>(
    "@/lib/scraper/seller"
  );
  return {
    ...actual,
    fetchSellerPrice: vi.fn(),
  };
});

const setupDb = () => {
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });
};

const cleanupDb = () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const journal = `${TEST_DB_PATH}-journal`;
  if (fs.existsSync(journal)) fs.unlinkSync(journal);
};

describe("scraper integration", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    cleanupDb();
    setupDb();
  });

  afterAll(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect();
    cleanupDb();
  });

  it("writes scraped posts with media, links, comments", async () => {
    const { fetchRedditListing, fetchPostComments } = await import(
      "@/lib/scraper/reddit"
    );
    const { fetchSellerPrice } = await import("@/lib/scraper/seller");

    (fetchRedditListing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "abc123",
        title: "Nike hoodie W2C $120",
        selftext: "Check https://seller.com/nike/hoodie",
        author: "opUser",
        created_utc: 1700000000,
        permalink: "/r/FashionReps/comments/abc123/test",
        preview: { images: [{ source: { url: "https://i.redd.it/preview.png" } }] },
      },
    ]);

    (fetchPostComments as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      comments: [
        {
          id: "c1",
          author: "opUser",
          body: "W2C https://seller.com/nike/hoodie",
          isOp: true,
        },
      ],
    });

    (fetchSellerPrice as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: 120,
      currency: "USD",
    });

    const { runScrape } = await import("@/lib/scraper");
    await runScrape();

    const { prisma } = await import("@/lib/db");
    const post = await prisma.post.findUnique({
      where: { id: "abc123" },
      include: { media: true, sellerLinks: true, comments: true, tags: true },
    });

    expect(post).not.toBeNull();
    expect(post?.media).toHaveLength(1);
    expect(post?.sellerLinks[0]?.domain).toBe("seller.com");
    expect(post?.comments).toHaveLength(1);
  });
});
