import { chromium } from "playwright";
import type { ScrapedJob } from "@/types/job";
import type { JobScraper, ScraperSearchOptions } from "@/services/scraper/scraper.types";
import { logger } from "@/utils/logger";

export class UpworkPlaywrightScraper implements JobScraper {
  async searchJobs({ query, limit = 10 }: ScraperSearchOptions): Promise<ScrapedJob[]> {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
      });
      const searchUrl = `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(query)}&sort=recency`;

      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(2500);

      const jobs = await page.evaluate((maxJobs) => {
        const cards = Array.from(
          document.querySelectorAll("[data-test='job-tile'], article, section")
        ).slice(0, maxJobs * 2);

        return cards
          .map((card) => {
            const link = card.querySelector<HTMLAnchorElement>("a[href*='/jobs/']");
            const title =
              card.querySelector<HTMLElement>("[data-test='job-tile-title']")?.innerText ??
              link?.innerText ??
              "";
            const description =
              card.querySelector<HTMLElement>("[data-test='job-description-text']")?.innerText ??
              card.querySelector<HTMLElement>("p")?.innerText ??
              "";
            const text = (card as HTMLElement).innerText ?? "";
            const budget = text.match(/(\$[\d,.]+(?:\s*-\s*\$[\d,.]+)?|Hourly|Fixed-price)/i)?.[0] ?? null;
            const proposals = text.match(/(?:Less than|[\d+]+\s*to\s*[\d+]+|[\d+]+)\s+proposals?/i)?.[0] ?? null;
            const rating = text.match(/(\d(?:\.\d)?)\s+of\s+5/i)?.[1] ?? null;
            const postedDate =
              text.match(/Posted\s+([^\n]+)/i)?.[1]?.trim() ??
              text.match(/(\d+\s+(?:minutes?|hours?|days?)\s+ago)/i)?.[1] ??
              null;

            return {
              title: title.trim(),
              description: description.trim(),
              budget,
              proposals,
              clientRating: rating ? Number(rating) : null,
              postedDate,
              url: link?.href ?? null,
              sourceJobId: link?.href?.split("/").filter(Boolean).pop() ?? null,
              rawPayload: { text }
            };
          })
          .filter((job) => job.title.length > 0 && job.description.length > 0)
          .slice(0, maxJobs);
      }, limit);

      return jobs.map((job) => ({
        source: "upwork",
        ...job
      }));
    } catch (error) {
      logger.error("Upwork scraping failed", { error });
      return [];
    } finally {
      await browser.close();
    }
  }
}
