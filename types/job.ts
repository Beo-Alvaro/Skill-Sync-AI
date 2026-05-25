export type ScrapedJob = {
  id?: string;
  source: "upwork";
  sourceJobId?: string | null;
  url?: string | null;
  title: string;
  description: string;
  budget?: string | null;
  proposals?: string | null;
  clientRating?: number | null;
  postedDate?: string | null;
  rawPayload?: Record<string, unknown> | null;
  createdAt?: string;
};
