import { AppError } from "@/utils/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export class RateLimitService {
  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  assertAllowed(key: string) {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (bucket.count >= this.maxRequests) {
      throw new AppError("Too many search requests. Please wait and try again.", 429);
    }

    bucket.count += 1;
  }
}
