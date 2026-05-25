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
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
      await page.waitForTimeout(2500);


      const jobs = await page.evaluate((maxJobs) => {
        const normalize = (value: string | null | undefined) =>
          (value ?? "").replace(/\s+/g, " ").trim();

        const linkedCards = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='/jobs/']"))
          .map((link) => {
            const card =
              link.closest("[data-test='job-tile']") ??
              link.closest("article") ??
              link.closest("section") ??
              link.closest("div");

            return card ? { card, link } : null;
          })
          .filter((item): item is { card: Element; link: HTMLAnchorElement } => Boolean(item));

        const seen = new Set<string>();
        const cards = linkedCards.filter(({ link }) => {
          const key = link.href || link.innerText;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return cards
          .map((card) => {
            const text = normalize((card.card as HTMLElement).innerText);
            const title =
              normalize(card.card.querySelector<HTMLElement>("[data-test='job-tile-title']")?.innerText) ||
              normalize(card.card.querySelector<HTMLElement>("h2, h3, h4")?.innerText) ||
              normalize(card.link.innerText);
            const description =
              normalize(card.card.querySelector<HTMLElement>("[data-test='job-description-text']")?.innerText) ||
              normalize(card.card.querySelector<HTMLElement>("p")?.innerText) ||
              text.replace(title, "").trim();
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
              url: card.link.href ?? null,
              sourceJobId: card.link.href?.split("/").filter(Boolean).pop() ?? null,
              rawPayload: { text }
            };
          })
          .filter((job) => job.title.length > 0 && job.url)
          .slice(0, maxJobs);
      }, limit);

      if (jobs.length === 0) {
        logger.warn("Upwork scraper returned no jobs", {
          query,
          pageUrl: page.url(),
          title: await page.title(),
          bodyPreview: (await page.locator("body").innerText().catch(() => "")).slice(0, 500)
        });
      }

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
