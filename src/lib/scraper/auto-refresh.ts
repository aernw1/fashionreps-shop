import { prisma } from "@/lib/db";
import { runScrape } from "@/lib/scraper";

type ScrapeState = {
  running: Promise<void> | null;
  lastStartedAt: number;
};

const globalForAutoScrape = global as unknown as {
  autoScrapeState?: ScrapeState;
};

const autoScrapeState: ScrapeState = globalForAutoScrape.autoScrapeState ?? {
  running: null,
  lastStartedAt: 0,
};

if (!globalForAutoScrape.autoScrapeState) {
  globalForAutoScrape.autoScrapeState = autoScrapeState;
}

const AUTO_REFRESH_COOLDOWN_MS = 30 * 60 * 1000;

const startScrape = (awaitCompletion: boolean) => {
  if (!autoScrapeState.running) {
    autoScrapeState.lastStartedAt = Date.now();
    autoScrapeState.running = runScrape()
      .catch((error) => {
        console.error("[auto-scrape] failed", error);
      })
      .finally(() => {
        autoScrapeState.running = null;
      });
  }

  if (awaitCompletion) {
    return autoScrapeState.running;
  }

  return Promise.resolve();
};

export const ensureCatalogDataFresh = async () => {
  if (process.env.DISABLE_AUTO_SCRAPE === "1") {
    return;
  }

  const totalItems = await prisma.sellerLink.count();
  if (totalItems === 0) {
    await startScrape(true);
    return;
  }

  const now = Date.now();
  const isCooldownActive = now - autoScrapeState.lastStartedAt < AUTO_REFRESH_COOLDOWN_MS;
  if (isCooldownActive || autoScrapeState.running) {
    return;
  }

  void startScrape(false);
};
