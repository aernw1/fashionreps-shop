import { runScrape } from "@/lib/scraper";

const main = async () => {
  try {
    await runScrape();
    process.exit(0);
  } catch (error) {
    console.error("[scraper] failed", error);
    process.exit(1);
  }
};

main();
