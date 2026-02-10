import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_DB_URL = "file:./api-test.db";
const TEST_DB_PATH = path.join(process.cwd(), "prisma", "api-test.db");

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

describe("items api query", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    cleanupDb();
    setupDb();

    const { prisma } = await import("@/lib/db");
    await prisma.post.create({
      data: {
        id: "1",
        title: "Nike hoodie",
        body: "Warm",
        author: "user",
        createdUtc: 1000,
        permalink: "/r/test/1",
        brand: "Nike",
        type: "Hoodie",
        sellerLinks: {
          create: {
            url: "https://seller.com/nike",
            domain: "seller.com",
            priceValue: 120,
            priceCurrency: "USD",
          },
        },
      },
    });
    await prisma.post.create({
      data: {
        id: "2",
        title: "Adidas jacket",
        body: "Light",
        author: "user",
        createdUtc: 2000,
        permalink: "/r/test/2",
        brand: "Adidas",
        type: "Jacket",
        sellerLinks: {
          create: {
            url: "https://seller.com/adidas",
            domain: "seller.com",
            priceValue: 80,
            priceCurrency: "USD",
          },
        },
      },
    });
  });

  afterAll(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect();
    cleanupDb();
  });

  it("filters by brand and price", async () => {
    const { getItems } = await import("@/lib/api/items");
    const result = await getItems({ brand: "Nike", minPrice: 100 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.brand).toBe("Nike");
  });

  it("paginates results", async () => {
    const { getItems } = await import("@/lib/api/items");
    const result = await getItems({ page: 1, pageSize: 1, sort: "oldest" });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
