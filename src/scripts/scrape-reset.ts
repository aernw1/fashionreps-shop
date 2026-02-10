import { prisma } from "@/lib/db";
import { runScrape } from "@/lib/scraper";

const main = async () => {
  if (process.env.CONFIRM_RESET !== "1") {
    console.error("[scraper] refusing to reset without CONFIRM_RESET=1");
    process.exit(1);
  }

  console.log("[scraper] clearing existing data...");
  await prisma.$transaction([
    prisma.media.deleteMany(),
    prisma.sellerLink.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.post.deleteMany(),
  ]);

  console.log("[scraper] running fresh scrape...");
  await runScrape();
  await prisma.$disconnect();
};

main().catch((error) => {
  console.error("[scraper] reset failed", error);
  process.exit(1);
});
