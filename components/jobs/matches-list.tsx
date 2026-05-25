"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/jobs/match-card";
import type { JobMatch } from "@/types/match";

export function MatchesList({ refreshKey }: { refreshKey: number }) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMatches() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/matches");
    const payload = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Unable to load matches");
      return;
    }

    setMatches(payload.data);
  }

  useEffect(() => {
    void loadMatches();
  }, [refreshKey]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Matched jobs</h2>
          <p className="text-sm text-muted-foreground">Sorted by fit and opportunity signal.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMatches}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading matches...</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load matches</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && !error && matches.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No matches yet. Save your profile, then run your first search.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
