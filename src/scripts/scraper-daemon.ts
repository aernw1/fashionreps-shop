import cron from "node-cron";
import { runScrape } from "@/lib/scraper";

const schedule = "0 12 * * *"; // 12:00 local time daily

const run = async () => {
  console.log(`[scraper] running at ${new Date().toLocaleString()}`);
  try {
    await runScrape();
  } catch (error) {
    console.error("[scraper] run failed", error);
  }
};

console.log(`[scraper] daemon started - schedule ${schedule}`);
cron.schedule(schedule, run, { scheduled: true });

// Run once on boot for convenience.
run();
