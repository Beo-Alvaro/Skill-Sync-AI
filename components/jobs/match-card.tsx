import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { JobMatch } from "@/types/match";

export function MatchCard({ match }: { match: JobMatch }) {
  const job = match.job;

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px] md:items-start">
          <div className="min-w-0 space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{job?.title ?? "Untitled job"}</h3>
                {job?.url ? (
                  <a
                    className="inline-flex text-muted-foreground hover:text-primary"
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open job"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{job?.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {job?.budget ? <Badge>{job.budget}</Badge> : null}
              {job?.proposals ? <Badge>{job.proposals}</Badge> : null}
              {job?.clientRating ? <Badge>Client {job.clientRating}/5</Badge> : null}
              <Badge>{match.difficultyEstimation} difficulty</Badge>
            </div>
            <p className="text-sm">{match.whyMatches}</p>
            {match.missingSkills.length ? (
              <p className="text-sm text-muted-foreground">
                Missing: {match.missingSkills.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col items-center rounded-md border bg-secondary px-4 py-3 text-center md:justify-self-end">
            <span className="text-2xl font-semibold text-primary">{match.matchPercentage}%</span>
            <span className="text-xs text-muted-foreground">{match.estimatedFit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
